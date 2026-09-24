const SolicitudMaterial = require('../models/SolicitudMaterial');
const Proyecto = require('../models/Proyecto');
const Usuario = require('../models/Usuario');
const Material = require('../models/Material');
const OrdenCompra = require('../models/OrdenCompra');
const DetalleOrdenCompra = require('../models/DetalleOrdenCompra');
const LogAuditoria = require('../models/LogAuditoria');
const { fechaHoy } = require('../utils/fecha');
const { obtenerIvaVigente, alertarIvaNoConfigurado, MENSAJE_IVA_NO_CONFIGURADO } = require('../utils/impuestos');

async function getMisSolicitudes(req, res) {
  try {
    const solicitudes = await SolicitudMaterial.findAll({
      where: { usuario_rut: req.user.rut },
      include: [{ model: Proyecto, attributes: ['proyecto_nombre_obra', 'proyecto_codigo_correlativo'] }],
      order: [['solicitud_material_fecha', 'DESC']]
    });
    return res.json({ success: true, data: solicitudes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener mis solicitudes' });
  }
}

async function crearSolicitud(req, res) {
  try {
    const { descripcion, cantidad, proyecto_codigo_correlativo, material_id } = req.body;

    if (!descripcion || !cantidad || !proyecto_codigo_correlativo) {
      return res.status(400).json({ success: false, error: 'Descripción, cantidad y proyecto son obligatorios' });
    }

    // Misma regla que al aprobar: un entero mayor a cero, como número o como
    // texto de solo dígitos. Sin esto se guardaban cantidades negativas o en cero,
    // y los decimales se truncaban en silencio.
    const cantidadEntera = typeof cantidad === 'string' && /^\s*\d+\s*$/.test(cantidad) ? Number(cantidad) : cantidad;
    if (!Number.isInteger(cantidadEntera) || cantidadEntera < 1) {
      return res.status(400).json({ success: false, error: 'La cantidad debe ser un número entero mayor a cero' });
    }

    const proyecto = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const solicitud = await SolicitudMaterial.create({
      solicitud_material_descripcion: descripcion,
      solicitud_material_cantidad: cantidadEntera,
      solicitud_material_estado: 'pendiente',
      solicitud_material_fecha: fechaHoy(),
      proyecto_codigo_correlativo,
      usuario_rut: req.user.rut,
      material_id: material_id || null
    });

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Solicitud de materiales #${solicitud.solicitud_material_id} creada para proyecto ${proyecto_codigo_correlativo}`,
        log_auditoria_modulo: 'SOLICITUD_MATERIAL',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: solicitud });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al crear la solicitud' });
  }
}

async function getSolicitudesPendientes(req, res) {
  try {
    const solicitudes = await SolicitudMaterial.findAll({
      where: { solicitud_material_estado: 'pendiente' },
      include: [{ model: Proyecto, attributes: ['proyecto_nombre_obra', 'proyecto_codigo_correlativo', 'proyecto_presupuesto_asignado'] }],
      order: [['solicitud_material_fecha', 'DESC']]
    });

    const ruts = [...new Set(solicitudes.map(s => s.usuario_rut).filter(Boolean))];
    const usuarios = ruts.length ? await Usuario.findAll({ where: { usuario_rut: ruts } }) : [];
    const mapaUsuarios = {};
    usuarios.forEach(u => { mapaUsuarios[u.usuario_rut] = u.usuario_nombre; });

    const data = solicitudes.map(s => {
      const json = s.toJSON();
      json.usuario_nombre = mapaUsuarios[s.usuario_rut] || s.usuario_rut;
      return json;
    });

    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener solicitudes pendientes' });
  }
}

// El costo estimado es el total de la solicitud, pero el precio unitario solo
// admite 2 decimales: un único precio redondeado desvía el total hasta $0,005 por
// unidad. Se reparte en centavos y el resto de la división va en una segunda
// línea a $0,01 más, para que la OC sume exactamente el costo aprobado.
function repartirCosto(costoTotal, cantidad) {
  const centavos = Math.round(costoTotal * 100);
  const base = Math.floor(centavos / cantidad);
  const resto = centavos - base * cantidad;
  const lineas = [];
  if (resto > 0) lineas.push({ cantidad: resto, precioUnitario: (base + 1) / 100 });
  lineas.push({ cantidad: cantidad - resto, precioUnitario: base / 100 });
  return lineas;
}

async function generarOrdenCompraDesdeSolicitud(solicitud, req, costoEstimado) {
  if (!solicitud.material_id) {
    return { oc_generada: false, motivo: 'La solicitud es una Solicitud Especial sin material de catálogo asociado; genera la Orden de Compra manualmente' };
  }

  const material = await Material.findByPk(solicitud.material_id);
  if (!material) {
    return { oc_generada: false, motivo: 'El material asociado ya no existe en el catálogo' };
  }

  if (!material.material_proveedor_rut) {
    return { oc_generada: false, motivo: `El material "${material.material_nombre}" no tiene proveedor asignado en el catálogo; asígnalo y genera la Orden de Compra manualmente` };
  }

  // CU53 - El costo estimado es el neto; la OC guarda el IVA vigente
  const iva = await obtenerIvaVigente();
  const folio = `OC-${Date.now()}`;
  const ordenCompra = await OrdenCompra.create({
    orden_compra_folio: folio,
    orden_compra_fecha: fechaHoy(),
    orden_compra_estado: 'Emitida',
    proveedor_rut: material.material_proveedor_rut,
    proyecto_codigo_correlativo: solicitud.proyecto_codigo_correlativo,
    solicitud_material_id: solicitud.solicitud_material_id,
    orden_compra_iva_porcentaje: iva.porcentaje
  });
  if (!iva.configurado) await alertarIvaNoConfigurado(`la orden de compra ${folio}`, req.user.rut);

  for (const linea of repartirCosto(costoEstimado, solicitud.solicitud_material_cantidad)) {
    await DetalleOrdenCompra.create({
      detalle_orden_compra_descripcion_material: material.material_nombre,
      detalle_orden_compra_cantidad: linea.cantidad,
      detalle_orden_compra_precio_unitario: linea.precioUnitario,
      orden_compra_id: ordenCompra.orden_compra_id,
      material_id: material.material_id
    });
  }

  try {
    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Orden de compra ${folio} generada automáticamente desde solicitud ${solicitud.solicitud_material_id} (CU35)`,
      log_auditoria_modulo: 'ORDEN_COMPRA',
      usuario_rut: req.user.rut
    });
  } catch (_) { /* log no crítico */ }

  return { oc_generada: true, motivo: null, orden_compra: ordenCompra, alerta_iva: iva.configurado ? null : MENSAJE_IVA_NO_CONFIGURADO };
}

async function aprobarSolicitud(req, res) {
  try {
    const { id } = req.params;
    const { cantidad, monto_estimado } = req.body;

    const solicitud = await SolicitudMaterial.findByPk(id);
    if (!solicitud) {
      return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
    }
    if (solicitud.solicitud_material_estado !== 'pendiente') {
      return res.status(400).json({ success: false, error: 'La solicitud ya fue validada' });
    }

    // El costo estimado define el precio de la OC automática: sin él, la OC queda en $0
    const costoEstimado = parseFloat(monto_estimado);
    if (!Number.isFinite(costoEstimado) || costoEstimado <= 0) {
      return res.status(400).json({ success: false, error: 'El costo estimado es obligatorio y debe ser mayor a cero' });
    }

    const cantidadEditada = cantidad !== undefined && cantidad !== null && cantidad !== '';
    const cantidadFinal = Number(cantidadEditada ? cantidad : solicitud.solicitud_material_cantidad);
    if (!Number.isInteger(cantidadFinal) || cantidadFinal < 1) {
      return res.status(400).json({ success: false, error: 'La cantidad debe ser un número entero mayor a cero' });
    }

    const proyecto = await Proyecto.findByPk(solicitud.proyecto_codigo_correlativo);
    const alertaPresupuesto = !!(proyecto && costoEstimado > parseFloat(proyecto.proyecto_presupuesto_asignado));

    solicitud.solicitud_material_cantidad = cantidadFinal;
    solicitud.solicitud_material_estado = 'aprobada';
    await solicitud.save();

    const comprobante = `COMP-${solicitud.solicitud_material_id}-${Date.now()}`;

    const resultadoOC = await generarOrdenCompraDesdeSolicitud(solicitud, req, costoEstimado);

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Solicitud de materiales #${id} aprobada${alertaPresupuesto ? ' (presupuesto excedido)' : ''} — comprobante ${comprobante}`,
        log_auditoria_modulo: 'SOLICITUD_MATERIAL',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.json({
      success: true,
      data: {
        solicitud,
        alerta_presupuesto: alertaPresupuesto,
        comprobante,
        oc_generada: resultadoOC.oc_generada,
        motivo_pausa_oc: resultadoOC.motivo,
        orden_compra: resultadoOC.orden_compra || null,
        alerta_iva: resultadoOC.alerta_iva || null
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al aprobar la solicitud' });
  }
}

async function rechazarSolicitud(req, res) {
  try {
    const { id } = req.params;
    const { comentario_rechazo } = req.body;

    if (!comentario_rechazo || !comentario_rechazo.trim()) {
      return res.status(400).json({ success: false, error: 'El comentario de rechazo es obligatorio' });
    }

    const solicitud = await SolicitudMaterial.findByPk(id);
    if (!solicitud) {
      return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
    }
    if (solicitud.solicitud_material_estado !== 'pendiente') {
      return res.status(400).json({ success: false, error: 'La solicitud ya fue validada' });
    }

    solicitud.solicitud_material_estado = 'rechazada';
    await solicitud.save();

    const comprobante = `COMP-${solicitud.solicitud_material_id}-${Date.now()}`;

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Solicitud de materiales #${id} rechazada: ${comentario_rechazo} — comprobante ${comprobante}`,
        log_auditoria_modulo: 'SOLICITUD_MATERIAL',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.json({ success: true, data: { solicitud, comprobante } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al rechazar la solicitud' });
  }
}

module.exports = { getMisSolicitudes, crearSolicitud, getSolicitudesPendientes, aprobarSolicitud, rechazarSolicitud };
