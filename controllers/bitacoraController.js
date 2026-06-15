const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const BitacoraDiaria = require('../models/BitacoraDiaria');
const LogAuditoria = require('../models/LogAuditoria');

// CU14 - C_Bitacora: Registrando Bitácora Técnica Diaria

// Retorna todos los proyectos con su estado para poblar el selector del formulario
async function getProyectos(req, res) {
  try {
    const proyectos = await Proyecto.findAll({
      // include hace un JOIN con la tabla ESTADO_PROYECTO para traer el nombre del estado
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });
    return res.json({ success: true, data: proyectos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener proyectos' });
  }
}

// Crea una nueva entrada en la bitácora diaria del proyecto seleccionado
async function registrarBitacora(req, res) {
  try {
    const { proyecto_codigo_correlativo, bitacora_diaria_descripcion_actividad, bitacora_diaria_fecha } = req.body;

    if (!proyecto_codigo_correlativo || !bitacora_diaria_descripcion_actividad) {
      return res.status(400).json({ success: false, error: 'Proyecto y descripción son requeridos' });
    }

    // Validación mínima de calidad: evita registros vacíos o con una sola palabra
    if (bitacora_diaria_descripcion_actividad.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'La descripción debe tener al menos 10 caracteres' });
    }

    const bitacora = await BitacoraDiaria.create({
      // Si no se envía fecha usa la fecha actual del servidor
      bitacora_diaria_fecha: bitacora_diaria_fecha || new Date().toISOString().split('T')[0],
      bitacora_diaria_descripcion_actividad: bitacora_diaria_descripcion_actividad.trim(),
      usuario_rut: req.user.rut, // viene del token JWT decodificado por el middleware
      proyecto_codigo_correlativo
    });

    // Registro de auditoría: guarda quién hizo qué y cuándo (trazabilidad)
    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Bitácora registrada en proyecto ${proyecto_codigo_correlativo}`,
      log_auditoria_modulo: 'BITACORA',
      usuario_rut: req.user.rut
    });

    return res.status(201).json({ success: true, data: bitacora });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar bitácora' });
  }
}

// Retorna todas las bitácoras de un proyecto ordenadas de más reciente a más antigua
async function getBitacorasByProyecto(req, res) {
  try {
    const { codigo } = req.params; // el código del proyecto viene en la URL: /bitacora/:codigo
    const bitacoras = await BitacoraDiaria.findAll({
      where: { proyecto_codigo_correlativo: codigo },
      order: [['bitacora_diaria_fecha', 'DESC'], ['bitacora_diaria_id', 'DESC']]
    });
    return res.json({ success: true, data: bitacoras });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener bitácoras' });
  }
}

module.exports = { getProyectos, registrarBitacora, getBitacorasByProyecto };
