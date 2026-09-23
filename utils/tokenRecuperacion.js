const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// CU06 - Token alfanumérico legible: sin O/0 ni I/1, para que no se confundan al tipearlo.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LARGO_TOKEN = 8;
const MINUTOS_VALIDEZ = 30;

function generarTokenPlano() {
  let token = '';
  for (let i = 0; i < LARGO_TOKEN; i++) {
    token += ALFABETO[crypto.randomInt(ALFABETO.length)];
  }
  return token;
}

async function hashToken(tokenPlano) {
  return bcrypt.hash(tokenPlano, 10);
}

async function compararToken(tokenPlano, hash) {
  return bcrypt.compare(tokenPlano, hash);
}

function fechaExpiracion() {
  return new Date(Date.now() + MINUTOS_VALIDEZ * 60 * 1000);
}

module.exports = { generarTokenPlano, hashToken, compararToken, fechaExpiracion, MINUTOS_VALIDEZ };
