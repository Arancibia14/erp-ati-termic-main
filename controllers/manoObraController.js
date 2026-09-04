const { Op } = require('sequelize');
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const Trabajador = require('../models/Trabajador');
const ContratoLaboral = require('../models/ContratoLaboral');

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

async function getTrabajadoresDelProyecto(req, res) {
  try {
    const { codigo } = req.params;

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const trabajadores = await Trabajador.findAll({
      where: { proyecto_codigo_correlativo: codigo }
    });

    return res.json({ success: true, data: trabajadores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener trabajadores' });
  }
}

async function getSueldosYLeyes(req, res) {
  try {
    const { rut } = req.params;

    const trabajador = await Trabajador.findByPk(rut);
    if (!trabajador) {
      return res.status(404).json({ success: false, error: 'Trabajador no encontrado' });
    }

    const contratos = await ContratoLaboral.findAll({
      where: { trabajador_rut: rut },
      order: [['contrato_laboral_fecha_inicio', 'DESC']]
    });

    const costoTotal = contratos.reduce((acc, c) => {
      return acc + parseFloat(c.contrato_laboral_sueldo_base) + parseFloat(c.contrato_laboral_leyes_sociales);
    }, 0);

    return res.json({ success: true, data: { trabajador, contratos, costo_total: costoTotal } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener sueldos y leyes' });
  }
}

async function getResumenMensual(req, res) {
  try {
    const { codigo } = req.params;
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ success: false, error: 'Año y mes son requeridos' });
    }
    const y = parseInt(year), m = parseInt(month);
    const inicioMes = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const finMes = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;

    // Busca trabajadores asignados al proyecto
    const trabajadoresDelProyecto = await Trabajador.findAll({
      where: { proyecto_codigo_correlativo: codigo }
    });

    if (trabajadoresDelProyecto.length === 0) {
      return res.json({ success: true, data: { trabajadores: [], total_mes: 0, periodo: `${String(m).padStart(2, '0')}/${y}` } });
    }

    const ruts = trabajadoresDelProyecto.map(t => t.trabajador_rut);

    // Busca contratos activos en el período para esos trabajadores
    const contratos = await ContratoLaboral.findAll({
      where: {
        trabajador_rut: { [Op.in]: ruts },
        contrato_laboral_fecha_inicio: { [Op.lte]: finMes },
        [Op.or]: [
          { contrato_laboral_fecha_termino: null },
          { contrato_laboral_fecha_termino: { [Op.gte]: inicioMes } }
        ]
      },
      include: [{ model: Trabajador }]
    });

    const mapa = {};
    for (const c of contratos) {
      const rut = c.trabajador_rut;
      const sueldo = parseFloat(c.contrato_laboral_sueldo_base) || 0;
      const leyes = parseFloat(c.contrato_laboral_leyes_sociales) || 0;
      if (!mapa[rut]) {
        mapa[rut] = { trabajador: c.Trabajador, sueldo_base: 0, leyes_sociales: 0, costo_mes: 0 };
      }
      mapa[rut].sueldo_base += sueldo;
      mapa[rut].leyes_sociales += leyes;
      mapa[rut].costo_mes += sueldo + leyes;
    }

    const trabajadores = Object.values(mapa);
    const total_mes = trabajadores.reduce((acc, t) => acc + t.costo_mes, 0);
    return res.json({ success: true, data: { trabajadores, total_mes, periodo: `${String(m).padStart(2, '0')}/${y}` } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al calcular consolidación mensual' });
  }
}

module.exports = { getProyectos, getTrabajadoresDelProyecto, getSueldosYLeyes, getResumenMensual };
