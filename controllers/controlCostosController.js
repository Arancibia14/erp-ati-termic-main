const sequelize = require('../config/database');
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const ParametroSistema = require('../models/ParametroSistema');

async function getProyectosConPresupuesto(req, res) {
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

async function getGastosReales(req, res) {
  try {
    const { codigo } = req.params;
    const { periodo } = req.query;

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    let query = `
      SELECT COALESCE(SUM(f.factura_monto_total), 0) AS total_gastos
      FROM FACTURA f
      INNER JOIN ORDEN_COMPRA oc ON f.orden_compra_id = oc.orden_compra_id
      WHERE oc.proyecto_codigo_correlativo = :codigo
    `;
    const replacements = { codigo };

    if (periodo) {
      query += ' AND DATE_FORMAT(f.factura_fecha, "%Y-%m") = :periodo';
      replacements.periodo = periodo;
    }

    const [result] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // CU NUEVO 4 (extensión CU32) - rebaja del costo por reingreso de materiales sobrantes
    const [rebaja] = await sequelize.query(
      'SELECT COALESCE(SUM(devolucion_obra_monto_rebajado), 0) AS total_rebajado FROM DEVOLUCION_OBRA WHERE proyecto_codigo_correlativo = :codigo',
      { replacements: { codigo }, type: sequelize.QueryTypes.SELECT }
    );
    const totalRebajado = parseFloat(rebaja.total_rebajado) || 0;

    const gastos_reales = (parseFloat(result.total_gastos) || 0) - totalRebajado;
    const presupuesto = parseFloat(proyecto.proyecto_presupuesto_asignado) || 0;
    const varianza = presupuesto - gastos_reales;
    const porcentaje_desviacion = presupuesto > 0 ? ((gastos_reales - presupuesto) / presupuesto) * 100 : 0;

    return res.json({
      success: true,
      data: { presupuesto, gastos_reales, varianza, porcentaje_desviacion, monto_rebajado_reingresos: totalRebajado }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener gastos reales' });
  }
}

async function getGastosPorMes(req, res) {
  try {
    const { codigo } = req.params;
    const { year } = req.query;

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const anio = parseInt(year) || new Date().getFullYear();

    // Obtiene gastos reales agrupados por mes del año seleccionado
    const gastosMensuales = await sequelize.query(`
      SELECT
        DATE_FORMAT(f.factura_fecha, '%Y-%m') AS mes,
        SUM(f.factura_monto_total)            AS gasto_real
      FROM FACTURA f
      INNER JOIN ORDEN_COMPRA oc ON f.orden_compra_id = oc.orden_compra_id
      WHERE oc.proyecto_codigo_correlativo = :codigo
        AND YEAR(f.factura_fecha) = :anio
      GROUP BY mes
      ORDER BY mes ASC
    `, { replacements: { codigo, anio }, type: sequelize.QueryTypes.SELECT });

    // CU NUEVO 4 (extensión CU32) - rebaja mensual por reingreso de materiales sobrantes
    const rebajasMensuales = await sequelize.query(`
      SELECT
        DATE_FORMAT(devolucion_obra_fecha, '%Y-%m') AS mes,
        SUM(devolucion_obra_monto_rebajado)         AS monto_rebajado
      FROM DEVOLUCION_OBRA
      WHERE proyecto_codigo_correlativo = :codigo
        AND YEAR(devolucion_obra_fecha) = :anio
      GROUP BY mes
    `, { replacements: { codigo, anio }, type: sequelize.QueryTypes.SELECT });

    const presupuesto = parseFloat(proyecto.proyecto_presupuesto_asignado) || 0;

    // Construye serie de los 12 meses del año seleccionado
    const meses = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(anio, i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });
      const encontrado = gastosMensuales.find(g => g.mes === key);
      const rebaja = rebajasMensuales.find(r => r.mes === key);
      const gastoBruto = encontrado ? parseFloat(encontrado.gasto_real) : 0;
      const montoRebajado = rebaja ? parseFloat(rebaja.monto_rebajado) : 0;
      meses.push({
        mes: key,
        label,
        gasto_real: gastoBruto - montoRebajado,
        // presupuesto mensual distribuido uniformemente
        presupuesto_mensual: Math.round(presupuesto / 12)
      });
    }

    // Acumulado para línea de tendencia
    let acumuladoReal = 0;
    let acumuladoPpto = 0;
    const serie = meses.map(m => {
      acumuladoReal += m.gasto_real;
      acumuladoPpto += m.presupuesto_mensual;
      return { ...m, acumulado_real: acumuladoReal, acumulado_ppto: acumuladoPpto };
    });

    const totalGastos = acumuladoReal;
    const varianza = presupuesto - totalGastos;
    const porcentaje_desviacion = presupuesto > 0 ? ((totalGastos - presupuesto) / presupuesto) * 100 : 0;

    return res.json({
      success: true,
      data: {
        proyecto: proyecto.proyecto_nombre_obra,
        presupuesto,
        total_gastos: totalGastos,
        varianza,
        porcentaje_desviacion,
        serie
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener gastos por mes' });
  }
}

async function getUmbralDesviacion(req, res) {
  try {
    const parametro = await ParametroSistema.findOne({
      where: { parametro_sistema_clave: 'umbral_desviacion' }
    });
    if (!parametro) {
      return res.status(404).json({ success: false, error: 'Parámetro umbral_desviacion no encontrado' });
    }
    return res.json({ success: true, data: parametro });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener umbral de desviación' });
  }
}

module.exports = { getProyectosConPresupuesto, getGastosReales, getGastosPorMes, getUmbralDesviacion };
