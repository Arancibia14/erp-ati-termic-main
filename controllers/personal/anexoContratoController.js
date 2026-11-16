const path = require('path');
const fs = require('fs');
const Trabajador = require('../../models/Trabajador');
const ContratoLaboral = require('../../models/ContratoLaboral');
const Proyecto = require('../../models/Proyecto');
const DocumentoLegal = require('../../models/DocumentoLegal');
const LogAuditoria = require('../../models/LogAuditoria');
const { fechaHoy } = require('../../utils/fecha');
const pdf = require('../../utils/pdfMembrete');

async function getInfoContractual(req, res) {
  try {
    const { rut } = req.params;

    const trabajador = await Trabajador.findByPk(rut);
    if (!trabajador) {
      return res.status(404).json({ success: false, error: 'Trabajador no encontrado' });
    }

    const contratoVigente = await ContratoLaboral.findOne({
      where: { trabajador_rut: rut },
      order: [['contrato_laboral_fecha_inicio', 'DESC']]
    });

    const proyectoActual = trabajador.proyecto_codigo_correlativo
      ? await Proyecto.findByPk(trabajador.proyecto_codigo_correlativo)
      : null;

    return res.json({
      success: true,
      data: { trabajador, contrato_vigente: contratoVigente, proyecto_actual: proyectoActual }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener la información contractual' });
  }
}

async function generarAnexoTraslado(req, res) {
  try {
    const { trabajador_rut, proyecto_destino_codigo, fecha_inicio } = req.body;

    if (!trabajador_rut || !proyecto_destino_codigo || !fecha_inicio) {
      return res.status(400).json({ success: false, error: 'Trabajador, proyecto de destino y fecha de inicio son obligatorios' });
    }

    const trabajador = await Trabajador.findByPk(trabajador_rut);
    if (!trabajador) {
      return res.status(404).json({ success: false, error: 'Trabajador no encontrado' });
    }

    const contratoVigente = await ContratoLaboral.findOne({
      where: { trabajador_rut },
      order: [['contrato_laboral_fecha_inicio', 'DESC']]
    });
    if (!contratoVigente) {
      return res.status(400).json({ success: false, error: 'El trabajador no tiene un contrato vigente registrado' });
    }

    const proyectoDestino = await Proyecto.findByPk(proyecto_destino_codigo);
    if (!proyectoDestino) {
      return res.status(404).json({ success: false, error: 'Proyecto de destino no encontrado' });
    }

    if (!proyectoDestino.proyecto_ubicacion) {
      return res.status(400).json({
        success: false,
        error: 'El proyecto de destino no tiene dirección registrada; completa los datos del proyecto antes de generar el anexo'
      });
    }

    const proyectoOrigenCodigo = trabajador.proyecto_codigo_correlativo;
    const proyectoOrigen = proyectoOrigenCodigo ? await Proyecto.findByPk(proyectoOrigenCodigo) : null;

    const dir = path.join(__dirname, '../../uploads/documentos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `anexo_traslado_${trabajador_rut}_${Date.now()}.pdf`;
    const filePath = path.join(dir, filename);
    const urlPdf = `/uploads/documentos/${filename}`;

    const nombreTrabajador = `${trabajador.trabajador_nombres} ${trabajador.trabajador_apellidos || ''}`.trim();
    const { doc, listo } = pdf.crearDocumento(filePath, {
      titulo: 'Anexo de contrato de trabajo',
      subtitulo: 'Traslado de obra',
      banda: [
        ['Fecha de emisión', pdf.fechaCorta(new Date())],
        ['Rige desde', pdf.fechaCorta(fecha_inicio)],
        ['Estado', 'Pendiente de firma', pdf.COLORES.ambar]
      ]
    });

    const representante = pdf.EMPRESA.representante
      ? `, representada por ${pdf.EMPRESA.representante}${pdf.EMPRESA.representanteRut ? `, RUT ${pdf.EMPRESA.representanteRut}` : ''}`
      : '';
    pdf.parrafoMixto(doc, [
      [`En ${pdf.EMPRESA.ciudad}, a ${pdf.fechaLarga(new Date())}, entre `],
      [pdf.EMPRESA.razonSocial, true],
      [`${pdf.EMPRESA.rut ? `, RUT ${pdf.EMPRESA.rut}` : ''}${representante}, domiciliada en ${pdf.EMPRESA.direccion}, ${pdf.EMPRESA.ciudad}, en adelante «el Empleador», y `],
      [nombreTrabajador, true],
      [`, RUT ${trabajador.trabajador_rut}, en adelante «el Trabajador», se acuerda el siguiente anexo al contrato de trabajo vigente entre las partes:`]
    ]);

    pdf.seccion(doc, 'Primero: traslado de obra');
    pdf.parrafo(doc, `A contar del ${pdf.fechaLarga(fecha_inicio)}, el Trabajador prestará sus servicios en la obra ${proyectoDestino.proyecto_codigo_correlativo} — ${proyectoDestino.proyecto_nombre_obra}, ubicada en ${proyectoDestino.proyecto_ubicacion}${proyectoOrigen ? `, dejando de prestarlos en la obra ${proyectoOrigen.proyecto_codigo_correlativo} — ${proyectoOrigen.proyecto_nombre_obra}` : ''}.`);

    pdf.seccion(doc, 'Segundo: condiciones que se mantienen');
    pdf.parrafo(doc, 'Se mantienen sin modificación todas las demás estipulaciones del contrato de trabajo vigente, incluidas las siguientes condiciones:');
    pdf.datos(doc, [
      ['Sueldo base', pdf.pesos(contratoVigente.contrato_laboral_sueldo_base)],
      ['Leyes sociales', pdf.pesos(contratoVigente.contrato_laboral_leyes_sociales)]
    ]);

    pdf.seccion(doc, 'Tercero: ejemplares');
    pdf.parrafo(doc, 'El presente anexo se firma en dos ejemplares de igual tenor y fecha, quedando uno en poder de cada parte.');

    pdf.firmas(doc, [
      pdf.firmaEmpresa('Empleador'),
      {
        titulo: 'Trabajador',
        nombre: nombreTrabajador,
        lineas: [`RUT ${trabajador.trabajador_rut}`]
      }
    ]);

    pdf.nota(doc, `Documento generado en el sistema ERP de ${pdf.EMPRESA.razonSocial} el ${pdf.fechaHora(new Date())}.`);
    pdf.finalizar(doc);
    await listo;

    const documento = await DocumentoLegal.create({
      documento_legal_tipo: 'AnexoTraslado',
      documento_legal_url_pdf: urlPdf,
      documento_legal_fecha_emision: fechaHoy(),
      documento_legal_fecha_vencimiento: null,
      documento_legal_estado: 'PendienteFirma',
      trabajador_rut,
      proyecto_codigo_correlativo: proyecto_destino_codigo
    });

    contratoVigente.proyecto_codigo_correlativo = proyecto_destino_codigo;
    await contratoVigente.save();

    trabajador.proyecto_codigo_correlativo = proyecto_destino_codigo;
    await trabajador.save();

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Anexo de contrato por traslado generado para trabajador ${trabajador_rut} — de ${proyectoOrigenCodigo || 'sin obra'} a ${proyecto_destino_codigo}`,
        log_auditoria_modulo: 'ANEXO_CONTRATO',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({
      success: true,
      data: { documento, trabajador, proyecto_origen: proyectoOrigen, proyecto_destino: proyectoDestino }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al generar el anexo de contrato' });
  }
}

module.exports = { getInfoContractual, generarAnexoTraslado };
