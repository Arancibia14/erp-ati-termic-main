const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ParametroSistema = sequelize.define('ParametroSistema', {
  parametro_sistema_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  parametro_sistema_clave: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  parametro_sistema_valor: { type: DataTypes.STRING(255), allowNull: false },
  parametro_sistema_descripcion: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'PARAMETRO_SISTEMA',
  timestamps: false
});

module.exports = ParametroSistema;
