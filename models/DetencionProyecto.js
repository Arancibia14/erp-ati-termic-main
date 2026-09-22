const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetencionProyecto = sequelize.define('DetencionProyecto', {
  detencion_proyecto_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  detencion_proyecto_fecha: { type: DataTypes.DATEONLY, allowNull: false },
  detencion_proyecto_motivo: { type: DataTypes.TEXT, allowNull: false },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: false }
}, {
  tableName: 'DETENCION_PROYECTO',
  timestamps: false
});

module.exports = DetencionProyecto;
