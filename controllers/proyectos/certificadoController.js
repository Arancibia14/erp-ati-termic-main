const path = require('path');
const fs = require('fs');
const Proyecto = require('../../models/Proyecto');
const EquipoHVAC = require('../../models/EquipoHVAC');
const ModeloHvac = require('../../models/ModeloHvac');
const DocumentoLegal = require('../../models/DocumentoLegal');
const EstadoProyecto = require('../../models/EstadoProyecto');
const LogAuditoria = require('../../models/LogAuditoria');
const { fechaHoy } = require('../../utils/fecha');
const pdf = require('../../utils/pdfMembrete');

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
      where: { proyecto_codigo_correlativo },
      include: [{ model: ModeloHvac, attributes: ['modelo_hvac_nombre'] }]
    });

    // Generar PDF real
    const dir = path.join(__dirname, '../../uploads/documentos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `certificado_${proyecto_codigo_correlativo}_${Date.now()}.pdf`;
    const filePath = path.join(dir, filename);
    const urlPdf = `/uploads/documentos/${filename}`;

    const fechaInstalacion = /^\d{4}-\d{2}-\d{2}$/.test(fecha_instalacion) ? pdf.fechaLarga(fecha_instalacion) : fecha_instalacion;
    const { doc, listo } = pdf.crearDocumento(filePath, {
      titulo: 'Certificado de instalación técnica',
      banda: [
        ['Fecha de emisión', pdf.fechaCorta(new Date())],
        ['Código de obra', proyecto_codigo_correlativo],
        ['Estado', 'Pendiente de firma', pdf.COLORES.ambar]
      ]
    });

    pdf.parrafoMixto(doc, [
      [`${pdf.EMPRESA.razonSocial} certifica que en la obra `],
      [proyecto.proyecto_nombre_obra, true],
      [` (${proyecto_codigo_correlativo})${proyecto.proyecto_ubicacion ? `, ubicada en ${proyecto.proyecto_ubicacion},` : ''} se realizó la instalación de los equipos de climatización que se detallan en este documento, con fecha ${fechaInstalacion}, bajo la responsabilidad del técnico ${tecnico_nombre}.`]
    ]);

    pdf.seccion(doc, '1. Datos del proyecto');
    pdf.datos(doc, [
      ['Código de obra', proyecto_codigo_correlativo],
      ['Obra', proyecto.proyecto_nombre_obra],
      ['Ubicación', proyecto.proyecto_ubicacion],
      ['Correo de contacto', proyecto.proyecto_correo_contacto]
    ]);

    pdf.seccion(doc, '2. Datos técnicos');
    pdf.datos(doc, [
      ['Técnico responsable', tecnico_nombre],
      ['Fecha de instalación', fechaInstalacion],
      ['Observaciones', observaciones]
    ]);

    pdf.seccion(doc, '3. Equipos instalados');
    pdf.tabla(doc, [
      { titulo: 'N°', ancho: 0.08, alinear: 'center' },
      { titulo: 'Modelo', ancho: 0.57 },
      { titulo: 'N° de serie', ancho: 0.35 }
    ], equipos.map((eq, i) => [i + 1, eq.ModeloHvac?.modelo_hvac_nombre || 'Equipo HVAC', eq.equipo_hvac_numero_serie]),
    'La obra no tiene equipos HVAC registrados.');

    pdf.firmas(doc, [
      {
        titulo: 'Técnico responsable',
        nombre: tecnico_nombre,
        lineas: [pdf.EMPRESA.razonSocial]
      },
      pdf.firmaEmpresa('Por la empresa')
    ]);

    pdf.nota(doc, `Documento generado en el sistema ERP de ${pdf.EMPRESA.razonSocial} el ${pdf.fechaHora(new Date())}.`);
    pdf.finalizar(doc);
    await listo;

    const certificado = await DocumentoLegal.create({
      documento_legal_tipo: 'certificado',
      documento_legal_url_pdf: urlPdf,
      documento_legal_fecha_emision: fechaHoy(),
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
