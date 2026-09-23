import axios from 'axios';
import { iniciarCarga, terminarCarga } from '../utils/cargaGlobal';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  iniciarCarga(config.method);
  return config;
});

api.interceptors.response.use(
  response => {
    terminarCarga(response.config?.method);
    return response;
  },
  error => {
    terminarCarga(error.config?.method);

    // CU05 Excepción 1 - Error de conexión: no hay respuesta del servidor.
    // Se limpia igual del lado del cliente para forzar el cierre.
    if (!error.response) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('inactividad_minutos');
      if (window.location.pathname !== '/login') window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('inactividad_minutos');
      // CU05 - Si el propio servidor detectó la inactividad (por ejemplo, otra
      // pestaña dejó de usarse), redirige con el mismo mensaje literal.
      const destino = error.response.data?.codigo === 'SESION_EXPIRADA' ? '/login?motivo=inactividad' : '/login';
      window.location.href = destino;
    }
    return Promise.reject(error);
  }
);

export default api;
