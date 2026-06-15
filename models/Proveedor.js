const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
  proveedor_rut: { type: DataTypes.STRING(20), primaryKey: true },
  proveedor_razon_social: { type: DataTypes.STRING(255), allowNull: false },
  proveedor_correo: { type: DataTypes.STRING(150), allowNull: false },
  proveedor_telefono: { type: DataTypes.STRING(20), allowNull: true }
}, {
  tableName: 'PROVEEDOR',
  timestamps: false
});

module.exports = Proveedor;
