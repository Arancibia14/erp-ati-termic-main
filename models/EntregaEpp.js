const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EntregaEpp = sequelize.define('EntregaEpp', {
  entrega_epp_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  entrega_epp_cantidad: { type: DataTypes.INTEGER, allowNull: false },
  entrega_epp_fecha: { type: DataTypes.DATEONLY, allowNull: false },
  entrega_epp_estado: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Pendiente' },
  entrega_epp_lote: { type: DataTypes.STRING(50), allowNull: true },
  entrega_epp_firma: { type: DataTypes.TEXT('long'), allowNull: true },
  entrega_epp_fecha_hora_validacion: { type: DataTypes.DATE, allowNull: true },
  entrega_epp_url_comprobante: { type: DataTypes.TEXT, allowNull: true },
  material_id: { type: DataTypes.INTEGER, allowNull: false },
  trabajador_rut: { type: DataTypes.STRING(20), allowNull: false },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: false }
}, {
  tableName: 'ENTREGA_EPP',
  timestamps: false
});

module.exports = EntregaEpp;
