import api from './api';

const badgeService = {
  // Obtener todas las insignias disponibles
  getAllBadges: async () => {
    const response = await api.get('/badges/');
    return response.data;
  },

  // Obtener insignias del estudiante actual
  getMyBadges: async () => {
    const response = await api.get('/badges/my-badges');
    return response.data;
  },

  // Obtener la insignia equipada de un estudiante
  getEquippedBadge: async (studentId = null) => {
    const url = studentId ? `/badges/equipped?student_id=${studentId}` : '/badges/equipped';
    const response = await api.get(url);
    return response.data;
  },

  // Equipar una insignia
  equipBadge: async (badgeId) => {
    const response = await api.post(`/badges/equip/${badgeId}`);
    return response.data;
  },

  // Desequipar insignia actual
  unequipBadge: async () => {
    const response = await api.post('/badges/unequip');
    return response.data;
  },

  // Verificar y otorgar nuevas insignias
  checkAchievements: async () => {
    const response = await api.post('/badges/check-achievements');
    return response.data;
  },

  // Admin: Crear insignia
  createBadge: async (badgeData) => {
    const response = await api.post('/badges/', badgeData);
    return response.data;
  },

  // Admin: Actualizar insignia
  updateBadge: async (badgeId, badgeData) => {
    const response = await api.put(`/badges/${badgeId}`, badgeData);
    return response.data;
  },

  // Admin: Eliminar insignia
  deleteBadge: async (badgeId) => {
    const response = await api.delete(`/badges/${badgeId}`);
    return response.data;
  },

  // Admin: Inicializar insignias por defecto
  initializeDefaults: async () => {
    const response = await api.post('/badges/initialize-defaults');
    return response.data;
  }
};

export default badgeService;
