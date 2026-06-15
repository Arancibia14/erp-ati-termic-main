const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ControlCambioPpto = sequelize.define('ControlCambioPpto', {
  control_cambio_ppto_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  control_cambio_ppto_fecha: { type: DataTypes.DATEONLY, allowNull: false },
  control_cambio_ppto_monto_anterior: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  control_cambio_ppto_monto_nuevo: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  control_cambio_ppto_motivo: { type: DataTypes.TEXT, allowNull: false },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: false }
}, {
  tableName: 'CONTROL_CAMBIO_PPTO',
  timestamps: false
});

module.exports = ControlCambioPpto;
