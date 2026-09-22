function etiquetar(tabla) {
  const cabeceras = [...tabla.querySelectorAll('thead th')].map(th => th.textContent.trim());
  if (cabeceras.length === 0) return;
  tabla.querySelectorAll('tbody tr').forEach(fila => {
    const celdas = [...fila.children];
    if (celdas.some(celda => celda.colSpan > 1)) {
      fila.classList.add('fila-unica');
      return;
    }
    celdas.forEach((celda, i) => {
      if (celda.tagName === 'TD' && celda.dataset.label === undefined) {
        celda.dataset.label = cabeceras[i] || '';
      }
    });
  });
}

export function activarTablasMoviles() {
  const raiz = document.querySelector('.main-content');
  if (!raiz) return undefined;
  let pendiente = false;

  const procesar = () => {
    pendiente = false;
    raiz.querySelectorAll('.table-container table').forEach(etiquetar);
  };

  const programar = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(procesar);
  };

  const observador = new MutationObserver(programar);
  observador.observe(raiz, { childList: true, subtree: true });
  programar();
  return () => observador.disconnect();
}
