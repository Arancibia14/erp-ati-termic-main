const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LogAuditoria = sequelize.define('LogAuditoria', {
  log_auditoria_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  log_auditoria_fecha_hora: { type: DataTypes.DATE, allowNull: false },
  log_auditoria_accion: { type: DataTypes.STRING(255), allowNull: false },
  log_auditoria_modulo: { type: DataTypes.STRING(100), allowNull: false },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: false }
}, {
  tableName: 'LOG_AUDITORIA',
  timestamps: false
});

module.exports = LogAuditoria;
