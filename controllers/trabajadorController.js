const Trabajador = require('../models/Trabajador');
const Especialidad = require('../models/Especialidad');
const LogAuditoria = require('../models/LogAuditoria');
const { normalizarRut, validarRutChileno, RUT_INVALIDO } = require('../utils/rut');

// Primero se busca el valor tal cual, para seguir encontrando los registros
// antiguos que Configuración guardó con puntos; después normalizado, para
// aceptar el RUT en cualquier formato.
async function buscarPorRut(rut) {
  const exacto = await Trabajador.findByPk(rut);
  if (exacto) return exacto;
  const normalizado = normalizarRut(rut);
  return normalizado ? Trabajador.findByPk(normalizado) : null;
}

function responderNoEncontrado(res, rut) {
  if (!validarRutChileno(rut).valido) {
    return res.status(400).json({ success: false, error: RUT_INVALIDO });
  }
  return res.status(404).json({ success: false, error: 'Trabajador no encontrado' });
}

async function getEspecialidades(req, res) {
  try {
    const especialidades = await Especialidad.findAll({ order: [['especialidad_nombre', 'ASC']] });
    return res.json({ success: true, data: especialidades });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener especialidades' });
  }
}

async function getTrabajadores(req, res) {
  try {
    const trabajadores = await Trabajador.findAll({
      where: { trabajador_activo: true },
      include: [{ model: Especialidad, attributes: ['especialidad_nombre'] }],
      order: [['trabajador_nombres', 'ASC']]
    });
    return res.json({ success: true, data: trabajadores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener trabajadores' });
  }
}

async function crearTrabajador(req, res) {
  try {
    const { rut, nombres, apellidos, especialidad_id, correo, telefono } = req.body;

    if (!rut || !nombres || !apellidos || !especialidad_id) {
      return res.status(400).json({ success: false, error: 'RUT, nombres, apellidos y especialidad son obligatorios' });
    }

    const validacion = validarRutChileno(rut);
    if (!validacion.valido) {
      return res.status(400).json({ success: false, error: validacion.error });
    }
    const rutNormalizado = validacion.rut;

    const existente = await Trabajador.findByPk(rutNormalizado);
    if (existente) {
      return res.status(409).json({ success: false, error: 'El RUT ya pertenece a otro trabajador' });
    }

    const trabajador = await Trabajador.create({
      trabajador_rut: rutNormalizado,
      trabajador_nombres: nombres,
      trabajador_apellidos: apellidos,
      especialidad_id,
      trabajador_correo: correo || null,
      trabajador_telefono: telefono || null,
      trabajador_activo: true
    });

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Expediente de trabajador ${rutNormalizado} creado`,
        log_auditoria_modulo: 'TRABAJADOR',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: trabajador });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al crear el expediente' });
  }
}

async function actualizarTrabajador(req, res) {
  try {
    const { rut } = req.params;
    const { nombres, apellidos, correo, telefono, especialidad_id } = req.body;

    const trabajador = await buscarPorRut(rut);
    if (!trabajador) return responderNoEncontrado(res, rut);

    if (!nombres || !apellidos || !especialidad_id) {
      return res.status(400).json({ success: false, error: 'Nombres, apellidos y especialidad son obligatorios' });
    }

    trabajador.trabajador_nombres = nombres;
    trabajador.trabajador_apellidos = apellidos;
    trabajador.trabajador_correo = correo || null;
    trabajador.trabajador_telefono = telefono || null;
    trabajador.especialidad_id = especialidad_id;
    await trabajador.save();

    return res.json({ success: true, data: trabajador });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar el expediente' });
  }
}

async function desactivarTrabajador(req, res) {
  try {
    const { rut } = req.params;
    const trabajador = await buscarPorRut(rut);
    if (!trabajador) return responderNoEncontrado(res, rut);
    trabajador.trabajador_activo = false;
    await trabajador.save();
    return res.json({ success: true, data: trabajador });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al desactivar el trabajador' });
  }
}

module.exports = { getEspecialidades, getTrabajadores, crearTrabajador, actualizarTrabajador, desactivarTrabajador };
