const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const DocumentoLegal = require('../models/DocumentoLegal');
const Trabajador = require('../models/Trabajador');
const LogAuditoria = require('../models/LogAuditoria');

const FORMATOS_OK = ['.pdf', '.jpg', '.jpeg', '.png'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/examenes-medicos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `examen_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (FORMATOS_OK.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      // Excepción 1: Formato no permitido
      cb(new Error('Formato no permitido. Adjunta un archivo PDF o imagen (JPG, PNG).'));
    }
  }
});

function eliminarArchivo(urlRelativa) {
  if (!urlRelativa) return;
  fs.unlink(path.join(__dirname, '..', urlRelativa), () => {});
}

const TIPOS = {
  fisica: { key: 'ExamenAlturaFisica', label: 'Altura Física' },
  geografica: { key: 'ExamenAlturaGeografica', label: 'Altura Geográfica' }
};

async function getExamenesTrabajador(req, res) {
  try {
    const { rut } = req.params;
    const examenes = await DocumentoLegal.findAll({
      where: {
        trabajador_rut: rut,
        documento_legal_tipo: { [Op.in]: [TIPOS.fisica.key, TIPOS.geografica.key] }
      },
      order: [['documento_legal_fecha_emision', 'DESC']]
    });

    const hoy = new Date().toISOString().split('T')[0];
    const data = examenes.map(e => ({
      ...e.toJSON(),
      vencido: !!e.documento_legal_fecha_vencimiento && e.documento_legal_fecha_vencimiento < hoy
    }));
    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener los exámenes médicos' });
  }
}

async function cargarExamen(req, res) {
  try {
    const { trabajador_rut, tipo, fecha_emision, fecha_vencimiento } = req.body;

    const limpiar = () => { if (req.file) eliminarArchivo(`/uploads/examenes-medicos/${req.file.filename}`); };

    if (!trabajador_rut || !tipo || !fecha_vencimiento) {
      limpiar();
      return res.status(400).json({ success: false, error: 'Trabajador, tipo de examen y fecha de vencimiento son obligatorios' });
    }

    if (!TIPOS[tipo]) {
      limpiar();
      return res.status(400).json({ success: false, error: 'Tipo de examen inválido. Debe ser "fisica" o "geografica".' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Se requiere adjuntar el archivo del certificado' });
    }

    const trabajador = await Trabajador.findByPk(trabajador_rut);
    if (!trabajador) {
      limpiar();
      return res.status(404).json({ success: false, error: 'Trabajador no encontrado' });
    }

    const hoy = new Date().toISOString().split('T')[0];
    const vencido = fecha_vencimiento < hoy;

    const certificado = await DocumentoLegal.create({
      documento_legal_tipo: TIPOS[tipo].key,
      documento_legal_url_pdf: `/uploads/examenes-medicos/${req.file.filename}`,
      documento_legal_fecha_emision: fecha_emision || hoy,
      documento_legal_fecha_vencimiento: fecha_vencimiento,
      documento_legal_estado: vencido ? 'Vencido' : 'Vigente',
      trabajador_rut,
      proyecto_codigo_correlativo: null
    });

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Certificado médico (${TIPOS[tipo].label}) cargado para trabajador ${trabajador_rut}${vencido ? ' — VENCIDO' : ''}`,
        log_auditoria_modulo: 'EXAMEN_MEDICO',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({
      success: true,
      data: {
        certificado,
        vencido,
        mensaje: 'Certificado médico cargado exitosamente'
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al cargar el certificado médico' });
  }
}

module.exports = { upload, getExamenesTrabajador, cargarExamen };
