import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Clock, Users, Play, CheckCircle, Loader2, Crown, Target } from 'lucide-react';
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
      alert(error.message || 'Error al unirse al desafio');
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
  const wonChallenges = challenges.filter(c => c.status === 'completed' && c.isWinner).length;

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
        <h1 className="text-2xl font-bold text-gray-800">Desafios</h1>
        <p className="text-gray-500">Compite contra otros estudiantes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Swords className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Disponibles</p>
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
          Disponibles
        </button>
        <button
          onClick={() => setFilter('my')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'my' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'
          }`}
        >
          Mis Desafios
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

      {/* Lista de desafios */}
      {challenges.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Swords className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay desafios</h3>
          <p className="text-gray-500">
            {filter === 'available'
              ? 'No hay desafios disponibles en este momento'
              : filter === 'my'
              ? 'No te has unido a ningun desafio'
              : 'No has completado ningun desafio'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {challenges.map((challenge, index) => {
              const statusInfo = getStatusInfo(challenge.status);
              const StatusIcon = statusInfo.icon;

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-xl p-5 border shadow-sm ${
                    challenge.isWinner ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-100'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        challenge.isWinner ? 'bg-yellow-100' : 'bg-indigo-100'
                      }`}>
                        {challenge.isWinner ? (
                          <Crown className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <Swords className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{challenge.title}</h3>
                        <p className="text-xs text-gray-500">
                          {challenge.topic ? challenge.topicName : 'Tema mixto'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {challenge.description && (
                    <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                  )}

                  {/* Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{challenge.numExercises} ejercicios</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{challenge.participantCount}/{challenge.maxParticipants}</span>
                    </div>
                    {challenge.timeLimit && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{challenge.timeLimit} min</span>
                      </div>
                    )}
                  </div>

                  {/* Participantes */}
                  {challenge.participants && challenge.participants.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Participantes:</p>
                      <div className="flex flex-wrap gap-2">
                        {challenge.participants.map((p, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              p.isWinner
                                ? 'bg-yellow-100 text-yellow-700'
                                : p.isMe
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {p.isWinner && <Crown className="w-3 h-3" />}
                            <span>{p.name}</span>
                            {challenge.status !== 'pending' && (
                              <span className="font-bold">{p.score} pts</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  {challenge.status === 'pending' && !challenge.hasJoined && (
                    <button
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={joining === challenge.id || challenge.participantCount >= challenge.maxParticipants}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {joining === challenge.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          Unirme
                        </>
                      )}
                    </button>
                  )}

                  {challenge.status === 'active' && challenge.hasJoined && (
                    <button
                      onClick={() => handlePlayChallenge(challenge.id)}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Jugar Desafio
                    </button>
                  )}

                  {challenge.status === 'completed' && challenge.isWinner && (
                    <div className="flex items-center justify-center gap-2 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
                      <Trophy className="w-5 h-5" />
                      <span className="font-bold">Ganaste!</span>
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
