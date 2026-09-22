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
  // CU08 - Tipo de sistema de climatización declarado al crear la obra.
  // Nullable porque las obras creadas antes de CU08 no lo tienen registrado.
  proyecto_tipo_sistema: { type: DataTypes.STRING(100), allowNull: true },
  proyecto_ubicacion: { type: DataTypes.STRING(255), allowNull: true },
  proyecto_latitud: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  proyecto_longitud: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  // Plazo de la obra: Control de Costos reparte el presupuesto planificado en sus meses
  proyecto_fecha_inicio: { type: DataTypes.DATEONLY, allowNull: true },
  proyecto_fecha_termino: { type: DataTypes.DATEONLY, allowNull: true },
  // Fondo de caja chica (CU 39): lo asigna el administrador y los egresos se
  // descuentan de él, no del presupuesto completo de la obra
  proyecto_presupuesto_caja_chica: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 }
}, {
  tableName: 'PROYECTO',
  timestamps: false
});

module.exports = Proyecto;
