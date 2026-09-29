const Material = require('../models/Material');
const Proveedor = require('../models/Proveedor');
const LogAuditoria = require('../models/LogAuditoria');
const sequelize = require('../config/database');
const { ingresarLote, ajustarStock, valorizarInventario, StockInsuficiente } = require('../utils/inventarioFifo');

async function getMateriales(req, res) {
  try {
    const materiales = await Material.findAll({
      where: { material_activo: true },
      include: [{ model: Proveedor, attributes: ['proveedor_razon_social'] }],
      order: [['material_nombre', 'ASC']]
    });
    return res.json({ success: true, data: materiales });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener materiales' });
  }
}

async function getMaterial(req, res) {
  try {
    const { id } = req.params;
    const material = await Material.findByPk(id);
    if (!material) {
      return res.status(404).json({ success: false, error: 'Material no encontrado' });
    }
    return res.json({ success: true, data: material });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener material' });
  }
}

async function crearMaterial(req, res) {
  try {
    const {
      material_codigo_sku,
      material_nombre,
      material_descripcion,
      material_unidad_medida,
      material_categoria,
      material_stock_minimo,
      material_proveedor_rut
    } = req.body;

    if (!material_codigo_sku || !material_nombre || !material_unidad_medida) {
      return res.status(400).json({ success: false, error: 'SKU, nombre y unidad de medida son obligatorios' });
    }

    const existente = await Material.findOne({ where: { material_codigo_sku } });
    if (existente) {
      return res.status(409).json({ success: false, error: 'El código SKU ya pertenece a otro material' });
    }

    // CU 26 / UR-F-29 - El stock con que nace el material entra como lote "Stock inicial"
    const material = await sequelize.transaction(async t => {
      const creado = await Material.create({
        material_codigo_sku,
        material_nombre,
        material_descripcion: material_descripcion || null,
        material_unidad_medida,
        material_categoria: material_categoria || null,
        material_stock_minimo: 0,
        material_proveedor_rut: material_proveedor_rut || null
      }, { transaction: t });
      await ingresarLote({ material_id: creado.material_id, cantidad: material_stock_minimo || 0, origen: 'Stock inicial' }, t);
      await creado.reload({ transaction: t });
      return creado;
    });

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Material ${material_codigo_sku} creado en catálogo maestro`,
        log_auditoria_modulo: 'MATERIAL',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: material });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al crear material' });
  }
}

async function actualizarMaterial(req, res) {
  try {
    const { id } = req.params;
    const {
      material_nombre,
      material_descripcion,
      material_unidad_medida,
      material_categoria,
      material_stock_minimo,
      material_proveedor_rut
    } = req.body;

    const material = await Material.findByPk(id);
    if (!material) {
      return res.status(404).json({ success: false, error: 'Material no encontrado' });
    }

    if (!material_nombre || !material_unidad_medida) {
      return res.status(400).json({ success: false, error: 'Nombre y unidad de medida son obligatorios' });
    }

    // CU 26 / UR-F-29 - Si se corrige el stock, la diferencia entra como lote de
    // ajuste o sale por FIFO, para que el stock siga calzando con los lotes
    try {
      await sequelize.transaction(async t => {
        await ajustarStock(material, material_stock_minimo || 0, t);
        material.material_nombre = material_nombre;
        material.material_descripcion = material_descripcion || null;
        material.material_unidad_medida = material_unidad_medida;
        material.material_categoria = material_categoria || null;
        material.material_proveedor_rut = material_proveedor_rut || null;
        await material.save({ fields: ['material_nombre', 'material_descripcion', 'material_unidad_medida', 'material_categoria', 'material_proveedor_rut'], transaction: t });
      });
    } catch (errFifo) {
      if (errFifo instanceof StockInsuficiente) {
        return res.status(400).json({ success: false, error: errFifo.message });
      }
      throw errFifo;
    }
    await material.reload();

    return res.json({ success: true, data: material });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar material' });
  }
}

async function desactivarMaterial(req, res) {
  try {
    const { id } = req.params;
    const material = await Material.findByPk(id);
    if (!material) {
      return res.status(404).json({ success: false, error: 'Material no encontrado' });
    }
    material.material_activo = false;
    await material.save();
    return res.json({ success: true, data: material });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al desactivar material' });
  }
}

// CU 26 / UR-F-29 - Valor del inventario de bodega calculado por FIFO, con los lotes de cada material
async function getValorizacion(req, res) {
  try {
    return res.json({ success: true, data: await valorizarInventario() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al calcular el valor del inventario' });
  }
}

module.exports = { getMateriales, getMaterial, crearMaterial, actualizarMaterial, desactivarMaterial, getValorizacion };
