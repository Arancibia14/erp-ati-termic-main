const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentoLegal = sequelize.define('DocumentoLegal', {
  documento_legal_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  documento_legal_tipo: { type: DataTypes.STRING(100), allowNull: false },
  documento_legal_url_pdf: { type: DataTypes.TEXT, allowNull: false },
  documento_legal_fecha_emision: { type: DataTypes.DATEONLY, allowNull: false },
  documento_legal_fecha_vencimiento: { type: DataTypes.DATEONLY, allowNull: true },
  documento_legal_estado: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Vigente' },
  trabajador_rut: { type: DataTypes.STRING(20), allowNull: true },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false }
}, {
  tableName: 'DOCUMENTO_LEGAL',
  timestamps: false
});

module.exports = DocumentoLegal;
