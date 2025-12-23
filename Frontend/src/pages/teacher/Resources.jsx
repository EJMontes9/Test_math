import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Video, Link as LinkIcon, Plus, Search, Edit2, Trash2, Eye, Loader2, BookOpen, X, Upload, ExternalLink } from 'lucide-react';
import resourceService from '../../services/resourceService';
import { getConfiguredApiUrl } from '../../services/api';

const resourceTypeIcons = {
  pdf: FileText,
  video: Video,
  link: LinkIcon
};

const topicLabels = {
  operations: 'Operaciones Basicas',
  combined_operations: 'Operaciones Combinadas',
  linear_equations: 'Ecuaciones Lineales',
  quadratic_equations: 'Ecuaciones Cuadraticas',
  fractions: 'Fracciones',
  percentages: 'Porcentajes',
  geometry: 'Geometria',
  algebra: 'Algebra'
};

// Funcion para extraer ID de video de YouTube
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Funcion para verificar si es una URL de YouTube
const isYouTubeUrl = (url) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Componente para visor de recursos
const ResourceViewer = ({ resource, onClose }) => {
  const apiUrl = getConfiguredApiUrl().replace('/api', '');

  const renderContent = () => {
    if (resource.resourceType === 'video' || isYouTubeUrl(resource.url)) {
      const videoId = getYouTubeVideoId(resource.url);
      if (videoId) {
        return (
          <div className="w-full aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={resource.title}
            />
          </div>
        );
      }
    }

    if (resource.resourceType === 'pdf') {
      // Si es un archivo local subido
      const pdfUrl = resource.url.startsWith('/api/files/')
        ? `${apiUrl}${resource.url}`
        : resource.url;

      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full rounded-lg border border-gray-200"
            title={resource.title}
          />
        </div>
      );
    }

    // Para links externos, mostrar en iframe si es posible
    return (
      <div className="text-center py-8">
        <ExternalLink className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Este recurso es un enlace externo</p>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <ExternalLink className="w-5 h-5" />
          Abrir en nueva pestana
        </a>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{resource.title}</h2>
            {resource.description && (
              <p className="text-sm text-gray-500">{resource.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {renderContent()}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewingResource, setViewingResource] = useState(null);
  const [uploadMode, setUploadMode] = useState('link'); // 'link' or 'file'
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    resourceType: 'link',
    topic: ''
  });

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await resourceService.getTeacherResources();
      if (response.success) {
        setResources(response.data);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (resource = null) => {
    if (resource) {
      setEditingResource(resource);
      setUploadMode('link');
      setFormData({
        title: resource.title,
        description: resource.description || '',
        url: resource.url,
        resourceType: resource.resourceType,
        topic: resource.topic || ''
      });
    } else {
      setEditingResource(null);
      setUploadMode('link');
      setSelectedFile(null);
      setFormData({
        title: '',
        description: '',
        url: '',
        resourceType: 'link',
        topic: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingResource(null);
    setSelectedFile(null);
    setUploadMode('link');
    setFormData({
      title: '',
      description: '',
      url: '',
      resourceType: 'link',
      topic: ''
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande (maximo 10MB)');
        return;
      }
      setSelectedFile(file);
      if (!formData.title) {
        setFormData({ ...formData, title: file.name.replace('.pdf', '') });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      if (uploadMode === 'file' && selectedFile && !editingResource) {
        // Subir archivo
        await resourceService.uploadFile(
          selectedFile,
          formData.title,
          formData.description,
          formData.topic
        );
      } else if (editingResource) {
        await resourceService.updateResource(editingResource.id, formData);
      } else {
        // Detectar automaticamente si es YouTube
        let resourceType = formData.resourceType;
        if (isYouTubeUrl(formData.url)) {
          resourceType = 'video';
        }
        await resourceService.createResource({ ...formData, resourceType });
      }

      handleCloseModal();
      loadResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      alert(error.message || 'Error al guardar recurso');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!confirm('Estas seguro de eliminar este recurso?')) return;
    try {
      await resourceService.deleteResource(resourceId);
      loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert(error.message || 'Error al eliminar recurso');
    }
  };

  const handleView = (resource) => {
    setViewingResource(resource);
    resourceService.registerView(resource.id).catch(() => {});
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = !selectedTopic || r.topic === selectedTopic;
    const matchesType = !selectedType || r.resourceType === selectedType;
    return matchesSearch && matchesTopic && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recursos Educativos</h1>
          <p className="text-gray-500">Gestiona material complementario para tus estudiantes</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Recurso
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar recursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los temas</option>
            {Object.entries(topicLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los tipos</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
            <option value="link">Enlace</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay recursos</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Crear primer recurso
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource, index) => {
            const Icon = resourceTypeIcons[resource.resourceType] || FileText;
            const isYouTube = isYouTubeUrl(resource.url);
            const videoId = isYouTube ? getYouTubeVideoId(resource.url) : null;

            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail */}
                <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                  {isYouTube && videoId ? (
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="w-12 h-12 text-white/80" />
                  )}
                  <div className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded-lg text-white text-xs backdrop-blur-sm">
                    {resource.resourceType.toUpperCase()}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-1 truncate">{resource.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{resource.description || 'Sin descripcion'}</p>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span>{resource.viewCount || 0} vistas</span>
                    </div>
                    {resource.topic && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                        {topicLabels[resource.topic] || resource.topic}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(resource)}
                      className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-medium flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </button>
                    <button
                      onClick={() => handleOpenModal(resource)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de Visor */}
      <AnimatePresence>
        {viewingResource && (
          <ResourceViewer
            resource={viewingResource}
            onClose={() => setViewingResource(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal de Crear/Editar */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
                </h2>
                <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selector de modo (solo para nuevo) */}
              {!editingResource && (
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setUploadMode('link')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      uploadMode === 'link'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    URL / Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      uploadMode === 'file'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Subir PDF
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>

                {uploadMode === 'file' && !editingResource ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Archivo PDF</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        {selectedFile ? (
                          <div className="flex items-center justify-center gap-2 text-indigo-600">
                            <FileText className="w-6 h-6" />
                            <span className="font-medium">{selectedFile.name}</span>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">
                              Haz clic para seleccionar un PDF
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Maximo 10MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL del Recurso
                      <span className="text-gray-400 font-normal ml-1">(YouTube, PDF, o enlace)</span>
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://..."
                      required={uploadMode === 'link' || editingResource}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {(uploadMode === 'link' || editingResource) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <select
                        value={formData.resourceType}
                        onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="link">Enlace</option>
                        <option value="pdf">PDF</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  )}
                  <div className={uploadMode === 'file' && !editingResource ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">General</option>
                      {Object.entries(topicLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || (uploadMode === 'file' && !selectedFile && !editingResource)}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
