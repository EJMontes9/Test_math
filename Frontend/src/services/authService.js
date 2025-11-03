import api from './api';

const authService = {
  // Login
  login: async (email, password, rememberMe = false) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { user, token } = response.data.data;

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

      return { success: false, message: 'Error al iniciar sesión' };
    } catch (error) {
      const message = error.response?.data?.message || 'Error de conexión con el servidor';
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
