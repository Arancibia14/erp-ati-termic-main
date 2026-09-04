const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const EgresoCajaChica = require('../models/EgresoCajaChica');
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

async function getSaldo(req, res) {
  try {
    const { codigo } = req.params;
    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const [result] = await sequelize.query(
      'SELECT COALESCE(SUM(egreso_caja_chica_monto), 0) as total_egresos FROM EGRESO_CAJA_CHICA WHERE proyecto_codigo_correlativo = :codigo',
      { replacements: { codigo }, type: sequelize.QueryTypes.SELECT }
    );

    const totalEgresos = parseFloat(result.total_egresos) || 0;
    const presupuesto = parseFloat(proyecto.proyecto_presupuesto_asignado) || 0;
    const saldo = presupuesto - totalEgresos;

    return res.json({
      success: true,
      data: {
        presupuesto,
        total_egresos: totalEgresos,
        saldo_disponible: saldo
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al calcular saldo' });
  }
}

async function registrarEgreso(req, res) {
  try {
    const { proyecto_codigo_correlativo, egreso_caja_chica_monto, egreso_caja_chica_concepto, egreso_caja_chica_fecha } = req.body;

    if (!proyecto_codigo_correlativo || !egreso_caja_chica_monto || !egreso_caja_chica_concepto) {
      return res.status(400).json({ success: false, error: 'Proyecto, monto y concepto son requeridos' });
    }

    const monto = parseFloat(egreso_caja_chica_monto);
    if (monto <= 0) {
      return res.status(400).json({ success: false, error: 'El monto debe ser mayor a 0' });
    }

    const proyecto = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const [result] = await sequelize.query(
      'SELECT COALESCE(SUM(egreso_caja_chica_monto), 0) as total_egresos FROM EGRESO_CAJA_CHICA WHERE proyecto_codigo_correlativo = :codigo',
      { replacements: { codigo: proyecto_codigo_correlativo }, type: sequelize.QueryTypes.SELECT }
    );

    const totalEgresos = parseFloat(result.total_egresos) || 0;
    const saldo = parseFloat(proyecto.proyecto_presupuesto_asignado) - totalEgresos;

    if (monto > saldo) {
      return res.status(400).json({
        success: false,
        error: `Saldo insuficiente. Saldo disponible: $${saldo.toLocaleString('es-CL')}`
      });
    }

    const egreso = await EgresoCajaChica.create({
      egreso_caja_chica_monto: monto,
      egreso_caja_chica_fecha: egreso_caja_chica_fecha || new Date().toISOString().split('T')[0],
      egreso_caja_chica_concepto,
      proyecto_codigo_correlativo
    });

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Egreso de $${monto} registrado en proyecto ${proyecto_codigo_correlativo}`,
        log_auditoria_modulo: 'CAJA_CHICA',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: egreso });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar egreso' });
  }
}

async function getEgresosByProyecto(req, res) {
  try {
    const { codigo } = req.params;
    const egresos = await EgresoCajaChica.findAll({
      where: { proyecto_codigo_correlativo: codigo },
      order: [['egreso_caja_chica_fecha', 'DESC'], ['egreso_caja_chica_id', 'DESC']]
    });
    return res.json({ success: true, data: egresos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener egresos' });
  }
}

module.exports = { getProyectos, getSaldo, registrarEgreso, getEgresosByProyecto };
