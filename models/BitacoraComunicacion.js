const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BitacoraComunicacion = sequelize.define('BitacoraComunicacion', {
  bitacora_comunicacion_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bitacora_comunicacion_descripcion: { type: DataTypes.TEXT, allowNull: false },
  bitacora_comunicacion_fecha: { type: DataTypes.DATEONLY, allowNull: false },
  bitacora_comunicacion_tipo: { type: DataTypes.STRING(100), allowNull: false },
  bitacora_comunicacion_participantes: { type: DataTypes.TEXT, allowNull: true },
  bitacora_comunicacion_url_adjunto: { type: DataTypes.TEXT, allowNull: true },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: false }
}, {
  tableName: 'BITACORA_COMUNICACION',
  timestamps: false
});

module.exports = BitacoraComunicacion;
