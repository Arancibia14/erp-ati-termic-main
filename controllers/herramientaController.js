const Herramienta = require('../models/Herramienta');
const AsignacionHerramienta = require('../models/AsignacionHerramienta');
const Trabajador = require('../models/Trabajador');
const ContratoLaboral = require('../models/ContratoLaboral');
const LogAuditoria = require('../models/LogAuditoria');

const hoy = () => new Date().toISOString().split('T')[0];

// Buscador de herramientas
async function getHerramientas(req, res) {
  try {
    const herramientas = await Herramienta.findAll({ order: [['herramienta_nombre', 'ASC']] });
    const ruts = herramientas.map(h => h.herramienta_tecnico_rut).filter(Boolean);
    const tecnicos = ruts.length
      ? await Trabajador.findAll({ where: { trabajador_rut: ruts }, attributes: ['trabajador_rut', 'trabajador_nombres', 'trabajador_apellidos'] })
      : [];
    const mapa = {};
    tecnicos.forEach(t => { mapa[t.trabajador_rut] = `${t.trabajador_nombres} ${t.trabajador_apellidos || ''}`.trim(); });

    const data = herramientas.map(h => ({
      ...h.toJSON(),
      tecnico_nombre: h.herramienta_tecnico_rut ? (mapa[h.herramienta_tecnico_rut] || h.herramienta_tecnico_rut) : null
    }));
    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener las herramientas' });
  }
}

// Buscador de personal
async function getTrabajadoresActivos(req, res) {
  try {
    const trabajadores = await Trabajador.findAll({
      where: { trabajador_activo: true },
      order: [['trabajador_nombres', 'ASC']]
    });
    return res.json({ success: true, data: trabajadores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener trabajadores activos' });
  }
}

// CU NUEVO 2 - Dando de alta herramientas en el catálogo maestro
async function crear(req, res) {
  try {
    const { herramienta_codigo, herramienta_nombre } = req.body;

    if (!herramienta_codigo || !herramienta_codigo.trim() || !herramienta_nombre || !herramienta_nombre.trim()) {
      return res.status(400).json({ success: false, error: 'Código y nombre de la herramienta son obligatorios' });
    }

    const existente = await Herramienta.findOne({ where: { herramienta_codigo: herramienta_codigo.trim() } });
    if (existente) {
      return res.status(409).json({ success: false, error: 'El código ya pertenece a otra herramienta del catálogo' });
    }

    const herramienta = await Herramienta.create({
      herramienta_codigo: herramienta_codigo.trim(),
      herramienta_nombre: herramienta_nombre.trim(),
      herramienta_estado: 'Disponible'
    });

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Herramienta ${herramienta.herramienta_codigo} (${herramienta.herramienta_nombre}) dada de alta en el catálogo`,
        log_auditoria_modulo: 'HERRAMIENTA',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: herramienta });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al dar de alta la herramienta' });
  }
}

// CU29 - Registrando asignación de herramienta
async function asignar(req, res) {
  try {
    const { herramienta_codigo, tecnico_rut, estado_herramienta } = req.body;

    if (!herramienta_codigo || !tecnico_rut || !estado_herramienta || !estado_herramienta.trim()) {
      return res.status(400).json({ success: false, error: 'Código de herramienta, RUT del técnico y estado de la herramienta son obligatorios' });
    }

    const herramienta = await Herramienta.findOne({ where: { herramienta_codigo } });
    if (!herramienta) {
      return res.status(404).json({ success: false, error: 'La herramienta no está registrada en el catálogo maestro' });
    }

    if (herramienta.herramienta_estado !== 'Disponible') {
      // Excepción 1: Herramienta no disponible
      const detalle = herramienta.herramienta_estado === 'Asignada'
        ? 'ya está asignada a otro técnico'
        : 'se encuentra en mantenimiento';
      return res.status(409).json({ success: false, error: `El equipo no está disponible: ${detalle}.` });
    }

    const trabajador = await Trabajador.findByPk(tecnico_rut);
    if (!trabajador || !trabajador.trabajador_activo) {
      // Excepción 2: Error de validación de identidad
      return res.status(400).json({ success: false, error: 'El RUT no corresponde a un trabajador activo. Asignación bloqueada.' });
    }

    // Validación de vigencia del contrato del técnico
    const contrato = await ContratoLaboral.findOne({
      where: { trabajador_rut: tecnico_rut },
      order: [['contrato_laboral_fecha_inicio', 'DESC']]
    });
    if (contrato && contrato.contrato_laboral_fecha_termino && contrato.contrato_laboral_fecha_termino < hoy()) {
      return res.status(400).json({
        success: false,
        error: `El contrato del técnico venció el ${contrato.contrato_laboral_fecha_termino}. No se puede asignar la herramienta.`
      });
    }

    const asignacion = await AsignacionHerramienta.create({
      herramienta_id: herramienta.herramienta_id,
      trabajador_rut: tecnico_rut,
      asignacion_herramienta_fecha_entrega: hoy(),
      asignacion_herramienta_estado_entrega: estado_herramienta.trim(),
      asignacion_herramienta_usuario_rut: req.user.rut
    });

    herramienta.herramienta_estado = 'Asignada';
    herramienta.herramienta_tecnico_rut = tecnico_rut;
    await herramienta.save();

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Herramienta ${herramienta.herramienta_codigo} (${herramienta.herramienta_nombre}) asignada al técnico ${tecnico_rut}`,
        log_auditoria_modulo: 'HERRAMIENTA',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({
      success: true,
      data: { mensaje: 'Asignación registrada exitosamente', asignacion, herramienta }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar la asignación' });
  }
}

// Registro de devolución (Frecuencia del CU: "cuando se entrega o devuelve una herramienta eléctrica")
async function devolver(req, res) {
  try {
    const { id } = req.params;
    const { estado_devolucion } = req.body;

    const herramienta = await Herramienta.findByPk(id);
    if (!herramienta) {
      return res.status(404).json({ success: false, error: 'Herramienta no encontrada' });
    }
    if (herramienta.herramienta_estado !== 'Asignada') {
      return res.status(409).json({ success: false, error: 'La herramienta no está asignada; no se puede registrar la devolución.' });
    }

    const asignacion = await AsignacionHerramienta.findOne({
      where: { herramienta_id: herramienta.herramienta_id, asignacion_herramienta_fecha_devolucion: null },
      order: [['asignacion_herramienta_id', 'DESC']]
    });
    if (asignacion) {
      asignacion.asignacion_herramienta_fecha_devolucion = hoy();
      asignacion.asignacion_herramienta_estado_devolucion = (estado_devolucion || '').trim() || null;
      await asignacion.save();
    }

    const tecnicoPrevio = herramienta.herramienta_tecnico_rut;
    herramienta.herramienta_estado = 'Disponible';
    herramienta.herramienta_tecnico_rut = null;
    await herramienta.save();

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Herramienta ${herramienta.herramienta_codigo} devuelta por el técnico ${tecnicoPrevio || 'desconocido'}`,
        log_auditoria_modulo: 'HERRAMIENTA',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.json({ success: true, data: { mensaje: 'Devolución registrada', herramienta } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar la devolución' });
  }
}

// Historial de trazabilidad
async function getHistorial(req, res) {
  try {
    const { herramienta_id, trabajador_rut } = req.query;
    const where = {};
    if (herramienta_id) where.herramienta_id = herramienta_id;
    if (trabajador_rut) where.trabajador_rut = trabajador_rut;

    const movimientos = await AsignacionHerramienta.findAll({
      where,
      order: [['asignacion_herramienta_id', 'DESC']]
    });

    const idsH = [...new Set(movimientos.map(m => m.herramienta_id))];
    const rutsT = [...new Set(movimientos.map(m => m.trabajador_rut))];
    const herramientas = idsH.length ? await Herramienta.findAll({ where: { herramienta_id: idsH } }) : [];
    const trabajadores = rutsT.length ? await Trabajador.findAll({ where: { trabajador_rut: rutsT } }) : [];
    const mapaH = {}; herramientas.forEach(h => { mapaH[h.herramienta_id] = h; });
    const mapaT = {}; trabajadores.forEach(t => { mapaT[t.trabajador_rut] = t; });

    const data = movimientos.map(m => ({
      ...m.toJSON(),
      herramienta_codigo: mapaH[m.herramienta_id]?.herramienta_codigo || null,
      herramienta_nombre: mapaH[m.herramienta_id]?.herramienta_nombre || `#${m.herramienta_id}`,
      trabajador_nombre: mapaT[m.trabajador_rut]
        ? `${mapaT[m.trabajador_rut].trabajador_nombres} ${mapaT[m.trabajador_rut].trabajador_apellidos || ''}`.trim()
        : m.trabajador_rut
    }));
    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener el historial de trazabilidad' });
  }
}

module.exports = { getHerramientas, getTrabajadoresActivos, crear, asignar, devolver, getHistorial };
