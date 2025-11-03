import api from './api';

const userService = {
  // Obtener todos los usuarios con filtros opcionales
  getAllUsers: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener un usuario por ID
  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Crear un nuevo usuario
  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Actualizar un usuario
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Eliminar un usuario
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener estadísticas de usuarios
  getUserStats: async () => {
    try {
      const response = await api.get('/users/stats');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  }
};

export default userService;
