const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const EvidenciaFotografica = require('../models/EvidenciaFotografica');
const HitoTecnico = require('../models/HitoTecnico');
const DetencionProyecto = require('../models/DetencionProyecto');
const LogAuditoria = require('../models/LogAuditoria');
const { fechaHoy } = require('../utils/fecha');

// CU12 - Estado desde el cual se puede detener un proyecto, y el que resulta.
const ESTADO_ORIGEN_DETENCION = 'En Ejecución';
const ESTADO_DETENIDO = 'Detenido';
const MOTIVO_LARGO_MINIMO = 10;

const audit = async (accion, modulo, rut) => {
  try {
    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: accion,
      log_auditoria_modulo: modulo,
      usuario_rut: rut
    });
  } catch (_) { /* no bloquear la operación principal */ }
};

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

// CU12 - Registrando detención de proyecto
async function detenerProyecto(req, res) {
  try {
    const { codigo } = req.params;
    const { motivo } = req.body;

    const proyecto = await Proyecto.findByPk(codigo, {
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    // Excepción 1 - Campo vacío
    if (!motivo || !String(motivo).trim()) {
      return res.status(400).json({
        success: false,
        error: 'El motivo de la detención es obligatorio',
        campos: ['motivo']
      });
    }
    const motivoLimpio = String(motivo).trim();
    if (motivoLimpio.length < MOTIVO_LARGO_MINIMO) {
      return res.status(400).json({
        success: false,
        error: `El motivo debe ser más descriptivo (mín. ${MOTIVO_LARGO_MINIMO} caracteres)`,
        campos: ['motivo']
      });
    }

    // Precondición - El proyecto debe estar "En Ejecución"
    if (proyecto.EstadoProyecto?.estado_proyecto_nombre !== ESTADO_ORIGEN_DETENCION) {
      return res.status(400).json({
        success: false,
        error: `Solo se puede detener un proyecto que esté en estado "${ESTADO_ORIGEN_DETENCION}"`
      });
    }

    const [estadoDetenido] = await EstadoProyecto.findOrCreate({
      where: { estado_proyecto_nombre: ESTADO_DETENIDO },
      defaults: { estado_proyecto_nombre: ESTADO_DETENIDO }
    });

    await proyecto.update({ estado_proyecto_id: estadoDetenido.estado_proyecto_id });

    await DetencionProyecto.create({
      detencion_proyecto_fecha: fechaHoy(),
      detencion_proyecto_motivo: motivoLimpio,
      proyecto_codigo_correlativo: codigo,
      usuario_rut: req.user.rut
    });

    await audit(`Proyecto ${codigo} detenido: ${motivoLimpio}`, 'PORTAFOLIO', req.user.rut);

    const actualizado = await Proyecto.findByPk(codigo, {
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });

    return res.json({
      success: true,
      data: actualizado,
      mensaje: 'Proyecto detenido correctamente'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al detener el proyecto' });
  }
}

module.exports = { getListadoProyectos, getProyecto, actualizarProyecto, detenerProyecto, upload };
