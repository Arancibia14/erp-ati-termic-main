const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EquipoHVAC = sequelize.define('EquipoHVAC', {
  equipo_hvac_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  equipo_hvac_tipo: { type: DataTypes.STRING(100), allowNull: false },
  equipo_hvac_modelo: { type: DataTypes.STRING(150), allowNull: false },
  equipo_hvac_numero_serie: { type: DataTypes.STRING(100), allowNull: true, unique: true },
  equipo_hvac_estado: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Activo' },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false }
}, {
  tableName: 'EQUIPO_HVAC',
  timestamps: false
});

module.exports = EquipoHVAC;
