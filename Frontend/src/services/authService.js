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

      // Manejar diferentes tipos de errores
      let message;
      const status = error.response?.status;

      if (status === 422) {
        // Errores de validación - traducir mensajes comunes de Pydantic
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) {
          const firstError = detail[0];
          const errorMsg = firstError?.msg || '';

          // Traducir mensajes comunes de validación de email
          if (errorMsg.includes('not a valid email') || errorMsg.includes('email address is not valid')) {
            message = 'El correo electrónico no es válido. Debe tener el formato: usuario@dominio.com';
          } else if (errorMsg.includes('field required')) {
            message = 'Por favor completa todos los campos requeridos.';
          } else {
            message = 'Por favor verifica que el correo y contraseña sean válidos.';
          }
        } else if (typeof detail === 'string') {
          if (detail.includes('email')) {
            message = 'El correo electrónico no es válido. Debe tener el formato: usuario@dominio.com';
          } else {
            message = detail;
          }
        } else {
          message = 'Por favor ingresa un correo electrónico válido (ej: usuario@dominio.com)';
        }
      } else if (status === 401) {
        // Credenciales incorrectas
        message = 'Correo electrónico o contraseña incorrectos. Por favor, verifica tus datos e intenta nuevamente.';
      } else if (status === 403) {
        // Usuario inactivo
        message = error.response?.data?.detail || 'Tu cuenta está inactiva. Contacta al administrador.';
      } else if (status === 404) {
        // Usuario no encontrado
        message = 'No existe una cuenta con este correo electrónico.';
      } else if (!error.response) {
        // Error de red/conexión
        message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else {
        // Otros errores
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
    // Solo mantener el email recordado si el usuario actual es el mismo que lo guardó
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const currentUser = localStorage.getItem('user');
    let shouldKeepEmail = false;

    if (rememberedEmail && currentUser) {
      try {
        const user = JSON.parse(currentUser);
        // Solo mantener si el email coincide con el usuario actual
        shouldKeepEmail = user.email === rememberedEmail;
      } catch (e) {
        shouldKeepEmail = false;
      }
    }

    localStorage.clear();

    if (shouldKeepEmail && rememberedEmail) {
      localStorage.setItem('rememberedEmail', rememberedEmail);
    }
  },

  // Obtener usuario actual desde el servidor
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        const user = response.data.data.user;
        // Actualizar localStorage
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true, user };
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

  // Solicitar restablecimiento de contraseña
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Error en forgotPassword:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al procesar la solicitud'
      };
    }
  },

  // Restablecer contraseña con token
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      console.error('Error en resetPassword:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al restablecer la contraseña'
      };
    }
  },

  // Cambiar contraseña (usuario autenticado)
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      console.error('Error en changePassword:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al cambiar la contraseña'
      };
    }
  },

  // Actualizar perfil
  updateProfile: async (data) => {
    try {
      const response = await api.put('/auth/profile', data);
      if (response.data.success) {
        // Actualizar localStorage
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Error en updateProfile:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al actualizar el perfil'
      };
    }
  },

  // Subir avatar
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Actualizar usuario en localStorage
        const user = authService.getStoredUser();
        if (user) {
          user.avatar = response.data.data.avatar;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error en uploadAvatar:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al subir el avatar'
      };
    }
  },

  // Eliminar avatar
  deleteAvatar: async () => {
    try {
      const response = await api.delete('/auth/avatar');

      if (response.data.success) {
        // Actualizar usuario en localStorage
        const user = authService.getStoredUser();
        if (user) {
          user.avatar = null;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error en deleteAvatar:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al eliminar el avatar'
      };
    }
  }
};

export default authService;
