import api from './api';

const settingService = {
  // Obtener configuraciones públicas (sin autenticación)
  getPublicSettings: async () => {
    try {
      const response = await api.get('/settings/public');
      return response.data;
    } catch (error) {
      console.error('Error al obtener configuraciones públicas:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener todas las configuraciones (requiere autenticación admin)
  getAllSettings: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error al obtener configuraciones:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener una configuración específica
  getSetting: async (key) => {
    try {
      const response = await api.get(`/settings/${key}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Actualizar una configuración
  updateSetting: async (key, value, type, category, description) => {
    try {
      const response = await api.put(`/settings/${key}`, {
        value,
        type,
        category,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Actualizar múltiples configuraciones
  updateMultipleSettings: async (settings) => {
    try {
      const response = await api.post('/settings/bulk', { settings });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar configuraciones:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Inicializar configuraciones por defecto
  initializeDefaults: async () => {
    try {
      const response = await api.post('/settings/initialize');
      return response.data;
    } catch (error) {
      console.error('Error al inicializar configuraciones:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Subir logo
  uploadLogo: async (file) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post('/settings/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al subir logo:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  }
};

export default settingService;
