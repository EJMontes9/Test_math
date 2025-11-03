import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Users, BookOpen, RefreshCw, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import paraleloService from '../../services/paraleloService';
import ParaleloModal from '../../components/modals/ParaleloModal';
import ConfirmModal from '../../components/modals/ConfirmModal';

const Paralelos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paralelos, setParalelos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedParalelo, setSelectedParalelo] = useState(null);
  const [paraleloToDelete, setParaleloToDelete] = useState(null);
  const [error, setError] = useState('');

  // Cargar paralelos y estadísticas
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const filters = {
        status: statusFilter,
        search: searchTerm
      };

      const [paralelosResponse, statsResponse] = await Promise.all([
        paraleloService.getAllParalelos(filters),
        paraleloService.getParaleloStats()
      ]);

      if (paralelosResponse.success) {
        setParalelos(paralelosResponse.data);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar paralelos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Buscar con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCreateParalelo = () => {
    setSelectedParalelo(null);
    setIsModalOpen(true);
  };

  const handleEditParalelo = (paralelo) => {
    setSelectedParalelo(paralelo);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (paralelo) => {
    setParaleloToDelete(paralelo);
    setIsConfirmOpen(true);
  };

  const handleSaveParalelo = async (paraleloData) => {
    try {
      if (selectedParalelo) {
        await paraleloService.updateParalelo(selectedParalelo.id, paraleloData);
      } else {
        await paraleloService.createParalelo(paraleloData);
      }
      loadData();
    } catch (err) {
      console.error('Error al guardar paralelo:', err);
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await paraleloService.deleteParalelo(paraleloToDelete.id);
      setIsConfirmOpen(false);
      setParaleloToDelete(null);
      loadData();
    } catch (err) {
      console.error('Error al eliminar paralelo:', err);
      setError('Error al eliminar paralelo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Paralelos</h1>
            <p className="text-gray-600 text-sm mt-1">
              Crea y asigna docentes a los paralelos
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={loadData}
              className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleCreateParalelo}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Paralelo</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o nivel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
      </motion.div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Paralelos</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Paralelos Activos</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Estudiantes</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Paralelos Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </motion.div>
        </div>
      ) : paralelos.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-500">No se encontraron paralelos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paralelos.map((paralelo, index) => (
            <motion.div
              key={paralelo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{paralelo.name}</h3>
                  <p className="text-sm text-gray-500">{paralelo.level}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  paralelo.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {paralelo.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Teacher */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Tutor Asignado</p>
                <p className="text-sm font-medium text-gray-800">
                  {paralelo.teacher
                    ? `${paralelo.teacher.firstName} ${paralelo.teacher.lastName}`
                    : 'Sin asignar'}
                </p>
              </div>

              {/* Students Count */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {paralelo.studentCount} estudiantes
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEditParalelo(paralelo)}
                  className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDeleteClick(paralelo)}
                  className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ParaleloModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveParalelo}
        paralelo={selectedParalelo}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Paralelo"
        message={`¿Estás seguro de que deseas eliminar el paralelo "${paraleloToDelete?.name}"? Esta acción desactivará el paralelo.`}
      />
    </div>
  );
};

export default Paralelos;
