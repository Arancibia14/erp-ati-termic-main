const crypto = require('crypto');

// CU04 - Excepción 2: cadena de hashes para detectar alteración externa de logs.
// Cada log encadena su hash con el del log anterior (mismo principio que un
// blockchain simple): si alguien edita una fila directamente en la base, la
// cadena se rompe a partir de ahí.

// MySQL guarda DATETIME sin milisegundos; hay que truncarlos también en memoria
// para que el hash calculado al escribir coincida con el que se recalcula al leer.
function fechaParaHash(fecha) {
  const d = new Date(fecha);
  d.setMilliseconds(0);
  return d.toISOString();
}

function calcularHashLog(log, hashAnterior) {
  const base = [
    log.log_auditoria_id,
    fechaParaHash(log.log_auditoria_fecha_hora),
    log.log_auditoria_accion,
    log.log_auditoria_modulo,
    log.usuario_rut,
    hashAnterior || ''
  ].join('|');
  return crypto.createHash('sha256').update(base).digest('hex');
}

module.exports = { fechaParaHash, calcularHashLog };
