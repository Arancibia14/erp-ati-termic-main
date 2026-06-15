const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Especialidad = sequelize.define('Especialidad', {
  especialidad_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  especialidad_nombre: { type: DataTypes.STRING(100), allowNull: false }
}, {
  tableName: 'ESPECIALIDAD',
  timestamps: false
});

module.exports = Especialidad;
