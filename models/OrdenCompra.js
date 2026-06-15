const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrdenCompra = sequelize.define('OrdenCompra', {
  orden_compra_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orden_compra_folio: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  orden_compra_fecha: { type: DataTypes.DATEONLY, allowNull: false },
  orden_compra_estado: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Pendiente' },
  proveedor_rut: { type: DataTypes.STRING(20), allowNull: false },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false },
  solicitud_material_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'ORDEN_COMPRA',
  timestamps: false
});

module.exports = OrdenCompra;
