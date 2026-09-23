import api from '../api/axios';

// CU05 - Finalizando sesión por inactividad
const EVENTOS_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

function minutosConfigurados() {
  const valor = Number(localStorage.getItem('inactividad_minutos'));
  return Number.isFinite(valor) && valor > 0 ? valor : 15;
}

// Paso 4/5 - Cierra la sesión "de verdad" (llama al servidor) y redirige con el
// mensaje literal. Si la llamada al servidor falla (Excepción 1: error de
// conexión), igual limpia todo localmente para no dejar al usuario colgado.
async function cerrarPorInactividad() {
  try {
    await api.post('/auth/logout', { motivo: 'inactividad' });
  } catch (_) {
    // Excepción 1 - sin conexión: se limpia igual del lado del cliente
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('inactividad_minutos');
    window.location.href = '/login?motivo=inactividad';
  }
}

// Se monta una sola vez (en PrivateLayout). Devuelve la función de limpieza.
export function iniciarVigilanciaInactividad() {
  let temporizador = null;

  const reiniciar = () => {
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(cerrarPorInactividad, minutosConfigurados() * 60 * 1000);
  };

  EVENTOS_ACTIVIDAD.forEach(ev => window.addEventListener(ev, reiniciar, { passive: true }));
  reiniciar();

  return () => {
    if (temporizador) clearTimeout(temporizador);
    EVENTOS_ACTIVIDAD.forEach(ev => window.removeEventListener(ev, reiniciar));
  };
}
