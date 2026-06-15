const SolicitudMaterial = require('../models/SolicitudMaterial');
const OrdenCompra = require('../models/OrdenCompra');
const DetalleOrdenCompra = require('../models/DetalleOrdenCompra');
const Proveedor = require('../models/Proveedor');
const Proyecto = require('../models/Proyecto');
const LogAuditoria = require('../models/LogAuditoria');

// CU35 - C_OrdenCompra: Generando Orden de Compra Automáticamente

// Lista todos los proveedores registrados para el selector del formulario
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

// Retorna las solicitudes de material que aún no tienen una orden de compra generada
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

// Crea una OC con sus ítems de detalle y marca la solicitud de material como aprobada
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

    // El folio se genera automáticamente usando el timestamp para garantizar unicidad
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

module.exports = { getProveedores, getSolicitudesPendientes, generarOrdenCompra };
