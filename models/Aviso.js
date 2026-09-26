const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// CU 46 - Gestionando avisos temporales (módulo "Avisos Internos")
const Aviso = sequelize.define('Aviso', {
  aviso_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  aviso_titulo: { type: DataTypes.STRING(100), allowNull: false },
  aviso_texto: { type: DataTypes.STRING(500), allowNull: false },
  aviso_url_imagen: { type: DataTypes.TEXT, allowNull: true },
  // "Borrador" o "Listo para publicar"
  aviso_estado: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Borrador' },
  aviso_fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  aviso_fecha_termino: { type: DataTypes.DATEONLY, allowNull: false },
  aviso_fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  usuario_rut: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: { model: 'USUARIO', key: 'usuario_rut' }
  }
}, {
  tableName: 'AVISO',
  timestamps: false
});

module.exports = Aviso;
