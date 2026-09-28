const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EvidenciaFotografica = sequelize.define('EvidenciaFotografica', {
  evidencia_fotografica_nro: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  evidencia_fotografica_url_foto: { type: DataTypes.TEXT, allowNull: false },
  evidencia_fotografica_fecha_captura: { type: DataTypes.DATE, allowNull: false },
  evidencia_fotografica_latitud: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
  evidencia_fotografica_longitud: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
  evidencia_fotografica_estado_aprobacion: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'pendiente' },
  hito_tecnico_id: { type: DataTypes.INTEGER, allowNull: false },
  // CU 17 - Supervisor que subió la foto, a quien se le notifica si se rechaza
  evidencia_fotografica_usuario_rut: { type: DataTypes.STRING(20), allowNull: true }
}, {
  tableName: 'EVIDENCIA_FOTOGRAFICA',
  timestamps: false
});

module.exports = EvidenciaFotografica;
