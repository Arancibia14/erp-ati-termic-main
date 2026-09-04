const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DocumentoLegal = require('../models/DocumentoLegal');
const Trabajador = require('../models/Trabajador');
const Proyecto = require('../models/Proyecto');
const LogAuditoria = require('../models/LogAuditoria');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/documentos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `poliza_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

async function subirPoliza(req, res) {
  try {
    const { trabajador_rut, proyecto_codigo_correlativo, fecha_vencimiento } = req.body;

    if (!trabajador_rut || !proyecto_codigo_correlativo || !fecha_vencimiento) {
      return res.status(400).json({ success: false, error: 'Trabajador, proyecto y fecha de vencimiento son requeridos' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Se requiere el archivo PDF de la póliza' });
    }

    const fechaVenc = new Date(fecha_vencimiento);
    if (fechaVenc <= new Date()) {
      return res.status(400).json({ success: false, error: 'La fecha de vencimiento debe ser futura' });
    }

    const trabajador = await Trabajador.findByPk(trabajador_rut);
    if (!trabajador) {
      return res.status(404).json({ success: false, error: 'Trabajador no encontrado' });
    }

    const proyecto = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const polizaExistente = await DocumentoLegal.findOne({
      where: {
        trabajador_rut,
        proyecto_codigo_correlativo,
        documento_legal_tipo: 'poliza',
        documento_legal_estado: 'Vigente'
      }
    });
    if (polizaExistente) {
      return res.status(409).json({
        success: false,
        error: `El trabajador ya tiene una póliza vigente para este proyecto (vence: ${polizaExistente.documento_legal_fecha_vencimiento}). Primero debe anularse la póliza existente.`
      });
    }

    const poliza = await DocumentoLegal.create({
      documento_legal_tipo: 'poliza',
      documento_legal_url_pdf: `/uploads/documentos/${req.file.filename}`,
      documento_legal_fecha_emision: new Date().toISOString().split('T')[0],
      documento_legal_fecha_vencimiento: fecha_vencimiento,
      documento_legal_estado: 'Vigente',
      trabajador_rut,
      proyecto_codigo_correlativo
    });

    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Póliza registrada para trabajador ${trabajador_rut} en proyecto ${proyecto_codigo_correlativo}`,
      log_auditoria_modulo: 'POLIZA',
      usuario_rut: req.user.rut
    });

    return res.status(201).json({ success: true, data: poliza });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al subir póliza' });
  }
}

module.exports = { subirPoliza, upload };
