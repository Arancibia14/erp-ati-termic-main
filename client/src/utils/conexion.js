const oyentes = new Set();
let enLinea = typeof navigator === 'undefined' ? true : navigator.onLine;

function publicar(valor) {
  enLinea = valor;
  oyentes.forEach(oyente => oyente());
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => publicar(true));
  window.addEventListener('offline', () => publicar(false));
}

export function suscribirConexion(oyente) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function leerConexion() {
  return enLinea;
}
