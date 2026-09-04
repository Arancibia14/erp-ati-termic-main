const Material = require('../models/Material');
const Proveedor = require('../models/Proveedor');
const LogAuditoria = require('../models/LogAuditoria');

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

    const material = await Material.create({
      material_codigo_sku,
      material_nombre,
      material_descripcion: material_descripcion || null,
      material_unidad_medida,
      material_categoria: material_categoria || null,
      material_stock_minimo: material_stock_minimo || 0,
      material_proveedor_rut: material_proveedor_rut || null
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

    material.material_nombre = material_nombre;
    material.material_descripcion = material_descripcion || null;
    material.material_unidad_medida = material_unidad_medida;
    material.material_categoria = material_categoria || null;
    material.material_stock_minimo = material_stock_minimo || 0;
    material.material_proveedor_rut = material_proveedor_rut || null;
    await material.save();

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

module.exports = { getMateriales, getMaterial, crearMaterial, actualizarMaterial, desactivarMaterial };
