const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentoEquipo = sequelize.define('DocumentoEquipo', {
  documento_equipo_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  modelo_hvac_id: { type: DataTypes.INTEGER, allowNull: false },
  documento_equipo_etiqueta: { type: DataTypes.STRING(150), allowNull: false },
  documento_equipo_url: { type: DataTypes.TEXT, allowNull: false },
  documento_equipo_formato: { type: DataTypes.STRING(10), allowNull: true },
  documento_equipo_fecha: { type: DataTypes.DATEONLY, allowNull: true }
}, {
  tableName: 'DOCUMENTO_EQUIPO',
  timestamps: false
});

module.exports = DocumentoEquipo;
