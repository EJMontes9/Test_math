import api from './api';

const paraleloService = {
  // Obtener todos los paralelos con filtros opcionales
  getAllParalelos: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/paralelos?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener paralelos:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener un paralelo por ID
  getParaleloById: async (id) => {
    try {
      const response = await api.get(`/paralelos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener paralelo:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Crear un nuevo paralelo
  createParalelo: async (paraleloData) => {
    try {
      const response = await api.post('/paralelos', paraleloData);
      return response.data;
    } catch (error) {
      console.error('Error al crear paralelo:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Actualizar un paralelo
  updateParalelo: async (id, paraleloData) => {
    try {
      const response = await api.put(`/paralelos/${id}`, paraleloData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar paralelo:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Eliminar un paralelo
  deleteParalelo: async (id) => {
    try {
      const response = await api.delete(`/paralelos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar paralelo:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener estadísticas de paralelos
  getParaleloStats: async () => {
    try {
      const response = await api.get('/paralelos/stats');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener estudiantes de un paralelo
  getParaleloStudents: async (paraleloId) => {
    try {
      const response = await api.get(`/paralelos/${paraleloId}/students`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estudiantes del paralelo:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener estudiantes disponibles para asignar a un paralelo
  getAvailableStudents: async (paraleloId) => {
    try {
      const response = await api.get(`/paralelos/${paraleloId}/available-students`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estudiantes disponibles:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Asignar estudiantes a un paralelo
  assignStudents: async (paraleloId, studentIds) => {
    try {
      const response = await api.post(`/paralelos/${paraleloId}/students`, {
        student_ids: studentIds
      });
      return response.data;
    } catch (error) {
      console.error('Error al asignar estudiantes:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Remover un estudiante de un paralelo
  removeStudent: async (paraleloId, studentId) => {
    try {
      const response = await api.delete(`/paralelos/${paraleloId}/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error al remover estudiante:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  }
};

export default paraleloService;
