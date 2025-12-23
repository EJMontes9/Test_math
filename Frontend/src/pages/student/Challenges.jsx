import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Clock, Users, Play, CheckCircle, Loader2, Crown, Target, Zap } from 'lucide-react';
import studentService from '../../services/studentService';

export default function Challenges() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [filter, setFilter] = useState('available');

  useEffect(() => {
    loadChallenges();
  }, [filter]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const response = await studentService.getChallenges(filter);
      if (response.success) {
        setChallenges(response.data);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      setJoining(challengeId);
      const response = await studentService.joinChallenge(challengeId);
      if (response.success) {
        loadChallenges();
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      alert(error.message || 'Error al unirse al versus');
    } finally {
      setJoining(null);
    }
  };

  const handlePlayChallenge = (challengeId) => {
    navigate(`/student/game?challenge=${challengeId}`);
  };

  const getStatusInfo = (status) => {
    const info = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      active: { label: 'En Curso', color: 'bg-green-100 text-green-700', icon: Play },
      completed: { label: 'Finalizado', color: 'bg-gray-100 text-gray-700', icon: CheckCircle }
    };
    return info[status] || info.pending;
  };

  // Estadisticas
  const availableChallenges = challenges.filter(c => c.status === 'pending' || c.status === 'active').length;
  const completedChallenges = challenges.filter(c => c.status === 'completed').length;
  const wonChallenges = challenges.filter(c => c.status === 'completed' && c.isWinnerParalelo).length;

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
        <h1 className="text-2xl font-bold text-gray-800">Versus</h1>
        <p className="text-gray-500">Compite con tu paralelo contra otros paralelos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Swords className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Activos</p>
              <p className="text-xl font-bold text-gray-900">{availableChallenges}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completados</p>
              <p className="text-xl font-bold text-gray-900">{completedChallenges}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Victorias</p>
              <p className="text-xl font-bold text-gray-900">{wonChallenges}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setFilter('available')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'available' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'
          }`}
        >
          Activos
        </button>
        <button
          onClick={() => setFilter('my')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'my' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'
          }`}
        >
          Mis Versus
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'completed' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'
          }`}
        >
          Finalizados
        </button>
      </div>

      {/* Lista de versus */}
      {challenges.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Swords className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay versus</h3>
          <p className="text-gray-500">
            {filter === 'available'
              ? 'No hay versus activos en este momento'
              : filter === 'my'
              ? 'No te has unido a ningun versus'
              : 'No hay versus finalizados'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {challenges.map((challenge, index) => {
              const statusInfo = getStatusInfo(challenge.status);
              const StatusIcon = statusInfo.icon;
              const paralelo1 = challenge.paralelo1;
              const paralelo2 = challenge.paralelo2;

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-xl p-5 border shadow-sm ${
                    challenge.isWinnerParalelo ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-100'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        challenge.isWinnerParalelo ? 'bg-yellow-100' : 'bg-indigo-100'
                      }`}>
                        {challenge.isWinnerParalelo ? (
                          <Crown className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <Swords className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{challenge.title}</h3>
                        <p className="text-xs text-gray-500">
                          {challenge.topicName || 'Tema mixto'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {challenge.description && (
                    <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
                  )}

                  {/* Versus Card - Paralelo vs Paralelo */}
                  <div className="bg-gradient-to-r from-blue-50 via-gray-50 to-red-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      {/* Paralelo 1 */}
                      <div className={`flex-1 text-center ${paralelo1?.isMyParalelo ? 'relative' : ''}`}>
                        {paralelo1?.isMyParalelo && (
                          <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                            Tu paralelo
                          </span>
                        )}
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                          paralelo1?.isWinner ? 'bg-yellow-200' : paralelo1?.isMyParalelo ? 'bg-blue-200' : 'bg-gray-200'
                        }`}>
                          {paralelo1?.isWinner && <Crown className="w-6 h-6 text-yellow-600" />}
                          {!paralelo1?.isWinner && <Users className="w-6 h-6 text-gray-600" />}
                        </div>
                        <h4 className={`font-bold ${paralelo1?.isMyParalelo ? 'text-blue-700' : 'text-gray-800'}`}>
                          {paralelo1?.name || 'Sin asignar'}
                        </h4>
                        <p className={`text-2xl font-bold mt-1 ${
                          paralelo1?.isWinner ? 'text-yellow-600' : paralelo1?.isMyParalelo ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          {paralelo1?.score || 0}
                        </p>
                        <p className="text-xs text-gray-500">{paralelo1?.participantCount || 0} participantes</p>
                      </div>

                      {/* VS Badge */}
                      <div className="px-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">VS</span>
                        </div>
                      </div>

                      {/* Paralelo 2 */}
                      <div className={`flex-1 text-center ${paralelo2?.isMyParalelo ? 'relative' : ''}`}>
                        {paralelo2?.isMyParalelo && (
                          <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                            Tu paralelo
                          </span>
                        )}
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                          paralelo2?.isWinner ? 'bg-yellow-200' : paralelo2?.isMyParalelo ? 'bg-red-200' : 'bg-gray-200'
                        }`}>
                          {paralelo2?.isWinner && <Crown className="w-6 h-6 text-yellow-600" />}
                          {!paralelo2?.isWinner && <Users className="w-6 h-6 text-gray-600" />}
                        </div>
                        <h4 className={`font-bold ${paralelo2?.isMyParalelo ? 'text-red-700' : 'text-gray-800'}`}>
                          {paralelo2?.name || 'Sin asignar'}
                        </h4>
                        <p className={`text-2xl font-bold mt-1 ${
                          paralelo2?.isWinner ? 'text-yellow-600' : paralelo2?.isMyParalelo ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          {paralelo2?.score || 0}
                        </p>
                        <p className="text-xs text-gray-500">{paralelo2?.participantCount || 0} participantes</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(challenge.status === 'active' || challenge.status === 'completed') && (
                      <div className="mt-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                          {(() => {
                            const total = (paralelo1?.score || 0) + (paralelo2?.score || 0);
                            const p1Percent = total > 0 ? ((paralelo1?.score || 0) / total) * 100 : 50;
                            return (
                              <>
                                <div
                                  className="h-full bg-blue-500 transition-all duration-500"
                                  style={{ width: `${p1Percent}%` }}
                                />
                                <div
                                  className="h-full bg-red-500 transition-all duration-500"
                                  style={{ width: `${100 - p1Percent}%` }}
                                />
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{challenge.numExercises} ejercicios</span>
                    </div>
                    {challenge.timeLimit && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{challenge.timeLimit} min</span>
                      </div>
                    )}
                    {challenge.hasJoined && (
                      <div className="flex items-center gap-1 text-indigo-600">
                        <Zap className="w-4 h-4" />
                        <span>Tu puntuacion: {challenge.myScore || 0} pts</span>
                      </div>
                    )}
                  </div>

                  {/* Mi progreso si estoy participando */}
                  {challenge.hasJoined && challenge.status === 'active' && (
                    <div className="bg-indigo-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-indigo-700">Tu progreso:</span>
                        <span className="font-bold text-indigo-800">
                          {challenge.myExercisesCompleted || 0} / {challenge.numExercises} ejercicios
                        </span>
                      </div>
                      <div className="w-full bg-indigo-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${((challenge.myExercisesCompleted || 0) / challenge.numExercises) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  {challenge.status === 'pending' && !challenge.hasJoined && (
                    <button
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={joining === challenge.id}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {joining === challenge.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          Unirme al Versus
                        </>
                      )}
                    </button>
                  )}

                  {challenge.status === 'active' && challenge.hasJoined && !challenge.myHasFinished && (
                    <button
                      onClick={() => handlePlayChallenge(challenge.id)}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {challenge.myExercisesCompleted > 0 ? 'Continuar Jugando' : 'Comenzar a Jugar'}
                    </button>
                  )}

                  {challenge.status === 'active' && challenge.hasJoined && challenge.myHasFinished && (
                    <div className="flex items-center justify-center gap-2 py-2 bg-green-100 text-green-700 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Has completado tus ejercicios</span>
                    </div>
                  )}

                  {challenge.status === 'completed' && challenge.isWinnerParalelo && (
                    <div className="flex items-center justify-center gap-2 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
                      <Trophy className="w-5 h-5" />
                      <span className="font-bold">Tu paralelo gano!</span>
                    </div>
                  )}

                  {challenge.status === 'completed' && !challenge.isWinnerParalelo && (
                    <div className="flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-600 rounded-lg">
                      <span className="font-medium">Versus finalizado</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
