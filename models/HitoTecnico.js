const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HitoTecnico = sequelize.define('HitoTecnico', {
  hito_tecnico_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  hito_tecnico_nombre_hito: { type: DataTypes.STRING(255), allowNull: false },
  hito_tecnico_avance_fisico: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.00 },
  // CU09 - Fechas estimadas del hito. Son nulas en los hitos creados antes de
  // CU09, que no tenían cronograma.
  hito_tecnico_fecha_inicio_estimada: { type: DataTypes.DATEONLY, allowNull: true },
  hito_tecnico_fecha_termino_estimada: { type: DataTypes.DATEONLY, allowNull: true },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false }
}, {
  tableName: 'HITO_TECNICO',
  timestamps: false
});

module.exports = HitoTecnico;
