const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Administrador = require('../models/Administrador');

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

    const token = jwt.sign(
      { rut: usuario.usuario_rut, nombre: usuario.usuario_nombre, rol },
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
        }
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}

async function logout(req, res) {
  return res.json({ success: true, data: { mensaje: 'Sesión cerrada' } });
}

module.exports = { login, logout };
