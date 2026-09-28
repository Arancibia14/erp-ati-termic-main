const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// CU 15 - Asociando subcontratista a proyecto: una obra puede tener varios
// subcontratistas, cada uno con el rol que cumple en ella.
const ProyectoSubcontratista = sequelize.define('ProyectoSubcontratista', {
  proyecto_subcontratista_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  proyecto_codigo_correlativo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: { model: 'PROYECTO', key: 'proyecto_codigo_correlativo' }
  },
  proveedor_rut: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: { model: 'PROVEEDOR', key: 'proveedor_rut' }
  },
  proyecto_subcontratista_rol: { type: DataTypes.STRING(150), allowNull: false },
  proyecto_subcontratista_fecha: { type: DataTypes.DATEONLY, allowNull: false }
}, {
  tableName: 'PROYECTO_SUBCONTRATISTA',
  timestamps: false,
  indexes: [{ name: 'uq_proyecto_subcontratista', unique: true, fields: ['proyecto_codigo_correlativo', 'proveedor_rut'] }]
});

module.exports = ProyectoSubcontratista;
