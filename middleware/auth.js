const jwt = require('jsonwebtoken');
const Administrador = require('../models/Administrador');
const Sesion = require('../models/Sesion');
const LogAuditoria = require('../models/LogAuditoria');

// CU05 - Minutos de inactividad tras la última petición antes de invalidar la sesión
const INACTIVIDAD_MINUTOS = Number(process.env.SESION_INACTIVIDAD_MINUTOS) || 15;

const MENSAJE_INACTIVIDAD = 'Su sesión ha expirado por inactividad. Por favor, ingrese sus credenciales nuevamente';

const MENSAJE_ROL_ACTUALIZADO = 'Su nivel de acceso fue modificado por un administrador. Ingrese nuevamente para aplicar sus nuevos permisos';

async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token requerido' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }

  try {
    // CU05 - Tokens emitidos antes de esta funcionalidad no llevan "sid": se
    // dejan pasar sin control de inactividad en vez de invalidarlos de golpe.
    if (decoded.sid === undefined) {
      req.user = decoded;
      return next();
    }

    const sesion = await Sesion.findByPk(decoded.sid);
    // CU02 - Un administrador cambió el rol de este usuario: debe volver a entrar
    // para que el token lleve sus nuevos permisos.
    if (sesion && sesion.sesion_estado === 'rol_actualizado') {
      return res.status(401).json({ success: false, error: MENSAJE_ROL_ACTUALIZADO, codigo: 'ROL_ACTUALIZADO' });
    }
    if (!sesion || sesion.sesion_estado !== 'activa') {
      return res.status(401).json({ success: false, error: 'Token inválido o expirado', codigo: 'SESION_INVALIDA' });
    }

    const minutosInactivo = (Date.now() - new Date(sesion.sesion_ultima_actividad).getTime()) / 60000;
    if (minutosInactivo > INACTIVIDAD_MINUTOS) {
      await sesion.update({ sesion_estado: 'expirada' });
      try {
        await LogAuditoria.create({
          log_auditoria_fecha_hora: new Date(),
          log_auditoria_accion: `Sesión del usuario ${decoded.rut} expiró por inactividad`,
          log_auditoria_modulo: 'SESION',
          usuario_rut: decoded.rut
        });
      } catch (_) { /* no bloquear la respuesta */ }
      return res.status(401).json({ success: false, error: MENSAJE_INACTIVIDAD, codigo: 'SESION_EXPIRADA' });
    }

    await sesion.update({ sesion_ultima_actividad: new Date() });
    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al validar la sesión' });
  }
}

async function requireAdmin(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, error: 'Acceso restringido a administradores' });
  }
  next();
}

module.exports = { verifyToken, requireAdmin, INACTIVIDAD_MINUTOS };
