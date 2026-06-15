const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Administrador = require('../models/Administrador');

// CU: Autenticación de usuario
// Recibe RUT y contraseña, devuelve un token JWT si las credenciales son válidas
async function login(req, res) {
  try {
    const { rut, password } = req.body;
    if (!rut || !password) {
      return res.status(400).json({ success: false, error: 'RUT y contraseña son requeridos' });
    }

    // Busca el usuario en la base de datos usando el RUT como clave primaria
    const usuario = await Usuario.findByPk(rut);
    if (!usuario) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // bcrypt.compare compara la contraseña ingresada con el hash guardado en BD
    // Nunca se guarda la contraseña en texto plano
    const passwordValida = await bcrypt.compare(password, usuario.usuario_password_hash);
    if (!passwordValida) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // Determina el rol consultando si el usuario existe en la tabla ADMINISTRADOR
    const admin = await Administrador.findOne({ where: { usuario_rut: rut } });
    const rol = admin ? 'admin' : 'supervisor';

    // Genera el token JWT que el frontend guardará y enviará en cada petición posterior
    // El token expira en 8 horas (duración de una jornada laboral)
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

// El logout en JWT es del lado del cliente: borra el token del localStorage
// El servidor solo confirma la acción; no hay sesión que destruir en el backend
async function logout(req, res) {
  return res.json({ success: true, data: { mensaje: 'Sesión cerrada' } });
}

module.exports = { login, logout };
