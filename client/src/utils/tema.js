const CLAVE = 'ati_tema';

export function obtenerTema() {
  try {
    return localStorage.getItem(CLAVE) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  try {
    localStorage.setItem(CLAVE, tema);
  } catch {
    return;
  }
}
