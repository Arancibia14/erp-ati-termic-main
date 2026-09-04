const DevolucionObra = require('../models/DevolucionObra');
const GuiaDespacho = require('../models/GuiaDespacho');
const OrdenCompra = require('../models/OrdenCompra');
const DetalleOrdenCompra = require('../models/DetalleOrdenCompra');
const Material = require('../models/Material');
const LogAuditoria = require('../models/LogAuditoria');

const ESTADOS_DANIO = ['Dañado', 'Defectuoso'];

async function guiasDelProyecto(proyecto, materialId) {
  const where = {};
  if (materialId) where.material_id = materialId;
  return GuiaDespacho.findAll({
    where,
    include: [{
      model: OrdenCompra,
      attributes: ['proyecto_codigo_correlativo'],
      where: { proyecto_codigo_correlativo: proyecto },
      required: true
    }]
  });
}

// Materiales que fueron despachados a un proyecto (para el selector)
async function getMaterialesDespachados(req, res) {
  try {
    const { proyecto } = req.query;
    if (!proyecto) return res.status(400).json({ success: false, error: 'Proyecto requerido' });

    const guias = await guiasDelProyecto(proyecto, null);
    const ids = [...new Set(guias.map(g => g.material_id).filter(Boolean))];
    const materiales = ids.length ? await Material.findAll({ where: { material_id: ids } }) : [];
    return res.json({ success: true, data: materiales });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener los materiales despachados' });
  }
}

// Cantidad despachada / ya devuelta / disponible para devolver
async function getDespachado(req, res) {
  try {
    const { proyecto, material } = req.query;
    if (!proyecto || !material) {
      return res.status(400).json({ success: false, error: 'Proyecto y material son requeridos' });
    }

    const guias = await guiasDelProyecto(proyecto, material);
    const despachado = guias.reduce((acc, g) => acc + (g.guia_despacho_cantidad_recibida || 0), 0);

    const devoluciones = await DevolucionObra.findAll({
      where: { proyecto_codigo_correlativo: proyecto, material_id: material }
    });
    const yaDevuelto = devoluciones.reduce((acc, d) => acc + (d.devolucion_obra_cantidad || 0), 0);

    return res.json({
      success: true,
      data: { despachado, ya_devuelto: yaDevuelto, disponible: Math.max(despachado - yaDevuelto, 0) }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al calcular la cantidad despachada' });
  }
}

// CU NUEVO 4 (extensión CU32) - Precio unitario de referencia del material en la OC del proyecto
async function precioUnitarioReferencia(proyecto, materialId) {
  const detalles = await DetalleOrdenCompra.findAll({
    where: { material_id: materialId },
    include: [{
      model: OrdenCompra,
      attributes: [],
      where: { proyecto_codigo_correlativo: proyecto },
      required: true
    }],
    order: [['detalle_orden_compra_id', 'DESC']]
  });
  if (!detalles.length) return 0;
  return parseFloat(detalles[0].detalle_orden_compra_precio_unitario) || 0;
}

// CU32 - Registrando reingreso de materiales sobrantes
async function registrarReingreso(req, res) {
  try {
    const { proyecto, fase, material_id, cantidad, estado_fisico, observacion } = req.body;

    if (!proyecto || !material_id || !cantidad || !estado_fisico) {
      return res.status(400).json({ success: false, error: 'Proyecto, material, cantidad y estado físico son obligatorios' });
    }

    const cant = parseInt(cantidad);
    if (!cant || cant <= 0) {
      return res.status(400).json({ success: false, error: 'La cantidad sobrante debe ser mayor a cero' });
    }

    const material = await Material.findByPk(material_id);
    if (!material) {
      return res.status(404).json({ success: false, error: 'Material no encontrado' });
    }

    const guias = await guiasDelProyecto(proyecto, material_id);
    const despachado = guias.reduce((acc, g) => acc + (g.guia_despacho_cantidad_recibida || 0), 0);
    const devoluciones = await DevolucionObra.findAll({
      where: { proyecto_codigo_correlativo: proyecto, material_id }
    });
    const yaDevuelto = devoluciones.reduce((acc, d) => acc + (d.devolucion_obra_cantidad || 0), 0);
    const disponible = despachado - yaDevuelto;

    if (cant > disponible) {
      // Excepción 1: Exceso de devolución
      return res.status(409).json({
        success: false,
        error: `La cantidad a devolver (${cant}) supera lo despachado a la obra (disponible: ${Math.max(disponible, 0)}).`
      });
    }

    if (ESTADOS_DANIO.includes(estado_fisico) && (!observacion || !observacion.trim())) {
      // Excepción 2: Material dañado
      return res.status(400).json({
        success: false,
        error: 'El material se registró como dañado: la observación es obligatoria.'
      });
    }

    const precioUnitario = await precioUnitarioReferencia(proyecto, material_id);
    const montoRebajado = precioUnitario * cant;

    const vale = `VALE-${Date.now()}`;
    const devolucion = await DevolucionObra.create({
      proyecto_codigo_correlativo: proyecto,
      devolucion_obra_fase: fase || null,
      material_id,
      devolucion_obra_cantidad: cant,
      devolucion_obra_estado_fisico: estado_fisico,
      devolucion_obra_observacion: observacion ? observacion.trim() : null,
      devolucion_obra_vale: vale,
      devolucion_obra_fecha: new Date().toISOString().split('T')[0],
      devolucion_obra_precio_unitario: precioUnitario,
      devolucion_obra_monto_rebajado: montoRebajado,
      usuario_rut: req.user.rut
    });

    // Actualiza el stock central
    material.material_stock_minimo = (material.material_stock_minimo || 0) + cant;
    await material.save();

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Reingreso de ${cant} ${material.material_unidad_medida} de ${material.material_nombre} desde obra ${proyecto} (vale ${vale})${montoRebajado > 0 ? ` — costo de obra rebajado en $${montoRebajado.toLocaleString('es-CL')}` : ''}`,
        log_auditoria_modulo: 'DEVOLUCION_OBRA',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({
      success: true,
      data: { mensaje: 'Reingreso procesado exitosamente', vale, devolucion, monto_rebajado: montoRebajado }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar el reingreso' });
  }
}

async function getHistorial(req, res) {
  try {
    const { proyecto } = req.query;
    const where = {};
    if (proyecto) where.proyecto_codigo_correlativo = proyecto;

    const devoluciones = await DevolucionObra.findAll({
      where,
      order: [['devolucion_obra_id', 'DESC']]
    });

    const ids = [...new Set(devoluciones.map(d => d.material_id))];
    const materiales = ids.length ? await Material.findAll({ where: { material_id: ids } }) : [];
    const mapa = {};
    materiales.forEach(m => { mapa[m.material_id] = m; });

    const data = devoluciones.map(d => ({
      ...d.toJSON(),
      material_nombre: mapa[d.material_id]?.material_nombre || `Material #${d.material_id}`,
      unidad: mapa[d.material_id]?.material_unidad_medida || ''
    }));
    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener el historial de reingresos' });
  }
}

module.exports = { getMaterialesDespachados, getDespachado, registrarReingreso, getHistorial };
