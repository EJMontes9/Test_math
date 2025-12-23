import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Plus,
  Calendar,
  Users,
  Trophy,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Trash2,
  Eye,
  Filter,
  Award,
  Zap,
  BarChart3
} from 'lucide-react';
import teacherService from '../../services/teacherService';

const GOAL_TYPES = {
  exercises: { label: 'Ejercicios', icon: Zap, color: 'blue' },
  accuracy: { label: 'Precisión', icon: Target, color: 'green' },
  points: { label: 'Puntos', icon: Trophy, color: 'yellow' },
  streak: { label: 'Racha', icon: TrendingUp, color: 'orange' },
  topic_mastery: { label: 'Dominio de Tema', icon: Award, color: 'purple' }
};

const MATH_TOPICS = {
  operations: 'Operaciones Básicas',
  combined_operations: 'Operaciones Combinadas',
  linear_equations: 'Ecuaciones Lineales',
  quadratic_equations: 'Ecuaciones Cuadráticas',
  fractions: 'Fracciones',
  percentages: 'Porcentajes',
  geometry: 'Geometría',
  algebra: 'Álgebra General'
};

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [paralelos, setParalelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalStudents, setGoalStudents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [paraleloFilter, setParaleloFilter] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalType: 'exercises',
    targetValue: 10,
    topic: '',
    rewardPoints: 100,
    paraleloId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [filter, paraleloFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsRes, paralelosRes] = await Promise.all([
        teacherService.getGoals(paraleloFilter || null, filter !== 'all' ? filter : null),
        teacherService.getMyParalelos()
      ]);

      if (goalsRes.success) {
        setGoals(goalsRes.data);
      }
      if (paralelosRes.success) {
        setParalelos(paralelosRes.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      const goalPayload = {
        title: formData.title,
        description: formData.description,
        goalType: formData.goalType,
        targetValue: parseInt(formData.targetValue),
        topic: formData.goalType === 'topic_mastery' ? formData.topic : null,
        rewardPoints: parseInt(formData.rewardPoints),
        paraleloId: formData.paraleloId || null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };

      const response = await teacherService.createGoal(goalPayload);
      if (response.success) {
        setShowModal(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      console.error('Error al crear meta:', error);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('¿Estás seguro de eliminar esta meta?')) return;

    try {
      const response = await teacherService.deleteGoal(goalId);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error al eliminar meta:', error);
    }
  };

  const handleViewGoalDetail = async (goal) => {
    setSelectedGoal(goal);
    try {
      const response = await teacherService.getGoalStudents(goal.id);
      if (response.success) {
        setGoalStudents(response.data.students);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
    }
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      goalType: 'exercises',
      targetValue: 10,
      topic: '',
      rewardPoints: 100,
      paraleloId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      active: 'Activa',
      upcoming: 'Próxima',
      expired: 'Expirada'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getGoalTypeInfo = (type) => {
    return GOAL_TYPES[type] || GOAL_TYPES.exercises;
  };

  // Stats
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const totalStudentsAssigned = goals.reduce((acc, g) => acc + g.totalAssigned, 0);
  const avgCompletion = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + g.avgProgress, 0) / goals.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metas</h1>
          <p className="text-gray-600 mt-1">Crea y gestiona metas para tus estudiantes</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Meta
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Metas Activas</p>
              <p className="text-2xl font-bold text-gray-900">{activeGoals}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Estudiantes Asignados</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudentsAssigned}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Progreso Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{avgCompletion}%</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-200">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0"
          >
            <option value="all">Todas las metas</option>
            <option value="active">Activas</option>
            <option value="upcoming">Próximas</option>
            <option value="expired">Expiradas</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-200">
          <Users className="w-4 h-4 text-gray-500" />
          <select
            value={paraleloFilter}
            onChange={(e) => setParaleloFilter(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0"
          >
            <option value="">Todos los paralelos</option>
            {paralelos.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {goals.map((goal, index) => {
            const typeInfo = getGoalTypeInfo(goal.goalType);
            const TypeIcon = typeInfo.icon;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-${typeInfo.color}-100`}>
                      <TypeIcon className={`w-6 h-6 text-${typeInfo.color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{goal.title}</h3>
                      <p className="text-sm text-gray-500">{goal.paraleloName}</p>
                    </div>
                  </div>
                  {getStatusBadge(goal.status)}
                </div>

                {goal.description && (
                  <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                )}

                <div className="space-y-3">
                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progreso promedio</span>
                      <span className="font-semibold text-gray-900">{goal.avgProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${goal.avgProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Target className="w-4 h-4" />
                      <span>{goal.targetValue} {typeInfo.label.toLowerCase()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{goal.completedCount}/{goal.totalAssigned}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Trophy className="w-4 h-4" />
                      <span>{goal.rewardPoints} pts</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(goal.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      {' - '}
                      {new Date(goal.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewGoalDetail(goal)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalle
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay metas</h3>
          <p className="text-gray-500 mb-4">Crea tu primera meta para motivar a tus estudiantes</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Crear Meta
          </motion.button>
        </div>
      )}

      {/* Create Goal Modal */}
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
                  <h2 className="text-xl font-bold text-gray-900">Nueva Meta</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título de la Meta
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Completar 20 ejercicios esta semana"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows="2"
                    placeholder="Describe el objetivo de esta meta..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Meta
                    </label>
                    <select
                      value={formData.goalType}
                      onChange={(e) => setFormData({ ...formData, goalType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {Object.entries(GOAL_TYPES).map(([key, value]) => (
                        <option key={key} value={key}>{value.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Objetivo
                    </label>
                    <input
                      type="number"
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {formData.goalType === 'topic_mastery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tema Matemático
                    </label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleccionar tema</option>
                      {Object.entries(MATH_TOPICS).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puntos de Recompensa
                    </label>
                    <input
                      type="number"
                      value={formData.rewardPoints}
                      onChange={(e) => setFormData({ ...formData, rewardPoints: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paralelo
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Crear Meta
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedGoal.title}</h2>
                    <p className="text-sm text-gray-500">{selectedGoal.paraleloName}</p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Goal Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedGoal.totalAssigned}</p>
                    <p className="text-xs text-blue-600">Asignados</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedGoal.completedCount}</p>
                    <p className="text-xs text-green-600">Completaron</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedGoal.avgProgress}%</p>
                    <p className="text-xs text-purple-600">Promedio</p>
                  </div>
                </div>

                {/* Students List */}
                <h3 className="font-bold text-gray-900 mb-4">Progreso de Estudiantes</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {goalStudents.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                student.status === 'completed'
                                  ? 'bg-green-500'
                                  : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                              }`}
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 min-w-[60px]">
                            {student.currentValue}/{student.targetValue}
                          </span>
                        </div>
                      </div>
                      {student.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </motion.div>
                  ))}
                </div>

                {goalStudents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay estudiantes asignados a esta meta
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
