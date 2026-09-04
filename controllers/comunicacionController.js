const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BitacoraComunicacion = require('../models/BitacoraComunicacion');
const Proyecto = require('../models/Proyecto');
const LogAuditoria = require('../models/LogAuditoria');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/comunicaciones');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `comunicacion_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

async function getHistorialComunicaciones(req, res) {
  try {
    const { codigo } = req.params;

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const comunicaciones = await BitacoraComunicacion.findAll({
      where: { proyecto_codigo_correlativo: codigo },
      order: [['bitacora_comunicacion_fecha', 'DESC']]
    });

    return res.json({ success: true, data: comunicaciones });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener historial de comunicaciones' });
  }
}

async function registrarComunicacion(req, res) {
  try {
    const { descripcion, fecha, tipo, participantes, proyecto_codigo_correlativo } = req.body;

    if (!descripcion || !fecha || !tipo || !proyecto_codigo_correlativo) {
      return res.status(400).json({ success: false, error: 'Descripción, fecha, tipo y proyecto son requeridos' });
    }

    const proyecto = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const urlAdjunto = req.file ? `/uploads/comunicaciones/${req.file.filename}` : null;

    const comunicacion = await BitacoraComunicacion.create({
      bitacora_comunicacion_descripcion: descripcion,
      bitacora_comunicacion_fecha: fecha,
      bitacora_comunicacion_tipo: tipo,
      bitacora_comunicacion_participantes: participantes || null,
      bitacora_comunicacion_url_adjunto: urlAdjunto,
      proyecto_codigo_correlativo,
      usuario_rut: req.user.rut
    });

    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Comunicación registrada en proyecto ${proyecto_codigo_correlativo}`,
      log_auditoria_modulo: 'COMUNICACION',
      usuario_rut: req.user.rut
    });

    return res.status(201).json({ success: true, data: comunicacion });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar comunicación' });
  }
}

module.exports = { getHistorialComunicaciones, registrarComunicacion, upload };
