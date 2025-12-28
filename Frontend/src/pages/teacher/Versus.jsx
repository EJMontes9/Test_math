import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Plus,
  Play,
  Square,
  Trophy,
  Users,
  Clock,
  Zap,
  X,
  Trash2,
  CheckCircle,
  Filter,
  Crown,
  ArrowRight,
  Target
} from 'lucide-react';
import teacherService from '../../services/teacherService';

const CHALLENGE_STATUS = {
  pending: { label: 'Pendiente', color: 'yellow', icon: Clock },
  active: { label: 'En Curso', color: 'green', icon: Play },
  completed: { label: 'Finalizada', color: 'blue', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'gray', icon: X }
};

const MATH_TOPICS = {
  operations: 'Operaciones Basicas',
  combined_operations: 'Operaciones Combinadas',
  linear_equations: 'Ecuaciones Lineales',
  quadratic_equations: 'Ecuaciones Cuadraticas',
  fractions: 'Fracciones',
  percentages: 'Porcentajes',
  geometry: 'Geometria',
  algebra: 'Algebra General'
};

const DIFFICULTIES = {
  easy: 'Facil',
  medium: 'Medio',
  hard: 'Dificil'
};

export default function Versus() {
  const [challenges, setChallenges] = useState([]);
  const [paralelos, setParalelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    paralelo1Id: '',
    paralelo2Id: '',
    topic: '',
    difficulty: '',
    numExercises: 10,
    timeLimit: 0
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [challengesRes, paralelosRes] = await Promise.all([
        teacherService.getChallenges(null, filter !== 'all' ? filter : null),
        teacherService.getMyParalelos()
      ]);

      if (challengesRes.success) {
        setChallenges(challengesRes.data);
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

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      const timeLimitValue = parseInt(formData.timeLimit);
      const challengePayload = {
        title: formData.title,
        description: formData.description || null,
        paralelo1Id: formData.paralelo1Id,
        paralelo2Id: formData.paralelo2Id,
        topic: formData.topic || null,
        difficulty: formData.difficulty || null,
        numExercises: parseInt(formData.numExercises) || 10,
        timeLimit: timeLimitValue > 0 ? timeLimitValue : null
      };

      const response = await teacherService.createChallenge(challengePayload);
      if (response.success) {
        setShowModal(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      console.error('Error al crear competencia:', error);
      alert(error.detail || 'Error al crear la competencia');
    }
  };

  const handleStartChallenge = async (challengeId) => {
    try {
      const response = await teacherService.startChallenge(challengeId);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      alert(error.detail || 'Error al iniciar competencia');
    }
  };

  const handleEndChallenge = async (challengeId) => {
    if (!confirm('Estas seguro de finalizar esta competencia?')) return;

    try {
      const response = await teacherService.endChallenge(challengeId);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error al finalizar competencia:', error);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!confirm('Estas seguro de eliminar esta competencia?')) return;

    try {
      const response = await teacherService.deleteChallenge(challengeId);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error al eliminar competencia:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      paralelo1Id: '',
      paralelo2Id: '',
      topic: '',
      difficulty: '',
      numExercises: 10,
      timeLimit: 0
    });
  };

  const getStatusInfo = (status) => {
    return CHALLENGE_STATUS[status] || CHALLENGE_STATUS.pending;
  };

  // Stats
  const activeChallenges = challenges.filter(c => c.status === 'active').length;
  const completedChallenges = challenges.filter(c => c.status === 'completed').length;
  const totalParticipants = challenges.reduce((acc, c) => acc + (c.totalParticipants || 0), 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Versus</h1>
          <p className="text-gray-600 mt-1">Crea competencias entre paralelos</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          disabled={paralelos.length < 2}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Nueva Competencia
        </motion.button>
      </div>

      {paralelos.length < 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800">
          <p className="font-medium">Necesitas al menos 2 paralelos para crear una competencia entre ellos.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En Curso</p>
              <p className="text-2xl font-bold text-gray-900">{activeChallenges}</p>
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
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Finalizadas</p>
              <p className="text-2xl font-bold text-gray-900">{completedChallenges}</p>
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
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Participantes</p>
              <p className="text-2xl font-bold text-gray-900">{totalParticipants}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-200 w-fit">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-transparent border-none text-sm focus:ring-0"
        >
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="active">En Curso</option>
          <option value="completed">Finalizadas</option>
        </select>
      </div>

      {/* Challenges List */}
      <div className="space-y-6">
        <AnimatePresence>
          {challenges.map((challenge, index) => {
            const statusInfo = getStatusInfo(challenge.status);
            const StatusIcon = statusInfo.icon;
            const isParalelo1Winner = challenge.winnerParaleloId === challenge.paralelo1Id;
            const isParalelo2Winner = challenge.winnerParaleloId === challenge.paralelo2Id;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                        <Swords className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{challenge.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <span>{challenge.paralelo1Name}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span>vs</span>
                          <ArrowRight className="w-4 h-4" />
                          <span>{challenge.paralelo2Name}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </div>

                  {challenge.description && (
                    <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                  )}

                  {/* Challenge Info */}
                  <div className="flex flex-wrap gap-3 text-sm">
                    {challenge.topic && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Zap className="w-4 h-4" />
                        <span>{MATH_TOPICS[challenge.topic]}</span>
                      </div>
                    )}
                    {challenge.difficulty && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        challenge.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {DIFFICULTIES[challenge.difficulty]}
                      </span>
                    )}
                    {!challenge.topic && !challenge.difficulty && (
                      <span className="text-gray-500">Tema y dificultad mixtos</span>
                    )}
                    <div className="flex items-center gap-1 text-gray-600">
                      <Target className="w-4 h-4" />
                      <span>{challenge.numExercises || 10} ejercicios</span>
                    </div>
                    {challenge.timeLimit > 0 && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{challenge.timeLimit} min</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Paralelos vs Paralelos */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Paralelo 1 */}
                    <div className={`rounded-xl p-4 ${isParalelo1Winner ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isParalelo1Winner && <Crown className="w-5 h-5 text-yellow-500" />}
                          <h4 className="font-bold text-gray-900">{challenge.paralelo1Name}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">{challenge.paralelo1Score || 0}</p>
                          <p className="text-xs text-gray-500">puntos</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {challenge.paralelo1ParticipantCount || 0} participantes
                      </p>
                      {/* Top 3 estudiantes */}
                      <div className="space-y-1">
                        {(challenge.paralelo1Participants || []).slice(0, 3).map((p, idx) => (
                          <div key={p.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                idx === 1 ? 'bg-gray-300 text-gray-700' :
                                'bg-orange-300 text-orange-900'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="text-gray-700">{p.firstName} {p.lastName}</span>
                            </div>
                            <span className="font-medium text-indigo-600">{p.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Paralelo 2 */}
                    <div className={`rounded-xl p-4 ${isParalelo2Winner ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isParalelo2Winner && <Crown className="w-5 h-5 text-yellow-500" />}
                          <h4 className="font-bold text-gray-900">{challenge.paralelo2Name}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">{challenge.paralelo2Score || 0}</p>
                          <p className="text-xs text-gray-500">puntos</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {challenge.paralelo2ParticipantCount || 0} participantes
                      </p>
                      {/* Top 3 estudiantes */}
                      <div className="space-y-1">
                        {(challenge.paralelo2Participants || []).slice(0, 3).map((p, idx) => (
                          <div key={p.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                idx === 1 ? 'bg-gray-300 text-gray-700' :
                                'bg-orange-300 text-orange-900'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="text-gray-700">{p.firstName} {p.lastName}</span>
                            </div>
                            <span className="font-medium text-purple-600">{p.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Winner Banner */}
                  {challenge.status === 'completed' && challenge.winnerParaleloName && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-50 border border-yellow-200">
                      <div className="flex items-center justify-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-600" />
                        <span className="text-lg font-bold text-yellow-800">
                          Ganador: {challenge.winnerParaleloName}
                        </span>
                        <Trophy className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  )}

                  {challenge.status === 'completed' && !challenge.winnerParaleloId && (
                    <div className="mt-4 p-4 rounded-xl bg-gray-100 border border-gray-200 text-center">
                      <span className="text-lg font-bold text-gray-600">Empate</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex items-center gap-2">
                  {challenge.status === 'pending' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStartChallenge(challenge.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Iniciar Competencia
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteChallenge(challenge.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </>
                  )}

                  {challenge.status === 'active' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEndChallenge(challenge.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                    >
                      <Square className="w-4 h-4" />
                      Finalizar Competencia
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {challenges.length === 0 && (
        <div className="text-center py-12">
          <Swords className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay competencias</h3>
          <p className="text-gray-500 mb-4">Crea tu primera competencia entre paralelos</p>
          {paralelos.length >= 2 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Crear Competencia
            </motion.button>
          )}
        </div>
      )}

      {/* Create Challenge Modal */}
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
                  <h2 className="text-xl font-bold text-gray-900">Nueva Competencia entre Paralelos</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateChallenge} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titulo de la Competencia
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Gran Batalla Matematica"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripcion (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows="2"
                    placeholder="Describe la competencia..."
                  />
                </div>

                {/* Seleccion de Paralelos */}
                <div className="bg-indigo-50 rounded-xl p-4 space-y-4">
                  <h3 className="font-medium text-indigo-900 flex items-center gap-2">
                    <Swords className="w-5 h-5" />
                    Paralelos que Competiran
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paralelo 1
                      </label>
                      <select
                        value={formData.paralelo1Id}
                        onChange={(e) => setFormData({ ...formData, paralelo1Id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {paralelos.filter(p => p.id !== formData.paralelo2Id).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paralelo 2
                      </label>
                      <select
                        value={formData.paralelo2Id}
                        onChange={(e) => setFormData({ ...formData, paralelo2Id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {paralelos.filter(p => p.id !== formData.paralelo1Id).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.paralelo1Id && formData.paralelo2Id && (
                    <div className="flex items-center justify-center gap-3 text-indigo-700 font-medium">
                      <span>{paralelos.find(p => p.id === formData.paralelo1Id)?.name}</span>
                      <span className="text-xl">vs</span>
                      <span>{paralelos.find(p => p.id === formData.paralelo2Id)?.name}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tema (opcional)
                    </label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Todos los temas</option>
                      {Object.entries(MATH_TOPICS).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dificultad (opcional)
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Mixta</option>
                      {Object.entries(DIFFICULTIES).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ejercicios y Tiempo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ejercicios por estudiante
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.numExercises}
                      onChange={(e) => setFormData({ ...formData, numExercises: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Cantidad de ejercicios que cada estudiante debe resolver</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiempo límite (minutos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = sin límite de tiempo</p>
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
                    disabled={!formData.paralelo1Id || !formData.paralelo2Id}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Crear Competencia
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
