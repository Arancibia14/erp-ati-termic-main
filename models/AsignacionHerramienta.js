const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AsignacionHerramienta = sequelize.define('AsignacionHerramienta', {
  asignacion_herramienta_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  herramienta_id: { type: DataTypes.INTEGER, allowNull: false },
  trabajador_rut: { type: DataTypes.STRING(20), allowNull: false },
  asignacion_herramienta_fecha_entrega: { type: DataTypes.DATEONLY, allowNull: false },
  asignacion_herramienta_fecha_devolucion: { type: DataTypes.DATEONLY, allowNull: true },
  asignacion_herramienta_estado_entrega: { type: DataTypes.STRING(120), allowNull: true },
  asignacion_herramienta_estado_devolucion: { type: DataTypes.STRING(120), allowNull: true },
  asignacion_herramienta_usuario_rut: { type: DataTypes.STRING(20), allowNull: true }
}, {
  tableName: 'ASIGNACION_HERRAMIENTA',
  timestamps: false
});

module.exports = AsignacionHerramienta;
