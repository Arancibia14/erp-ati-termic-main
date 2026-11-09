const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Trabajador = require('../models/Trabajador');
const Material = require('../models/Material');
const EntregaEpp = require('../models/EntregaEpp');
const DocumentoLegal = require('../models/DocumentoLegal');
const LogAuditoria = require('../models/LogAuditoria');
const { fechaHoy } = require('../utils/fecha');
const pdf = require('../utils/pdfMembrete');
const sequelize = require('../config/database');
const { consumirFifo, StockInsuficiente } = require('../utils/inventarioFifo');

async function getTrabajadoresActivos(req, res) {
  try {
    const trabajadores = await Trabajador.findAll({
      where: { trabajador_activo: true },
      order: [['trabajador_nombres', 'ASC']]
    });
    return res.json({ success: true, data: trabajadores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener trabajadores activos' });
  }
}

async function getCatalogoEpp(req, res) {
  try {
    const articulos = await Material.findAll({
      where: { material_categoria: 'EPP', material_activo: true },
      order: [['material_nombre', 'ASC']]
    });
    return res.json({ success: true, data: articulos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener el listado de EPP' });
  }
}

async function crearEntrega(req, res) {
  try {
    const { trabajador_rut, items } = req.body;

    if (!trabajador_rut || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Selecciona un receptor y al menos un artículo a entregar' });
    }

    const trabajador = await Trabajador.findByPk(trabajador_rut);
    if (!trabajador || !trabajador.trabajador_activo) {
      return res.status(404).json({ success: false, error: 'Trabajador no encontrado' });
    }

    const materiales = [];
    for (const item of items) {
      const cantidad = parseInt(item.cantidad);
      if (!item.material_id || !cantidad || cantidad <= 0) {
        return res.status(400).json({ success: false, error: 'Cada artículo debe tener una cantidad válida' });
      }

      const material = await Material.findByPk(item.material_id);
      if (!material) {
        return res.status(404).json({ success: false, error: 'Uno de los artículos seleccionados ya no existe en el catálogo' });
      }

      if (cantidad > material.material_stock_minimo) {
        return res.status(400).json({
          success: false,
          error: `No hay unidades suficientes de "${material.material_nombre}" (disponible: ${material.material_stock_minimo})`
        });
      }

      materiales.push({ material, cantidad });
    }

    const fecha = fechaHoy();
    const lote = `LOTE-${Date.now()}`;
    const entregas = [];
    // CU 22 / UR-F-29 - Cada artículo sale de bodega consumiendo primero los lotes
    // más antiguos (FIFO). Todo el lote de entrega se registra o no se registra nada.
    try {
      await sequelize.transaction(async t => {
        for (const { material, cantidad } of materiales) {
          const entrega = await EntregaEpp.create({
            entrega_epp_cantidad: cantidad,
            entrega_epp_fecha: fecha,
            entrega_epp_estado: 'Pendiente',
            entrega_epp_lote: lote,
            material_id: material.material_id,
            trabajador_rut,
            usuario_rut: req.user.rut
          }, { transaction: t });
          await consumirFifo(material, cantidad, t);
          entregas.push(entrega);
        }
      });
    } catch (errFifo) {
      if (errFifo instanceof StockInsuficiente) {
        return res.status(400).json({ success: false, error: errFifo.message });
      }
      throw errFifo;
    }

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Entrega de EPP registrada para trabajador ${trabajador_rut} (${materiales.length} artículo(s)) — lote ${lote}`,
        log_auditoria_modulo: 'ENTREGA_EPP',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: { lote, entregas, trabajador } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar la entrega de EPP' });
  }
}

// Agrupa filas EntregaEpp por lote (o por trabajador+fecha si el lote es nulo, para datos antiguos)
function agruparPorLote(filas) {
  const grupos = new Map();
  for (const f of filas) {
    const clave = f.entrega_epp_lote || `${f.trabajador_rut}|${f.entrega_epp_fecha}`;
    if (!grupos.has(clave)) {
      grupos.set(clave, {
        lote: clave,
        trabajador_rut: f.trabajador_rut,
        trabajador_nombre: f.Trabajador
          ? `${f.Trabajador.trabajador_nombres} ${f.Trabajador.trabajador_apellidos || ''}`.trim()
          : f.trabajador_rut,
        fecha: f.entrega_epp_fecha,
        fecha_hora_validacion: f.entrega_epp_fecha_hora_validacion,
        url_comprobante: f.entrega_epp_url_comprobante,
        tiene_firma: !!f.entrega_epp_firma,
        estados: [],
        items: []
      });
    }
    const g = grupos.get(clave);
    g.estados.push(f.entrega_epp_estado);
    g.items.push({
      material_nombre: f.Material ? f.Material.material_nombre : `Material #${f.material_id}`,
      sku: f.Material ? f.Material.material_codigo_sku : '',
      unidad: f.Material ? f.Material.material_unidad_medida : '',
      cantidad: f.entrega_epp_cantidad
    });
    if (f.entrega_epp_fecha_hora_validacion) g.fecha_hora_validacion = f.entrega_epp_fecha_hora_validacion;
    if (f.entrega_epp_url_comprobante) g.url_comprobante = f.entrega_epp_url_comprobante;
    if (f.entrega_epp_firma) g.tiene_firma = true;
  }
  return Array.from(grupos.values()).map(g => ({
    lote: g.lote,
    trabajador_rut: g.trabajador_rut,
    trabajador_nombre: g.trabajador_nombre,
    fecha: g.fecha,
    fecha_hora_validacion: g.fecha_hora_validacion,
    url_comprobante: g.url_comprobante,
    tiene_firma: g.tiene_firma,
    estado: g.estados.every(e => e === 'Validado') ? 'Validado' : 'Pendiente',
    items: g.items
  }));
}

// CU23 - Historial de entregas de un trabajador o de una obra
async function getHistorial(req, res) {
  try {
    const { trabajador_rut, proyecto_codigo } = req.query;
    const where = {};

    if (trabajador_rut) {
      where.trabajador_rut = trabajador_rut;
    } else if (proyecto_codigo) {
      const trabs = await Trabajador.findAll({
        where: { proyecto_codigo_correlativo: proyecto_codigo },
        attributes: ['trabajador_rut']
      });
      where.trabajador_rut = { [Op.in]: trabs.map(t => t.trabajador_rut) };
    }

    const filas = await EntregaEpp.findAll({
      where,
      include: [
        { model: Trabajador, attributes: ['trabajador_nombres', 'trabajador_apellidos'] },
        { model: Material, attributes: ['material_nombre', 'material_codigo_sku', 'material_unidad_medida'] }
      ],
      order: [['entrega_epp_id', 'DESC']]
    });

    const lotes = agruparPorLote(filas).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    return res.json({ success: true, data: lotes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener el historial de entregas' });
  }
}

// CU24 - Validar recepción mediante firma digital
async function validarEntrega(req, res) {
  try {
    const { lote } = req.params;
    const { firma } = req.body;

    if (!firma || typeof firma !== 'string' || !firma.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'El panel de firma está vacío. Registra el trazo antes de validar.'
      });
    }

    let filas = await EntregaEpp.findAll({ where: { entrega_epp_lote: lote } });
    if (filas.length === 0 && lote.includes('|')) {
      const [rut, fecha] = lote.split('|');
      filas = await EntregaEpp.findAll({ where: { trabajador_rut: rut, entrega_epp_fecha: fecha } });
    }
    if (filas.length === 0) {
      return res.status(404).json({ success: false, error: 'Entrega no encontrada' });
    }

    if (filas.every(f => f.entrega_epp_estado === 'Validado')) {
      return res.status(409).json({ success: false, error: 'La entrega ya fue validada por el receptor' });
    }

    const ahora = new Date();
    for (const f of filas) {
      f.entrega_epp_estado = 'Validado';
      f.entrega_epp_firma = firma;
      f.entrega_epp_fecha_hora_validacion = ahora;
      await f.save();
    }

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: ahora,
        log_auditoria_accion: `Firma digital registrada y entrega de EPP validada — lote ${lote}, trabajador ${filas[0].trabajador_rut}`,
        log_auditoria_modulo: 'ENTREGA_EPP',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.json({
      success: true,
      data: { mensaje: 'Entrega Registrada con Éxito', lote, fecha_hora_validacion: ahora }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al validar la entrega' });
  }
}

// CU23 - Generar comprobante de entrega firmado (PDF)
async function generarComprobante(req, res) {
  try {
    const { lote } = req.params;

    let filas = await EntregaEpp.findAll({
      where: { entrega_epp_lote: lote },
      include: [
        { model: Trabajador },
        { model: Material, attributes: ['material_nombre', 'material_codigo_sku', 'material_unidad_medida'] }
      ]
    });
    if (filas.length === 0 && lote.includes('|')) {
      const [rut, fecha] = lote.split('|');
      filas = await EntregaEpp.findAll({
        where: { trabajador_rut: rut, entrega_epp_fecha: fecha },
        include: [
          { model: Trabajador },
          { model: Material, attributes: ['material_nombre', 'material_codigo_sku', 'material_unidad_medida'] }
        ]
      });
    }
    if (filas.length === 0) {
      return res.status(404).json({ success: false, error: 'Entrega no encontrada' });
    }

    const validada = filas.every(f => f.entrega_epp_estado === 'Validado');
    const firma = filas[0].entrega_epp_firma;
    if (!validada || !firma) {
      // Excepción 1: Registro sin firma
      return res.status(409).json({
        success: false,
        error: 'La entrega aún no ha sido validada por el receptor. No se puede generar el comprobante.'
      });
    }

    const trabajador = filas[0].Trabajador;
    const fechaHora = filas[0].entrega_epp_fecha_hora_validacion || new Date();

    const dir = path.join(__dirname, '../uploads/documentos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `comprobante_epp_${lote.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    const filePath = path.join(dir, filename);
    const urlPdf = `/uploads/documentos/${filename}`;

    try {
      const nombreTrabajador = `${trabajador.trabajador_nombres} ${trabajador.trabajador_apellidos || ''}`.trim();
      const { doc, listo } = pdf.crearDocumento(filePath, {
        titulo: 'Comprobante de entrega de EPP',
        subtitulo: 'Elementos de protección personal',
        banda: [
          ['Folio de entrega', lote],
          ['Fecha y hora de validación', pdf.fechaHora(fechaHora)],
          ['Estado', 'Recepción validada', pdf.COLORES.verde]
        ]
      });

      pdf.seccion(doc, '1. Datos del trabajador');
      pdf.datos(doc, [
        ['Nombre', nombreTrabajador],
        ['RUT', trabajador.trabajador_rut],
        ['Obra asignada', trabajador.proyecto_codigo_correlativo]
      ]);

      pdf.seccion(doc, '2. Elementos entregados');
      pdf.tabla(doc, [
        { titulo: 'N°', ancho: 0.08, alinear: 'center' },
        { titulo: 'Elemento', ancho: 0.52 },
        { titulo: 'SKU', ancho: 0.2 },
        { titulo: 'Cantidad', ancho: 0.2, alinear: 'right' }
      ], filas.map((f, i) => {
        const m = f.Material;
        return [
          i + 1,
          m ? m.material_nombre : `Material #${f.material_id}`,
          (m && m.material_codigo_sku) || '—',
          pdf.cantidad(f.entrega_epp_cantidad, m && m.material_unidad_medida)
        ];
      }), 'Sin elementos registrados.');

      pdf.seccion(doc, '3. Declaración del trabajador');
      pdf.parrafo(doc, `Declaro recibir de ${pdf.EMPRESA.razonSocial}, sin costo y en buen estado, los elementos de protección personal detallados, y me comprometo a usarlos durante mi trabajo, cuidarlos e informar su deterioro o pérdida, conforme a la Ley N° 16.744 y al D.S. N° 594.`);

      pdf.recuadro(doc, `Recepción validada con la firma del trabajador el ${pdf.fechaHora(fechaHora)}.`, 'ok');

      pdf.firmas(doc, [
        {
          titulo: 'Recibe conforme',
          nombre: nombreTrabajador,
          lineas: [`RUT ${trabajador.trabajador_rut}`],
          imagen: firma
        },
        pdf.firmaEmpresa('Entrega')
      ]);

      pdf.nota(doc, `Documento registrado en el sistema ERP de ${pdf.EMPRESA.razonSocial} con el folio de entrega ${lote}. Generado el ${pdf.fechaHora(new Date())}.`);
      pdf.finalizar(doc);
      await listo;
    } catch (pdfErr) {
      console.error('Error motor PDF:', pdfErr);
      // Excepción 2: Error de generación
      return res.status(500).json({
        success: false,
        error: 'Fallo en el motor de generación de PDF. Intenta generar el comprobante nuevamente.'
      });
    }

    const documento = await DocumentoLegal.create({
      documento_legal_tipo: 'ComprobanteEPP',
      documento_legal_url_pdf: urlPdf,
      documento_legal_fecha_emision: fechaHoy(),
      documento_legal_fecha_vencimiento: null,
      documento_legal_estado: 'Emitido',
      trabajador_rut: trabajador.trabajador_rut,
      proyecto_codigo_correlativo: trabajador.proyecto_codigo_correlativo || null
    });

    for (const f of filas) {
      f.entrega_epp_url_comprobante = urlPdf;
      await f.save();
    }

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Comprobante de entrega de EPP generado — lote ${lote}, trabajador ${trabajador.trabajador_rut}`,
        log_auditoria_modulo: 'ENTREGA_EPP',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: { url_pdf: urlPdf, documento } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al generar el comprobante de entrega' });
  }
}

module.exports = {
  getTrabajadoresActivos,
  getCatalogoEpp,
  crearEntrega,
  getHistorial,
  validarEntrega,
  generarComprobante
};
