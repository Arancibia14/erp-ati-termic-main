const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModeloHvac = sequelize.define('ModeloHvac', {
  modelo_hvac_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  modelo_hvac_nombre: { type: DataTypes.STRING(255), allowNull: false },
  modelo_hvac_url_ficha: { type: DataTypes.TEXT, allowNull: true },
  modelo_hvac_url_manual: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'MODELO_HVAC',
  timestamps: false
});

module.exports = ModeloHvac;
