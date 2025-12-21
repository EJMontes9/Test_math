import api from './api';

const resourceService = {
  // ======= Endpoints del Profesor =======

  // Obtener recursos del profesor
  getTeacherResources: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.topic) params.append('topic', filters.topic);
    if (filters.resourceType) params.append('resource_type', filters.resourceType);
    if (filters.paraleloId) params.append('paralelo_id', filters.paraleloId);

    const response = await api.get(`/resources/teacher?${params.toString()}`);
    return response.data;
  },

  // Crear un nuevo recurso
  createResource: async (resourceData) => {
    const response = await api.post('/resources/', resourceData);
    return response.data;
  },

  // Subir archivo (PDF o video)
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/resources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Actualizar recurso
  updateResource: async (resourceId, resourceData) => {
    const response = await api.put(`/resources/${resourceId}`, resourceData);
    return response.data;
  },

  // Eliminar recurso
  deleteResource: async (resourceId) => {
    const response = await api.delete(`/resources/${resourceId}`);
    return response.data;
  },

  // ======= Endpoints del Estudiante =======

  // Obtener recursos disponibles para el estudiante
  getStudentResources: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.topic) params.append('topic', filters.topic);
    if (filters.resourceType) params.append('resource_type', filters.resourceType);

    const response = await api.get(`/resources/student?${params.toString()}`);
    return response.data;
  },

  // Registrar visualización de un recurso
  registerView: async (resourceId) => {
    const response = await api.post(`/resources/${resourceId}/view`);
    return response.data;
  }
};

export default resourceService;
