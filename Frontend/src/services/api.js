import axios from 'axios';

// URL base del API - funcion que siempre lee de localStorage
// Para demos con tunel de Cloudflare
export const getApiUrl = () => {
  const customUrl = localStorage.getItem('API_URL');
  if (customUrl) {
    return customUrl;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
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
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
