const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Administrador = require('../models/Administrador');
const Sesion = require('../models/Sesion');
const LogAuditoria = require('../models/LogAuditoria');
const { INACTIVIDAD_MINUTOS } = require('../middleware/auth');

const audit = async (accion, modulo, rut) => {
  try {
    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: accion,
      log_auditoria_modulo: modulo,
      usuario_rut: rut
    });
  } catch (_) { /* no bloquear la operación principal */ }
};

async function login(req, res) {
  try {
    const { rut, password } = req.body;
    if (!rut || !password) {
      return res.status(400).json({ success: false, error: 'RUT y contraseña son requeridos' });
    }

    const usuario = await Usuario.findByPk(rut);
    if (!usuario) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.usuario_password_hash);
    if (!passwordValida) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    const admin = await Administrador.findOne({ where: { usuario_rut: rut } });
    const rol = admin ? 'admin' : 'supervisor';

    // CU05 - Cada login abre una sesión que el middleware vigila por inactividad
    const ahora = new Date();
    const sesion = await Sesion.create({
      sesion_fecha_inicio: ahora,
      sesion_ultima_actividad: ahora,
      sesion_estado: 'activa',
      usuario_rut: rut
    });

    const token = jwt.sign(
      { rut: usuario.usuario_rut, nombre: usuario.usuario_nombre, rol, sid: sesion.sesion_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      data: {
        token,
        usuario: {
          rut: usuario.usuario_rut,
          nombre: usuario.usuario_nombre,
          correo: usuario.usuario_correo_institucional,
          rol
        },
        // CU05 - El frontend usa este valor para su propio contador de inactividad,
        // así el límite queda definido en un solo lugar (el .env del backend).
        inactividad_minutos: INACTIVIDAD_MINUTOS
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}

// CU05 - Cierra la sesión en el servidor (logout manual o expiración por inactividad)
async function logout(req, res) {
  try {
    const { motivo } = req.body;
    const sesion = req.user?.sid ? await Sesion.findByPk(req.user.sid) : null;
    if (sesion && sesion.sesion_estado === 'activa') {
      const nuevoEstado = motivo === 'inactividad' ? 'expirada' : 'cerrada';
      await sesion.update({ sesion_estado: nuevoEstado });
      await audit(
        nuevoEstado === 'expirada'
          ? `Sesión del usuario ${req.user.rut} expiró por inactividad`
          : `Usuario ${req.user.rut} cerró sesión`,
        'SESION',
        req.user.rut
      );
    }
    return res.json({ success: true, data: { mensaje: 'Sesión cerrada' } });
  } catch (err) {
    console.error(err);
    // El cierre de sesión no debe bloquear al cliente aunque falle en el servidor
    return res.json({ success: true, data: { mensaje: 'Sesión cerrada' } });
  }
}

module.exports = { login, logout };
