const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proyecto = sequelize.define('Proyecto', {
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), primaryKey: true },
  proyecto_nombre_obra: { type: DataTypes.STRING(255), allowNull: false },
  proyecto_porcentaje_avance: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.00 },
  proyecto_presupuesto_asignado: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  proyecto_correo_contacto: { type: DataTypes.STRING(150), allowNull: false },
  estado_proyecto_id: { type: DataTypes.INTEGER, allowNull: false },
  proveedor_rut: { type: DataTypes.STRING(20), allowNull: true },
  proyecto_descripcion_tecnica: { type: DataTypes.TEXT, allowNull: true },
  proyecto_ubicacion: { type: DataTypes.STRING(255), allowNull: true },
  proyecto_latitud: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  proyecto_longitud: { type: DataTypes.DECIMAL(10, 7), allowNull: true }
}, {
  tableName: 'PROYECTO',
  timestamps: false
});

module.exports = Proyecto;
