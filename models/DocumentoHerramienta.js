const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentoHerramienta = sequelize.define('DocumentoHerramienta', {
  documento_herramienta_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  herramienta_id: { type: DataTypes.INTEGER, allowNull: false },
  documento_herramienta_etiqueta: { type: DataTypes.STRING(150), allowNull: false },
  documento_herramienta_url: { type: DataTypes.TEXT, allowNull: false },
  documento_herramienta_formato: { type: DataTypes.STRING(10), allowNull: true },
  documento_herramienta_fecha: { type: DataTypes.DATEONLY, allowNull: true }
}, {
  tableName: 'DOCUMENTO_HERRAMIENTA',
  timestamps: false
});

module.exports = DocumentoHerramienta;
