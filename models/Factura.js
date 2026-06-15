const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Factura = sequelize.define('Factura', {
  factura_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  factura_folio: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  factura_monto_total: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  factura_fecha: { type: DataTypes.DATEONLY, allowNull: false },
  factura_url_pdf: { type: DataTypes.TEXT, allowNull: true },
  orden_compra_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'FACTURA',
  timestamps: false
});

module.exports = Factura;
