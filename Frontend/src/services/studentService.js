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
  }
};

export default studentService;
