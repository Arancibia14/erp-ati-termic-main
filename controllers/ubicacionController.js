// CU10 - Registrando geolocalización de la obra.
// La ubicación la registran tanto el Administrador Total como el Supervisor de
// Obra, por eso vive fuera de /setup, que es solo del administrador.
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const LogAuditoria = require('../models/LogAuditoria');
const { geocodificarDireccion, ErrorGeocodificacion } = require('../utils/geocodificar');

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

// CU10 paso 1 - Sección de ubicación dentro de la ficha del proyecto
async function getUbicacion(req, res) {
  try {
    const { codigo } = req.params;
    const proyecto = await Proyecto.findByPk(codigo, {
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });
    if (!proyecto) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    return res.json({ success: true, data: { proyecto } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener la ubicación del proyecto' });
  }
}

// CU10 paso 4 - Convertir una dirección en coordenadas, sin guardar todavía.
// El actor todavía puede mover el marcador antes de confirmar (paso 5).
async function buscarDireccion(req, res) {
  try {
    const { direccion } = req.body;
    if (!direccion || !String(direccion).trim()) {
      return res.status(400).json({ success: false, error: 'Escribe la dirección de la obra' });
    }
    try {
      const ubicacion = await geocodificarDireccion(direccion);
      return res.json({ success: true, data: ubicacion });
    } catch (err) {
      if (!(err instanceof ErrorGeocodificacion)) throw err;
      // CU10 Excepción 1 (dirección no encontrada) y Excepción 2 (servicio caído):
      // en ambos casos se ofrece marcar o escribir el punto a mano.
      const estado = err.causa === 'NO_ENCONTRADA' ? 404 : err.causa === 'DIRECCION_CORTA' ? 400 : 503;
      return res.status(estado).json({
        success: false,
        error: err.message,
        causa: err.causa,
        sugerir_manual: err.causa !== 'DIRECCION_CORTA'
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al buscar la dirección' });
  }
}

// CU10 pasos 5 y 6 - Confirmar y registrar el punto geográfico
async function guardarUbicacion(req, res) {
  try {
    const { codigo } = req.params;
    const { direccion, latitud, longitud } = req.body;

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });

    if (latitud === undefined || longitud === undefined || latitud === '' || longitud === '') {
      return res.status(400).json({
        success: false,
        error: 'Marca la posición de la obra en el mapa antes de guardarla',
        campos: ['latitud', 'longitud']
      });
    }

    const lat = parseFloat(latitud), lon = parseFloat(longitud);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        error: 'Coordenadas inválidas. Latitud entre -90 y 90, longitud entre -180 y 180',
        campos: ['latitud', 'longitud']
      });
    }

    const cambios = { proyecto_latitud: lat, proyecto_longitud: lon };
    if (direccion && String(direccion).trim()) cambios.proyecto_ubicacion = String(direccion).trim();
    await proyecto.update(cambios);

    await audit(`Ubicación del proyecto ${codigo} registrada en ${lat.toFixed(6)}, ${lon.toFixed(6)}`, 'UBICACION', req.user.rut);
    return res.json({
      success: true,
      data: { latitud: lat, longitud: lon, direccion: cambios.proyecto_ubicacion || proyecto.proyecto_ubicacion },
      mensaje: `Ubicación de la obra ${codigo} guardada en ${lat.toFixed(6)}, ${lon.toFixed(6)}`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al guardar la ubicación del proyecto' });
  }
}

module.exports = { getUbicacion, buscarDireccion, guardarUbicacion };
