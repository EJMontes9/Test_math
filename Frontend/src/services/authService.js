import api from './api';

const authService = {
  // Login
  login: async (email, password, rememberMe = false) => {
    try {
      console.log('🔹 authService.login - Iniciando petición al servidor...');
      console.log('🔹 URL base del API:', import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
      console.log('🔹 Endpoint:', '/auth/login');

      const response = await api.post('/auth/login', { email, password });

      console.log('🔹 Respuesta recibida:', response);
      console.log('🔹 Status:', response.status);
      console.log('🔹 Data:', response.data);

      if (response.data.success) {
        const { user, token } = response.data.data;

        console.log('✅ Login exitoso en authService');
        console.log('✅ Usuario:', user);
        console.log('✅ Token recibido:', token ? 'SÍ' : 'NO');

        // Guardar en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Si marcó "Recordarme", guardar email
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        return { success: true, user, token };
      }

      console.warn('⚠️ Respuesta sin success=true');
      return { success: false, message: 'Error al iniciar sesión' };
    } catch (error) {
      console.error('❌ Error en authService.login:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message:', error.message);

      // Manejar errores de validación (422)
      let message;
      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;
        if (errors && errors.length > 0) {
          // Mostrar el primer error de validación
          const firstError = errors[0];
          message = firstError.msg || firstError.message || 'Por favor verifica que el email y contraseña sean válidos';
        } else {
          message = 'Por favor ingresa un email válido (ej: usuario@dominio.com)';
        }
      } else if (error.response?.status === 401) {
        message = 'Email o contraseña incorrectos';
      } else {
        message = error.response?.data?.message
          || error.response?.data?.detail
          || error.message
          || 'Error de conexión con el servidor';
      }

      console.error('❌ Mensaje de error retornado:', message);
      return { success: false, message };
    }
  },

  // Logout
  logout: () => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    localStorage.clear();
    if (rememberedEmail) {
      localStorage.setItem('rememberedEmail', rememberedEmail);
    }
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        return { success: true, user: response.data.data.user };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  },

  // Verificar si hay sesión activa
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Obtener usuario guardado
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Obtener email recordado
  getRememberedEmail: () => {
    return localStorage.getItem('rememberedEmail') || '';
  },
};

export default authService;
