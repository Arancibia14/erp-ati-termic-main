const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trabajador = sequelize.define('Trabajador', {
  trabajador_rut: { type: DataTypes.STRING(20), primaryKey: true },
  trabajador_telefono: { type: DataTypes.STRING(20), allowNull: true },
  trabajador_nombres: { type: DataTypes.STRING(150), allowNull: false },
  trabajador_apellidos: { type: DataTypes.STRING(150), allowNull: true },
  trabajador_correo: { type: DataTypes.STRING(150), allowNull: true },
  especialidad_id: { type: DataTypes.INTEGER, allowNull: false },
  trabajador_activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: true }
}, {
  tableName: 'TRABAJADOR',
  timestamps: false
});

module.exports = Trabajador;
