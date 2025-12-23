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
  },

  // ============= GOALS (METAS) =============

  // Obtener todas las metas
  getGoals: async (paraleloId = null, status = null) => {
    try {
      let params = [];
      if (paraleloId) params.push(`paralelo_id=${paraleloId}`);
      if (status) params.push(`status=${status}`);
      const queryString = params.length > 0 ? `?${params.join('&')}` : '';
      const response = await api.get(`/teacher/goals${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener metas:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Crear una nueva meta
  createGoal: async (goalData) => {
    try {
      const response = await api.post('/teacher/goals', goalData);
      return response.data;
    } catch (error) {
      console.error('Error al crear meta:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Actualizar una meta
  updateGoal: async (goalId, goalData) => {
    try {
      const response = await api.put(`/teacher/goals/${goalId}`, goalData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar meta:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Eliminar una meta
  deleteGoal: async (goalId) => {
    try {
      const response = await api.delete(`/teacher/goals/${goalId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar meta:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener estudiantes de una meta
  getGoalStudents: async (goalId) => {
    try {
      const response = await api.get(`/teacher/goals/${goalId}/students`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estudiantes de la meta:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ============= CHALLENGES (VERSUS) =============

  // Obtener todas las competencias
  getChallenges: async (paraleloId = null, status = null) => {
    try {
      let params = [];
      if (paraleloId) params.push(`paralelo_id=${paraleloId}`);
      if (status) params.push(`status=${status}`);
      const queryString = params.length > 0 ? `?${params.join('&')}` : '';
      const response = await api.get(`/teacher/challenges${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener competencias:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Crear una nueva competencia
  createChallenge: async (challengeData) => {
    try {
      const response = await api.post('/teacher/challenges', challengeData);
      return response.data;
    } catch (error) {
      console.error('Error al crear competencia:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Actualizar una competencia
  updateChallenge: async (challengeId, challengeData) => {
    try {
      const response = await api.put(`/teacher/challenges/${challengeId}`, challengeData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar competencia:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Eliminar una competencia
  deleteChallenge: async (challengeId) => {
    try {
      const response = await api.delete(`/teacher/challenges/${challengeId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar competencia:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Iniciar una competencia
  startChallenge: async (challengeId) => {
    try {
      const response = await api.post(`/teacher/challenges/${challengeId}/start`);
      return response.data;
    } catch (error) {
      console.error('Error al iniciar competencia:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Finalizar una competencia
  endChallenge: async (challengeId) => {
    try {
      const response = await api.post(`/teacher/challenges/${challengeId}/end`);
      return response.data;
    } catch (error) {
      console.error('Error al finalizar competencia:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Agregar participante a una competencia
  addChallengeParticipant: async (challengeId, studentId) => {
    try {
      const response = await api.post(`/teacher/challenges/${challengeId}/add-participant?student_id=${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error al agregar participante:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ============= RANKING =============

  // Obtener ranking de estudiantes
  getRanking: async (paraleloId = null, period = 'all') => {
    try {
      let params = [`period=${period}`];
      if (paraleloId) params.push(`paralelo_id=${paraleloId}`);
      const queryString = `?${params.join('&')}`;
      const response = await api.get(`/teacher/ranking${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener ranking:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ============= PARALELOS =============

  // Obtener paralelos (alias para getMyParalelos)
  getParalelos: async () => {
    try {
      const response = await api.get('/teacher/my-paralelos');
      return response.data;
    } catch (error) {
      console.error('Error al obtener paralelos:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ============= PERFORMANCE =============

  // Obtener desempeno de un paralelo
  getParaleloPerformance: async (paraleloId, period = 'week') => {
    try {
      const response = await api.get(`/teacher/paralelo/${paraleloId}/performance?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener desempeño:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  }
};

export default teacherService;
