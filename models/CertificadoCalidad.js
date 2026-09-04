const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CertificadoCalidad = sequelize.define('CertificadoCalidad', {
  certificado_calidad_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  guia_despacho_id: { type: DataTypes.INTEGER, allowNull: false },
  material_id: { type: DataTypes.INTEGER, allowNull: true },
  certificado_calidad_numero: { type: DataTypes.STRING(100), allowNull: false },
  certificado_calidad_url: { type: DataTypes.TEXT, allowNull: false },
  certificado_calidad_fecha_emision: { type: DataTypes.DATEONLY, allowNull: true },
  certificado_calidad_fecha_carga: { type: DataTypes.DATEONLY, allowNull: false },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: true }
}, {
  tableName: 'CERTIFICADO_CALIDAD',
  timestamps: false
});

module.exports = CertificadoCalidad;
