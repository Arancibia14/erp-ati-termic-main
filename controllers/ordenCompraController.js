const { Op } = require('sequelize');
const SolicitudMaterial = require('../models/SolicitudMaterial');
const OrdenCompra = require('../models/OrdenCompra');
const DetalleOrdenCompra = require('../models/DetalleOrdenCompra');
const Proveedor = require('../models/Proveedor');
const Proyecto = require('../models/Proyecto');
const LogAuditoria = require('../models/LogAuditoria');

async function getProveedores(req, res) {
  try {
    const proveedores = await Proveedor.findAll({
      order: [['proveedor_razon_social', 'ASC']]
    });
    return res.json({ success: true, data: proveedores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener proveedores' });
  }
}

async function getSolicitudesPendientes(req, res) {
  try {
    const solicitudes = await SolicitudMaterial.findAll({
      where: { solicitud_material_estado: 'pendiente' },
      include: [{ model: Proyecto, attributes: ['proyecto_nombre_obra', 'proyecto_codigo_correlativo'] }],
      order: [['solicitud_material_fecha', 'DESC']]
    });
    return res.json({ success: true, data: solicitudes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener solicitudes pendientes' });
  }
}

async function generarOrdenCompra(req, res) {
  try {
    const { solicitud_material_id, proveedor_rut, detalles } = req.body;

    if (!solicitud_material_id || !proveedor_rut || !detalles || !detalles.length) {
      return res.status(400).json({ success: false, error: 'Solicitud, proveedor y detalles son requeridos' });
    }

    const solicitud = await SolicitudMaterial.findByPk(solicitud_material_id);
    if (!solicitud) {
      return res.status(404).json({ success: false, error: 'Solicitud de material no encontrada' });
    }

    const proveedor = await Proveedor.findByPk(proveedor_rut);
    if (!proveedor) {
      return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
    }

    const folio = `OC-${Date.now()}`;
    const ordenCompra = await OrdenCompra.create({
      orden_compra_folio: folio,
      orden_compra_fecha: new Date().toISOString().split('T')[0],
      orden_compra_estado: 'Emitida',
      proveedor_rut,
      proyecto_codigo_correlativo: solicitud.proyecto_codigo_correlativo,
      solicitud_material_id
    });

    for (const detalle of detalles) {
      await DetalleOrdenCompra.create({
        detalle_orden_compra_descripcion_material: detalle.descripcion_material,
        detalle_orden_compra_cantidad: detalle.cantidad,
        detalle_orden_compra_precio_unitario: detalle.precio_unitario,
        orden_compra_id: ordenCompra.orden_compra_id
      });
    }

    await solicitud.update({ solicitud_material_estado: 'aprobada' });

    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Orden de compra ${folio} generada desde solicitud ${solicitud_material_id}`,
      log_auditoria_modulo: 'ORDEN_COMPRA',
      usuario_rut: req.user.rut
    });

    return res.status(201).json({ success: true, data: ordenCompra });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al generar orden de compra' });
  }
}

function montoTotal(detalles) {
  return detalles.reduce(
    (acc, d) => acc + (d.detalle_orden_compra_cantidad || 0) * parseFloat(d.detalle_orden_compra_precio_unitario || 0),
    0
  );
}

// CU36 - Almacenando historial de Órdenes de Compra
async function getHistorial(req, res) {
  try {
    const { desde, hasta, proyecto } = req.query;
    const where = {};
    if (proyecto) where.proyecto_codigo_correlativo = proyecto;
    if (desde && hasta) where.orden_compra_fecha = { [Op.between]: [desde, hasta] };
    else if (desde) where.orden_compra_fecha = { [Op.gte]: desde };
    else if (hasta) where.orden_compra_fecha = { [Op.lte]: hasta };

    const ordenes = await OrdenCompra.findAll({
      where,
      include: [
        { model: Proveedor, attributes: ['proveedor_razon_social'] },
        { model: Proyecto, attributes: ['proyecto_nombre_obra'] },
        { model: DetalleOrdenCompra, attributes: ['detalle_orden_compra_cantidad', 'detalle_orden_compra_precio_unitario'] }
      ],
      order: [['orden_compra_fecha', 'DESC'], ['orden_compra_id', 'DESC']]
    });

    const data = ordenes.map(o => ({
      orden_compra_id: o.orden_compra_id,
      orden_compra_folio: o.orden_compra_folio,
      orden_compra_fecha: o.orden_compra_fecha,
      orden_compra_estado: o.orden_compra_estado,
      proyecto_codigo_correlativo: o.proyecto_codigo_correlativo,
      proyecto_nombre_obra: o.Proyecto?.proyecto_nombre_obra || null,
      proveedor: o.Proveedor?.proveedor_razon_social || '—',
      monto_total: montoTotal(o.DetalleOrdenCompras || [])
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener el historial de órdenes de compra' });
  }
}

async function getDetalle(req, res) {
  try {
    const { id } = req.params;
    const orden = await OrdenCompra.findByPk(id, {
      include: [
        { model: Proveedor },
        { model: Proyecto, attributes: ['proyecto_nombre_obra', 'proyecto_codigo_correlativo'] },
        { model: DetalleOrdenCompra }
      ]
    });
    if (!orden) {
      return res.status(404).json({ success: false, error: 'Orden de compra no encontrada' });
    }
    const detalles = orden.DetalleOrdenCompras || [];
    return res.json({
      success: true,
      data: {
        orden,
        detalles,
        monto_total: montoTotal(detalles)
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener el detalle de la orden de compra' });
  }
}

module.exports = { getProveedores, getSolicitudesPendientes, generarOrdenCompra, getHistorial, getDetalle };
