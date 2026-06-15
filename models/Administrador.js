const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Administrador = sequelize.define('Administrador', {
  administrador_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  administrador_nivel_acceso: { type: DataTypes.STRING(50), allowNull: false },
  administrador_fecha_asignacion: { type: DataTypes.DATE, allowNull: false },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: false }
}, {
  tableName: 'ADMINISTRADOR',
  timestamps: false
});

module.exports = Administrador;
