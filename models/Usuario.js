const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  usuario_rut: { type: DataTypes.STRING(20), primaryKey: true },
  usuario_nombre: { type: DataTypes.STRING(100), allowNull: false },
  usuario_correo_institucional: { type: DataTypes.STRING(150), allowNull: false },
  usuario_password_hash: { type: DataTypes.STRING(255), allowNull: false }
}, {
  tableName: 'USUARIO',
  timestamps: false
});

module.exports = Usuario;
