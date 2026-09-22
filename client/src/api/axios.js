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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
