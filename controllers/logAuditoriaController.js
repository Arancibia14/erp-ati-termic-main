const { Op } = require('sequelize');
const LogAuditoria = require('../models/LogAuditoria');
const Usuario = require('../models/Usuario');
const { calcularHashLog } = require('../utils/integridadLog');

// CU04 Excepción 2 - Recalcula la cadena de hashes desde el primer log hasta
// el indicado. Si algún eslabón no coincide, la cadena está rota: alguien
// alteró un registro directamente en la base, sin pasar por el sistema.
async function huboAlteracionHasta(id) {
  const logs = await LogAuditoria.findAll({
    where: { log_auditoria_id: { [Op.lte]: id } },
    order: [['log_auditoria_id', 'ASC']]
  });

  let hashAnterior = null;
  let alterado = false;
  for (const log of logs) {
    if (!log.log_auditoria_hash) {
      // Log anterior a esta funcionalidad: no participa de la cadena.
      hashAnterior = null;
      continue;
    }
    const esperado = calcularHashLog(log, hashAnterior);
    if (esperado !== log.log_auditoria_hash) alterado = true;
    hashAnterior = log.log_auditoria_hash;
  }
  return alterado;
}

// CU04 - Listado con filtros por fecha, usuario y módulo (tipo de acción)
async function getLogs(req, res) {
  try {
    const { fecha_inicio, fecha_termino, usuario_rut, modulo } = req.query;
    const where = {};

    if (fecha_inicio || fecha_termino) {
      where.log_auditoria_fecha_hora = {};
      if (fecha_inicio) where.log_auditoria_fecha_hora[Op.gte] = new Date(`${fecha_inicio}T00:00:00`);
      if (fecha_termino) where.log_auditoria_fecha_hora[Op.lte] = new Date(`${fecha_termino}T23:59:59.999`);
    }
    if (usuario_rut && String(usuario_rut).trim()) where.usuario_rut = String(usuario_rut).trim();
    if (modulo && String(modulo).trim()) where.log_auditoria_modulo = String(modulo).trim();

    const logs = await LogAuditoria.findAll({
      where,
      include: [{ model: Usuario, attributes: ['usuario_nombre'], required: false }],
      order: [['log_auditoria_id', 'DESC']],
      limit: 300
    });

    // Excepción 1 - Sin coincidencias: se resuelve con una lista vacía;
    // el mensaje lo muestra la interfaz, no es un error de la API.
    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener los registros de auditoría' });
  }
}

// CU04 - Valores de "módulo" realmente usados, para el filtro de tipo de acción
async function getModulos(req, res) {
  try {
    const filas = await LogAuditoria.findAll({
      attributes: ['log_auditoria_modulo'],
      group: ['log_auditoria_modulo'],
      order: [['log_auditoria_modulo', 'ASC']]
    });
    return res.json({ success: true, data: filas.map(f => f.log_auditoria_modulo) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener los tipos de acción' });
  }
}

// CU04 - Detalle de un log puntual, con verificación de integridad (Excepción 2)
async function getDetalle(req, res) {
  try {
    const { id } = req.params;
    const log = await LogAuditoria.findByPk(id, {
      include: [{ model: Usuario, attributes: ['usuario_nombre'], required: false }]
    });
    if (!log) {
      return res.status(404).json({ success: false, error: 'Registro no encontrado' });
    }

    let integridad = 'sin_verificar';
    if (log.log_auditoria_hash) {
      const alterado = await huboAlteracionHasta(log.log_auditoria_id);
      integridad = alterado ? 'alterado' : 'ok';
    }

    return res.json({
      success: true,
      data: { ...log.toJSON(), integridad },
      alerta_seguridad: integridad === 'alterado'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener el detalle del registro' });
  }
}

module.exports = { getLogs, getModulos, getDetalle };
