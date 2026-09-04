const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DevolucionObra = sequelize.define('DevolucionObra', {
  devolucion_obra_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false },
  devolucion_obra_fase: { type: DataTypes.STRING(150), allowNull: true },
  material_id: { type: DataTypes.INTEGER, allowNull: false },
  devolucion_obra_cantidad: { type: DataTypes.INTEGER, allowNull: false },
  devolucion_obra_estado_fisico: { type: DataTypes.STRING(50), allowNull: true },
  devolucion_obra_observacion: { type: DataTypes.TEXT, allowNull: true },
  devolucion_obra_vale: { type: DataTypes.STRING(50), allowNull: true },
  devolucion_obra_fecha: { type: DataTypes.DATEONLY, allowNull: false },
  devolucion_obra_precio_unitario: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  devolucion_obra_monto_rebajado: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: true }
}, {
  tableName: 'DEVOLUCION_OBRA',
  timestamps: false
});

module.exports = DevolucionObra;
