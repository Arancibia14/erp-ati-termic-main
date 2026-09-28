const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Avisos para un usuario que se muestran en Inicio al iniciar sesión.
// CU 17: evidencia rechazada, para el supervisor que la subió.
// CU 57: incidente SSO registrado, para los administradores.
const Notificacion = sequelize.define('Notificacion', {
  notificacion_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_rut: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: { model: 'USUARIO', key: 'usuario_rut' }
  },
  notificacion_tipo: { type: DataTypes.STRING(30), allowNull: false },
  notificacion_titulo: { type: DataTypes.STRING(150), allowNull: false },
  notificacion_mensaje: { type: DataTypes.STRING(500), allowNull: false },
  notificacion_fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  notificacion_leida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: 'NOTIFICACION',
  timestamps: false
});

module.exports = Notificacion;
