const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const TokenRecuperacion = require('../models/TokenRecuperacion');
const LogAuditoria = require('../models/LogAuditoria');
const { enviarCorreo } = require('../utils/correo');
const { generarTokenPlano, hashToken, compararToken, fechaExpiracion, MINUTOS_VALIDEZ } = require('../utils/tokenRecuperacion');

function validarPassword(pw) {
  return typeof pw === 'string' && pw.length >= 8 && /[A-Z]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

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

// CU06 - Solicitando recuperación de credenciales
async function solicitarRecuperacion(req, res) {
  try {
    const { identificador } = req.body;

    if (!identificador || !String(identificador).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Ingresa tu RUT para recibir el token de recuperación',
        campos: ['identificador']
      });
    }

    const rut = String(identificador).trim();
    const usuario = await Usuario.findByPk(rut);

    // Excepción 1 - Usuario no encontrado
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'El identificador no está registrado en la plataforma',
        campos: ['identificador']
      });
    }

    // Un pedido nuevo invalida cualquier token anterior sin usar de este usuario
    await TokenRecuperacion.destroy({ where: { usuario_rut: rut } });

    const tokenPlano = generarTokenPlano();
    await TokenRecuperacion.create({
      token_recuperacion_codigo_hash: await hashToken(tokenPlano),
      token_recuperacion_fecha_expiracion: fechaExpiracion(),
      usuario_rut: rut
    });

    // CU07 - Link directo a la pantalla de nueva contraseña, con el RUT y el
    // token ya incluidos: así el usuario no tiene que volver a tipear el token.
    const link = `${FRONTEND_URL}/restablecer?rut=${encodeURIComponent(rut)}&token=${encodeURIComponent(tokenPlano)}`;

    await enviarCorreo({
      para: usuario.usuario_correo_institucional,
      asunto: 'Recuperación de credenciales — ATI Termic',
      texto: `Hola ${usuario.usuario_nombre}.\n\nTu token de recuperación es: ${tokenPlano}\n\nPara restablecer tu contraseña, entra a: ${link}\n\nEste token vence en ${MINUTOS_VALIDEZ} minutos. Si no solicitaste este cambio, ignora este correo.`,
      html: `<p>Hola ${usuario.usuario_nombre}.</p><p>Tu token de recuperación es:</p><p style="font-size:22px;font-weight:700;letter-spacing:2px">${tokenPlano}</p><p><a href="${link}">Haz clic aquí para restablecer tu contraseña</a></p><p>Este token vence en ${MINUTOS_VALIDEZ} minutos. Si no solicitaste este cambio, ignora este correo.</p>`
    });

    await audit(`Usuario ${rut} solicitó recuperación de credenciales`, 'RECUPERACION', rut);

    return res.json({
      success: true,
      data: { mensaje: 'Se envió un token de recuperación a tu correo institucional' }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al solicitar la recuperación de credenciales' });
  }
}

// CU07 - Restableciendo contraseña de acceso
async function restablecerContrasena(req, res) {
  try {
    const { rut, token, password, confirmacion } = req.body;

    const faltantes = [];
    if (!rut || !String(rut).trim()) faltantes.push('rut');
    if (!token || !String(token).trim()) faltantes.push('token');
    if (!password) faltantes.push('password');
    if (!confirmacion) faltantes.push('confirmacion');
    if (faltantes.length) {
      return res.status(400).json({ success: false, error: 'Completa los campos obligatorios', campos: faltantes });
    }

    // Excepción 1 - Las contraseñas no coinciden
    if (password !== confirmacion) {
      return res.status(400).json({
        success: false,
        error: 'Las contraseñas no coinciden. Verifica los campos.',
        campos: ['password', 'confirmacion']
      });
    }

    if (!validarPassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener mínimo 8 caracteres, una letra mayúscula y un carácter especial',
        campos: ['password', 'confirmacion']
      });
    }

    const rutLimpio = String(rut).trim();
    const usuario = await Usuario.findByPk(rutLimpio);
    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado', campos: ['rut'] });
    }

    const tokenGuardado = await TokenRecuperacion.findOne({ where: { usuario_rut: rutLimpio } });
    const tokenValido = tokenGuardado && await compararToken(String(token).trim(), tokenGuardado.token_recuperacion_codigo_hash);
    const tokenVigente = tokenGuardado && new Date(tokenGuardado.token_recuperacion_fecha_expiracion) > new Date();

    if (!tokenGuardado || !tokenValido || !tokenVigente) {
      return res.status(400).json({
        success: false,
        error: 'El token de recuperación no es válido o ha expirado. Solicita uno nuevo.',
        campos: ['token']
      });
    }

    await usuario.update({ usuario_password_hash: await bcrypt.hash(password, 10) });

    // Paso 3 - Invalida el token para que no pueda usarse nuevamente
    await tokenGuardado.destroy();

    await audit(`Usuario ${rutLimpio} restableció su contraseña`, 'RECUPERACION', rutLimpio);

    return res.json({
      success: true,
      data: { mensaje: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales.' }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al restablecer la contraseña' });
  }
}

module.exports = { solicitarRecuperacion, restablecerContrasena };
