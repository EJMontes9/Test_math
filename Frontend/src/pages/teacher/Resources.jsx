import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Video,
  Link as LinkIcon,
  Plus,
  X,
  Trash2,
  Edit3,
  Eye,
  Upload,
  Filter,
  Search,
  Loader2,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import resourceService from '../../services/resourceService';
import teacherService from '../../services/teacherService';

const resourceTypeOptions = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'link', label: 'Enlace', icon: LinkIcon }
];

const topicOptions = [
  { value: 'operations', label: 'Operaciones Basicas' },
  { value: 'combined_operations', label: 'Operaciones Combinadas' },
  { value: 'linear_equations', label: 'Ecuaciones Lineales' },
  { value: 'quadratic_equations', label: 'Ecuaciones Cuadraticas' },
  { value: 'fractions', label: 'Fracciones' },
  { value: 'percentages', label: 'Porcentajes' },
  { value: 'geometry', label: 'Geometria' },
  { value: 'algebra', label: 'Algebra' }
];

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [paralelos, setParalelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedParalelo, setSelectedParalelo] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resourceType: 'pdf',
    topic: '',
    url: '',
    paraleloId: '',
    thumbnail: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedTopic, selectedType, selectedParalelo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resourcesRes, paralelosRes] = await Promise.all([
        resourceService.getTeacherResources({
          topic: selectedTopic || undefined,
          resourceType: selectedType || undefined,
          paraleloId: selectedParalelo || undefined
        }),
        teacherService.getMyParalelos()
      ]);

      if (resourcesRes.success) {
        setResources(resourcesRes.data);
      }
      if (paralelosRes.success) {
        setParalelos(paralelosRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const response = await resourceService.uploadFile(file);
      if (response.success) {
        setFormData(prev => ({ ...prev, url: response.data.url }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        resourceType: formData.resourceType,
        topic: formData.topic || null,
        url: formData.url,
        paraleloId: formData.paraleloId || null,
        thumbnail: formData.thumbnail || null
      };

      const response = await resourceService.createResource(payload);
      if (response.success) {
        setShowModal(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      console.error('Error creating resource:', error);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!confirm('Estas seguro de eliminar este recurso?')) return;

    try {
      const response = await resourceService.deleteResource(resourceId);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      resourceType: 'pdf',
      topic: '',
      url: '',
      paraleloId: '',
      thumbnail: ''
    });
  };

  const filteredResources = resources.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getResourceIcon = (type) => {
    const option = resourceTypeOptions.find(o => o.value === type);
    return option ? option.icon : FileText;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recursos</h1>
          <p className="text-gray-600 mt-1">Gestiona material de estudio para tus estudiantes</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Recurso
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Recursos</p>
              <p className="text-xl font-bold text-gray-900">{resources.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">PDFs</p>
              <p className="text-xl font-bold text-gray-900">
                {resources.filter(r => r.resourceType === 'pdf').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Video className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Videos</p>
              <p className="text-xl font-bold text-gray-900">
                {resources.filter(r => r.resourceType === 'video').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Vistas</p>
              <p className="text-xl font-bold text-gray-900">
                {resources.reduce((acc, r) => acc + r.viewCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar recursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por tema */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Todos los temas</option>
            {topicOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Filtro por tipo */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            {resourceTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Filtro por paralelo */}
          <select
            value={selectedParalelo}
            onChange={(e) => setSelectedParalelo(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Todos los paralelos</option>
            {paralelos.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de recursos */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay recursos</h3>
          <p className="text-gray-500 mb-4">Crea tu primer recurso para tus estudiantes</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Crear Recurso
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource, index) => {
            const Icon = getResourceIcon(resource.resourceType);
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail o icono */}
                <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative">
                  {resource.thumbnail ? (
                    <img
                      src={resource.thumbnail}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="w-12 h-12 text-white/80" />
                  )}
                  <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs">
                    {resource.resourceType.toUpperCase()}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{resource.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{resource.description || 'Sin descripcion'}</p>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span>{resource.viewCount} vistas</span>
                    </div>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                      {resource.paraleloName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-medium transition-colors flex items-center justify-center space-x-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Ver</span>
                    </a>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
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

      {/* Modal Crear Recurso */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Nuevo Recurso</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titulo
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Guia de Ecuaciones Lineales"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripcion (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows="2"
                    placeholder="Describe el contenido del recurso..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Recurso
                    </label>
                    <select
                      value={formData.resourceType}
                      onChange={(e) => setFormData({ ...formData, resourceType: e.target.value, url: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {resourceTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tema (opcional)
                    </label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Sin tema especifico</option>
                      {topicOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paralelo (opcional)
                  </label>
                  <select
                    value={formData.paraleloId}
                    onChange={(e) => setFormData({ ...formData, paraleloId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Todos los paralelos</option>
                    {paralelos.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* URL o Upload segun tipo */}
                {formData.resourceType === 'link' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL del Enlace
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="https://..."
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Archivo {formData.resourceType === 'pdf' ? 'PDF' : 'Video'}
                    </label>
                    {formData.url ? (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                        <FileText className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-700 flex-1">Archivo subido</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, url: '' })}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept={formData.resourceType === 'pdf' ? '.pdf' : 'video/*'}
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors"
                        >
                          {uploading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-gray-400" />
                              <span className="text-gray-500">
                                Haz clic para subir {formData.resourceType === 'pdf' ? 'PDF' : 'video'}
                              </span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!formData.url}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Crear Recurso
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
