// CU 26 / UR-F-29 - Valoración del inventario por el método FIFO.
// Toda entrada a bodega crea un lote y toda salida consume primero los lotes más
// antiguos. El stock del material sigue siendo el total y siempre calza con la
// suma de lo disponible en sus lotes.
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Material = require('../models/Material');
const LoteMaterial = require('../models/LoteMaterial');

const num = v => parseFloat(v) || 0;
const redondear = v => Math.round(v * 100) / 100;

class StockInsuficiente extends Error {
  constructor(material, disponible) {
    super(`No hay unidades suficientes de "${material.material_nombre}" (disponible: ${disponible})`);
    this.disponible = disponible;
  }
}

// Entrada: crea un lote y suma la cantidad al stock del material
async function ingresarLote({ material_id, cantidad, costo_unitario = 0, origen, guia_despacho_id = null, devolucion_obra_id = null }, transaction) {
  const cant = num(cantidad);
  if (cant <= 0) return null;
  const lote = await LoteMaterial.create({
    material_id,
    lote_material_fecha_ingreso: new Date(),
    lote_material_origen: origen,
    lote_material_cantidad_inicial: cant,
    lote_material_cantidad_disponible: cant,
    lote_material_costo_unitario: redondear(num(costo_unitario)),
    guia_despacho_id,
    devolucion_obra_id
  }, { transaction });
  await Material.increment('material_stock_minimo', { by: cant, where: { material_id }, transaction });
  return lote;
}

// Salida: descuenta la cantidad consumiendo primero los lotes más antiguos.
// Devuelve el costo FIFO de lo que salió. Debe llamarse dentro de una transacción.
async function consumirFifo(material, cantidad, transaction) {
  let pendiente = num(cantidad);
  const lotes = await LoteMaterial.findAll({
    where: { material_id: material.material_id, lote_material_cantidad_disponible: { [Op.gt]: 0 } },
    order: [['lote_material_fecha_ingreso', 'ASC'], ['lote_material_id', 'ASC']],
    lock: transaction.LOCK.UPDATE,
    transaction
  });
  const disponible = lotes.reduce((s, l) => s + num(l.lote_material_cantidad_disponible), 0);
  if (pendiente > disponible) throw new StockInsuficiente(material, disponible);

  let costo = 0;
  for (const lote of lotes) {
    if (pendiente <= 0) break;
    const saca = Math.min(pendiente, num(lote.lote_material_cantidad_disponible));
    lote.lote_material_cantidad_disponible = redondear(num(lote.lote_material_cantidad_disponible) - saca);
    await lote.save({ transaction });
    costo += saca * num(lote.lote_material_costo_unitario);
    pendiente = redondear(pendiente - saca);
  }
  await Material.decrement('material_stock_minimo', { by: num(cantidad), where: { material_id: material.material_id }, transaction });
  return redondear(costo);
}

// Edición manual del stock en el catálogo: la diferencia entra como lote de
// ajuste con costo 0 o sale por FIFO
async function ajustarStock(material, nuevoStock, transaction) {
  const diferencia = redondear(num(nuevoStock) - num(material.material_stock_minimo));
  if (diferencia > 0) await ingresarLote({ material_id: material.material_id, cantidad: diferencia, origen: 'Ajuste de catálogo' }, transaction);
  else if (diferencia < 0) await consumirFifo(material, -diferencia, transaction);
}

// Valor del inventario de cada material: suma de lo disponible por su costo
async function valorizarInventario() {
  const materiales = await Material.findAll({ where: { material_activo: true }, order: [['material_nombre', 'ASC']] });
  const lotes = await LoteMaterial.findAll({ order: [['lote_material_fecha_ingreso', 'ASC'], ['lote_material_id', 'ASC']] });
  const porMaterial = {};
  lotes.forEach(l => { (porMaterial[l.material_id] = porMaterial[l.material_id] || []).push(l); });
  let total = 0;
  const data = materiales.map(m => {
    const propios = porMaterial[m.material_id] || [];
    const valor = redondear(propios.reduce((s, l) => s + num(l.lote_material_cantidad_disponible) * num(l.lote_material_costo_unitario), 0));
    total += valor;
    return {
      material_id: m.material_id,
      material_nombre: m.material_nombre,
      stock: num(m.material_stock_minimo),
      valor_fifo: valor,
      lotes: propios.map(l => ({
        lote_material_id: l.lote_material_id,
        fecha_ingreso: l.lote_material_fecha_ingreso,
        origen: l.lote_material_origen,
        cantidad_inicial: num(l.lote_material_cantidad_inicial),
        cantidad_disponible: num(l.lote_material_cantidad_disponible),
        costo_unitario: num(l.lote_material_costo_unitario)
      }))
    };
  });
  return { materiales: data, valor_total: redondear(total) };
}

// Migración: el stock que existía antes del FIFO queda como un lote "Stock inicial"
// con costo 0. Solo se aplica a materiales con stock que aún no tienen lotes.
async function crearLotesIniciales() {
  const [filas] = await sequelize.query(
    'SELECT m.material_id, m.material_stock_actual AS stock FROM MATERIAL m ' +
    'WHERE m.material_stock_actual > 0 AND NOT EXISTS (SELECT 1 FROM LOTE_MATERIAL l WHERE l.material_id = m.material_id)'
  );
  for (const f of filas) {
    await LoteMaterial.create({
      material_id: f.material_id,
      lote_material_fecha_ingreso: new Date(),
      lote_material_origen: 'Stock inicial',
      lote_material_cantidad_inicial: num(f.stock),
      lote_material_cantidad_disponible: num(f.stock),
      lote_material_costo_unitario: 0
    });
  }
  if (filas.length) console.log(`FIFO: ${filas.length} material(es) con stock previo quedaron como lote "Stock inicial".`);
}

module.exports = { StockInsuficiente, ingresarLote, consumirFifo, ajustarStock, valorizarInventario, crearLotesIniciales };
