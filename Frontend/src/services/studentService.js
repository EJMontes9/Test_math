import api from './api';

const studentService = {
  // Iniciar sesión de juego
  startGame: async () => {
    try {
      const response = await api.post('/student/game/start');
      return response.data;
    } catch (error) {
      console.error('Error al iniciar juego:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener siguiente ejercicio
  getNextExercise: async (sessionId) => {
    try {
      const response = await api.get(`/student/game/next-exercise?session_id=${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener ejercicio:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Enviar respuesta
  submitAnswer: async (sessionId, exerciseId, answer, timeTaken) => {
    try {
      const response = await api.post('/student/game/submit-answer', {
        session_id: sessionId,
        exercise_id: exerciseId,
        answer,
        time_taken: timeTaken
      });
      return response.data;
    } catch (error) {
      console.error('Error al enviar respuesta:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Finalizar juego
  endGame: async (sessionId) => {
    try {
      const response = await api.post('/student/game/end', {
        session_id: sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Error al finalizar juego:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener estadísticas del estudiante
  getStats: async () => {
    try {
      const response = await api.get('/student/stats');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener ranking
  getRanking: async (paraleloId = null) => {
    try {
      const url = paraleloId
        ? `/student/ranking?paralelo_id=${paraleloId}`
        : '/student/ranking';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener ranking:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener recomendaciones
  getRecommendations: async () => {
    try {
      const response = await api.get('/student/recommendations');
      return response.data;
    } catch (error) {
      console.error('Error al obtener recomendaciones:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ============= METAS (GOALS) =============

  // Obtener metas del estudiante
  getGoals: async (status = null) => {
    try {
      const url = status ? `/student/goals?status=${status}` : '/student/goals';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener metas:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener detalle de una meta
  getGoalDetail: async (goalId) => {
    try {
      const response = await api.get(`/student/goals/${goalId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalle de meta:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ============= DESAFÍOS (CHALLENGES) =============

  // Obtener desafíos
  getChallenges: async (status = null) => {
    try {
      const url = status ? `/student/challenges?status=${status}` : '/student/challenges';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener desafíos:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener detalle de un desafío
  getChallengeDetail: async (challengeId) => {
    try {
      const response = await api.get(`/student/challenges/${challengeId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalle del desafío:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Unirse a un desafío
  joinChallenge: async (challengeId) => {
    try {
      const response = await api.post(`/student/challenges/${challengeId}/join`);
      return response.data;
    } catch (error) {
      console.error('Error al unirse al desafío:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Enviar respuesta en desafío
  submitChallengeAnswer: async (challengeId, exerciseId, answer, timeTaken) => {
    try {
      const response = await api.post(`/student/challenges/${challengeId}/submit`, {
        exercise_id: exerciseId,
        answer,
        time_taken: timeTaken
      });
      return response.data;
    } catch (error) {
      console.error('Error al enviar respuesta del desafío:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  }
};

export default studentService;
