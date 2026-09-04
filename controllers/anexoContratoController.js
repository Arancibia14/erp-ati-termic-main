const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const Trabajador = require('../models/Trabajador');
const ContratoLaboral = require('../models/ContratoLaboral');
const Proyecto = require('../models/Proyecto');
const DocumentoLegal = require('../models/DocumentoLegal');
const LogAuditoria = require('../models/LogAuditoria');

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

    const dir = path.join(__dirname, '../uploads/documentos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `anexo_traslado_${trabajador_rut}_${Date.now()}.pdf`;
    const filePath = path.join(dir, filename);
    const urlPdf = `/uploads/documentos/${filename}`;

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 60, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(22).font('Helvetica-Bold').fillColor('#0a2342')
        .text('ATI TERMIC SpA', { align: 'center' });
      doc.fontSize(10).font('Helvetica').fillColor('#555')
        .text('Ingeniería en Climatización y HVAC', { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#0a2342').lineWidth(2).stroke();
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#0a2342')
        .text('ANEXO DE CONTRATO DE TRABAJO — TRASLADO DE OBRA', { align: 'center' });
      doc.moveDown(1.5);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('DATOS DEL TRABAJADOR');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#000');
      doc.text(`RUT: ${trabajador.trabajador_rut}`);
      doc.text(`Nombre: ${trabajador.trabajador_nombres} ${trabajador.trabajador_apellidos || ''}`.trim());
      doc.moveDown(1);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('DATOS DEL TRASLADO');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#000');
      doc.text(`Obra de Origen: ${proyectoOrigen ? `${proyectoOrigen.proyecto_codigo_correlativo} — ${proyectoOrigen.proyecto_nombre_obra}` : 'Sin obra asignada'}`);
      doc.text(`Obra de Destino: ${proyectoDestino.proyecto_codigo_correlativo} — ${proyectoDestino.proyecto_nombre_obra}`);
      doc.text(`Dirección Destino: ${proyectoDestino.proyecto_ubicacion}`);
      doc.text(`Fecha de Inicio: ${fecha_inicio}`);
      doc.moveDown(1);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('CONDICIONES CONTRACTUALES');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#000');
      doc.text(`Sueldo Base: $${parseFloat(contratoVigente.contrato_laboral_sueldo_base).toLocaleString('es-CL')}`);
      doc.text(`Leyes Sociales: $${parseFloat(contratoVigente.contrato_laboral_leyes_sociales).toLocaleString('es-CL')}`);
      doc.moveDown(1);

      doc.moveDown(0.5);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#ccc').lineWidth(1).stroke();
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#c0392b')
        .text('ESTADO: PENDIENTE DE FIRMA', { align: 'center' });
      doc.moveDown(3);

      const yFirma = doc.y;
      doc.moveTo(175, yFirma).lineTo(380, yFirma).strokeColor('#000').lineWidth(1).stroke();
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#000')
        .text(`${trabajador.trabajador_nombres} ${trabajador.trabajador_apellidos || ''}`.trim(), { align: 'center' });
      doc.text('Trabajador', { align: 'center' });

      doc.moveDown(2);
      doc.fontSize(8).fillColor('#888')
        .text(`Emitido el ${new Date().toLocaleDateString('es-CL')} — ATI Termic SpA`, { align: 'center' });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const documento = await DocumentoLegal.create({
      documento_legal_tipo: 'AnexoTraslado',
      documento_legal_url_pdf: urlPdf,
      documento_legal_fecha_emision: new Date().toISOString().split('T')[0],
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
