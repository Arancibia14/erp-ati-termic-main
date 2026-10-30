const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const sequelize = require('../config/database');
const ActaRecepcion = require('../models/ActaRecepcion');
const ActaRecepcionMaterial = require('../models/ActaRecepcionMaterial');
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const EquipoHVAC = require('../models/EquipoHVAC');
const ModeloHvac = require('../models/ModeloHvac');
const GuiaDespacho = require('../models/GuiaDespacho');
const OrdenCompra = require('../models/OrdenCompra');
const DevolucionObra = require('../models/DevolucionObra');
const Material = require('../models/Material');
const Usuario = require('../models/Usuario');
const PlantillaCorreo = require('../models/PlantillaCorreo');
const LogAuditoria = require('../models/LogAuditoria');
const { validarRutChileno } = require('../utils/rut');
const { enviarCorreo } = require('../utils/correo');
const { aplicarPlantilla } = require('../utils/plantillaCorreo');
const { fechaHoy, ZONA_HORARIA } = require('../utils/fecha');

// CU 68 - Generando acta de recepción final de obra
// Una sola acta Firmada por obra. Su fecha es el inicio de la garantía de los
// equipos de la obra. No se edita: el administrador la anula y se emite otra.

const ESTADO_HABILITADO = 'En Ejecución';
const CONFORMIDADES = ['Conforme', 'Conforme con observaciones'];
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function auditar(accion, usuarioRut) {
  try {
    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: accion.slice(0, 255),
      log_auditoria_modulo: 'ACTA_RECEPCION',
      usuario_rut: usuarioRut
    });
  } catch (_) { /* log no crítico */ }
}

const formatoFecha = fecha => new Date(fecha).toLocaleDateString('es-CL', { timeZone: ZONA_HORARIA });
const formatoFechaHora = fecha => new Date(fecha).toLocaleString('es-CL', { timeZone: ZONA_HORARIA });

const escaparHtml = texto => String(texto)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function buscarObraHabilitada(codigo) {
  const proyecto = await Proyecto.findByPk(codigo, { include: [{ model: EstadoProyecto }] });
  if (!proyecto) return { error: 'La obra seleccionada no existe', status: 404 };
  if (proyecto.proyecto_archivado || proyecto.EstadoProyecto?.estado_proyecto_nombre !== ESTADO_HABILITADO) {
    return { error: 'Solo se puede generar el acta de una obra En Ejecución', status: 409 };
  }
  return { proyecto };
}

async function actaFirmadaDe(codigo) {
  return ActaRecepcion.findOne({
    where: { proyecto_codigo_correlativo: codigo, acta_recepcion_estado: 'Firmada' }
  });
}

// Usado = recibido en obra por guías menos lo devuelto de la obra. Es la misma
// cuenta que hace Devolución de Obra, así ambos módulos muestran lo mismo.
async function calcularMaterialesUsados(codigo) {
  const [guias, devoluciones] = await Promise.all([
    GuiaDespacho.findAll({
      where: { guia_despacho_estado: 'Recibido' },
      include: [{
        model: OrdenCompra,
        attributes: [],
        where: { proyecto_codigo_correlativo: codigo },
        required: true
      }]
    }),
    DevolucionObra.findAll({ where: { proyecto_codigo_correlativo: codigo } })
  ]);

  const usado = new Map();
  for (const g of guias) {
    if (!g.material_id) continue;
    usado.set(g.material_id, (usado.get(g.material_id) || 0) + (g.guia_despacho_cantidad_recibida || 0));
  }
  for (const d of devoluciones) {
    if (usado.has(d.material_id)) usado.set(d.material_id, usado.get(d.material_id) - (d.devolucion_obra_cantidad || 0));
  }

  const ids = [...usado.keys()].filter(id => usado.get(id) > 0);
  if (ids.length === 0) return [];
  const materiales = await Material.findAll({ where: { material_id: ids } });
  return materiales
    .map(m => ({
      material_id: m.material_id,
      sku: m.material_codigo_sku,
      nombre: m.material_nombre,
      unidad: m.material_unidad_medida,
      cantidad: usado.get(m.material_id)
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

async function equiposDe(codigo) {
  const equipos = await EquipoHVAC.findAll({
    where: { proyecto_codigo_correlativo: codigo },
    include: [{ model: ModeloHvac, attributes: ['modelo_hvac_nombre'] }],
    order: [['equipo_hvac_numero_serie', 'ASC']]
  });
  return equipos.map(e => ({
    numero_serie: e.equipo_hvac_numero_serie,
    modelo: e.ModeloHvac?.modelo_hvac_nombre || '',
    fecha_instalacion: e.equipo_hvac_fecha_instalacion
  }));
}

async function contarGuiasEnTransito(codigo) {
  return GuiaDespacho.count({
    where: { guia_despacho_estado: 'En Tránsito' },
    include: [{
      model: OrdenCompra,
      attributes: [],
      where: { proyecto_codigo_correlativo: codigo },
      required: true
    }]
  });
}

// Paso 2 - Obras que pueden recibir acta: En Ejecución, no archivadas y sin
// acta Firmada (Excepción 1)
async function getObrasHabilitadas(req, res) {
  try {
    const proyectos = await Proyecto.findAll({
      include: [{ model: EstadoProyecto, where: { estado_proyecto_nombre: ESTADO_HABILITADO }, required: true }],
      order: [['proyecto_codigo_correlativo', 'ASC']]
    });
    const conActa = await ActaRecepcion.findAll({
      where: { acta_recepcion_estado: 'Firmada' },
      attributes: ['proyecto_codigo_correlativo']
    });
    const codigosConActa = new Set(conActa.map(a => a.proyecto_codigo_correlativo));

    const data = proyectos
      .filter(p => !p.proyecto_archivado && !codigosConActa.has(p.proyecto_codigo_correlativo))
      .map(p => ({ codigo: p.proyecto_codigo_correlativo, nombre: p.proyecto_nombre_obra }));
    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener las obras habilitadas' });
  }
}

// Paso 3 - Datos que el sistema autocompleta en el acta
async function getDatosObra(req, res) {
  try {
    const { codigo } = req.params;
    const { proyecto, error, status } = await buscarObraHabilitada(codigo);
    if (error) return res.status(status).json({ success: false, error });

    if (await actaFirmadaDe(codigo)) {
      return res.status(409).json({ success: false, error: 'La obra ya tiene un acta de recepción firmada' });
    }

    const [equipos, materiales, guiasEnTransito] = await Promise.all([
      equiposDe(codigo),
      calcularMaterialesUsados(codigo),
      contarGuiasEnTransito(codigo)
    ]);

    return res.json({
      success: true,
      data: {
        obra: {
          codigo: proyecto.proyecto_codigo_correlativo,
          nombre: proyecto.proyecto_nombre_obra,
          direccion: proyecto.proyecto_ubicacion,
          correo_contacto: proyecto.proyecto_correo_contacto,
          tipo_sistema: proyecto.proyecto_tipo_sistema
        },
        equipos,
        materiales,
        guias_en_transito: guiasEnTransito
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener los datos de la obra' });
  }
}

function generarPdfActa({ acta, proyecto, equipos, materiales, emisor }, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const titulo = texto => {
      doc.moveDown(0.8);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text(texto);
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#000');
    };

    doc.fontSize(22).font('Helvetica-Bold').fillColor('#0a2342')
      .text('ATI TERMIC SpA', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#555')
      .text('Ingeniería en Climatización y HVAC', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#0a2342').lineWidth(2).stroke();
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#0a2342')
      .text('ACTA DE RECEPCIÓN FINAL DE OBRA', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#555')
      .text(`Folio N° ${acta.acta_recepcion_id}`, { align: 'center' });

    titulo('DATOS DE LA OBRA');
    doc.text(`Código: ${proyecto.proyecto_codigo_correlativo}`);
    doc.text(`Obra: ${proyecto.proyecto_nombre_obra}`);
    doc.text(`Dirección: ${proyecto.proyecto_ubicacion || 'Sin dirección registrada'}`);

    titulo('CLIENTE QUE RECIBE');
    doc.text(`Nombre: ${acta.acta_recepcion_cliente_nombre}`);
    doc.text(`RUT: ${acta.acta_recepcion_cliente_rut}`);
    doc.text(`Cargo: ${acta.acta_recepcion_cliente_cargo}`);
    doc.text(`Correo: ${acta.acta_recepcion_cliente_correo}`);

    titulo('TRABAJOS REALIZADOS');
    doc.text(acta.acta_recepcion_trabajos, { align: 'justify' });

    titulo('EQUIPOS ENTREGADOS');
    if (equipos.length === 0) doc.text('La obra no tiene equipos HVAC registrados.');
    equipos.forEach((e, i) => doc.text(`  ${i + 1}.  ${e.modelo || 'Equipo HVAC'}  —  N° de serie ${e.numero_serie}`));

    titulo('MATERIALES UTILIZADOS');
    if (materiales.length === 0) doc.text('No se registran materiales recibidos en la obra.');
    materiales.forEach((m, i) => doc.text(`  ${i + 1}.  ${m.nombre}${m.sku ? ` [${m.sku}]` : ''}  —  ${Number(m.cantidad)} ${m.unidad || ''}`.trimEnd()));

    titulo('CONFORMIDAD');
    doc.text(`Resultado: ${acta.acta_recepcion_conformidad}`);
    if (acta.acta_recepcion_observaciones) doc.text(`Observaciones: ${acta.acta_recepcion_observaciones}`, { align: 'justify' });

    doc.moveDown(1);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#ccc').lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0a2342')
      .text(`Fecha de recepción: ${formatoFechaHora(acta.acta_recepcion_fecha_hora)}`, { align: 'center' });
    doc.fillColor('#1e7d34')
      .text(`LA GARANTÍA DE LOS EQUIPOS RIGE DESDE EL ${formatoFecha(acta.acta_recepcion_fecha_hora)}`, { align: 'center' });
    doc.moveDown(1);

    // La firma necesita unos 120 puntos: si no caben, pasa a la página siguiente
    if (doc.y > doc.page.height - 220) doc.addPage();
    try {
      const imgBuffer = Buffer.from(acta.acta_recepcion_firma_cliente.split(',')[1], 'base64');
      doc.image(imgBuffer, doc.page.width / 2 - 110, doc.y, { width: 220 });
      doc.moveDown(8);
    } catch (_) {
      doc.moveDown(3);
    }

    const yFirma = doc.y;
    doc.moveTo(175, yFirma).lineTo(380, yFirma).strokeColor('#000').lineWidth(1).stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#000')
      .text(acta.acta_recepcion_cliente_nombre, { align: 'center' });
    doc.text(`RUT ${acta.acta_recepcion_cliente_rut} — Cliente`, { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#888')
      .text(`Acta emitida por ${emisor} el ${formatoFechaHora(new Date())} — ATI Termic SpA. Registro inalterable.`, { align: 'center' });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// Envía la copia al cliente. Devuelve true o false: un fallo de correo no
// anula el acta (Excepción 5), solo se avisa para reenviarla.
async function enviarCopiaCliente(acta, proyecto) {
  try {
    const plantilla = await PlantillaCorreo.findByPk('acta_recepcion');
    if (!plantilla) throw new Error('Falta la plantilla de correo acta_recepcion');
    const valores = {
      cliente: acta.acta_recepcion_cliente_nombre,
      obra: proyecto.proyecto_nombre_obra,
      codigo: proyecto.proyecto_codigo_correlativo,
      fecha: formatoFechaHora(acta.acta_recepcion_fecha_hora),
      fecha_garantia: formatoFecha(acta.acta_recepcion_fecha_hora)
    };
    const valoresHtml = Object.fromEntries(Object.entries(valores).map(([k, v]) => [k, escaparHtml(v)]));
    await enviarCorreo({
      para: acta.acta_recepcion_cliente_correo,
      asunto: aplicarPlantilla(plantilla.plantilla_correo_asunto, valores),
      texto: aplicarPlantilla(plantilla.plantilla_correo_contenido_texto, valores),
      html: aplicarPlantilla(plantilla.plantilla_correo_contenido_html, valoresHtml),
      adjuntos: [{
        filename: `acta_recepcion_${proyecto.proyecto_codigo_correlativo}.pdf`,
        path: path.join(__dirname, '..', acta.acta_recepcion_url_pdf)
      }]
    });
    return true;
  } catch (err) {
    console.error('[correo] No se pudo enviar el acta de recepción:', err.message);
    return false;
  }
}

function validarDatosActa(body) {
  const campos = [];
  const texto = v => (typeof v === 'string' ? v.trim() : '');
  const datos = {
    cliente_nombre: texto(body.cliente_nombre),
    cliente_cargo: texto(body.cliente_cargo),
    cliente_correo: texto(body.cliente_correo),
    trabajos: texto(body.trabajos),
    conformidad: texto(body.conformidad),
    observaciones: texto(body.observaciones)
  };

  if (!datos.cliente_nombre) campos.push('cliente_nombre');
  if (!datos.cliente_cargo) campos.push('cliente_cargo');
  if (!datos.trabajos) campos.push('trabajos');
  if (!CONFORMIDADES.includes(datos.conformidad)) campos.push('conformidad');
  if (datos.conformidad === 'Conforme con observaciones' && !datos.observaciones) campos.push('observaciones');
  if (!CORREO_REGEX.test(datos.cliente_correo)) campos.push('cliente_correo');

  const rut = validarRutChileno(body.cliente_rut);
  if (!rut.valido) campos.push('cliente_rut');
  datos.cliente_rut = rut.rut;

  return { datos, campos };
}

// Pasos 4 a 7 - Valida, guarda el acta con sus materiales congelados, genera
// el PDF, envía la copia al cliente y registra la acción
async function generarActa(req, res) {
  try {
    const { proyecto_codigo_correlativo, firma } = req.body;
    if (!proyecto_codigo_correlativo) {
      return res.status(400).json({ success: false, error: 'Selecciona la obra', campos: ['proyecto'] });
    }

    const { proyecto, error, status } = await buscarObraHabilitada(proyecto_codigo_correlativo);
    if (error) return res.status(status).json({ success: false, error });

    // Excepción 1 - La obra ya tiene un acta firmada
    if (await actaFirmadaDe(proyecto_codigo_correlativo)) {
      return res.status(409).json({ success: false, error: 'La obra ya tiene un acta de recepción firmada. Para emitir otra, el administrador debe anularla primero.' });
    }

    // Excepción 2 - Datos obligatorios faltantes o RUT inválido
    const { datos, campos } = validarDatosActa(req.body);
    if (campos.length > 0) {
      const error = campos.includes('cliente_rut') && campos.length === 1
        ? 'El RUT del cliente tiene un formato inválido'
        : 'Completa los campos marcados en rojo';
      return res.status(400).json({ success: false, error, campos });
    }

    // Excepción 3 - Firma vacía
    if (!firma || typeof firma !== 'string' || !firma.startsWith('data:image/')) {
      return res.status(400).json({ success: false, error: 'El panel de firma está vacío. El cliente debe firmar para generar el acta.' });
    }

    const [equipos, materiales, emisor] = await Promise.all([
      equiposDe(proyecto_codigo_correlativo),
      calcularMaterialesUsados(proyecto_codigo_correlativo),
      Usuario.findByPk(req.user.rut, { attributes: ['usuario_nombre'] })
    ]);

    const dir = path.join(__dirname, '../uploads/actas-recepcion');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const t = await sequelize.transaction();
    let acta;
    let filePath;
    try {
      acta = await ActaRecepcion.create({
        proyecto_codigo_correlativo,
        acta_recepcion_fecha_hora: new Date(),
        acta_recepcion_cliente_nombre: datos.cliente_nombre,
        acta_recepcion_cliente_rut: datos.cliente_rut,
        acta_recepcion_cliente_cargo: datos.cliente_cargo,
        acta_recepcion_cliente_correo: datos.cliente_correo,
        acta_recepcion_trabajos: datos.trabajos,
        acta_recepcion_conformidad: datos.conformidad,
        acta_recepcion_observaciones: datos.observaciones || null,
        acta_recepcion_firma_cliente: firma,
        acta_recepcion_estado: 'Firmada',
        usuario_rut: req.user.rut
      }, { transaction: t });

      if (materiales.length > 0) {
        await ActaRecepcionMaterial.bulkCreate(materiales.map(m => ({
          acta_recepcion_id: acta.acta_recepcion_id,
          material_id: m.material_id,
          acta_recepcion_material_cantidad: m.cantidad
        })), { transaction: t });
      }

      const filename = `acta_recepcion_${proyecto_codigo_correlativo.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
      filePath = path.join(dir, filename);
      await generarPdfActa({
        acta,
        proyecto,
        equipos,
        materiales,
        emisor: emisor?.usuario_nombre || req.user.rut
      }, filePath);

      acta.acta_recepcion_url_pdf = `/uploads/actas-recepcion/${filename}`;
      await acta.save({ transaction: t });
      await t.commit();
    } catch (errActa) {
      await t.rollback();
      if (filePath) fs.unlink(filePath, () => {});
      console.error('Error al generar el acta:', errActa);
      return res.status(500).json({ success: false, error: 'No se pudo generar el acta. Intenta nuevamente.' });
    }

    await auditar(`Acta de recepción N° ${acta.acta_recepcion_id} firmada para la obra ${proyecto_codigo_correlativo} por ${datos.cliente_nombre}`, req.user.rut);
    const correoEnviado = await enviarCopiaCliente(acta, proyecto);

    return res.status(201).json({
      success: true,
      data: {
        acta_recepcion_id: acta.acta_recepcion_id,
        url_pdf: acta.acta_recepcion_url_pdf,
        fecha_inicio_garantia: fechaHoy(acta.acta_recepcion_fecha_hora),
        correo_enviado: correoEnviado
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al generar el acta de recepción' });
  }
}

// Historial de actas emitidas, firmadas y anuladas
async function listarActas(req, res) {
  try {
    const actas = await ActaRecepcion.findAll({
      attributes: { exclude: ['acta_recepcion_firma_cliente'] },
      include: [
        { model: Proyecto, attributes: ['proyecto_nombre_obra'] },
        { model: Usuario, attributes: ['usuario_nombre'] }
      ],
      order: [['acta_recepcion_fecha_hora', 'DESC']]
    });
    const data = actas.map(a => ({
      ...a.toJSON(),
      proyecto_nombre_obra: a.Proyecto?.proyecto_nombre_obra || '',
      emisor: a.Usuario?.usuario_nombre || a.usuario_rut
    }));
    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener las actas de recepción' });
  }
}

// Flujo de anulación - Solo el administrador, con motivo obligatorio
async function anularActa(req, res) {
  try {
    const motivo = typeof req.body.motivo === 'string' ? req.body.motivo.trim() : '';
    // Excepción 6 - Anulación sin motivo
    if (!motivo) {
      return res.status(400).json({ success: false, error: 'Debes indicar el motivo de la anulación', campos: ['motivo'] });
    }

    const acta = await ActaRecepcion.findByPk(req.params.id);
    if (!acta) return res.status(404).json({ success: false, error: 'Acta no encontrada' });
    if (acta.acta_recepcion_estado !== 'Firmada') {
      return res.status(409).json({ success: false, error: 'El acta ya se encuentra anulada' });
    }

    acta.acta_recepcion_estado = 'Anulada';
    acta.acta_recepcion_motivo_anulacion = motivo;
    acta.acta_recepcion_fecha_anulacion = new Date();
    await acta.save();

    await auditar(`Acta de recepción N° ${acta.acta_recepcion_id} de la obra ${acta.proyecto_codigo_correlativo} anulada. Motivo: ${motivo}`, req.user.rut);
    return res.json({ success: true, data: { mensaje: 'Acta anulada. La obra queda habilitada para emitir una nueva acta.' } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al anular el acta' });
  }
}

// Excepción 5 - Reenvío de la copia al cliente cuando el correo falló
async function reenviarCorreoActa(req, res) {
  try {
    const acta = await ActaRecepcion.findByPk(req.params.id, { include: [{ model: Proyecto }] });
    if (!acta) return res.status(404).json({ success: false, error: 'Acta no encontrada' });
    if (acta.acta_recepcion_estado !== 'Firmada') {
      return res.status(409).json({ success: false, error: 'Solo se puede reenviar un acta firmada' });
    }
    if (!acta.acta_recepcion_url_pdf || !fs.existsSync(path.join(__dirname, '..', acta.acta_recepcion_url_pdf))) {
      return res.status(409).json({ success: false, error: 'El PDF del acta no se encuentra en el servidor' });
    }

    const enviado = await enviarCopiaCliente(acta, acta.Proyecto);
    if (!enviado) {
      return res.status(502).json({ success: false, error: 'No se pudo enviar el correo. Intenta nuevamente más tarde.' });
    }

    await auditar(`Acta de recepción N° ${acta.acta_recepcion_id} reenviada a ${acta.acta_recepcion_cliente_correo}`, req.user.rut);
    return res.json({ success: true, data: { mensaje: `Acta reenviada a ${acta.acta_recepcion_cliente_correo}` } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al reenviar el acta' });
  }
}

module.exports = {
  getObrasHabilitadas,
  getDatosObra,
  generarActa,
  listarActas,
  anularActa,
  reenviarCorreoActa
};
