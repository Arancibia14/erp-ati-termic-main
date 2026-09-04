const GuiaDespacho = require('../models/GuiaDespacho');
const OrdenCompra = require('../models/OrdenCompra');
const DetalleOrdenCompra = require('../models/DetalleOrdenCompra');
const Proveedor = require('../models/Proveedor');
const Material = require('../models/Material');
const LogAuditoria = require('../models/LogAuditoria');

async function getProveedores(req, res) {
  try {
    const proveedores = await Proveedor.findAll({ order: [['proveedor_razon_social', 'ASC']] });
    return res.json({ success: true, data: proveedores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener proveedores' });
  }
}

async function getOrdenesCompra(req, res) {
  try {
    const ordenes = await OrdenCompra.findAll({
      include: [{ model: Proveedor, attributes: ['proveedor_razon_social'] }],
      order: [['orden_compra_id', 'DESC']]
    });
    return res.json({ success: true, data: ordenes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener órdenes de compra' });
  }
}

async function getGuias(req, res) {
  try {
    const guias = await GuiaDespacho.findAll({
      include: [
        { model: OrdenCompra, attributes: ['orden_compra_folio'] },
        { model: Proveedor, attributes: ['proveedor_razon_social'] },
        { model: Material, attributes: ['material_nombre', 'material_codigo_sku', 'material_unidad_medida'] }
      ],
      order: [['guia_despacho_id', 'DESC']]
    });
    return res.json({ success: true, data: guias });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener guías de despacho' });
  }
}

async function crearGuia(req, res) {
  try {
    const { numero, proveedor_rut, orden_compra_id, material_id, cantidad_recibida, fecha } = req.body;

    if (!numero || !proveedor_rut || !material_id || !cantidad_recibida) {
      return res.status(400).json({ success: false, error: 'Número de guía, proveedor, material y cantidad son obligatorios' });
    }

    const proveedor = await Proveedor.findByPk(proveedor_rut);
    if (!proveedor) {
      return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
    }

    const material = await Material.findByPk(material_id);
    if (!material) {
      return res.status(404).json({ success: false, error: 'Material no encontrado' });
    }

    const guiaExistente = await GuiaDespacho.findOne({ where: { guia_despacho_numero: numero } });
    if (guiaExistente) {
      return res.status(409).json({ success: false, error: 'El número de guía ya existe' });
    }

    const cantidad = parseInt(cantidad_recibida);
    let alertaExceso = false;

    if (orden_compra_id) {
      const ordenCompra = await OrdenCompra.findByPk(orden_compra_id);
      if (!ordenCompra) {
        return res.status(404).json({ success: false, error: 'Orden de compra no encontrada' });
      }

      const detalles = await DetalleOrdenCompra.findAll({
        where: { orden_compra_id, material_id }
      });
      const cantidadComprada = detalles.reduce((acc, d) => acc + d.detalle_orden_compra_cantidad, 0);

      const guiasPrevias = await GuiaDespacho.findAll({
        where: { orden_compra_id, material_id }
      });
      const cantidadRecibidaPrevia = guiasPrevias.reduce((acc, g) => acc + (g.guia_despacho_cantidad_recibida || 0), 0);

      if (cantidadComprada > 0 && (cantidadRecibidaPrevia + cantidad) > cantidadComprada) {
        alertaExceso = true;
      }
    }

    const guia = await GuiaDespacho.create({
      guia_despacho_numero: numero,
      guia_despacho_fecha: fecha || new Date().toISOString().split('T')[0],
      guia_despacho_estado: 'Registrada',
      proveedor_rut,
      orden_compra_id: orden_compra_id || null,
      material_id,
      guia_despacho_cantidad_recibida: cantidad
    });

    material.material_stock_minimo = (material.material_stock_minimo || 0) + cantidad;
    await material.save();

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Guía de despacho ${numero} registrada — ${cantidad} ${material.material_unidad_medida} de ${material.material_nombre}${alertaExceso ? ' (excede lo comprado)' : ''}`,
        log_auditoria_modulo: 'GUIA_DESPACHO',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: { guia, alerta_exceso: alertaExceso } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar el ingreso de materiales' });
  }
}

// CU NUEVO 3 - Confirmando despacho de guía por el proveedor
async function getGuiasRegistradas(req, res) {
  try {
    const guias = await GuiaDespacho.findAll({
      where: { guia_despacho_estado: 'Registrada' },
      include: [
        { model: OrdenCompra, attributes: ['orden_compra_folio'] },
        { model: Proveedor, attributes: ['proveedor_razon_social'] },
        { model: Material, attributes: ['material_nombre', 'material_codigo_sku'] }
      ],
      order: [['guia_despacho_id', 'DESC']]
    });
    return res.json({ success: true, data: guias });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener las guías registradas' });
  }
}

async function confirmarDespacho(req, res) {
  try {
    const { id } = req.params;

    const guia = await GuiaDespacho.findByPk(id);
    if (!guia) {
      return res.status(404).json({ success: false, error: 'Guía de despacho no encontrada' });
    }

    if (guia.guia_despacho_estado !== 'Registrada') {
      // Excepción 1: Estado inválido
      return res.status(409).json({
        success: false,
        error: `La guía ya se encuentra en estado "${guia.guia_despacho_estado}" y no puede confirmarse nuevamente`
      });
    }

    guia.guia_despacho_estado = 'En Tránsito';
    await guia.save();

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Despacho confirmado por el proveedor para la guía ${guia.guia_despacho_numero} — estado actualizado a "En Tránsito"`,
        log_auditoria_modulo: 'GUIA_DESPACHO',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.json({ success: true, data: guia });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al confirmar el despacho de la guía' });
  }
}

module.exports = { getProveedores, getOrdenesCompra, getGuias, crearGuia, getGuiasRegistradas, confirmarDespacho };
