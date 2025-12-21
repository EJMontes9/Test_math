import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Swords,
  Users,
  Trophy,
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  Target,
  Zap,
  Medal,
  Crown,
  Filter,
  UserPlus
} from 'lucide-react';
import studentService from '../../services/studentService';

export default function StudentChallenges() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    loadChallenges();
  }, [filter]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? null : filter;
      const response = await studentService.getChallenges(status);
      if (response.success) {
        setChallenges(response.data);
      }
    } catch (error) {
      console.error('Error al cargar desafíos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      setJoiningId(challengeId);
      const response = await studentService.joinChallenge(challengeId);
      if (response.success) {
        loadChallenges();
      }
    } catch (error) {
      console.error('Error al unirse:', error);
      alert(error.message || 'Error al unirse al desafío');
    } finally {
      setJoiningId(null);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Esperando',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-4 h-4" />,
          bgGradient: 'from-yellow-50 to-orange-50'
        };
      case 'active':
        return {
          label: 'En Curso',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Play className="w-4 h-4" />,
          bgGradient: 'from-green-50 to-emerald-50'
        };
      case 'completed':
        return {
          label: 'Finalizado',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <CheckCircle className="w-4 h-4" />,
          bgGradient: 'from-blue-50 to-indigo-50'
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: null,
          bgGradient: 'from-gray-50 to-gray-100'
        };
    }
  };

  const getDifficultyConfig = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return { label: 'Fácil', color: 'text-green-600 bg-green-100' };
      case 'medium':
        return { label: 'Medio', color: 'text-yellow-600 bg-yellow-100' };
      case 'hard':
        return { label: 'Difícil', color: 'text-red-600 bg-red-100' };
      default:
        return { label: 'Mixta', color: 'text-gray-600 bg-gray-100' };
    }
  };

  const getTopicLabel = (topic) => {
    const topics = {
      operations: 'Operaciones',
      combined_operations: 'Op. Combinadas',
      linear_equations: 'Ec. Lineales',
      quadratic_equations: 'Ec. Cuadráticas',
      fractions: 'Fracciones',
      percentages: 'Porcentajes',
      geometry: 'Geometría',
      algebra: 'Álgebra'
    };
    return topics[topic] || 'Varios';
  };

  // Estadísticas
  const stats = {
    total: challenges.length,
    participating: challenges.filter(c => c.isParticipating).length,
    won: challenges.filter(c => c.status === 'completed' && c.participants.some(p => p.isCurrentUser && p.rank === 1)).length,
    active: challenges.filter(c => c.status === 'active' && c.isParticipating).length
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
          <h1 className="text-3xl font-bold text-gray-900">Desafíos</h1>
          <p className="text-gray-600 mt-1">
            Compite contra otros estudiantes y demuestra tus habilidades
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white"
        >
          <Swords className="w-8 h-8 mb-2 opacity-90" />
          <p className="text-sm opacity-90">Desafíos Disponibles</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white"
        >
          <Play className="w-8 h-8 mb-2 opacity-90" />
          <p className="text-sm opacity-90">En Curso</p>
          <p className="text-3xl font-bold">{stats.active}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white"
        >
          <Users className="w-8 h-8 mb-2 opacity-90" />
          <p className="text-sm opacity-90">Participando</p>
          <p className="text-3xl font-bold">{stats.participating}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-5 text-white"
        >
          <Trophy className="w-8 h-8 mb-2 opacity-90" />
          <p className="text-sm opacity-90">Victorias</p>
          <p className="text-3xl font-bold">{stats.won}</p>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtrar:</span>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'pending', label: 'Esperando' },
              { value: 'active', label: 'En Curso' },
              { value: 'completed', label: 'Finalizados' },
              { value: 'my', label: 'Mis Desafíos' }
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

      {/* Lista de Desafíos */}
      {challenges.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Swords className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No hay desafíos disponibles
          </h3>
          <p className="text-gray-600">
            Tu profesor aún no ha creado desafíos. ¡Mantente atento!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {challenges.map((challenge, index) => {
            const statusConfig = getStatusConfig(challenge.status);
            const difficultyConfig = getDifficultyConfig(challenge.difficulty);
            const myParticipation = challenge.participants.find(p => p.isCurrentUser);

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${
                  challenge.isParticipating
                    ? 'border-indigo-200'
                    : 'border-gray-200'
                }`}
              >
                {/* Header */}
                <div className={`px-6 py-4 bg-gradient-to-r ${statusConfig.bgGradient}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${
                        challenge.status === 'active'
                          ? 'bg-green-200 text-green-700'
                          : challenge.status === 'completed'
                          ? 'bg-blue-200 text-blue-700'
                          : 'bg-yellow-200 text-yellow-700'
                      }`}>
                        <Swords className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{challenge.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyConfig.color}`}>
                            {difficultyConfig.label}
                          </span>
                          {challenge.topic && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-600">
                              {getTopicLabel(challenge.topic)}
                            </span>
                          )}
                        </div>
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
                  {challenge.description && (
                    <p className="text-gray-600 mb-4">{challenge.description}</p>
                  )}

                  {/* Info del desafío */}
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Zap className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
                      <p className="font-bold text-gray-900">{challenge.numExercises}</p>
                      <p className="text-gray-500 text-xs">Ejercicios</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Users className="w-5 h-5 mx-auto mb-1 text-green-500" />
                      <p className="font-bold text-gray-900">
                        {challenge.currentParticipants}/{challenge.maxParticipants}
                      </p>
                      <p className="text-gray-500 text-xs">Participantes</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                      <p className="font-bold text-gray-900">
                        {challenge.timeLimit ? `${challenge.timeLimit} min` : 'Sin límite'}
                      </p>
                      <p className="text-gray-500 text-xs">Tiempo</p>
                    </div>
                  </div>

                  {/* Participantes / Ranking */}
                  {challenge.participants.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2 text-sm">
                        {challenge.status === 'completed' ? 'Resultados' : 'Participantes'}
                      </h4>
                      <div className="space-y-2">
                        {challenge.participants.slice(0, 3).map((p, idx) => (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              p.isCurrentUser
                                ? 'bg-indigo-50 border border-indigo-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {challenge.status === 'completed' && idx === 0 && (
                                <Crown className="w-5 h-5 text-yellow-500" />
                              )}
                              {challenge.status === 'completed' && idx === 1 && (
                                <Medal className="w-5 h-5 text-gray-400" />
                              )}
                              {challenge.status === 'completed' && idx === 2 && (
                                <Medal className="w-5 h-5 text-amber-600" />
                              )}
                              {(challenge.status !== 'completed' || idx > 2) && (
                                <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500">
                                  {idx + 1}
                                </span>
                              )}
                              <span className={`font-medium ${p.isCurrentUser ? 'text-indigo-700' : 'text-gray-700'}`}>
                                {p.name} {p.isCurrentUser && '(Tú)'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-gray-600">{p.score} pts</span>
                              {p.hasFinished && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mi progreso si participo */}
                  {challenge.isParticipating && challenge.status === 'active' && (
                    <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-indigo-700">Tu progreso</span>
                        <span className="font-bold text-indigo-900">
                          {challenge.myProgress}/{challenge.numExercises} ejercicios
                        </span>
                      </div>
                      <div className="w-full bg-indigo-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${(challenge.myProgress / challenge.numExercises) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-indigo-600 mt-2">
                        Puntuación actual: <strong>{challenge.myScore} pts</strong>
                      </p>
                    </div>
                  )}

                  {/* Ganador */}
                  {challenge.status === 'completed' && challenge.winnerName && (
                    <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center gap-3">
                      <Trophy className="w-8 h-8 text-yellow-500" />
                      <div>
                        <p className="text-sm text-yellow-700">Ganador</p>
                        <p className="font-bold text-yellow-800">{challenge.winnerName}</p>
                      </div>
                    </div>
                  )}

                  {/* Botón de acción */}
                  {challenge.status === 'pending' && !challenge.isParticipating && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={joiningId === challenge.id}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {joiningId === challenge.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Unirse al Desafío
                        </>
                      )}
                    </motion.button>
                  )}

                  {challenge.isParticipating && challenge.status === 'pending' && (
                    <div className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5" />
                      Esperando más participantes...
                    </div>
                  )}

                  {challenge.isParticipating && challenge.status === 'active' && !challenge.hasFinished && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/student/game`)}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                    >
                      <Play className="w-5 h-5" />
                      Continuar Jugando
                    </motion.button>
                  )}

                  {challenge.isParticipating && challenge.hasFinished && (
                    <div className="w-full py-3 bg-blue-100 text-blue-700 rounded-xl font-semibold flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Desafío Completado
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
