const multer = require('multer');
const path = require('path');
const fs = require('fs');
const HitoTecnico = require('../models/HitoTecnico');
const EvidenciaFotografica = require('../models/EvidenciaFotografica');
const LogAuditoria = require('../models/LogAuditoria');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/evidencias');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `evidencia_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const tipos = /jpeg|jpg|png|webp/;
    if (tipos.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
    }
  }
});

async function getHitosPorProyecto(req, res) {
  try {
    const { codigo } = req.params;
    const hitos = await HitoTecnico.findAll({ where: { proyecto_codigo_correlativo: codigo } });
    return res.json({ success: true, data: hitos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener hitos' });
  }
}

async function subirEvidencia(req, res) {
  try {
    const { hito_tecnico_id, evidencia_fotografica_latitud, evidencia_fotografica_longitud } = req.body;

    if (!hito_tecnico_id) {
      return res.status(400).json({ success: false, error: 'El hito técnico es requerido' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Se requiere una imagen' });
    }

    const hito = await HitoTecnico.findByPk(hito_tecnico_id);
    if (!hito) {
      return res.status(404).json({ success: false, error: 'Hito técnico no encontrado' });
    }

    const urlRelativa = `/uploads/evidencias/${req.file.filename}`;

    const evidencia = await EvidenciaFotografica.create({
      evidencia_fotografica_url_foto: urlRelativa,
      evidencia_fotografica_fecha_captura: new Date(),
      evidencia_fotografica_latitud: parseFloat(evidencia_fotografica_latitud) || 0,
      evidencia_fotografica_longitud: parseFloat(evidencia_fotografica_longitud) || 0,
      evidencia_fotografica_estado_aprobacion: 'pendiente',
      hito_tecnico_id: parseInt(hito_tecnico_id)
    });

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Evidencia fotográfica subida para hito ${hito_tecnico_id}`,
        log_auditoria_modulo: 'EVIDENCIA',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: evidencia });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message || 'Error al subir evidencia' });
  }
}

async function getPendientes(req, res) {
  try {
    const evidencias = await EvidenciaFotografica.findAll({
      where: { evidencia_fotografica_estado_aprobacion: 'pendiente' },
      include: [{ model: HitoTecnico, attributes: ['hito_tecnico_nombre_hito', 'proyecto_codigo_correlativo'] }],
      order: [['evidencia_fotografica_fecha_captura', 'DESC']]
    });
    return res.json({ success: true, data: evidencias });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener evidencias pendientes' });
  }
}

async function validarEvidencia(req, res) {
  try {
    const { id } = req.params;
    const { estado, comentario } = req.body;

    if (!['aprobado', 'rechazado', 're_captura'].includes(estado)) {
      return res.status(400).json({ success: false, error: 'Estado debe ser "aprobado", "rechazado" o "re_captura"' });
    }

    if (estado === 'rechazado' && !comentario?.trim()) {
      return res.status(400).json({ success: false, error: 'El motivo de rechazo es requerido' });
    }

    const evidencia = await EvidenciaFotografica.findByPk(id);
    if (!evidencia) {
      return res.status(404).json({ success: false, error: 'Evidencia no encontrada' });
    }

    await evidencia.update({
      evidencia_fotografica_estado_aprobacion: estado
    });

    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Evidencia #${id} ${estado}${comentario ? ': ' + comentario.substring(0, 80) : ''}`,
      log_auditoria_modulo: 'EVIDENCIA',
      usuario_rut: req.user.rut
    });

    return res.json({ success: true, data: { id, estado } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al validar evidencia' });
  }
}

module.exports = { getHitosPorProyecto, subirEvidencia, getPendientes, validarEvidencia, upload };
