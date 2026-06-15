const jwt = require('jsonwebtoken');
const Administrador = require('../models/Administrador');

// Middleware: verifica que la petición HTTP incluya un token JWT válido
// Se ejecuta ANTES del controlador en cada ruta protegida
async function verifyToken(req, res, next) {
  // El token llega en el header "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // extrae solo la parte del token

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token requerido' });
  }

  try {
    // jwt.verify decodifica el token y comprueba que no haya expirado ni sido alterado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // adjunta los datos del usuario (rut, nombre, rol) a la petición
    next();             // pasa al siguiente middleware o controlador
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
}

// Middleware: permite el acceso solo si el usuario autenticado tiene rol 'admin'
// Debe usarse DESPUÉS de verifyToken en la cadena de middlewares
async function requireAdmin(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, error: 'Acceso restringido a administradores' });
  }
  next();
}

module.exports = { verifyToken, requireAdmin };
