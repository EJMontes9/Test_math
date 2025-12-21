import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Award,
  TrendingUp,
  Zap,
  BookOpen,
  Filter
} from 'lucide-react';
import studentService from '../../services/studentService';

export default function StudentGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadGoals();
  }, [filter]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? null : filter;
      const response = await studentService.getGoals(status);
      if (response.success) {
        setGoals(response.data);
      }
    } catch (error) {
      console.error('Error al cargar metas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGoalTypeIcon = (type) => {
    switch (type) {
      case 'exercises':
        return <Zap className="w-5 h-5" />;
      case 'accuracy':
        return <Target className="w-5 h-5" />;
      case 'points':
        return <Trophy className="w-5 h-5" />;
      case 'streak':
        return <TrendingUp className="w-5 h-5" />;
      case 'topic_mastery':
        return <BookOpen className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getGoalTypeLabel = (type) => {
    switch (type) {
      case 'exercises':
        return 'Ejercicios';
      case 'accuracy':
        return 'Precisión';
      case 'points':
        return 'Puntos';
      case 'streak':
        return 'Racha';
      case 'topic_mastery':
        return 'Dominio de Tema';
      default:
        return type;
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          label: 'Activa',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Clock className="w-4 h-4" />
        };
      case 'completed':
        return {
          label: 'Completada',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'expired':
        return {
          label: 'Expirada',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="w-4 h-4" />
        };
      case 'upcoming':
        return {
          label: 'Próxima',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Calendar className="w-4 h-4" />
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: null
        };
    }
  };

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'from-green-500 to-green-600';
    if (percent >= 70) return 'from-blue-500 to-blue-600';
    if (percent >= 40) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Estadísticas
  const stats = {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    totalPoints: goals.reduce((sum, g) => sum + g.pointsEarned, 0)
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Mis Metas</h1>
          <p className="text-gray-600 mt-1">
            Cumple tus objetivos y gana recompensas
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white"
        >
          <Target className="w-8 h-8 mb-2 opacity-90" />
          <p className="text-sm opacity-90">Total Metas</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white"
        >
          <Clock className="w-8 h-8 mb-2 opacity-90" />
          <p className="text-sm opacity-90">Activas</p>
          <p className="text-3xl font-bold">{stats.active}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white"
        >
          <CheckCircle className="w-8 h-8 mb-2 opacity-90" />
          <p className="text-sm opacity-90">Completadas</p>
          <p className="text-3xl font-bold">{stats.completed}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-5 text-white"
        >
          <Award className="w-8 h-8 mb-2 opacity-90" />
          <p className="text-sm opacity-90">Puntos Ganados</p>
          <p className="text-3xl font-bold">{stats.totalPoints}</p>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtrar:</span>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Todas' },
              { value: 'active', label: 'Activas' },
              { value: 'completed', label: 'Completadas' },
              { value: 'expired', label: 'Expiradas' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Metas */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No tienes metas asignadas
          </h3>
          <p className="text-gray-600">
            Tu profesor aún no te ha asignado metas. ¡Sigue practicando!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal, index) => {
            const statusConfig = getStatusConfig(goal.status);
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${
                  goal.status === 'completed'
                    ? 'border-green-200'
                    : goal.status === 'active'
                    ? 'border-indigo-200'
                    : 'border-gray-200'
                }`}
              >
                {/* Header de la meta */}
                <div className={`px-6 py-4 ${
                  goal.status === 'completed'
                    ? 'bg-gradient-to-r from-green-50 to-green-100'
                    : goal.status === 'active'
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50'
                    : 'bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        goal.status === 'completed'
                          ? 'bg-green-200 text-green-700'
                          : goal.status === 'active'
                          ? 'bg-indigo-200 text-indigo-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {getGoalTypeIcon(goal.goalType)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{goal.title}</h3>
                        <span className="text-sm text-gray-600">{getGoalTypeLabel(goal.goalType)}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${statusConfig.color}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  {goal.description && (
                    <p className="text-gray-600 mb-4">{goal.description}</p>
                  )}

                  {/* Barra de progreso */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-bold text-gray-900">
                        {goal.currentValue} / {goal.targetValue}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progressPercent}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-4 rounded-full bg-gradient-to-r ${getProgressColor(goal.progressPercent)}`}
                      />
                    </div>
                    <p className="text-right text-sm font-semibold mt-1" style={{
                      color: goal.progressPercent >= 100 ? '#10b981' :
                             goal.progressPercent >= 70 ? '#3b82f6' :
                             goal.progressPercent >= 40 ? '#f59e0b' : '#ef4444'
                    }}>
                      {goal.progressPercent}%
                    </p>
                  </div>

                  {/* Info adicional */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span>Recompensa: <strong className="text-gray-900">{goal.rewardPoints} pts</strong></span>
                    </div>
                    {goal.status === 'active' && goal.daysRemaining > 0 && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span><strong className="text-gray-900">{goal.daysRemaining}</strong> días restantes</span>
                      </div>
                    )}
                    {goal.status === 'completed' && goal.pointsEarned > 0 && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Trophy className="w-4 h-4" />
                        <span>Ganaste <strong>{goal.pointsEarned} pts</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Fechas */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>Inicio: {formatDate(goal.startDate)}</span>
                    <span>Fin: {formatDate(goal.endDate)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
