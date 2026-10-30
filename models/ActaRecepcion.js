const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// CU 68 - Acta de recepción final de obra firmada por el cliente.
// Su fecha marca el inicio de la garantía de los equipos de la obra.
const ActaRecepcion = sequelize.define('ActaRecepcion', {
  acta_recepcion_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  proyecto_codigo_correlativo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: { model: 'PROYECTO', key: 'proyecto_codigo_correlativo' }
  },
  acta_recepcion_fecha_hora: { type: DataTypes.DATE, allowNull: false },
  acta_recepcion_cliente_nombre: { type: DataTypes.STRING(150), allowNull: false },
  acta_recepcion_cliente_rut: { type: DataTypes.STRING(20), allowNull: false },
  acta_recepcion_cliente_cargo: { type: DataTypes.STRING(100), allowNull: false },
  acta_recepcion_cliente_correo: { type: DataTypes.STRING(150), allowNull: false },
  acta_recepcion_trabajos: { type: DataTypes.TEXT, allowNull: false },
  acta_recepcion_conformidad: { type: DataTypes.STRING(50), allowNull: false },
  acta_recepcion_observaciones: { type: DataTypes.TEXT, allowNull: true },
  acta_recepcion_firma_cliente: { type: DataTypes.TEXT('long'), allowNull: false },
  acta_recepcion_url_pdf: { type: DataTypes.TEXT, allowNull: true },
  acta_recepcion_estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Firmada' },
  acta_recepcion_motivo_anulacion: { type: DataTypes.TEXT, allowNull: true },
  acta_recepcion_fecha_anulacion: { type: DataTypes.DATE, allowNull: true },
  usuario_rut: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: { model: 'USUARIO', key: 'usuario_rut' }
  }
}, {
  tableName: 'ACTA_RECEPCION',
  timestamps: false
});

module.exports = ActaRecepcion;
