// CU 66 - Crea avisos que el destinatario ve en Inicio al iniciar sesión.
// Nunca interrumpe la operación que los origina: si falla, solo se informa en consola.
const sequelize = require('../config/database');
const Notificacion = require('../models/Notificacion');

async function notificar(ruts, { tipo, titulo, mensaje }) {
  const destinatarios = [...new Set(ruts.filter(Boolean))];
  if (!destinatarios.length) return 0;
  try {
    await Notificacion.bulkCreate(destinatarios.map(usuario_rut => ({
      usuario_rut,
      notificacion_tipo: tipo,
      notificacion_titulo: titulo.slice(0, 150),
      notificacion_mensaje: mensaje.slice(0, 500),
      notificacion_fecha: new Date()
    })));
    return destinatarios.length;
  } catch (err) {
    console.error('[notificaciones] No se pudo crear la notificación:', err.message);
    return 0;
  }
}

// RUT de todos los usuarios con rol Administrador Total
async function rutsAdministradores() {
  const filas = await sequelize.query('SELECT usuario_rut FROM ADMINISTRADOR', { type: sequelize.QueryTypes.SELECT });
  return filas.map(f => f.usuario_rut);
}

module.exports = { notificar, rutsAdministradores };
