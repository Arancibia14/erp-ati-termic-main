const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Accidente = sequelize.define('Accidente', {
  accidente_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  accidente_dias_perdidos: { type: DataTypes.INTEGER, allowNull: false },
  accidente_riesgo_potencial: { type: DataTypes.TEXT, allowNull: false },
  incidente_sso_id: { type: DataTypes.INTEGER, allowNull: false },
  trabajador_rut: { type: DataTypes.STRING(20), allowNull: false },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false }
}, {
  tableName: 'ACCIDENTE',
  timestamps: false
});

module.exports = Accidente;
