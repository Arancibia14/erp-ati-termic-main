const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const BitacoraDiaria = require('../models/BitacoraDiaria');
const LogAuditoria = require('../models/LogAuditoria');

async function getProyectos(req, res) {
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

async function registrarBitacora(req, res) {
  try {
    const { proyecto_codigo_correlativo, bitacora_diaria_descripcion_actividad, bitacora_diaria_fecha } = req.body;

    if (!proyecto_codigo_correlativo || !bitacora_diaria_descripcion_actividad) {
      return res.status(400).json({ success: false, error: 'Proyecto y descripción son requeridos' });
    }

    if (bitacora_diaria_descripcion_actividad.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'La descripción debe tener al menos 10 caracteres' });
    }

    const bitacora = await BitacoraDiaria.create({
      bitacora_diaria_fecha: bitacora_diaria_fecha || new Date().toISOString().split('T')[0],
      bitacora_diaria_descripcion_actividad: bitacora_diaria_descripcion_actividad.trim(),
      usuario_rut: req.user.rut,
      proyecto_codigo_correlativo
    });

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

async function getBitacorasByProyecto(req, res) {
  try {
    const { codigo } = req.params;
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
