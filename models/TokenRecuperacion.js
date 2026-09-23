const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// CU06 - Token de recuperación de credenciales. El código se guarda con hash
// (igual que las contraseñas): el valor en texto plano solo existe en el
// correo que se le envía al usuario, nunca en la base de datos.
const TokenRecuperacion = sequelize.define('TokenRecuperacion', {
  token_recuperacion_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  token_recuperacion_codigo_hash: { type: DataTypes.STRING(255), allowNull: false },
  token_recuperacion_fecha_expiracion: { type: DataTypes.DATE, allowNull: false },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: false }
}, {
  tableName: 'TOKEN_RECUPERACION',
  timestamps: false
});

module.exports = TokenRecuperacion;
