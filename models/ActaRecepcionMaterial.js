const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// CU 68 - Materiales usados en la obra, congelados al firmar el acta para
// que una devolución posterior no cambie lo que el cliente recibió.
const ActaRecepcionMaterial = sequelize.define('ActaRecepcionMaterial', {
  acta_recepcion_material_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  acta_recepcion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'ACTA_RECEPCION', key: 'acta_recepcion_id' }
  },
  material_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'MATERIAL', key: 'material_id' }
  },
  acta_recepcion_material_cantidad: { type: DataTypes.DECIMAL(15, 2), allowNull: false }
}, {
  tableName: 'ACTA_RECEPCION_MATERIAL',
  timestamps: false
});

module.exports = ActaRecepcionMaterial;
