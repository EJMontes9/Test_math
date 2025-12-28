import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Target, TrendingUp, ArrowRight, RefreshCw, CheckCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import teacherService from '../../services/teacherService';

export default function MyParalelos() {
  const navigate = useNavigate();
  const [paralelos, setParalelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadParalelos();
  }, []);

  const loadParalelos = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await teacherService.getMyParalelos();

      if (response.success) {
        setParalelos(response.data);
      }
    } catch (error) {
      console.error('Error al cargar paralelos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewStudents = (paraleloId) => {
    navigate(`/teacher/paralelo/${paraleloId}/students`);
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
          <h1 className="text-3xl font-bold text-gray-900">Mis Paralelos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus clases y monitorea el progreso de tus estudiantes
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => loadParalelos(false)}
          disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors ${
            refreshing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </motion.button>
      </div>

      {/* Paralelos Grid */}
      {paralelos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-12 text-center border border-gray-100"
        >
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No tienes paralelos asignados
          </h3>
          <p className="text-gray-500">
            Contacta con el administrador para que te asigne paralelos
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paralelos.map((paralelo, index) => (
            <motion.div
              key={paralelo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition-all cursor-pointer"
              onClick={() => handleViewStudents(paralelo.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {paralelo.name}
                  </h3>
                  <p className="text-sm text-gray-500">{paralelo.level}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Description */}
              {paralelo.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {paralelo.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-blue-600 font-medium">
                      Estudiantes
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {paralelo.activeStudents}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">
                      Ejercicios
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {paralelo.totalExercises}
                  </p>
                </div>
              </div>

              {/* Precisión promedio */}
              {paralelo.avgAccuracy > 0 && (
                <div className="bg-purple-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-purple-600 font-medium">
                        Precisión promedio
                      </span>
                    </div>
                    <p className="text-lg font-bold text-purple-900">
                      {paralelo.avgAccuracy}%
                    </p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    Participación
                  </span>
                  <span className="font-semibold text-gray-900">
                    {paralelo.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${paralelo.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {paralelo.progress > 0
                    ? `${Math.round(paralelo.activeStudents * paralelo.progress / 100)} de ${paralelo.activeStudents} estudiantes han practicado`
                    : 'Ningún estudiante ha practicado aún'
                  }
                </p>
              </div>

              {/* Action Button */}
              <motion.button
                whileHover={{ x: 5 }}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700"
              >
                <span>Ver estudiantes</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
