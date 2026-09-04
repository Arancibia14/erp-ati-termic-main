const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CertificadoLaboral = sequelize.define('CertificadoLaboral', {
  certificado_laboral_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false },
  certificado_laboral_periodo: { type: DataTypes.STRING(7), allowNull: false },
  certificado_laboral_url_f30: { type: DataTypes.TEXT, allowNull: true },
  certificado_laboral_url_f30_1: { type: DataTypes.TEXT, allowNull: true },
  certificado_laboral_fecha_carga: { type: DataTypes.DATEONLY, allowNull: false }
}, {
  tableName: 'CERTIFICADO_LABORAL',
  timestamps: false
});

module.exports = CertificadoLaboral;
