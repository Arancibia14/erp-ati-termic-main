const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { fechaHoy } = require('../utils/fecha');

// La tabla real usa la clave del parámetro como llave primaria y guarda el valor
// como decimal. Los nombres de atributo se mantienen mapeados con `field` para no
// romper a quienes ya consultan por parametro_sistema_clave / _valor.
const ParametroSistema = sequelize.define('ParametroSistema', {
  parametro_sistema_clave: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    field: 'parametro_sistema_clave_parametro'
  },
  parametro_sistema_valor: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'parametro_sistema_valor_numerico'
  },
  parametro_sistema_fecha_vigencia: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: () => fechaHoy()
  }
}, {
  tableName: 'PARAMETRO_SISTEMA',
  timestamps: false
});

module.exports = ParametroSistema;
