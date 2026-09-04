const jwt = require('jsonwebtoken');
const Administrador = require('../models/Administrador');

async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
}

async function requireAdmin(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, error: 'Acceso restringido a administradores' });
  }
  next();
}

module.exports = { verifyToken, requireAdmin };
