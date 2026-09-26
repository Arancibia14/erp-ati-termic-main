const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const Usuario = require('../models/Usuario');
const Administrador = require('../models/Administrador');
const SupervisorTerreno = require('../models/SupervisorTerreno');
const Sesion = require('../models/Sesion');
const LogAuditoria = require('../models/LogAuditoria');

const ROL_LABEL = { admin: 'Administrador Total', supervisor: 'Supervisor de Obra', sin_rol: 'Sin rol asignado' };

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

// CU 63 - Registrando nuevo usuario del sistema
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

// CU02 - El rol vigente se deduce de la tabla de especialización en que está el usuario
async function rolActual(rut, transaction) {
  if (await Administrador.findOne({ where: { usuario_rut: rut }, transaction })) return 'admin';
  if (await SupervisorTerreno.findOne({ where: { usuario_rut: rut }, transaction })) return 'supervisor';
  return 'sin_rol';
}

// CU02 - Gestionando niveles de acceso
async function cambiarRol(req, res) {
  const { rut } = req.params;
  const { rol, rol_anterior } = req.body;

  if (!rol) {
    return res.status(400).json({ success: false, error: 'Selecciona el nuevo nivel de acceso', campos: ['rol'] });
  }
  if (!['admin', 'supervisor'].includes(rol)) {
    return res.status(400).json({ success: false, error: 'El rol debe ser Administrador Total o Supervisor de Obra', campos: ['rol'] });
  }

  const t = await sequelize.transaction();
  try {
    const usuario = await Usuario.findByPk(rut, { transaction: t, lock: t.LOCK.UPDATE });
    if (!usuario) {
      // Excepción 1: Usuario inexistente o eliminado
      await t.rollback();
      return res.status(404).json({ success: false, error: 'El registro ya no está disponible para edición' });
    }

    // Se bloquean las filas de administradores para que dos cambios simultáneos
    // no puedan dejar al sistema sin administradores (Excepción 3).
    const admins = await Administrador.findAll({ transaction: t, lock: t.LOCK.UPDATE });
    const actual = await rolActual(rut, t);

    if (rol_anterior && rol_anterior !== actual) {
      // Excepción 2: Error de concurrencia
      await t.rollback();
      return res.status(409).json({
        success: false,
        codigo: 'CONCURRENCIA',
        error: 'Otro administrador modificó este usuario mientras lo editabas. Recarga la página para ver los datos actualizados'
      });
    }

    if (actual === rol) {
      await t.rollback();
      return res.status(400).json({ success: false, error: `El usuario ya tiene el rol ${ROL_LABEL[rol]}`, campos: ['rol'] });
    }

    if (actual === 'admin' && admins.length <= 1) {
      // Excepción 3: Usuario único
      await t.rollback();
      return res.status(409).json({
        success: false,
        codigo: 'ULTIMO_ADMINISTRADOR',
        error: 'No puedes quitar el rol de Administrador Total: es el único administrador y el sistema quedaría sin administradores'
      });
    }

    if (rol === 'admin') {
      await SupervisorTerreno.destroy({ where: { usuario_rut: rut }, transaction: t });
      await Administrador.create({
        administrador_nivel_acceso: 'total',
        administrador_fecha_asignacion: new Date(),
        usuario_rut: rut
      }, { transaction: t });
    } else {
      await Administrador.destroy({ where: { usuario_rut: rut }, transaction: t });
      await SupervisorTerreno.create({
        supervisor_terreno_registro_certificacion: 'No especificado',
        supervisor_terreno_telefono_emergencia: 'No especificado',
        usuario_rut: rut
      }, { transaction: t });
    }

    // Postcondición: los permisos van dentro del token de sesión, así que las
    // sesiones abiertas se cierran y el usuario vuelve a entrar con su nuevo rango.
    const [sesionesCerradas] = await Sesion.update(
      { sesion_estado: 'rol_actualizado' },
      { where: { usuario_rut: rut, sesion_estado: 'activa' }, transaction: t }
    );

    await t.commit();

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Nivel de acceso de ${rut} (${usuario.usuario_nombre}) cambiado de ${ROL_LABEL[actual]} a ${ROL_LABEL[rol]}`,
        log_auditoria_modulo: 'USUARIO',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.json({
      success: true,
      mensaje: 'Nivel de acceso actualizado correctamente',
      data: { usuario_rut: rut, rol, rol_anterior: actual, sesiones_cerradas: sesionesCerradas, propio: rut === req.user.rut }
    });
  } catch (err) {
    if (!t.finished) await t.rollback();
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar el nivel de acceso' });
  }
}

module.exports = { getUsuarios, crearUsuario, cambiarRol };
