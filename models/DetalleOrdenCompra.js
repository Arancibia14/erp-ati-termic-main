const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetalleOrdenCompra = sequelize.define('DetalleOrdenCompra', {
  detalle_orden_compra_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  detalle_orden_compra_descripcion_material: { type: DataTypes.STRING(255), allowNull: false },
  detalle_orden_compra_cantidad: { type: DataTypes.INTEGER, allowNull: false },
  detalle_orden_compra_precio_unitario: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  orden_compra_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'DETALLE_ORDEN_COMPRA',
  timestamps: false
});

module.exports = DetalleOrdenCompra;
