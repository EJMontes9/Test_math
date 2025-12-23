import api from './api';

const badgeService = {
  // Obtener todas las insignias disponibles
  getAllBadges: async () => {
    try {
      const response = await api.get('/student/badges/all');
      return response.data;
    } catch (error) {
      console.error('Error al obtener insignias:', error);
      // Datos mock para demo
      return {
        success: true,
        data: [
          { id: 1, name: 'Primer Paso', description: 'Completa tu primer ejercicio', icon: '🎯', rarity: 'common' },
          { id: 2, name: 'En Racha', description: 'Completa 5 ejercicios seguidos', icon: '🔥', rarity: 'common' },
          { id: 3, name: 'Matematico', description: 'Resuelve 50 ejercicios', icon: '🧮', rarity: 'rare' },
          { id: 4, name: 'Perfeccionista', description: '10 respuestas correctas seguidas', icon: '💎', rarity: 'rare' },
          { id: 5, name: 'Maestro', description: 'Completa 200 ejercicios', icon: '🏆', rarity: 'epic' },
          { id: 6, name: 'Velocista', description: 'Responde en menos de 5 segundos', icon: '⚡', rarity: 'epic' },
          { id: 7, name: 'Leyenda', description: '100% precision en 50 ejercicios', icon: '👑', rarity: 'legendary' }
        ]
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
      // Datos mock para demo
      return {
        success: true,
        data: [
          { id: 1, badgeId: 1, name: 'Primer Paso', description: 'Completa tu primer ejercicio', icon: '🎯', rarity: 'common', isEquipped: false, earnedAt: new Date().toISOString() },
          { id: 2, badgeId: 2, name: 'En Racha', description: 'Completa 5 ejercicios seguidos', icon: '🔥', rarity: 'common', isEquipped: true, earnedAt: new Date().toISOString() }
        ]
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
