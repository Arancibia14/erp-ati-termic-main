const Trabajador = require('../models/Trabajador');
const Especialidad = require('../models/Especialidad');
const LogAuditoria = require('../models/LogAuditoria');

function validarRutChileno(rut) {
  if (!rut) return false;
  const limpio = rut.replace(/\./g, '').toUpperCase().trim();
  if (!/^\d{7,8}-[0-9K]$/.test(limpio)) return false;
  const [numero, dv] = limpio.split('-');
  let suma = 0;
  let multiplo = 2;
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dvEsperado === dv;
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

    if (!validarRutChileno(rut)) {
      return res.status(400).json({ success: false, error: 'El RUT ingresado tiene un formato inválido' });
    }

    const existente = await Trabajador.findByPk(rut);
    if (existente) {
      return res.status(409).json({ success: false, error: 'El RUT ya pertenece a otro trabajador' });
    }

    const trabajador = await Trabajador.create({
      trabajador_rut: rut,
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
        log_auditoria_accion: `Expediente de trabajador ${rut} creado`,
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

    const trabajador = await Trabajador.findByPk(rut);
    if (!trabajador) {
      return res.status(404).json({ success: false, error: 'Trabajador no encontrado' });
    }

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
    const trabajador = await Trabajador.findByPk(rut);
    if (!trabajador) {
      return res.status(404).json({ success: false, error: 'Trabajador no encontrado' });
    }
    trabajador.trabajador_activo = false;
    await trabajador.save();
    return res.json({ success: true, data: trabajador });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al desactivar el trabajador' });
  }
}

module.exports = { getEspecialidades, getTrabajadores, crearTrabajador, actualizarTrabajador, desactivarTrabajador };
