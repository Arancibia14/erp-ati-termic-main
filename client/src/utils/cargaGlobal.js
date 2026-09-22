let total = 0;
let lecturas = 0;
let estado = { total: 0, lecturas: 0 };
const oyentes = new Set();

function publicar() {
  estado = { total, lecturas };
  oyentes.forEach(oyente => oyente());
}

function esLectura(metodo) {
  return (metodo || 'get').toLowerCase() === 'get';
}

export function iniciarCarga(metodo) {
  total += 1;
  if (esLectura(metodo)) lecturas += 1;
  publicar();
}

export function terminarCarga(metodo) {
  total = Math.max(0, total - 1);
  if (esLectura(metodo)) lecturas = Math.max(0, lecturas - 1);
  publicar();
}

export function suscribir(oyente) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function leerEstado() {
  return estado;
}
