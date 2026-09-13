// Convierte una dirección en coordenadas usando Nominatim (OpenStreetMap).
// Es gratuito y no necesita clave, pero su política de uso pide identificar la
// aplicación y no hacer más de una consulta por segundo, así que el servicio se
// llama siempre desde el backend y nunca desde el navegador.
const SERVICIO = 'https://nominatim.openstreetmap.org/search';
const IDENTIFICACION = 'ERP-ATI-Termic/1.0 (sistema de gestion de obras)';
const ESPERA_ENTRE_CONSULTAS = 1100; // ms, con margen sobre el límite de 1 por segundo
const TIEMPO_MAXIMO = 8000;

let ultimaConsulta = 0;

// Errores con causa identificable, para que el controlador responda distinto a
// "no hay internet" que a "esa dirección no existe".
class ErrorGeocodificacion extends Error {
  constructor(causa, mensaje) {
    super(mensaje);
    this.causa = causa;
  }
}

async function respetarLimite() {
  const desde = Date.now() - ultimaConsulta;
  if (desde < ESPERA_ENTRE_CONSULTAS) {
    await new Promise(r => setTimeout(r, ESPERA_ENTRE_CONSULTAS - desde));
  }
  ultimaConsulta = Date.now();
}

// Devuelve { latitud, longitud, direccion_encontrada } o lanza ErrorGeocodificacion.
async function geocodificarDireccion(direccion) {
  const texto = String(direccion || '').trim();
  if (texto.length < 5) {
    throw new ErrorGeocodificacion('DIRECCION_CORTA', 'Escribe la dirección completa de la obra (calle, número y comuna)');
  }

  await respetarLimite();

  const url = `${SERVICIO}?format=jsonv2&limit=1&countrycodes=cl&q=${encodeURIComponent(texto)}`;
  const corte = AbortSignal.timeout ? AbortSignal.timeout(TIEMPO_MAXIMO) : undefined;

  let respuesta;
  try {
    respuesta = await fetch(url, { headers: { 'User-Agent': IDENTIFICACION, 'Accept-Language': 'es' }, signal: corte });
  } catch (err) {
    throw new ErrorGeocodificacion('SIN_CONEXION', 'No se pudo consultar el servicio de mapas. Revisa la conexión a internet o ingresa las coordenadas manualmente');
  }

  if (!respuesta.ok) {
    throw new ErrorGeocodificacion('SERVICIO', 'El servicio de mapas no respondió correctamente. Intenta de nuevo o ingresa las coordenadas manualmente');
  }

  const resultados = await respuesta.json().catch(() => []);
  if (!Array.isArray(resultados) || resultados.length === 0) {
    throw new ErrorGeocodificacion('NO_ENCONTRADA', 'No se encontró esa dirección en Chile. Revísala o ingresa las coordenadas manualmente');
  }

  const { lat, lon, display_name } = resultados[0];
  const latitud = parseFloat(lat);
  const longitud = parseFloat(lon);
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
    throw new ErrorGeocodificacion('SERVICIO', 'El servicio de mapas devolvió coordenadas ilegibles. Ingresa las coordenadas manualmente');
  }

  return { latitud, longitud, direccion_encontrada: display_name || texto };
}

module.exports = { geocodificarDireccion, ErrorGeocodificacion };
