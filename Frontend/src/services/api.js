import axios from 'axios';

// URLs
const PRODUCTION_API_URL = 'https://magnificent-love-production.up.railway.app/api';
const LOCAL_API_URL = 'http://localhost:3000/api';

// Detectar si estamos en desarrollo local
const isLocalhost = () => {
  try {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
  } catch {
    return false;
  }
};

// URL base del API
export const getApiUrl = () => {
  // Primero verificar localStorage para override manual
  const customUrl = localStorage.getItem('API_URL');
  if (customUrl) {
    return customUrl;
  }

  // Si estamos en localhost, usar URL local
  if (isLocalhost()) {
    return import.meta.env.VITE_API_URL || LOCAL_API_URL;
  }

  // Por defecto (producción), SIEMPRE usar HTTPS
  return PRODUCTION_API_URL;
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
    const url = getApiUrl();
    console.log('🔗 API Request:', {
      endpoint: config.url,
      baseURL: url,
      hostname: window.location.hostname,
      isLocal: isLocalhost(),
      localStorage: localStorage.getItem('API_URL')
    });
    config.baseURL = url;

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
