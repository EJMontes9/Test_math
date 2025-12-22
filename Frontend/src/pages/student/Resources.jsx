import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Video, Link as LinkIcon, Eye, Search, ExternalLink, Loader2, BookOpen } from 'lucide-react';
import resourceService from '../../services/resourceService';

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

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    loadResources();
  }, [selectedTopic, selectedType]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await resourceService.getStudentResources({
        topic: selectedTopic || undefined,
        resourceType: selectedType || undefined
      });
      if (response.success) {
        setResources(response.data);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResource = async (resource) => {
    try {
      await resourceService.registerView(resource.id);
    } catch (error) {
      console.error('Error registering view:', error);
    }
    window.open(resource.url, '_blank');
  };

  const filteredResources = resources.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Recursos de Estudio</h1>
        <p className="text-gray-500">Material complementario para reforzar tu aprendizaje</p>
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
          <p className="text-gray-500">No hay recursos disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource, index) => {
            const Icon = resourceTypeIcons[resource.resourceType] || FileText;
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative">
                  <Icon className="w-12 h-12 text-white/80" />
                  <div className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded-lg text-white text-xs">
                    {resource.resourceType.toUpperCase()}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-1">{resource.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{resource.description || 'Sin descripcion'}</p>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span>{resource.viewCount} vistas</span>
                    </div>
                    {resource.topicName && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                        {resource.topicName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Por: {resource.teacherName}</p>
                  <button
                    onClick={() => handleOpenResource(resource)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-medium flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
