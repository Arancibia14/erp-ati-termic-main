const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const EgresoCajaChica = require('../models/EgresoCajaChica');
const LogAuditoria = require('../models/LogAuditoria');
const { fechaHoy, esFechaValida } = require('../utils/fecha');

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

async function totalEgresos(codigo) {
  const [result] = await sequelize.query(
    'SELECT COALESCE(SUM(egreso_caja_chica_monto), 0) as total_egresos FROM EGRESO_CAJA_CHICA WHERE proyecto_codigo_correlativo = :codigo',
    { replacements: { codigo }, type: sequelize.QueryTypes.SELECT }
  );
  return parseFloat(result.total_egresos) || 0;
}

// El saldo de la caja chica sale del fondo asignado al proyecto, no de su
// presupuesto completo: el presupuesto de la obra también lo consumen las
// órdenes de compra, y usarlo aquí permitía gastar dos veces el mismo dinero.
async function calcularSaldo(proyecto) {
  const fondo = parseFloat(proyecto.proyecto_presupuesto_caja_chica) || 0;
  const egresos = await totalEgresos(proyecto.proyecto_codigo_correlativo);
  return { fondo_caja_chica: fondo, total_egresos: egresos, saldo_disponible: fondo - egresos };
}

async function getSaldo(req, res) {
  try {
    const { codigo } = req.params;
    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }
    return res.json({ success: true, data: await calcularSaldo(proyecto) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al calcular saldo' });
  }
}

// Monto en pesos: un número, o un texto de solo dígitos con hasta 2 decimales.
// parseFloat("abc") da NaN y NaN <= 0 es falso, así que antes un monto no
// numérico pasaba la validación y el egreso se guardaba igual.
function leerMonto(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && /^\s*\d+(\.\d{1,2})?\s*$/.test(valor)) return Number(valor);
  return NaN;
}

async function registrarEgreso(req, res) {
  try {
    const { proyecto_codigo_correlativo, egreso_caja_chica_monto, egreso_caja_chica_concepto, egreso_caja_chica_fecha } = req.body;
    const concepto = typeof egreso_caja_chica_concepto === 'string' ? egreso_caja_chica_concepto.trim() : '';

    if (!proyecto_codigo_correlativo || !egreso_caja_chica_monto || !concepto) {
      return res.status(400).json({ success: false, error: 'Proyecto, monto y concepto son requeridos' });
    }

    const monto = leerMonto(egreso_caja_chica_monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      return res.status(400).json({ success: false, error: 'El monto debe ser mayor a 0' });
    }

    // La fecha la ingresa el actor (paso 19 del CU 39): si viene, debe ser una
    // fecha real y no posterior a hoy. Sin fecha se usa la de hoy.
    const hoy = fechaHoy();
    const fecha = egreso_caja_chica_fecha || hoy;
    if (!esFechaValida(fecha)) {
      return res.status(400).json({ success: false, error: 'La fecha del egreso no es válida' });
    }
    if (fecha > hoy) {
      return res.status(400).json({ success: false, error: 'La fecha del egreso no puede ser posterior a hoy' });
    }

    const proyecto = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const { fondo_caja_chica: fondo, saldo_disponible: saldo } = await calcularSaldo(proyecto);
    if (fondo <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El proyecto no tiene fondo de caja chica asignado. El administrador debe asignarlo en Configuración.'
      });
    }

    if (monto > saldo) {
      return res.status(400).json({
        success: false,
        error: `Saldo insuficiente. Saldo disponible: $${saldo.toLocaleString('es-CL')}`
      });
    }

    const egreso = await EgresoCajaChica.create({
      egreso_caja_chica_monto: monto,
      egreso_caja_chica_fecha: fecha,
      egreso_caja_chica_concepto: concepto,
      proyecto_codigo_correlativo,
      usuario_rut: req.user.rut
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
