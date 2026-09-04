const GuiaDespacho = require('../models/GuiaDespacho');
const OrdenCompra = require('../models/OrdenCompra');
const Material = require('../models/Material');
const Proveedor = require('../models/Proveedor');

// CU31 - Monitoreando materiales en tránsito
async function getEnTransito(req, res) {
  try {
    const { proyecto } = req.query;

    const includeOC = {
      model: OrdenCompra,
      attributes: ['orden_compra_folio', 'proyecto_codigo_correlativo'],
      required: true
    };
    if (proyecto) includeOC.where = { proyecto_codigo_correlativo: proyecto };

    const guias = await GuiaDespacho.findAll({
      where: { guia_despacho_estado: 'En Tránsito' },
      include: [
        includeOC,
        { model: Material, attributes: ['material_nombre', 'material_codigo_sku', 'material_unidad_medida'] },
        { model: Proveedor, attributes: ['proveedor_razon_social'] }
      ],
      order: [['guia_despacho_id', 'DESC']]
    });

    const data = guias.map(g => ({
      guia_despacho_id: g.guia_despacho_id,
      guia_despacho_numero: g.guia_despacho_numero,
      guia_despacho_fecha: g.guia_despacho_fecha,
      proveedor: g.Proveedor?.proveedor_razon_social || '—',
      proyecto_codigo_correlativo: g.OrdenCompra?.proyecto_codigo_correlativo || null,
      orden_compra_folio: g.OrdenCompra?.orden_compra_folio || null,
      material_nombre: g.Material?.material_nombre || `Material #${g.material_id}`,
      material_sku: g.Material?.material_codigo_sku || '',
      unidad: g.Material?.material_unidad_medida || '',
      cantidad: g.guia_despacho_cantidad_recibida
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener los materiales en tránsito' });
  }
}

module.exports = { getEnTransito };
