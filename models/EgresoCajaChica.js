const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EgresoCajaChica = sequelize.define('EgresoCajaChica', {
  egreso_caja_chica_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  egreso_caja_chica_monto: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  egreso_caja_chica_fecha: { type: DataTypes.DATEONLY, allowNull: false },
  egreso_caja_chica_concepto: { type: DataTypes.TEXT, allowNull: false },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false }
}, {
  tableName: 'EGRESO_CAJA_CHICA',
  timestamps: false
});

module.exports = EgresoCajaChica;
