import api from './api';

const teacherService = {
  // Obtener paralelos del profesor
  getMyParalelos: async () => {
    try {
      const response = await api.get('/teacher/my-paralelos');
      return response.data;
    } catch (error) {
      console.error('Error al obtener paralelos:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener estudiantes de un paralelo
  getParaleloStudents: async (paraleloId) => {
    try {
      const response = await api.get(`/teacher/paralelo/${paraleloId}/students`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estudiantes:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener estadísticas detalladas de un estudiante
  getStudentStats: async (studentId, paraleloId = null) => {
    try {
      const params = paraleloId ? `?paralelo_id=${paraleloId}` : '';
      const response = await api.get(`/teacher/student/${studentId}/stats${params}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas del estudiante:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  }
};

export default teacherService;
