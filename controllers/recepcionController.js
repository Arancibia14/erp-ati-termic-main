const GuiaDespacho = require('../models/GuiaDespacho');
const Material = require('../models/Material');
const OrdenCompra = require('../models/OrdenCompra');
const Proyecto = require('../models/Proyecto');
const LogAuditoria = require('../models/LogAuditoria');

const RADIO_MAXIMO_METROS = 5000;

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getGuiasPendientes(req, res) {
  try {
    const guias = await GuiaDespacho.findAll({
      where: { guia_despacho_estado: 'En Tránsito' },
      include: [{
        model: OrdenCompra,
        attributes: ['proyecto_codigo_correlativo'],
        include: [{ model: Proyecto, attributes: ['proyecto_latitud', 'proyecto_longitud', 'proyecto_nombre_obra'] }]
      }]
    });
    return res.json({ success: true, data: guias });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener guías pendientes' });
  }
}

async function confirmarRecepcion(req, res) {
  try {
    const { id } = req.params;
    const { latitud_supervisor, longitud_supervisor } = req.body;

    if (!latitud_supervisor || !longitud_supervisor) {
      return res.status(400).json({ success: false, error: 'Coordenadas GPS del supervisor son requeridas' });
    }

    const guia = await GuiaDespacho.findByPk(id, {
      include: [{
        model: OrdenCompra,
        include: [{ model: Proyecto, attributes: ['proyecto_latitud', 'proyecto_longitud'] }]
      }]
    });
    if (!guia) {
      return res.status(404).json({ success: false, error: 'Guía de despacho no encontrada' });
    }

    // Solo se recibe lo que el proveedor ya despachó, y una sola vez
    if (guia.guia_despacho_estado !== 'En Tránsito') {
      return res.status(409).json({
        success: false,
        error: `La guía está en estado "${guia.guia_despacho_estado}"; solo se puede recibir una guía en tránsito`
      });
    }

    const proyecto = guia.OrdenCompra?.Proyecto;
    if (!proyecto?.proyecto_latitud || !proyecto?.proyecto_longitud) {
      return res.status(400).json({ success: false, error: 'El proyecto no tiene coordenadas GPS configuradas. El administrador debe configurarlas en Configuración → Proyectos.' });
    }

    const distancia = calcularDistancia(
      parseFloat(latitud_supervisor),
      parseFloat(longitud_supervisor),
      parseFloat(proyecto.proyecto_latitud),
      parseFloat(proyecto.proyecto_longitud)
    );

    const fueraDeRango = distancia > RADIO_MAXIMO_METROS;
    const ubicacionVerificada = !fueraDeRango;

    // Actualización condicionada al estado: si dos confirmaciones llegan a la
    // vez, solo una encuentra la guía "En Tránsito" y suma el stock.
    const [actualizadas] = await GuiaDespacho.update({
      guia_despacho_estado: 'Recibido',
      guia_despacho_ubicacion_verificada: ubicacionVerificada,
      guia_despacho_latitud_recepcion: parseFloat(latitud_supervisor),
      guia_despacho_longitud_recepcion: parseFloat(longitud_supervisor)
    }, { where: { guia_despacho_id: id, guia_despacho_estado: 'En Tránsito' } });

    if (actualizadas === 0) {
      return res.status(409).json({ success: false, error: 'La guía ya fue recibida' });
    }

    // El material ingresa al inventario al confirmarse la recepción
    const cantidad = guia.guia_despacho_cantidad_recibida || 0;
    if (guia.material_id && cantidad > 0) {
      await Material.increment('material_stock_minimo', { by: cantidad, where: { material_id: guia.material_id } });
    }

    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Recepción de guía ${id} ${ubicacionVerificada ? 'verificada' : 'FUERA DE RANGO'} (distancia: ${Math.round(distancia)}m) — ${cantidad} unidad(es) ingresadas al inventario`,
      log_auditoria_modulo: 'RECEPCION',
      usuario_rut: req.user.rut
    });

    return res.json({
      success: true,
      data: {
        guia_despacho_id: parseInt(id),
        distancia_metros: Math.round(distancia),
        fuera_de_rango: fueraDeRango,
        ubicacion_verificada: ubicacionVerificada
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al confirmar recepción' });
  }
}

module.exports = { getGuiasPendientes, confirmarRecepcion };
