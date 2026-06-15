const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SolicitudMaterial = sequelize.define('SolicitudMaterial', {
  solicitud_material_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  solicitud_material_descripcion: { type: DataTypes.TEXT, allowNull: false },
  solicitud_material_cantidad: { type: DataTypes.INTEGER, allowNull: false },
  solicitud_material_estado: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'pendiente' },
  solicitud_material_fecha: { type: DataTypes.DATEONLY, allowNull: false },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: true }
}, {
  tableName: 'SOLICITUD_MATERIAL',
  timestamps: false
});

module.exports = SolicitudMaterial;
