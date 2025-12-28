import api from './api';

const resourceService = {
  // ============= TEACHER RESOURCES =============

  // Subir archivo PDF
  uploadFile: async (file, title, description, topic, paraleloId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || '');
      formData.append('description', description || '');
      formData.append('topic', topic || '');
      formData.append('paralelo_id', paraleloId || '');

      const response = await api.post('/teacher/resources/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw error.response?.data || { success: false, message: 'Error al subir archivo' };
    }
  },

  // Obtener recursos del profesor
  getTeacherResources: async (filters = {}) => {
    try {
      let params = [];
      if (filters.topic) params.push(`topic=${filters.topic}`);
      if (filters.resourceType) params.push(`resource_type=${filters.resourceType}`);
      const queryString = params.length > 0 ? `?${params.join('&')}` : '';
      const response = await api.get(`/teacher/resources${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener recursos:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Crear recurso
  createResource: async (resourceData) => {
    try {
      const response = await api.post('/teacher/resources', resourceData);
      return response.data;
    } catch (error) {
      console.error('Error al crear recurso:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Actualizar recurso
  updateResource: async (resourceId, resourceData) => {
    try {
      const response = await api.put(`/teacher/resources/${resourceId}`, resourceData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar recurso:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Eliminar recurso
  deleteResource: async (resourceId) => {
    try {
      const response = await api.delete(`/teacher/resources/${resourceId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar recurso:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ============= STUDENT RESOURCES =============

  // Obtener recursos para estudiantes
  getStudentResources: async (filters = {}) => {
    try {
      let params = [];
      if (filters.topic) params.push(`topic=${filters.topic}`);
      if (filters.resourceType) params.push(`resource_type=${filters.resourceType}`);
      const queryString = params.length > 0 ? `?${params.join('&')}` : '';
      const response = await api.get(`/student/resources${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener recursos:', error);
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // Registrar vista de recurso
  registerView: async (resourceId) => {
    try {
      const response = await api.post(`/student/resources/${resourceId}/view`);
      return response.data;
    } catch (error) {
      console.error('Error al registrar vista:', error);
      // No lanzar error, solo loguear
      return { success: false };
    }
  }
};

export default resourceService;
