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

// CU11 - Estados que se pueden elegir desde el selector genérico. "Detenido"
// queda fuera a propósito: solo se llega a él por el flujo del CU12 (con motivo).
const ESTADOS_SELECCIONABLES = ['Planificación', 'En Ejecución', 'Finalizado'];

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

// CU11 - Actualizando estado del proyecto
async function actualizarEstadoProyecto(req, res) {
  try {
    const { codigo } = req.params;
    const { estado_proyecto_nombre: nuevo } = req.body;

    const proyecto = await Proyecto.findByPk(codigo, {
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    if (!nuevo || !String(nuevo).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Selecciona el nuevo estado del proyecto',
        campos: ['estado_proyecto_nombre']
      });
    }

    // "Detenido" tiene su propio flujo obligatorio con motivo (CU12)
    if (nuevo === ESTADO_DETENIDO) {
      return res.status(400).json({
        success: false,
        error: 'Para detener el proyecto usa la acción "Detener Proyecto", que pide el motivo',
        campos: ['estado_proyecto_nombre']
      });
    }

    if (!ESTADOS_SELECCIONABLES.includes(nuevo)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido',
        campos: ['estado_proyecto_nombre']
      });
    }

    const actual = proyecto.EstadoProyecto?.estado_proyecto_nombre;

    if (actual === nuevo) {
      return res.status(400).json({
        success: false,
        error: `El proyecto ya está en estado "${actual}"`,
        campos: ['estado_proyecto_nombre']
      });
    }

    if (actual === 'Finalizado') {
      return res.status(400).json({
        success: false,
        error: 'Un proyecto finalizado no puede cambiar de estado'
      });
    }

    // Reanudación: desde "Detenido" el único destino válido es "En Ejecución"
    if (actual === ESTADO_DETENIDO && nuevo !== ESTADO_ORIGEN_DETENCION) {
      return res.status(400).json({
        success: false,
        error: `Desde "${ESTADO_DETENIDO}" solo se puede reanudar a "${ESTADO_ORIGEN_DETENCION}"`,
        campos: ['estado_proyecto_nombre']
      });
    }

    // Excepción 1 - Transición no válida
    if (nuevo === 'Finalizado' && actual !== ESTADO_ORIGEN_DETENCION) {
      return res.status(400).json({
        success: false,
        error: `El sistema impide pasar de "${actual}" a "Finalizado" sin haber pasado por "${ESTADO_ORIGEN_DETENCION}"`,
        campos: ['estado_proyecto_nombre']
      });
    }

    const [estadoNuevo] = await EstadoProyecto.findOrCreate({
      where: { estado_proyecto_nombre: nuevo },
      defaults: { estado_proyecto_nombre: nuevo }
    });

    await proyecto.update({ estado_proyecto_id: estadoNuevo.estado_proyecto_id });

    await audit(`Proyecto ${codigo} cambia de estado: "${actual}" -> "${nuevo}"`, 'PORTAFOLIO', req.user.rut);

    const actualizado = await Proyecto.findByPk(codigo, {
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });

    return res.json({
      success: true,
      data: actualizado,
      mensaje: 'Estado del proyecto actualizado correctamente'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar el estado del proyecto' });
  }
}

module.exports = { getListadoProyectos, getProyecto, actualizarProyecto, detenerProyecto, actualizarEstadoProyecto, upload };
