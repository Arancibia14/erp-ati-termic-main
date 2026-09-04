const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LiquidacionSueldo = sequelize.define('LiquidacionSueldo', {
  liquidacion_sueldo_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  trabajador_rut: { type: DataTypes.STRING(20), allowNull: false },
  liquidacion_sueldo_periodo: { type: DataTypes.STRING(7), allowNull: false },
  liquidacion_sueldo_url_pdf: { type: DataTypes.TEXT, allowNull: false },
  liquidacion_sueldo_fecha_carga: { type: DataTypes.DATEONLY, allowNull: false }
}, {
  tableName: 'LIQUIDACION_SUELDO',
  timestamps: false
});

module.exports = LiquidacionSueldo;
