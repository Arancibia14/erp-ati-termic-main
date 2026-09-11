const sequelize = require('../config/database');
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const ParametroSistema = require('../models/ParametroSistema');
const { fechaHoy } = require('../utils/fecha');

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

const redondear = n => Math.round(n * 100) / 100;

// Costo real acumulado del proyecto al cierre de cada mes con movimientos, desde
// su inicio. Cargos: facturas de las OC del proyecto. Créditos: rebajas por
// reingreso de sobrantes (CU NUEVO 4, extensión CU32). Un crédito solo descuenta
// costo ya facturado: si el material se devuelve antes de que llegue su factura,
// la rebaja queda pendiente y se descuenta cuando la factura se registra. Por eso
// el acumulado nunca es negativo.
// factura_fecha y devolucion_obra_fecha son DATE (sin hora) y se guardan con la
// fecha de Chile, así que agrupar con DATE_FORMAT no depende de la zona horaria
// del servidor ni de la de MySQL.
async function costoAcumuladoPorMes(codigo) {
  const opciones = { replacements: { codigo }, type: sequelize.QueryTypes.SELECT };
  const cargos = await sequelize.query(`
    SELECT DATE_FORMAT(f.factura_fecha, '%Y-%m') AS mes, SUM(f.factura_monto_total) AS monto
    FROM FACTURA f
    INNER JOIN ORDEN_COMPRA oc ON f.orden_compra_id = oc.orden_compra_id
    WHERE oc.proyecto_codigo_correlativo = :codigo
    GROUP BY mes
  `, opciones);
  const creditos = await sequelize.query(`
    SELECT DATE_FORMAT(devolucion_obra_fecha, '%Y-%m') AS mes, SUM(devolucion_obra_monto_rebajado) AS monto
    FROM DEVOLUCION_OBRA
    WHERE proyecto_codigo_correlativo = :codigo
    GROUP BY mes
  `, opciones);

  const meses = new Map();
  const mesDe = clave => meses.get(clave) || meses.set(clave, { cargos: 0, creditos: 0 }).get(clave);
  for (const c of cargos) if (c.mes) mesDe(c.mes).cargos += parseFloat(c.monto) || 0;
  for (const c of creditos) if (c.mes) mesDe(c.mes).creditos += parseFloat(c.monto) || 0;

  let neto = 0;
  let rebajado = 0;
  return [...meses.keys()].sort().map(mes => {
    const { cargos: cargo, creditos: credito } = meses.get(mes);
    neto += cargo - credito;
    rebajado += credito;
    return { mes, acumulado: redondear(Math.max(neto, 0)), rebajado: redondear(rebajado) };
  });
}

// Estado del costo al cierre del mes indicado (AAAA-MM).
function costoAl(acumulados, mes) {
  let estado = { acumulado: 0, rebajado: 0 };
  for (const a of acumulados) {
    if (a.mes > mes) break;
    estado = a;
  }
  return estado;
}

async function getGastosReales(req, res) {
  try {
    const { codigo } = req.params;
    const { periodo } = req.query;

    if (periodo && !/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
      return res.status(400).json({ success: false, error: 'El periodo debe tener el formato AAAA-MM' });
    }

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    // Sin periodo: costo acumulado a la fecha. Con periodo: acumulado al cierre de ese mes.
    const acumulados = await costoAcumuladoPorMes(codigo);
    const estado = periodo ? costoAl(acumulados, periodo) : (acumulados[acumulados.length - 1] || { acumulado: 0, rebajado: 0 });
    const gastos_reales = estado.acumulado;
    const totalRebajado = estado.rebajado;
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

    // El año por defecto sale de la fecha de Chile: con el reloj del servidor en
    // UTC, desde las 21:00 del 31 de diciembre ya sería el año siguiente.
    const anio = parseInt(year) || parseInt(fechaHoy().slice(0, 4));

    // El costo real es el acumulado del proyecto desde su inicio (UR-F-43), así
    // que un año arrastra lo facturado en los anteriores.
    const acumulados = await costoAcumuladoPorMes(codigo);
    const presupuesto = parseFloat(proyecto.proyecto_presupuesto_asignado) || 0;

    // Construye serie de los 12 meses del año seleccionado. La clave se arma
    // como texto y la etiqueta se formatea en UTC, sin pasar por la zona
    // horaria del servidor.
    const serie = [];
    let acumuladoAnterior = costoAl(acumulados, `${anio - 1}-12`).acumulado;
    let acumuladoPpto = 0;
    for (let i = 0; i < 12; i++) {
      const key = `${anio}-${String(i + 1).padStart(2, '0')}`;
      const label = new Date(Date.UTC(anio, i, 1))
        .toLocaleDateString('es-CL', { month: 'short', year: '2-digit', timeZone: 'UTC' });
      const acumuladoReal = costoAl(acumulados, key).acumulado;
      // presupuesto mensual distribuido uniformemente
      const presupuestoMensual = Math.round(presupuesto / 12);
      acumuladoPpto += presupuestoMensual;
      serie.push({
        mes: key,
        label,
        // Variación del costo en el mes. Es negativa solo cuando una devolución
        // rebaja costo ya facturado; una rebaja pendiente no mueve el costo.
        gasto_real: redondear(acumuladoReal - acumuladoAnterior),
        presupuesto_mensual: presupuestoMensual,
        acumulado_real: acumuladoReal,
        acumulado_ppto: acumuladoPpto
      });
      acumuladoAnterior = acumuladoReal;
    }

    const totalGastos = serie[serie.length - 1].acumulado_real;
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
