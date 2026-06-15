const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IncidenteSSO = sequelize.define('IncidenteSSO', {
  incidente_sso_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  incidente_sso_descripcion: { type: DataTypes.TEXT, allowNull: false },
  incidente_sso_fecha_hora: { type: DataTypes.DATE, allowNull: false },
  incidente_sso_gravedad: { type: DataTypes.STRING(50), allowNull: false },
  incidente_sso_tipo: { type: DataTypes.STRING(50), allowNull: true },
  incidente_sso_lugar: { type: DataTypes.STRING(255), allowNull: true },
  incidente_sso_url_fotos: { type: DataTypes.TEXT, allowNull: true },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false }
}, {
  tableName: 'INCIDENTE_SSO',
  timestamps: false
});

module.exports = IncidenteSSO;
