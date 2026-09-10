const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// El número de serie es la llave primaria real; el modelo del equipo vive en
// MODELO_HVAC y se referencia por modelo_hvac_id.
const EquipoHVAC = sequelize.define('EquipoHVAC', {
  equipo_hvac_numero_serie: { type: DataTypes.STRING(100), primaryKey: true },
  equipo_hvac_fecha_instalacion: { type: DataTypes.DATEONLY, allowNull: false },
  equipo_hvac_estado_operativo: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Operativo' },
  modelo_hvac_id: { type: DataTypes.INTEGER, allowNull: false },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false }
}, {
  tableName: 'EQUIPO_HVAC',
  timestamps: false
});

module.exports = EquipoHVAC;
