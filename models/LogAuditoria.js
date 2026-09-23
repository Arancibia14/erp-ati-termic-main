const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');
const { calcularHashLog } = require('../utils/integridadLog');

const LogAuditoria = sequelize.define('LogAuditoria', {
  log_auditoria_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  log_auditoria_fecha_hora: { type: DataTypes.DATE, allowNull: false },
  log_auditoria_accion: { type: DataTypes.STRING(255), allowNull: false },
  log_auditoria_modulo: { type: DataTypes.STRING(100), allowNull: false },
  usuario_rut: { type: DataTypes.STRING(20), allowNull: false },
  // CU04 - Nulable: los logs escritos antes de este CU no tienen hash y quedan
  // marcados como "sin verificar" en vez de "alterados".
  log_auditoria_hash: { type: DataTypes.STRING(64), allowNull: true }
}, {
  tableName: 'LOG_AUDITORIA',
  timestamps: false,
  hooks: {
    // El id lo asigna MySQL al insertar, así que el hash (que lo incluye) se
    // calcula después de crear la fila, con un UPDATE aparte. Así ningún
    // controlador que ya llama a LogAuditoria.create tiene que cambiar.
    async afterCreate(log, options) {
      const anterior = await LogAuditoria.findOne({
        where: { log_auditoria_id: { [Op.lt]: log.log_auditoria_id } },
        order: [['log_auditoria_id', 'DESC']],
        transaction: options.transaction
      });
      const hash = calcularHashLog(log, anterior?.log_auditoria_hash);
      await log.update({ log_auditoria_hash: hash }, { hooks: false, transaction: options.transaction });
    }
  }
});

module.exports = LogAuditoria;
