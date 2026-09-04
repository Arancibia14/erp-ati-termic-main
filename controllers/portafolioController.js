const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const EvidenciaFotografica = require('../models/EvidenciaFotografica');
const HitoTecnico = require('../models/HitoTecnico');
const LogAuditoria = require('../models/LogAuditoria');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/portafolio');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `portafolio_${Date.now()}${path.extname(file.originalname)}`);
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

async function getListadoProyectos(req, res) {
  try {
    const proyectos = await Proyecto.findAll({
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });
    return res.json({ success: true, data: proyectos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener proyectos' });
  }
}

async function getProyecto(req, res) {
  try {
    const { codigo } = req.params;
    const proyecto = await Proyecto.findByPk(codigo, {
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }
    return res.json({ success: true, data: proyecto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener proyecto' });
  }
}

async function actualizarProyecto(req, res) {
  try {
    const { codigo } = req.params;
    const { proyecto_nombre_obra, proyecto_correo_contacto, proyecto_descripcion_tecnica, proyecto_ubicacion } = req.body;

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    await proyecto.update({
      ...(proyecto_nombre_obra && { proyecto_nombre_obra }),
      ...(proyecto_correo_contacto && { proyecto_correo_contacto }),
      ...(proyecto_descripcion_tecnica !== undefined && { proyecto_descripcion_tecnica }),
      ...(proyecto_ubicacion !== undefined && { proyecto_ubicacion })
    });

    if (req.files && req.files.length > 0) {
      const hito = await HitoTecnico.findOne({ where: { proyecto_codigo_correlativo: codigo } });
      if (hito) {
        for (const file of req.files) {
          await EvidenciaFotografica.create({
            evidencia_fotografica_url_foto: `/uploads/portafolio/${file.filename}`,
            evidencia_fotografica_fecha_captura: new Date(),
            evidencia_fotografica_latitud: 0,
            evidencia_fotografica_longitud: 0,
            evidencia_fotografica_estado_aprobacion: 'aprobado',
            hito_tecnico_id: hito.hito_tecnico_id
          });
        }
      }
    }

    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Portafolio del proyecto ${codigo} actualizado`,
      log_auditoria_modulo: 'PORTAFOLIO',
      usuario_rut: req.user.rut
    });

    return res.json({ success: true, data: proyecto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar proyecto' });
  }
}

module.exports = { getListadoProyectos, getProyecto, actualizarProyecto, upload };
