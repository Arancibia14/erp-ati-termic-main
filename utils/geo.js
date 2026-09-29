// Geocerca de las obras. La usan la recepción de insumos (CU 57) y la carga de
// evidencias fotográficas (CU 16, UR-F-16), con el mismo radio.
const RADIO_MAXIMO_METROS = 5000;

// Distancia en metros entre dos puntos (fórmula de Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Coordenadas válidas: numéricas, dentro de rango y distintas de 0,0, que es lo
// que llega cuando el dispositivo no entregó su posición
function coordenadasValidas(lat, lon) {
  const la = parseFloat(lat);
  const lo = parseFloat(lon);
  return Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180 && !(la === 0 && lo === 0);
}

module.exports = { RADIO_MAXIMO_METROS, calcularDistancia, coordenadasValidas };
