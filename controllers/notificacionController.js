// Notificaciones del usuario conectado: se listan en Inicio y él puede borrarlas.
// Cada usuario solo ve y borra las suyas.
const Notificacion = require('../models/Notificacion');

async function getMisNotificaciones(req, res) {
  try {
    const notificaciones = await Notificacion.findAll({
      where: { usuario_rut: req.user.rut },
      order: [['notificacion_fecha', 'DESC'], ['notificacion_id', 'DESC']]
    });
    return res.json({ success: true, data: notificaciones });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener las notificaciones' });
  }
}

// Al mostrarlas en Inicio quedan como leídas, para avisar solo de las nuevas
async function marcarLeidas(req, res) {
  try {
    const [cantidad] = await Notificacion.update(
      { notificacion_leida: true },
      { where: { usuario_rut: req.user.rut, notificacion_leida: false } }
    );
    return res.json({ success: true, data: { marcadas: cantidad } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar las notificaciones' });
  }
}

async function borrarNotificacion(req, res) {
  try {
    const borradas = await Notificacion.destroy({
      where: { notificacion_id: req.params.id, usuario_rut: req.user.rut }
    });
    if (!borradas) return res.status(404).json({ success: false, error: 'La notificación ya no existe' });
    return res.json({ success: true, mensaje: 'Notificación eliminada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al eliminar la notificación' });
  }
}

async function borrarTodas(req, res) {
  try {
    const borradas = await Notificacion.destroy({ where: { usuario_rut: req.user.rut } });
    return res.json({ success: true, data: { borradas }, mensaje: 'Notificaciones eliminadas' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al eliminar las notificaciones' });
  }
}

module.exports = { getMisNotificaciones, marcarLeidas, borrarNotificacion, borrarTodas };
