import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import teacherService from '../../services/teacherService';

export default function StudentDetail() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const paraleloId = searchParams.get('paraleloId');

  const [student, setStudent] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [progressChart, setProgressChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentStats();
  }, [studentId, paraleloId]);

  const loadStudentStats = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getStudentStats(studentId, paraleloId);

      if (response.success) {
        setStudent(response.data.student);
        setStatistics(response.data.statistics);
        setRecentAttempts(response.data.recentAttempts);
        setRecommendations(response.data.recommendations);
        setPeakHours(response.data.peakHours);
        setProgressChart(response.data.progressChart);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
    }
  };

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      <div>
        <button
          onClick={() =>
            paraleloId
              ? navigate(`/teacher/paralelo/${paraleloId}/students`)
              : navigate('/teacher/paralelos')
          }
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {student?.firstName.charAt(0)}
            {student?.lastName.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {student?.firstName} {student?.lastName}
            </h1>
            <p className="text-gray-600">{student?.email}</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <BarChart3 className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Total Intentos</p>
          <p className="text-3xl font-bold">{statistics?.totalAttempts || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
        >
          <CheckCircle className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Tasa de Acierto</p>
          <p className="text-3xl font-bold">{statistics?.accuracy || 0}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
        >
          <Clock className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Tiempo Promedio</p>
          <p className="text-3xl font-bold">
            {Math.floor((statistics?.averageTime || 0) / 60)}
            <span className="text-lg">min</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
        >
          <Trophy className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Puntos Totales</p>
          <p className="text-3xl font-bold">{statistics?.totalPoints || 0}</p>
        </motion.div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            Recomendaciones
          </h2>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`flex items-start gap-3 p-4 rounded-lg border ${getRecommendationColor(
                  rec.type
                )}`}
              >
                {getRecommendationIcon(rec.type)}
                <p className="text-sm text-gray-700 flex-1">{rec.message}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Peak Hours */}
      {peakHours.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            Horas Más Activas
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {peakHours.map((peak, index) => (
              <div
                key={index}
                className="bg-indigo-50 rounded-lg p-4 text-center"
              >
                <p className="text-2xl font-bold text-indigo-900">
                  {peak.hour}:00
                </p>
                <p className="text-sm text-indigo-600 mt-1">
                  {peak.attempts} intentos
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Progress Chart */}
      {progressChart.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Progreso Últimos 7 Días
          </h2>
          <div className="space-y-3">
            {progressChart.map((day, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                        style={{ width: `${day.accuracy}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 min-w-[50px]">
                      {day.accuracy}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>{day.correct} correctos</span>
                    <span>•</span>
                    <span>{day.total} intentos</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Attempts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Últimos Intentos</h2>
        </div>

        {recentAttempts.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay intentos registrados
            </h3>
            <p className="text-gray-500">
              El estudiante aún no ha completado ejercicios
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentAttempts.map((attempt, index) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {attempt.exerciseTitle}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {attempt.question}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full font-medium ${getDifficultyColor(
                          attempt.difficulty
                        )}`}
                      >
                        {attempt.difficulty === 'easy'
                          ? 'Fácil'
                          : attempt.difficulty === 'medium'
                          ? 'Medio'
                          : 'Difícil'}
                      </span>
                      <span className="text-gray-500">
                        {new Date(attempt.attemptedAt).toLocaleDateString(
                          'es-ES',
                          {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          }
                        )}
                      </span>
                      {attempt.timeTaken && (
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.floor(attempt.timeTaken / 60)}:
                          {(attempt.timeTaken % 60)
                            .toString()
                            .padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        attempt.isCorrect
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {attempt.isCorrect ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="text-sm font-semibold">
                        {attempt.isCorrect ? 'Correcto' : 'Incorrecto'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Trophy className="w-4 h-4" />
                        <span className="font-bold">{attempt.pointsEarned}</span>
                      </div>
                      <span className="text-xs text-gray-500">puntos</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Respuesta del estudiante:
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {attempt.studentAnswer}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Respuesta correcta:
                    </p>
                    <p className="text-sm font-medium text-green-700">
                      {attempt.correctAnswer}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
