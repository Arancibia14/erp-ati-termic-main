const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EgresoCajaChica = sequelize.define('EgresoCajaChica', {
  egreso_caja_chica_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  egreso_caja_chica_monto: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  egreso_caja_chica_fecha: { type: DataTypes.DATEONLY, allowNull: false },
  egreso_caja_chica_concepto: { type: DataTypes.TEXT, allowNull: false },
  proyecto_codigo_correlativo: { type: DataTypes.STRING(50), allowNull: false },
  // Quién registró el egreso. Es opcional porque los egresos anteriores a esta
  // columna no lo tienen; los nuevos lo guardan siempre.
  usuario_rut: { type: DataTypes.STRING(20), allowNull: true },
  // CU53 - Desglose del egreso: egreso_caja_chica_monto es el total descontado del
  // saldo. Los egresos anteriores a este CU no tienen desglose.
  egreso_caja_chica_monto_neto: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
  egreso_caja_chica_iva_porcentaje: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  // CU40 - Foto o PDF de la boleta. Una vez guardado no se reemplaza (respaldo inmutable)
  egreso_caja_chica_url_comprobante: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'EGRESO_CAJA_CHICA',
  timestamps: false
});

module.exports = EgresoCajaChica;
