import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  TrendingUp,
  Zap,
  Award,
  BookOpen,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Play,
  BarChart3,
  Flame
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import studentService from '../../services/studentService';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [statsResponse, recsResponse] = await Promise.all([
        studentService.getStats(),
        studentService.getRecommendations()
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (recsResponse.success) {
        setRecommendations(recsResponse.data.recommendations);
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Lightbulb className="w-6 h-6 text-blue-600" />;
    }
  };

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200';
      case 'success':
        return 'bg-gradient-to-br from-green-50 to-green-100 border-green-200';
      default:
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200';
    }
  };

  const getMasteryColor = (level) => {
    if (level < 30) return 'text-red-600';
    if (level < 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getMasteryLabel = (level) => {
    if (level < 30) return 'Principiante';
    if (level < 60) return 'Intermedio';
    if (level < 80) return 'Avanzado';
    return 'Maestro';
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
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Hola, {user.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Aquí está tu progreso y recomendaciones personalizadas
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/student/game')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
        >
          <Play className="w-5 h-5" />
          ¡Jugar Ahora!
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <Trophy className="w-10 h-10 mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Mejor Puntuación</p>
          <p className="text-4xl font-bold">{stats?.general?.best_score || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <BarChart3 className="w-10 h-10 mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Total Puntos</p>
          <p className="text-4xl font-bold">{stats?.general?.total_score || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <Target className="w-10 h-10 mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Tasa de Acierto</p>
          <p className="text-4xl font-bold">{stats?.general?.accuracy || 0}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <Zap className="w-10 h-10 mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Ejercicios Completados</p>
          <p className="text-4xl font-bold">{stats?.general?.total_attempts || 0}</p>
        </motion.div>
      </div>

      {/* Recomendaciones IA */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Recomendaciones Personalizadas
              </h2>
              <p className="text-sm text-gray-600">
                Basadas en tu rendimiento y progreso
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`p-5 rounded-xl border-2 ${getRecommendationColor(rec.type)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getRecommendationIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-2 text-lg">
                      {rec.title}
                    </h3>
                    <p className="text-gray-700 mb-3">{rec.message}</p>

                    {rec.suggested_topic && rec.action === 'practice' && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/student/game')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 rounded-lg font-semibold text-sm shadow-sm transition-colors border border-gray-200"
                      >
                        <Play className="w-4 h-4" />
                        Practicar Ahora
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Progreso por Tema */}
      {stats?.topics && stats.topics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Tu Progreso por Tema
              </h2>
              <p className="text-sm text-gray-600">
                Nivel de dominio en cada área
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.topics.map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className={`p-5 rounded-xl border-2 ${
                  topic.needs_improvement
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {topic.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {topic.total_attempts} ejercicios • {topic.accuracy}% acierto
                    </p>
                  </div>
                  {topic.needs_improvement && (
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  )}
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Nivel de Dominio</span>
                    <span className={`font-bold ${getMasteryColor(topic.mastery_level)}`}>
                      {getMasteryLabel(topic.mastery_level)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.mastery_level}%` }}
                      transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                      className={`h-3 rounded-full ${
                        topic.mastery_level < 30
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : topic.mastery_level < 60
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                          : 'bg-gradient-to-r from-green-500 to-green-600'
                      }`}
                    ></motion.div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={`font-bold ${getMasteryColor(topic.mastery_level)}`}>
                    {topic.mastery_level}%
                  </span>
                  {topic.needs_improvement && (
                    <span className="text-orange-600 font-semibold">
                      Necesita práctica
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">¿Listo para el desafío?</h2>
            <p className="text-indigo-100 text-lg">
              Pon a prueba tus conocimientos y sube en el ranking
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/student/game')}
            className="bg-white text-indigo-600 p-6 rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            <Play className="w-8 h-8" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
