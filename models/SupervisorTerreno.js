const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupervisorTerreno = sequelize.define('SupervisorTerreno', {
  supervisor_terreno_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  supervisor_terreno_registro_certificacion: { type: DataTypes.STRING(100), allowNull: false },
  supervisor_terreno_telefono_emergencia: { type: DataTypes.STRING(20), allowNull: false },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: false }
}, {
  tableName: 'SUPERVISOR_TERRENO',
  timestamps: false
});

module.exports = SupervisorTerreno;
