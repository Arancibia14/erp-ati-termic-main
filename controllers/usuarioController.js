const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Administrador = require('../models/Administrador');
const SupervisorTerreno = require('../models/SupervisorTerreno');
const LogAuditoria = require('../models/LogAuditoria');

function validarPassword(pw) {
  return typeof pw === 'string' && pw.length >= 8 && /[A-Z]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
}

async function getUsuarios(req, res) {
  try {
    const usuarios = await Usuario.findAll({ order: [['usuario_nombre', 'ASC']] });
    const admins = await Administrador.findAll();
    const supervisores = await SupervisorTerreno.findAll();
    const rutsAdmin = new Set(admins.map(a => a.usuario_rut));
    const rutsSuper = new Set(supervisores.map(s => s.usuario_rut));

    const data = usuarios.map(u => ({
      usuario_rut: u.usuario_rut,
      usuario_nombre: u.usuario_nombre,
      usuario_correo_institucional: u.usuario_correo_institucional,
      rol: rutsAdmin.has(u.usuario_rut) ? 'admin' : rutsSuper.has(u.usuario_rut) ? 'supervisor' : 'sin_rol'
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener los usuarios' });
  }
}

// CU NUEVO 5 - Registrando nuevo usuario del sistema
async function crearUsuario(req, res) {
  try {
    const { rut, nombre, correo, password, rol, registro_certificacion, telefono_emergencia } = req.body;

    if (!rut || !nombre || !correo || !password || !rol) {
      return res.status(400).json({ success: false, error: 'RUT, nombre, correo, contraseña y rol son obligatorios' });
    }

    if (!['admin', 'supervisor'].includes(rol)) {
      return res.status(400).json({ success: false, error: 'El rol debe ser Administrador Total o Supervisor de Obra' });
    }

    const existente = await Usuario.findByPk(rut);
    if (existente) {
      // Excepción 1: RUT duplicado
      return res.status(409).json({ success: false, error: 'Ya existe una cuenta registrada con ese RUT' });
    }

    if (!validarPassword(password)) {
      // Excepción 2: Contraseña inválida
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener mínimo 8 caracteres, una letra mayúscula y un carácter especial'
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({
      usuario_rut: rut,
      usuario_nombre: nombre,
      usuario_correo_institucional: correo,
      usuario_password_hash: hash
    });

    if (rol === 'admin') {
      await Administrador.create({
        administrador_nivel_acceso: 'total',
        administrador_fecha_asignacion: new Date(),
        usuario_rut: rut
      });
    } else {
      await SupervisorTerreno.create({
        supervisor_terreno_registro_certificacion: registro_certificacion?.trim() || 'No especificado',
        supervisor_terreno_telefono_emergencia: telefono_emergencia?.trim() || 'No especificado',
        usuario_rut: rut
      });
    }

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Usuario ${rut} (${nombre}) registrado con rol ${rol === 'admin' ? 'Administrador Total' : 'Supervisor de Obra'}`,
        log_auditoria_modulo: 'USUARIO',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({
      success: true,
      data: { usuario_rut: usuario.usuario_rut, usuario_nombre: usuario.usuario_nombre, rol }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar el usuario' });
  }
}

module.exports = { getUsuarios, crearUsuario };
