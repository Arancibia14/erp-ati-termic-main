const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// CU05 - Registro de sesiones activas para detectar inactividad. El estado
// "activa" se degrada a "expirada" (por inactividad) o "cerrada" (logout).
const Sesion = sequelize.define('Sesion', {
  sesion_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sesion_fecha_inicio: { type: DataTypes.DATE, allowNull: false },
  sesion_ultima_actividad: { type: DataTypes.DATE, allowNull: false },
  sesion_estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'activa' },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: false }
}, {
  tableName: 'SESION',
  timestamps: false
});

module.exports = Sesion;
