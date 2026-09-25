const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// CU48 - Una fila por cada tipo ("evento") de correo automático que envía el sistema.
// La clave primaria es el código del evento porque solo puede existir una plantilla vigente por tipo.
const PlantillaCorreo = sequelize.define('PlantillaCorreo', {
  plantilla_correo_evento: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  plantilla_correo_nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  plantilla_correo_asunto: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  plantilla_correo_contenido_html: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  plantilla_correo_contenido_texto: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  plantilla_correo_fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  usuario_rut: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  tableName: 'PLANTILLA_CORREO',
  timestamps: false
});

module.exports = PlantillaCorreo;
