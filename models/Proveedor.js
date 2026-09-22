const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
  proveedor_rut: { type: DataTypes.STRING(20), primaryKey: true },
  proveedor_razon_social: { type: DataTypes.STRING(255), allowNull: false },
  // CU34 - El correo y el teléfono son datos de contacto opcionales
  proveedor_correo: { type: DataTypes.STRING(150), allowNull: true },
  proveedor_telefono: { type: DataTypes.STRING(20), allowNull: true },
  // CU34 paso 10 - Un proveedor dado de baja deja de ofrecerse, pero se conserva
  // para no romper las órdenes de compra y guías que ya lo referencian.
  proveedor_activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'PROVEEDOR',
  timestamps: false
});

module.exports = Proveedor;
