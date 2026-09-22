// CU09 - Definiendo hitos técnicos del proyecto.
// El cronograma de hitos lo definen tanto el Administrador Total como el
// Supervisor de Obra, por eso vive fuera de /setup, que es solo del administrador.
const { literal } = require('sequelize');
const HitoTecnico = require('../models/HitoTecnico');
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const LogAuditoria = require('../models/LogAuditoria');

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

// Los hitos se devuelven en orden cronológico. Los definidos antes de CU09 no
// tienen fecha, así que van al final y se ordenan por su id.
// El literal es necesario porque MySQL ordena los NULL primero y un hito sin
// fecha no tiene lugar en el cronograma: va al final.
const ORDEN_CRONOLOGICO = [
  [literal('hito_tecnico_fecha_inicio_estimada IS NULL'), 'ASC'],
  ['hito_tecnico_fecha_inicio_estimada', 'ASC'],
  ['hito_tecnico_id', 'ASC']
];

// CU09 paso 1 - Ficha del proyecto y sus hitos ya definidos
async function getPlanificacion(req, res) {
  try {
    const { codigo } = req.params;
    const proyecto = await Proyecto.findByPk(codigo, {
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });
    if (!proyecto) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });

    const hitos = await HitoTecnico.findAll({
      where: { proyecto_codigo_correlativo: codigo },
      order: ORDEN_CRONOLOGICO
    });
    return res.json({ success: true, data: { proyecto, hitos } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener la planificación de hitos' });
  }
}

// CU09 paso 3 - Las fechas deben seguir una secuencia lógica cronológica.
// Devuelve el mensaje de error, o null si el cronograma es coherente.
function errorCronograma(inicio, termino, hitosPrevios) {
  if (termino < inicio) {
    return 'La fecha de término estimada no puede ser anterior a la de inicio';
  }
  // El hito nuevo se agrega al final de la secuencia: no puede empezar antes de
  // que comience el último hito ya definido, ni terminar antes que él.
  const conFecha = hitosPrevios.filter(h => h.hito_tecnico_fecha_inicio_estimada);
  if (!conFecha.length) return null;

  const ultimo = conFecha[conFecha.length - 1];
  const inicioUltimo = ultimo.hito_tecnico_fecha_inicio_estimada;
  const terminoUltimo = ultimo.hito_tecnico_fecha_termino_estimada || inicioUltimo;

  if (inicio < inicioUltimo) {
    return `El hito "${ultimo.hito_tecnico_nombre_hito}" comienza el ${inicioUltimo}. Un hito posterior no puede empezar antes de esa fecha`;
  }
  if (termino < terminoUltimo) {
    return `El hito "${ultimo.hito_tecnico_nombre_hito}" termina el ${terminoUltimo}. Un hito posterior no puede terminar antes de esa fecha`;
  }
  return null;
}

// CU09 pasos 2 a 4 - Definir un hito con sus fechas estimadas
async function crearHito(req, res) {
  try {
    const {
      hito_tecnico_nombre_hito,
      proyecto_codigo_correlativo,
      hito_tecnico_avance_fisico,
      hito_tecnico_fecha_inicio_estimada,
      hito_tecnico_fecha_termino_estimada
    } = req.body;

    const faltantes = [];
    if (!hito_tecnico_nombre_hito || !String(hito_tecnico_nombre_hito).trim()) faltantes.push('hito_tecnico_nombre_hito');
    if (!proyecto_codigo_correlativo) faltantes.push('proyecto_codigo_correlativo');
    if (!hito_tecnico_fecha_inicio_estimada) faltantes.push('hito_tecnico_fecha_inicio_estimada');
    if (!hito_tecnico_fecha_termino_estimada) faltantes.push('hito_tecnico_fecha_termino_estimada');
    if (faltantes.length) {
      return res.status(400).json({ success: false, error: 'Completa los campos obligatorios', campos: faltantes });
    }

    const proyecto = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (!proyecto) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });

    const avance = hito_tecnico_avance_fisico === undefined || hito_tecnico_avance_fisico === null || hito_tecnico_avance_fisico === ''
      ? 0
      : parseFloat(hito_tecnico_avance_fisico);
    if (!Number.isFinite(avance) || avance < 0 || avance > 100) {
      return res.status(400).json({ success: false, error: 'El avance físico debe estar entre 0 y 100', campos: ['hito_tecnico_avance_fisico'] });
    }

    const nombre = String(hito_tecnico_nombre_hito).trim();
    const hitosPrevios = await HitoTecnico.findAll({
      where: { proyecto_codigo_correlativo },
      order: ORDEN_CRONOLOGICO
    });

    if (hitosPrevios.some(h => h.hito_tecnico_nombre_hito.toLowerCase() === nombre.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'El proyecto ya tiene un hito con ese nombre', campos: ['hito_tecnico_nombre_hito'] });
    }

    // CU09 Excepción 1 - Fechas inconsistentes
    const error = errorCronograma(hito_tecnico_fecha_inicio_estimada, hito_tecnico_fecha_termino_estimada, hitosPrevios);
    if (error) {
      return res.status(400).json({
        success: false,
        error,
        campos: ['hito_tecnico_fecha_inicio_estimada', 'hito_tecnico_fecha_termino_estimada']
      });
    }

    const hito = await HitoTecnico.create({
      hito_tecnico_nombre_hito: nombre,
      proyecto_codigo_correlativo,
      hito_tecnico_avance_fisico: avance,
      hito_tecnico_fecha_inicio_estimada,
      hito_tecnico_fecha_termino_estimada
    });

    await audit(`Hito "${nombre}" definido en proyecto ${proyecto_codigo_correlativo} (${hito_tecnico_fecha_inicio_estimada} a ${hito_tecnico_fecha_termino_estimada})`, 'HITO', req.user.rut);
    return res.status(201).json({
      success: true,
      data: hito,
      mensaje: `Hito "${nombre}" agregado al cronograma del proyecto ${proyecto_codigo_correlativo}`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al definir el hito técnico' });
  }
}

module.exports = { getPlanificacion, crearHito, errorCronograma };
