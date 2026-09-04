const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  material_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  material_codigo_sku: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  material_nombre: { type: DataTypes.STRING(255), allowNull: false },
  material_descripcion: { type: DataTypes.TEXT, allowNull: true },
  material_unidad_medida: { type: DataTypes.STRING(50), allowNull: false },
  material_categoria: { type: DataTypes.STRING(100), allowNull: true },
  material_stock_minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  material_activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  material_proveedor_rut: { type: DataTypes.STRING(20), allowNull: true }
}, {
  tableName: 'MATERIAL',
  timestamps: false
});

module.exports = Material;
