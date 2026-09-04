const Proyecto = require('../models/Proyecto');
const ControlCambioPpto = require('../models/ControlCambioPpto');
const LogAuditoria = require('../models/LogAuditoria');

async function getPresupuestoActual(req, res) {
  try {
    const { codigo } = req.params;
    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const historial = await ControlCambioPpto.findAll({
      where: { proyecto_codigo_correlativo: codigo },
      order: [['control_cambio_ppto_fecha', 'DESC']]
    });

    return res.json({
      success: true,
      data: { presupuesto_actual: proyecto.proyecto_presupuesto_asignado, historial }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener presupuesto' });
  }
}

async function registrarCambioPpto(req, res) {
  try {
    const { codigo } = req.params;
    const { monto_nuevo, motivo } = req.body;

    if (!monto_nuevo || !motivo) {
      return res.status(400).json({ success: false, error: 'Monto nuevo y motivo son requeridos' });
    }

    if (!motivo.trim()) {
      return res.status(400).json({ success: false, error: 'La justificación no puede estar vacía' });
    }

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const monto_anterior = parseFloat(proyecto.proyecto_presupuesto_asignado);
    const nuevo = parseFloat(monto_nuevo);

    if (monto_anterior === nuevo) {
      return res.status(400).json({ success: false, error: 'El monto nuevo es igual al presupuesto actual' });
    }

    await proyecto.update({ proyecto_presupuesto_asignado: nuevo });

    const cambio = await ControlCambioPpto.create({
      control_cambio_ppto_fecha: new Date().toISOString().split('T')[0],
      control_cambio_ppto_monto_anterior: monto_anterior,
      control_cambio_ppto_monto_nuevo: nuevo,
      control_cambio_ppto_motivo: motivo,
      proyecto_codigo_correlativo: codigo,
      usuario_rut: req.user.rut
    });

    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Presupuesto del proyecto ${codigo} modificado de $${monto_anterior} a $${nuevo}`,
      log_auditoria_modulo: 'PRESUPUESTO',
      usuario_rut: req.user.rut
    });

    return res.status(201).json({ success: true, data: cambio });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar cambio presupuestario' });
  }
}

module.exports = { getPresupuestoActual, registrarCambioPpto };
