const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EstadoProyecto = sequelize.define('EstadoProyecto', {
  estado_proyecto_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  estado_proyecto_nombre: { type: DataTypes.STRING(100), allowNull: false }
}, {
  tableName: 'ESTADO_PROYECTO',
  timestamps: false
});

module.exports = EstadoProyecto;
