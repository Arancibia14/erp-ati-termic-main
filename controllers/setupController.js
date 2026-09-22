const { Op }           = require('sequelize');
const EstadoProyecto   = require('../models/EstadoProyecto');
const Especialidad     = require('../models/Especialidad');
const Proyecto         = require('../models/Proyecto');
const Proveedor        = require('../models/Proveedor');
const Trabajador       = require('../models/Trabajador');
const HitoTecnico      = require('../models/HitoTecnico');
const SolicitudMaterial = require('../models/SolicitudMaterial');
const OrdenCompra      = require('../models/OrdenCompra');
const DetalleOrdenCompra = require('../models/DetalleOrdenCompra');
const GuiaDespacho     = require('../models/GuiaDespacho');
const ContratoLaboral  = require('../models/ContratoLaboral');
const LogAuditoria     = require('../models/LogAuditoria');
const EgresoCajaChica  = require('../models/EgresoCajaChica');
const { fechaHoy } = require('../utils/fecha');
const { validarRutChileno } = require('../utils/rut');
const { geocodificarDireccion, ErrorGeocodificacion } = require('../utils/geocodificar');

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

// ── LECTURAS ──────────────────────────────────────────────────────────────────

async function getEstados(req, res) {
  try {
    let estados = await EstadoProyecto.findAll();
    if (estados.length === 0) {
      await EstadoProyecto.bulkCreate([
        { estado_proyecto_nombre: 'Planificación' },
        { estado_proyecto_nombre: 'En Ejecución' },
        { estado_proyecto_nombre: 'Finalizado' }
      ]);
      estados = await EstadoProyecto.findAll();
    }
    return res.json({ success: true, data: estados });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener estados' });
  }
}

async function getEspecialidades(req, res) {
  try {
    let especialidades = await Especialidad.findAll();
    if (especialidades.length === 0) {
      await Especialidad.bulkCreate([
        { especialidad_nombre: 'Técnico HVAC' },
        { especialidad_nombre: 'Electricista' },
        { especialidad_nombre: 'Gasfiter' },
        { especialidad_nombre: 'Instalador' },
        { especialidad_nombre: 'Supervisor' },
        { especialidad_nombre: 'Bodeguero' }
      ]);
      especialidades = await Especialidad.findAll();
    }
    return res.json({ success: true, data: especialidades });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener especialidades' });
  }
}

async function getProyectos(req, res) {
  try {
    const proyectos = await Proyecto.findAll({
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }],
      order: [['proyecto_codigo_correlativo', 'ASC']]
    });
    return res.json({ success: true, data: proyectos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener proyectos' });
  }
}

async function getTrabajadores(req, res) {
  try {
    const trabajadores = await Trabajador.findAll({
      order: [['trabajador_nombres', 'ASC']]
    });
    return res.json({ success: true, data: trabajadores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener trabajadores' });
  }
}

async function getOrdenes(req, res) {
  try {
    const ordenes = await OrdenCompra.findAll({
      order: [['orden_compra_id', 'DESC']]
    });
    return res.json({ success: true, data: ordenes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener órdenes de compra' });
  }
}

async function getContratos(req, res) {
  try {
    const contratos = await ContratoLaboral.findAll({
      include: [{ model: Trabajador, attributes: ['trabajador_nombres', 'trabajador_apellidos'] }],
      order: [['contrato_laboral_fecha_inicio', 'DESC']]
    });
    return res.json({ success: true, data: contratos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener contratos laborales' });
  }
}

// ── CREACIONES ────────────────────────────────────────────────────────────────

async function crearProyecto(req, res) {
  try {
    const { proyecto_codigo_correlativo, proyecto_nombre_obra, proyecto_presupuesto_asignado, proyecto_correo_contacto, estado_proyecto_id, proyecto_fecha_inicio, proyecto_fecha_termino } = req.body;
    if (!proyecto_codigo_correlativo || !proyecto_nombre_obra || !proyecto_presupuesto_asignado || !proyecto_correo_contacto || !estado_proyecto_id) {
      return res.status(400).json({ success: false, error: 'Todos los campos son requeridos' });
    }
    // El plazo es opcional al crear, pero si se indica debe venir completo
    if (proyecto_fecha_inicio || proyecto_fecha_termino) {
      const errorPlazo = errorPlazoProyecto(proyecto_fecha_inicio, proyecto_fecha_termino);
      if (errorPlazo) return res.status(400).json({ success: false, error: errorPlazo });
    }
    const existe = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (existe) return res.status(400).json({ success: false, error: 'Ya existe un proyecto con ese código' });

    const proyecto = await Proyecto.create({
      proyecto_codigo_correlativo,
      proyecto_nombre_obra,
      proyecto_presupuesto_asignado: parseFloat(proyecto_presupuesto_asignado),
      proyecto_correo_contacto,
      proyecto_porcentaje_avance: 0,
      estado_proyecto_id: parseInt(estado_proyecto_id),
      proyecto_fecha_inicio: proyecto_fecha_inicio || null,
      proyecto_fecha_termino: proyecto_fecha_termino || null
    });

    await audit(`Proyecto ${proyecto_codigo_correlativo} creado`, 'SETUP', req.user.rut);
    return res.status(201).json({ success: true, data: proyecto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message || 'Error al crear proyecto' });
  }
}

async function crearProveedor(req, res) {
  try {
    const { proveedor_rut, proveedor_razon_social, proveedor_correo, proveedor_telefono } = req.body;
    if (!proveedor_rut || !proveedor_razon_social || !proveedor_correo) {
      return res.status(400).json({ success: false, error: 'RUT, razón social y correo son requeridos' });
    }
    const existe = await Proveedor.findByPk(proveedor_rut);
    if (existe) return res.status(400).json({ success: false, error: 'Ya existe un proveedor con ese RUT' });

    const proveedor = await Proveedor.create({
      proveedor_rut,
      proveedor_razon_social,
      proveedor_correo,
      proveedor_telefono: proveedor_telefono || null
    });
    await audit(`Proveedor ${proveedor_rut} creado`, 'SETUP', req.user.rut);
    return res.status(201).json({ success: true, data: proveedor });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message || 'Error al crear proveedor' });
  }
}

async function crearTrabajador(req, res) {
  try {
    const { trabajador_rut, trabajador_nombres, trabajador_correo, trabajador_telefono, especialidad_id, proyecto_codigo_correlativo } = req.body;
    if (!trabajador_rut || !trabajador_nombres || !trabajador_correo || !trabajador_telefono || !especialidad_id) {
      return res.status(400).json({ success: false, error: 'RUT, nombres, correo, teléfono y especialidad son requeridos' });
    }
    const validacion = validarRutChileno(trabajador_rut);
    if (!validacion.valido) return res.status(400).json({ success: false, error: validacion.error });
    const rut = validacion.rut;

    const existe = await Trabajador.findByPk(rut);
    if (existe) return res.status(400).json({ success: false, error: 'Ya existe un trabajador con ese RUT' });

    const trabajador = await Trabajador.create({
      trabajador_rut: rut,
      trabajador_nombres,
      trabajador_correo,
      trabajador_telefono,
      especialidad_id: parseInt(especialidad_id),
      proyecto_codigo_correlativo: proyecto_codigo_correlativo || null
    });
    await audit(`Trabajador ${rut} creado`, 'SETUP', req.user.rut);
    return res.status(201).json({ success: true, data: trabajador });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al crear trabajador' });
  }
}

async function crearHito(req, res) {
  try {
    const { hito_tecnico_nombre_hito, proyecto_codigo_correlativo, hito_tecnico_avance_fisico } = req.body;
    if (!hito_tecnico_nombre_hito || !proyecto_codigo_correlativo) {
      return res.status(400).json({ success: false, error: 'Nombre del hito y proyecto son requeridos' });
    }
    const proyecto = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (!proyecto) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });

    const hito = await HitoTecnico.create({
      hito_tecnico_nombre_hito,
      proyecto_codigo_correlativo,
      hito_tecnico_avance_fisico: parseFloat(hito_tecnico_avance_fisico) || 0
    });
    await audit(`Hito "${hito_tecnico_nombre_hito}" creado en proyecto ${proyecto_codigo_correlativo}`, 'SETUP', req.user.rut);
    return res.status(201).json({ success: true, data: hito });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al crear hito técnico' });
  }
}

async function crearSolicitudMaterial(req, res) {
  try {
    const { solicitud_material_descripcion, solicitud_material_cantidad, proyecto_codigo_correlativo } = req.body;
    if (!solicitud_material_descripcion || !solicitud_material_cantidad || !proyecto_codigo_correlativo) {
      return res.status(400).json({ success: false, error: 'Descripción, cantidad y proyecto son requeridos' });
    }
    // Misma regla que al aprobar: un entero mayor a cero, como número o como
    // texto de solo dígitos. parseInt aceptaba negativos y truncaba decimales
    // ("2.5" quedaba en 2, "5abc" en 5).
    const cantidad = solicitud_material_cantidad;
    const cantidadEntera = typeof cantidad === 'string' && /^\s*\d+\s*$/.test(cantidad) ? Number(cantidad) : cantidad;
    if (!Number.isInteger(cantidadEntera) || cantidadEntera < 1) {
      return res.status(400).json({ success: false, error: 'La cantidad debe ser un número entero mayor a cero' });
    }
    const proyecto = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (!proyecto) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });

    const solicitud = await SolicitudMaterial.create({
      solicitud_material_descripcion,
      solicitud_material_cantidad: cantidadEntera,
      solicitud_material_estado: 'pendiente',
      solicitud_material_fecha: fechaHoy(),
      proyecto_codigo_correlativo,
      usuario_rut: req.user.rut
    });
    await audit(`Solicitud de material creada para proyecto ${proyecto_codigo_correlativo}`, 'SETUP', req.user.rut);
    return res.status(201).json({ success: true, data: solicitud });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message || 'Error al crear solicitud de material' });
  }
}

async function crearGuiaDespacho(req, res) {
  try {
    const { guia_despacho_numero, guia_despacho_fecha, orden_compra_id } = req.body;
    if (!guia_despacho_numero || !guia_despacho_fecha || !orden_compra_id) {
      return res.status(400).json({ success: false, error: 'Número de guía, fecha y orden de compra son requeridos' });
    }
    const orden = await OrdenCompra.findByPk(parseInt(orden_compra_id));
    if (!orden) return res.status(404).json({ success: false, error: 'Orden de compra no encontrada' });

    const existe = await GuiaDespacho.findOne({ where: { guia_despacho_numero } });
    if (existe) return res.status(400).json({ success: false, error: 'Ya existe una guía con ese número' });

    const guia = await GuiaDespacho.create({
      guia_despacho_numero,
      guia_despacho_fecha,
      guia_despacho_estado: 'En Tránsito',
      guia_despacho_ubicacion_verificada: false,
      orden_compra_id: parseInt(orden_compra_id)
    });
    await audit(`Guía de despacho ${guia_despacho_numero} creada`, 'SETUP', req.user.rut);
    return res.status(201).json({ success: true, data: guia });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al crear guía de despacho' });
  }
}

// Fecha real en formato AAAA-MM-DD (el que envía <input type="date">). Se exige
// ese formato porque el término se compara con el inicio como texto.
function esFechaValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [a, m, d] = fecha.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}

// Devuelve el mensaje de error del rango de fechas, o null si es válido.
// Un término anterior al inicio también esquivaría la validación de solapamiento.
function errorRangoContrato(fecha_inicio, fecha_termino) {
  if (!esFechaValida(fecha_inicio) || (fecha_termino && !esFechaValida(fecha_termino))) {
    return 'Las fechas del contrato no son válidas';
  }
  if (fecha_termino && fecha_termino < fecha_inicio) {
    return 'La fecha de término no puede ser anterior a la fecha de inicio';
  }
  return null;
}

// El plazo de la obra reparte el presupuesto planificado mes a mes, así que se
// necesitan ambas fechas: sin término no se sabe en cuántos meses repartirlo.
function errorPlazoProyecto(fecha_inicio, fecha_termino) {
  if (!fecha_inicio || !fecha_termino) {
    return 'Indica la fecha de inicio y la de término del proyecto';
  }
  if (!esFechaValida(fecha_inicio) || !esFechaValida(fecha_termino)) {
    return 'Las fechas del proyecto no son válidas';
  }
  if (fecha_termino < fecha_inicio) {
    return 'La fecha de término no puede ser anterior a la fecha de inicio';
  }
  return null;
}

// Un trabajador no puede tener dos contratos cuyos rangos [inicio, término] se solapen.
// Un término null se trata como "sigue vigente" (equivalente a +infinito).
async function buscarContratoSolapado(trabajador_rut, fecha_inicio, fecha_termino, excluirId = null) {
  const where = {
    trabajador_rut,
    contrato_laboral_fecha_inicio: { [Op.lte]: fecha_termino || '9999-12-31' },
    [Op.or]: [
      { contrato_laboral_fecha_termino: null },
      { contrato_laboral_fecha_termino: { [Op.gte]: fecha_inicio } }
    ]
  };
  if (excluirId) where.contrato_laboral_id_contrato = { [Op.ne]: excluirId };
  return ContratoLaboral.findOne({ where });
}

async function crearContratoLaboral(req, res) {
  try {
    const { trabajador_rut, contrato_laboral_sueldo_base, contrato_laboral_leyes_sociales, contrato_laboral_fecha_inicio, contrato_laboral_fecha_termino, proyecto_codigo_correlativo } = req.body;
    if (!trabajador_rut || !contrato_laboral_sueldo_base || !contrato_laboral_fecha_inicio) {
      return res.status(400).json({ success: false, error: 'Trabajador, sueldo base y fecha de inicio son requeridos' });
    }
    const errorRango = errorRangoContrato(contrato_laboral_fecha_inicio, contrato_laboral_fecha_termino || null);
    if (errorRango) return res.status(400).json({ success: false, error: errorRango });

    const trabajador = await Trabajador.findByPk(trabajador_rut);
    if (!trabajador) return res.status(404).json({ success: false, error: 'Trabajador no encontrado' });

    const solapado = await buscarContratoSolapado(trabajador_rut, contrato_laboral_fecha_inicio, contrato_laboral_fecha_termino || null);
    if (solapado) {
      return res.status(409).json({ success: false, error: 'El trabajador ya tiene un contrato registrado que se solapa con ese rango de fechas' });
    }

    const contrato = await ContratoLaboral.create({
      trabajador_rut,
      contrato_laboral_sueldo_base: parseFloat(contrato_laboral_sueldo_base),
      contrato_laboral_leyes_sociales: parseFloat(contrato_laboral_leyes_sociales) || 0,
      contrato_laboral_fecha_inicio,
      contrato_laboral_fecha_termino: contrato_laboral_fecha_termino || null,
      proyecto_codigo_correlativo: proyecto_codigo_correlativo || null
    });
    await audit(`Contrato creado para trabajador ${trabajador_rut}`, 'SETUP', req.user.rut);
    return res.status(201).json({ success: true, data: contrato });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al crear contrato laboral' });
  }
}

async function actualizarContratoLaboral(req, res) {
  try {
    const { id } = req.params;
    const { contrato_laboral_sueldo_base, contrato_laboral_leyes_sociales, contrato_laboral_fecha_inicio, contrato_laboral_fecha_termino, proyecto_codigo_correlativo } = req.body;
    if (!contrato_laboral_sueldo_base || !contrato_laboral_fecha_inicio) {
      return res.status(400).json({ success: false, error: 'Sueldo base y fecha de inicio son requeridos' });
    }
    const errorRango = errorRangoContrato(contrato_laboral_fecha_inicio, contrato_laboral_fecha_termino || null);
    if (errorRango) return res.status(400).json({ success: false, error: errorRango });

    const contrato = await ContratoLaboral.findByPk(id);
    if (!contrato) return res.status(404).json({ success: false, error: 'Contrato no encontrado' });

    const solapado = await buscarContratoSolapado(
      contrato.trabajador_rut, contrato_laboral_fecha_inicio, contrato_laboral_fecha_termino || null, contrato.contrato_laboral_id_contrato
    );
    if (solapado) {
      return res.status(409).json({ success: false, error: 'El trabajador ya tiene otro contrato registrado que se solapa con ese rango de fechas' });
    }

    await contrato.update({
      contrato_laboral_sueldo_base: parseFloat(contrato_laboral_sueldo_base),
      contrato_laboral_leyes_sociales: parseFloat(contrato_laboral_leyes_sociales) || 0,
      contrato_laboral_fecha_inicio,
      contrato_laboral_fecha_termino: contrato_laboral_fecha_termino || null,
      proyecto_codigo_correlativo: proyecto_codigo_correlativo || null
    });
    await audit(`Contrato ${id} actualizado para trabajador ${contrato.trabajador_rut}`, 'SETUP', req.user.rut);
    return res.json({ success: true, data: contrato });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar contrato laboral' });
  }
}

async function eliminarContratoLaboral(req, res) {
  try {
    const { id } = req.params;
    const contrato = await ContratoLaboral.findByPk(id);
    if (!contrato) return res.status(404).json({ success: false, error: 'Contrato no encontrado' });

    const trabajador_rut = contrato.trabajador_rut;
    await contrato.destroy();
    await audit(`Contrato ${id} eliminado para trabajador ${trabajador_rut}`, 'SETUP', req.user.rut);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al eliminar contrato laboral' });
  }
}

// Acepta la dirección de la obra, que es lo cómodo de escribir, y la convierte en
// coordenadas. Si el servicio de mapas no está disponible o no reconoce la dirección,
// el actor todavía puede mandar la latitud y la longitud a mano.
async function actualizarCoordenadasProyecto(req, res) {
  try {
    const { codigo } = req.params;
    const { direccion, latitud, longitud } = req.body;
    const hayCoordenadas = latitud !== undefined && longitud !== undefined;

    if (!direccion && !hayCoordenadas)
      return res.status(400).json({ success: false, error: 'Indica la dirección de la obra o su latitud y longitud' });

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto)
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });

    // Modo manual: las coordenadas mandan y la dirección, si viene, se guarda igual.
    if (hayCoordenadas) {
      const lat = parseFloat(latitud), lon = parseFloat(longitud);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180)
        return res.status(400).json({ success: false, error: 'Coordenadas inválidas. Latitud entre -90 y 90, longitud entre -180 y 180' });

      const cambios = { proyecto_latitud: lat, proyecto_longitud: lon };
      if (direccion) cambios.proyecto_ubicacion = String(direccion).trim();
      await proyecto.update(cambios);
      await audit(`Coordenadas GPS del proyecto ${codigo} actualizadas manualmente`, 'SETUP', req.user.rut);
      return res.json({ success: true, data: { latitud: lat, longitud: lon, origen: 'manual' } });
    }

    // Modo dirección: se consulta el servicio de mapas.
    let ubicacion;
    try {
      ubicacion = await geocodificarDireccion(direccion);
    } catch (err) {
      if (!(err instanceof ErrorGeocodificacion)) throw err;
      const estado = err.causa === 'NO_ENCONTRADA' ? 404 : err.causa === 'DIRECCION_CORTA' ? 400 : 503;
      return res.status(estado).json({ success: false, error: err.message, sugerir_manual: err.causa !== 'DIRECCION_CORTA' });
    }

    await proyecto.update({
      proyecto_ubicacion: String(direccion).trim(),
      proyecto_latitud: ubicacion.latitud,
      proyecto_longitud: ubicacion.longitud
    });
    await audit(`Ubicación del proyecto ${codigo} actualizada desde la dirección "${String(direccion).trim()}"`, 'SETUP', req.user.rut);
    return res.json({ success: true, data: { ...ubicacion, origen: 'direccion' } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar la ubicación del proyecto' });
  }
}

async function actualizarPlazoProyecto(req, res) {
  try {
    const { codigo } = req.params;
    const { fecha_inicio, fecha_termino } = req.body;
    const errorPlazo = errorPlazoProyecto(fecha_inicio, fecha_termino);
    if (errorPlazo) return res.status(400).json({ success: false, error: errorPlazo });

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto)
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    await proyecto.update({ proyecto_fecha_inicio: fecha_inicio, proyecto_fecha_termino: fecha_termino });
    await audit(`Plazo del proyecto ${codigo} actualizado (${fecha_inicio} a ${fecha_termino})`, 'SETUP', req.user.rut);
    return res.json({ success: true, data: proyecto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar el plazo del proyecto' });
  }
}

// Fondo de caja chica del proyecto (CU 39). Sale del presupuesto de la obra,
// así que no puede superarlo, y no puede quedar bajo lo que ya se gastó en caja
// chica porque el saldo quedaría negativo.
async function actualizarCajaChicaProyecto(req, res) {
  try {
    const { codigo } = req.params;
    const { monto } = req.body;
    const valor = typeof monto === 'number' ? monto
      : (typeof monto === 'string' && /^\s*\d+(\.\d{1,2})?\s*$/.test(monto) ? Number(monto) : NaN);
    if (!Number.isFinite(valor) || valor < 0) {
      return res.status(400).json({ success: false, error: 'El fondo de caja chica debe ser un monto igual o mayor a cero' });
    }

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto)
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });

    const presupuesto = parseFloat(proyecto.proyecto_presupuesto_asignado) || 0;
    if (valor > presupuesto) {
      return res.status(400).json({
        success: false,
        error: `El fondo de caja chica no puede superar el presupuesto del proyecto ($${presupuesto.toLocaleString('es-CL')})`
      });
    }
    const gastado = parseFloat(await EgresoCajaChica.sum('egreso_caja_chica_monto', {
      where: { proyecto_codigo_correlativo: codigo }
    })) || 0;
    if (valor < gastado) {
      return res.status(400).json({
        success: false,
        error: `El fondo no puede ser menor a lo ya gastado en caja chica ($${gastado.toLocaleString('es-CL')})`
      });
    }

    await proyecto.update({ proyecto_presupuesto_caja_chica: valor });
    await audit(`Fondo de caja chica del proyecto ${codigo} actualizado a $${valor.toLocaleString('es-CL')}`, 'SETUP', req.user.rut);
    return res.json({ success: true, data: proyecto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar el fondo de caja chica' });
  }
}

module.exports = {
  getEstados, getEspecialidades, getProyectos, getTrabajadores, getOrdenes, getContratos,
  crearProyecto, crearProveedor, crearTrabajador, crearHito, crearSolicitudMaterial,
  crearGuiaDespacho, crearContratoLaboral, actualizarContratoLaboral, eliminarContratoLaboral,
  actualizarCoordenadasProyecto, actualizarPlazoProyecto, actualizarCajaChicaProyecto
};
