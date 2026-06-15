const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContratoLaboral = sequelize.define('ContratoLaboral', {
  contrato_laboral_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  contrato_laboral_sueldo_base: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  contrato_laboral_leyes_sociales: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
  contrato_laboral_fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  contrato_laboral_fecha_termino: { type: DataTypes.DATEONLY, allowNull: true },
  trabajador_rut: { type: DataTypes.STRING(20), allowNull: false },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: true }
}, {
  tableName: 'CONTRATO_LABORAL',
  timestamps: false
});

module.exports = ContratoLaboral;
