import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trophy, Clock, CheckCircle, AlertCircle, Filter, Loader2, Award } from 'lucide-react';
import studentService from '../../services/studentService';

const GOAL_TYPE_LABELS = {
  exercises: 'Ejercicios',
  accuracy: 'Precision',
  points: 'Puntos',
  streak: 'Racha',
  topic_mastery: 'Dominio de Tema'
};

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadGoals();
  }, [filter]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await studentService.getGoals(filter !== 'all' ? filter : null);
      if (response.success) {
        setGoals(response.data);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Activa' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completada' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Expirada' }
    };
    const style = styles[status] || styles.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  // Estadisticas
  const totalGoals = goals.length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const totalPointsEarned = goals.reduce((acc, g) => acc + (g.pointsEarned || 0), 0);

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
        <h1 className="text-2xl font-bold text-gray-800">Mis Metas</h1>
        <p className="text-gray-500">Completa metas para ganar puntos extra</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{totalGoals}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Activas</p>
              <p className="text-xl font-bold text-gray-900">{activeGoals}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completadas</p>
              <p className="text-xl font-bold text-gray-900">{completedGoals}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Puntos Ganados</p>
              <p className="text-xl font-bold text-gray-900">{totalPointsEarned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-200 w-fit">
        <Filter className="w-4 h-4 text-gray-500 ml-2" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-transparent border-none text-sm focus:ring-0"
        >
          <option value="all">Todas las metas</option>
          <option value="active">Activas</option>
          <option value="completed">Completadas</option>
          <option value="expired">Expiradas</option>
        </select>
      </div>

      {/* Lista de metas */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay metas</h3>
          <p className="text-gray-500">Tu profesor aun no ha asignado metas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl p-5 border shadow-sm ${
                  goal.status === 'completed' ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      goal.status === 'completed' ? 'bg-green-100' : 'bg-indigo-100'
                    }`}>
                      {goal.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Target className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{goal.title}</h3>
                      <p className="text-xs text-gray-500">
                        {GOAL_TYPE_LABELS[goal.goalType]} - {goal.targetValue} objetivo
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(goal.status)}
                </div>

                {goal.description && (
                  <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                )}

                {/* Barra de progreso */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progreso</span>
                    <span className="font-semibold text-gray-900">
                      {goal.currentValue}/{goal.targetValue} ({goal.progress}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(goal.progress, 100)}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`h-3 rounded-full ${getProgressColor(goal.progress)}`}
                    />
                  </div>
                </div>

                {/* Info adicional */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>
                      {goal.status === 'active' && goal.daysRemaining !== undefined
                        ? `${goal.daysRemaining} dias restantes`
                        : goal.status === 'completed'
                        ? 'Completada'
                        : 'Expirada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Trophy className="w-4 h-4" />
                    <span>{goal.rewardPoints} pts</span>
                  </div>
                </div>

                {goal.status === 'completed' && goal.pointsEarned > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Award className="w-5 h-5" />
                      <span className="font-bold">+{goal.pointsEarned} puntos ganados!</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
