const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Herramienta = sequelize.define('Herramienta', {
  herramienta_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  herramienta_codigo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  herramienta_nombre: { type: DataTypes.STRING(150), allowNull: false },
  herramienta_estado: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Disponible' },
  herramienta_tecnico_rut: { type: DataTypes.STRING(20), allowNull: true }
}, {
  tableName: 'HERRAMIENTA',
  timestamps: false
});

module.exports = Herramienta;
