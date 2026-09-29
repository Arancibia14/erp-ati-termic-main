const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// CU 26 / UR-F-29 - Lote de inventario de un material. Cada ingreso a bodega crea
// un lote con su costo unitario; las salidas consumen primero el lote más antiguo
// (FIFO) y el valor del inventario es la suma de lo disponible por su costo.
const LoteMaterial = sequelize.define('LoteMaterial', {
  lote_material_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  material_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'MATERIAL', key: 'material_id' }
  },
  lote_material_fecha_ingreso: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  // "Recepción en obra", "Devolución de obra", "Stock inicial" o "Ajuste de catálogo"
  lote_material_origen: { type: DataTypes.STRING(40), allowNull: false },
  lote_material_cantidad_inicial: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  lote_material_cantidad_disponible: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  lote_material_costo_unitario: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  guia_despacho_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'GUIA_DESPACHO', key: 'guia_despacho_id' }
  },
  devolucion_obra_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'DEVOLUCION_OBRA', key: 'devolucion_obra_id' }
  }
}, {
  tableName: 'LOTE_MATERIAL',
  timestamps: false
});

module.exports = LoteMaterial;
