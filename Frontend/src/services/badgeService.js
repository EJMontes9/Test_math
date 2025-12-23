import api from './api';

const badgeService = {
  // Obtener todas las insignias disponibles
  getAllBadges: async () => {
    try {
      const response = await api.get('/student/badges/all');
      return response.data;
    } catch (error) {
      console.error('Error al obtener insignias:', error);
      return {
        success: false,
        data: []
      };
    }
  },

  // Obtener mis insignias desbloqueadas
  getMyBadges: async () => {
    try {
      const response = await api.get('/student/badges');
      return response.data;
    } catch (error) {
      console.error('Error al obtener mis insignias:', error);
      return {
        success: false,
        data: []
      };
    }
  },

  // Verificar logros pendientes
  checkAchievements: async () => {
    try {
      const response = await api.post('/student/badges/check');
      return response.data;
    } catch (error) {
      console.error('Error al verificar logros:', error);
      return { success: true, data: { newBadges: [] } };
    }
  },

  // Equipar una insignia
  equipBadge: async (badgeId) => {
    try {
      const response = await api.post(`/student/badges/${badgeId}/equip`);
      return response.data;
    } catch (error) {
      console.error('Error al equipar insignia:', error);
      return { success: true };
    }
  },

  // Desequipar insignia
  unequipBadge: async () => {
    try {
      const response = await api.post('/student/badges/unequip');
      return response.data;
    } catch (error) {
      console.error('Error al desequipar insignia:', error);
      return { success: true };
    }
  }
};

export default badgeService;
