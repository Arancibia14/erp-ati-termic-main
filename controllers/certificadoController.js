const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const Proyecto = require('../models/Proyecto');
const EquipoHVAC = require('../models/EquipoHVAC');
const DocumentoLegal = require('../models/DocumentoLegal');
const EstadoProyecto = require('../models/EstadoProyecto');
const LogAuditoria = require('../models/LogAuditoria');

async function generarCertificado(req, res) {
  try {
    const { proyecto_codigo_correlativo, datos_certificado } = req.body;

    if (!proyecto_codigo_correlativo || !datos_certificado) {
      return res.status(400).json({ success: false, error: 'Proyecto y datos del certificado son requeridos' });
    }

    const { tecnico_nombre, fecha_instalacion, observaciones } = datos_certificado;
    if (!tecnico_nombre || !fecha_instalacion) {
      return res.status(400).json({ success: false, error: 'Nombre del técnico y fecha de instalación son obligatorios' });
    }

    const proyecto = await Proyecto.findByPk(proyecto_codigo_correlativo, {
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    if (proyecto.EstadoProyecto?.estado_proyecto_nombre !== 'Finalizado') {
      return res.status(400).json({
        success: false,
        error: `Solo se puede emitir certificado para proyectos en estado "Finalizado". Estado actual: "${proyecto.EstadoProyecto?.estado_proyecto_nombre || 'desconocido'}".`
      });
    }

    const equipos = await EquipoHVAC.findAll({
      where: { proyecto_codigo_correlativo }
    });

    // Generar PDF real
    const dir = path.join(__dirname, '../uploads/documentos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `certificado_${proyecto_codigo_correlativo}_${Date.now()}.pdf`;
    const filePath = path.join(dir, filename);
    const urlPdf = `/uploads/documentos/${filename}`;

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 60, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Encabezado
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#0a2342')
        .text('ATI TERMIC SpA', { align: 'center' });
      doc.fontSize(10).font('Helvetica').fillColor('#555')
        .text('Ingeniería en Climatización y HVAC', { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#0a2342').lineWidth(2).stroke();
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#0a2342')
        .text('CERTIFICADO DE INSTALACIÓN TÉCNICA', { align: 'center' });
      doc.moveDown(1.5);

      // Datos del proyecto
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('DATOS DEL PROYECTO');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#000');
      doc.text(`Código de Obra:  ${proyecto_codigo_correlativo}`);
      doc.text(`Nombre de Obra:  ${proyecto.proyecto_nombre_obra}`);
      doc.text(`Correo Contacto: ${proyecto.proyecto_correo_contacto || '—'}`);
      if (proyecto.proyecto_ubicacion) doc.text(`Ubicación:       ${proyecto.proyecto_ubicacion}`);
      doc.moveDown(1);

      // Datos técnicos
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('DATOS TÉCNICOS');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#000');
      doc.text(`Técnico Responsable: ${tecnico_nombre}`);
      doc.text(`Fecha de Instalación: ${fecha_instalacion}`);
      if (observaciones) doc.text(`Observaciones: ${observaciones}`);
      doc.moveDown(1);

      // Equipos instalados
      if (equipos.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('EQUIPOS INSTALADOS');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica').fillColor('#000');
        equipos.forEach((eq, i) => {
          doc.text(`  ${i + 1}.  ${eq.equipo_hvac_modelo || `Equipo ID #${eq.equipo_hvac_id}`}`);
        });
        doc.moveDown(1);
      }

      // Estado
      doc.moveDown(0.5);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#ccc').lineWidth(1).stroke();
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#c0392b')
        .text('ESTADO: PENDIENTE DE FIRMA', { align: 'center' });
      doc.moveDown(3);

      // Firma
      const yFirma = doc.y;
      doc.moveTo(175, yFirma).lineTo(380, yFirma).strokeColor('#000').lineWidth(1).stroke();
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#000')
        .text(tecnico_nombre, { align: 'center' });
      doc.text('Técnico Responsable', { align: 'center' });

      // Pie
      doc.moveDown(2);
      doc.fontSize(8).fillColor('#888')
        .text(`Emitido el ${new Date().toLocaleDateString('es-CL')} — ATI Termic SpA`, { align: 'center' });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const certificado = await DocumentoLegal.create({
      documento_legal_tipo: 'certificado',
      documento_legal_url_pdf: urlPdf,
      documento_legal_fecha_emision: new Date().toISOString().split('T')[0],
      documento_legal_fecha_vencimiento: null,
      documento_legal_estado: 'PendienteFirma',
      trabajador_rut: null,
      proyecto_codigo_correlativo
    });

    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Certificado de instalación generado para proyecto ${proyecto_codigo_correlativo}`,
      log_auditoria_modulo: 'CERTIFICADO',
      usuario_rut: req.user.rut
    });

    return res.status(201).json({
      success: true,
      data: { certificado, proyecto, equipos, datos_certificado }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al generar certificado' });
  }
}

module.exports = { generarCertificado };
