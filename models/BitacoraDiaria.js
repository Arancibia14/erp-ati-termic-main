const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BitacoraDiaria = sequelize.define('BitacoraDiaria', {
  bitacora_diaria_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bitacora_diaria_fecha: { type: DataTypes.DATEONLY, allowNull: false },
  bitacora_diaria_descripcion_actividad: { type: DataTypes.TEXT, allowNull: false },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: false },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false }
}, {
  tableName: 'BITACORA_DIARIA',
  timestamps: false
});

module.exports = BitacoraDiaria;
