const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GuiaDespacho = sequelize.define('GuiaDespacho', {
  guia_despacho_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  guia_despacho_numero: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  guia_despacho_fecha: { type: DataTypes.DATEONLY, allowNull: false },
  guia_despacho_estado: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Pendiente' },
  guia_despacho_ubicacion_verificada: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  guia_despacho_latitud_recepcion: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  guia_despacho_longitud_recepcion: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  orden_compra_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'GUIA_DESPACHO',
  timestamps: false
});

module.exports = GuiaDespacho;
