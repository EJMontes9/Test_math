import axios from 'axios';

// URL de producción - SIEMPRE HTTPS
const PRODUCTION_API_URL = 'https://magnificent-love-production.up.railway.app/api';
const LOCAL_API_URL = 'http://localhost:3000/api';

// URL base del API
export const getApiUrl = () => {
  // Si estamos en HTTPS (producción), SIEMPRE usar URL de producción con HTTPS
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    // Permitir override desde localStorage solo si es HTTPS
    const customUrl = localStorage.getItem('API_URL');
    if (customUrl && customUrl.startsWith('https://')) {
      return customUrl;
    }
    return PRODUCTION_API_URL;
  }

  // Desarrollo local - permitir customUrl o variable de entorno
  const customUrl = localStorage.getItem('API_URL');
  if (customUrl) {
    return customUrl;
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return LOCAL_API_URL;
};

// Exportar funcion para actualizar la URL dinamicamente
export const setApiUrl = (url) => {
  localStorage.setItem('API_URL', url);
  window.location.reload();
};

export const getConfiguredApiUrl = () => getApiUrl();

// Crear instancia de axios SIN baseURL fija
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar baseURL dinamica y token
api.interceptors.request.use(
  (config) => {
    // Establecer baseURL dinamicamente en cada request
    config.baseURL = getApiUrl();

    // Agregar token si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // NO redirigir si es el endpoint de login (credenciales incorrectas)
      const isLoginRequest = error.config?.url?.includes('/auth/login');

      if (!isLoginRequest) {
        // Token expirado o inválido en otras rutas - redirigir a login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      // Si es login, dejar que el error sea manejado por authService
    }
    return Promise.reject(error);
  }
);

export default api;
