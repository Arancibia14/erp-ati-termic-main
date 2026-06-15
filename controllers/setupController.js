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

// Controlador de Configuración del Sistema (solo administradores)
// Centraliza la creación de todas las entidades maestras del ERP:
// proyectos, proveedores, trabajadores, hitos, solicitudes, guías, contratos y coordenadas GPS

// Función auxiliar: registra cada acción administrativa en el log de auditoría
const audit = async (accion, modulo, rut) => {
  try {
    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: accion,
      log_auditoria_modulo: modulo,
      usuario_rut: rut
    });
  } catch (_) { /* el log no es crítico: si falla no interrumpe la operación principal */ }
};

// ── LECTURAS ──────────────────────────────────────────────────────────────────

// Retorna los estados de proyecto; si la tabla está vacía los crea automáticamente (datos semilla)
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

// Retorna las especialidades de trabajadores; si la tabla está vacía las crea con valores por defecto
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

// ── CREACIONES ────────────────────────────────────────────────────────────────

// Crea un nuevo proyecto verificando que el código correlativo no esté duplicado
async function crearProyecto(req, res) {
  try {
    const { proyecto_codigo_correlativo, proyecto_nombre_obra, proyecto_presupuesto_asignado, proyecto_correo_contacto, estado_proyecto_id } = req.body;
    if (!proyecto_codigo_correlativo || !proyecto_nombre_obra || !proyecto_presupuesto_asignado || !proyecto_correo_contacto || !estado_proyecto_id) {
      return res.status(400).json({ success: false, error: 'Todos los campos son requeridos' });
    }
    const existe = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (existe) return res.status(400).json({ success: false, error: 'Ya existe un proyecto con ese código' });

    const proyecto = await Proyecto.create({
      proyecto_codigo_correlativo,
      proyecto_nombre_obra,
      proyecto_presupuesto_asignado: parseFloat(proyecto_presupuesto_asignado),
      proyecto_correo_contacto,
      proyecto_porcentaje_avance: 0,
      estado_proyecto_id: parseInt(estado_proyecto_id)
    });

    await audit(`Proyecto ${proyecto_codigo_correlativo} creado`, 'SETUP', req.user.rut);
    return res.status(201).json({ success: true, data: proyecto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message || 'Error al crear proyecto' });
  }
}

// Registra un nuevo proveedor/subcontratista en el sistema
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

// Registra un nuevo trabajador y lo asigna opcionalmente a un proyecto
async function crearTrabajador(req, res) {
  try {
    const { trabajador_rut, trabajador_nombres, trabajador_correo, trabajador_telefono, especialidad_id, proyecto_codigo_correlativo } = req.body;
    if (!trabajador_rut || !trabajador_nombres || !trabajador_correo || !trabajador_telefono || !especialidad_id) {
      return res.status(400).json({ success: false, error: 'RUT, nombres, correo, teléfono y especialidad son requeridos' });
    }
    const existe = await Trabajador.findByPk(trabajador_rut);
    if (existe) return res.status(400).json({ success: false, error: 'Ya existe un trabajador con ese RUT' });

    const trabajador = await Trabajador.create({
      trabajador_rut,
      trabajador_nombres,
      trabajador_correo,
      trabajador_telefono,
      especialidad_id: parseInt(especialidad_id),
      proyecto_codigo_correlativo: proyecto_codigo_correlativo || null
    });
    await audit(`Trabajador ${trabajador_rut} creado`, 'SETUP', req.user.rut);
    return res.status(201).json({ success: true, data: trabajador });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al crear trabajador' });
  }
}

// Crea un hito técnico (etapa de avance) para un proyecto específico
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

// Crea una solicitud de material pendiente que luego el admin convertirá en orden de compra
async function crearSolicitudMaterial(req, res) {
  try {
    const { solicitud_material_descripcion, solicitud_material_cantidad, proyecto_codigo_correlativo } = req.body;
    if (!solicitud_material_descripcion || !solicitud_material_cantidad || !proyecto_codigo_correlativo) {
      return res.status(400).json({ success: false, error: 'Descripción, cantidad y proyecto son requeridos' });
    }
    const proyecto = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (!proyecto) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });

    const solicitud = await SolicitudMaterial.create({
      solicitud_material_descripcion,
      solicitud_material_cantidad: parseInt(solicitud_material_cantidad),
      solicitud_material_estado: 'pendiente',
      solicitud_material_fecha: new Date().toISOString().split('T')[0],
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

// Crea una guía de despacho asociada a una orden de compra, en estado "Pendiente" de recepción
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
      guia_despacho_estado: 'Pendiente',
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

// Registra el contrato laboral de un trabajador con su sueldo base y leyes sociales
async function crearContratoLaboral(req, res) {
  try {
    const { trabajador_rut, contrato_laboral_sueldo_base, contrato_laboral_leyes_sociales, contrato_laboral_fecha_inicio, contrato_laboral_fecha_termino, proyecto_codigo_correlativo } = req.body;
    if (!trabajador_rut || !contrato_laboral_sueldo_base || !contrato_laboral_fecha_inicio) {
      return res.status(400).json({ success: false, error: 'Trabajador, sueldo base y fecha de inicio son requeridos' });
    }
    const trabajador = await Trabajador.findByPk(trabajador_rut);
    if (!trabajador) return res.status(404).json({ success: false, error: 'Trabajador no encontrado' });

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

// Guarda las coordenadas GPS del proyecto para la validación geográfica de recepciones
async function actualizarCoordenadasProyecto(req, res) {
  try {
    const { codigo } = req.params;
    const { latitud, longitud } = req.body;
    if (latitud === undefined || longitud === undefined)
      return res.status(400).json({ success: false, error: 'Latitud y longitud son requeridas' });
    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto)
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    await proyecto.update({ proyecto_latitud: parseFloat(latitud), proyecto_longitud: parseFloat(longitud) });
    await audit(`Coordenadas GPS del proyecto ${codigo} actualizadas`, 'SETUP', req.user.rut);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar coordenadas' });
  }
}

module.exports = {
  getEstados, getEspecialidades, getProyectos, getTrabajadores, getOrdenes,
  crearProyecto, crearProveedor, crearTrabajador, crearHito, crearSolicitudMaterial,
  crearGuiaDespacho, crearContratoLaboral, actualizarCoordenadasProyecto
};
