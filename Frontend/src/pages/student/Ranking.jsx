import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, TrendingUp, Zap, Target } from 'lucide-react';
import studentService from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';

export default function Ranking() {
  const { user } = useAuth();
  const [rankingData, setRankingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const response = await studentService.getRanking();

      if (response.success) {
        setRankingData(response.data);
      }
    } catch (error) {
      console.error('Error al cargar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Medal className="w-8 h-8 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-blue-400 to-blue-600';
    }
  };

  const getPositionSuffix = (rank) => {
    if (rank === 1) return 'er';
    if (rank === 2) return 'do';
    if (rank === 3) return 'er';
    return 'to';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const currentUserRanking = rankingData?.ranking?.find((r) => r.is_current_user);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="inline-block mb-4"
        >
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full p-6">
            <Trophy className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Tabla de Clasificación
        </h1>
        <p className="text-xl text-gray-600">
          {rankingData?.paralelo?.name || 'Tu clase'}
        </p>
      </div>

      {/* Tu Posición */}
      {currentUserRanking && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-2xl font-bold">
                #{currentUserRanking.rank}
              </div>
              <div>
                <p className="text-sm opacity-90">Tu Posición</p>
                <p className="text-3xl font-bold">
                  {currentUserRanking.rank}
                  {getPositionSuffix(currentUserRanking.rank)} Lugar
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Puntuación Total</p>
              <p className="text-4xl font-bold">{currentUserRanking.total_score}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top 3 Podio */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {rankingData?.ranking?.slice(0, 3).map((student, index) => {
          const actualIndex = [1, 0, 2][index]; // Orden: 2do, 1ro, 3ro
          const actualStudent = rankingData.ranking[actualIndex];

          if (!actualStudent) return null;

          return (
            <motion.div
              key={actualStudent.student_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`relative ${index === 1 ? 'order-1' : index === 0 ? 'order-0' : 'order-2'}`}
            >
              <div
                className={`bg-white rounded-2xl shadow-lg p-6 text-center border-4 ${
                  actualStudent.is_current_user
                    ? 'border-indigo-500 ring-4 ring-indigo-200'
                    : 'border-transparent'
                } ${index === 1 ? 'transform scale-110 z-10' : ''}`}
              >
                {/* Rank Badge */}
                <div
                  className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br ${getRankColor(
                    actualStudent.rank
                  )} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-white`}
                >
                  {actualStudent.rank}
                </div>

                {/* Medal/Crown */}
                <div className="mt-4 mb-4">
                  {getMedalIcon(actualStudent.rank)}
                </div>

                {/* Avatar */}
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {actualStudent.name.split(' ').map((n) => n[0]).join('')}
                </div>

                {/* Name */}
                <h3 className="font-bold text-gray-900 mb-2 truncate">
                  {actualStudent.name}
                </h3>

                {/* Score */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Puntos</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {actualStudent.total_score}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Ejercicios</p>
                    <p className="font-bold text-gray-700">
                      {actualStudent.exercises_completed}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Correctos</p>
                    <p className="font-bold text-green-600">
                      {actualStudent.correct_answers}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Resto del Ranking */}
      {rankingData?.ranking?.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Clasificación Completa</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {rankingData.ranking.slice(3).map((student, index) => (
              <motion.div
                key={student.student_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  student.is_current_user
                    ? 'bg-indigo-50 border-l-4 border-indigo-500'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Rank */}
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-bold">
                      {student.rank}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {student.name.split(' ').map((n) => n[0]).join('')}
                    </div>

                    {/* Name */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {student.name}
                        {student.is_current_user && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
                            Tú
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          {student.exercises_completed} ejercicios
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-green-600" />
                          {student.correct_answers} correctos
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Puntos</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {student.total_score}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!rankingData?.ranking || rankingData.ranking.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No hay estudiantes en el ranking aún
          </h3>
          <p className="text-gray-500">
            ¡Sé el primero en jugar y aparecer en la tabla de clasificación!
          </p>
        </div>
      )}
    </div>
  );
}
