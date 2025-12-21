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
  Target,
  Zap,
  X,
  Trash2,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Filter,
  Crown,
  Medal
} from 'lucide-react';
import teacherService from '../../services/teacherService';

const CHALLENGE_STATUS = {
  pending: { label: 'Pendiente', color: 'yellow', icon: Clock },
  active: { label: 'En Curso', color: 'green', icon: Play },
  completed: { label: 'Finalizada', color: 'blue', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'gray', icon: X }
};

const MATH_TOPICS = {
  operations: 'Operaciones Básicas',
  combined_operations: 'Operaciones Combinadas',
  linear_equations: 'Ecuaciones Lineales',
  quadratic_equations: 'Ecuaciones Cuadráticas',
  fractions: 'Fracciones',
  percentages: 'Porcentajes',
  geometry: 'Geometría',
  algebra: 'Álgebra General'
};

const DIFFICULTIES = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil'
};

export default function Versus() {
  const [challenges, setChallenges] = useState([]);
  const [paralelos, setParalelos] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [filter, setFilter] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    paraleloId: '',
    topic: '',
    difficulty: '',
    numExercises: 10,
    timeLimit: '',
    maxParticipants: 2,
    studentIds: []
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

  const loadStudents = async (paraleloId) => {
    if (!paraleloId) {
      setStudents([]);
      return;
    }
    try {
      const response = await teacherService.getParaleloStudents(paraleloId);
      if (response.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
    }
  };

  const handleParaleloChange = (paraleloId) => {
    setFormData({ ...formData, paraleloId, studentIds: [] });
    loadStudents(paraleloId);
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      const challengePayload = {
        title: formData.title,
        description: formData.description || null,
        paraleloId: formData.paraleloId || null,
        topic: formData.topic || null,
        difficulty: formData.difficulty || null,
        numExercises: parseInt(formData.numExercises),
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
        maxParticipants: parseInt(formData.maxParticipants),
        studentIds: formData.studentIds
      };

      const response = await teacherService.createChallenge(challengePayload);
      if (response.success) {
        setShowModal(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      console.error('Error al crear competencia:', error);
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
    if (!confirm('¿Estás seguro de finalizar esta competencia?')) return;

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
    if (!confirm('¿Estás seguro de eliminar esta competencia?')) return;

    try {
      const response = await teacherService.deleteChallenge(challengeId);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error al eliminar competencia:', error);
    }
  };

  const handleAddParticipant = async (studentId) => {
    if (!selectedChallenge) return;

    try {
      const response = await teacherService.addChallengeParticipant(selectedChallenge.id, studentId);
      if (response.success) {
        setShowAddStudentModal(false);
        setSelectedChallenge(null);
        loadData();
      }
    } catch (error) {
      alert(error.detail || 'Error al agregar participante');
    }
  };

  const openAddStudentModal = async (challenge) => {
    setSelectedChallenge(challenge);
    if (challenge.paraleloId) {
      await loadStudents(challenge.paraleloId);
    }
    setShowAddStudentModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      paraleloId: '',
      topic: '',
      difficulty: '',
      numExercises: 10,
      timeLimit: '',
      maxParticipants: 2,
      studentIds: []
    });
    setStudents([]);
  };

  const toggleStudentSelection = (studentId) => {
    const currentIds = formData.studentIds;
    if (currentIds.includes(studentId)) {
      setFormData({
        ...formData,
        studentIds: currentIds.filter(id => id !== studentId)
      });
    } else if (currentIds.length < formData.maxParticipants) {
      setFormData({
        ...formData,
        studentIds: [...currentIds, studentId]
      });
    }
  };

  const getStatusInfo = (status) => {
    return CHALLENGE_STATUS[status] || CHALLENGE_STATUS.pending;
  };

  // Stats
  const activeChallenges = challenges.filter(c => c.status === 'active').length;
  const completedChallenges = challenges.filter(c => c.status === 'completed').length;
  const totalParticipants = challenges.reduce((acc, c) => acc + c.participantCount, 0);

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
          <p className="text-gray-600 mt-1">Crea competencias entre estudiantes</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Competencia
        </motion.button>
      </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <h3 className="font-bold text-gray-900">{challenge.title}</h3>
                        <p className="text-sm text-gray-500">{challenge.paraleloName}</p>
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
                    <div className="flex items-center gap-1 text-gray-600">
                      <Target className="w-4 h-4" />
                      <span>{challenge.numExercises} ejercicios</span>
                    </div>
                    {challenge.timeLimit && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{challenge.timeLimit} min</span>
                      </div>
                    )}
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
                  </div>
                </div>

                {/* Participants */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      Participantes ({challenge.participantCount}/{challenge.maxParticipants})
                    </h4>
                    {challenge.status === 'pending' && challenge.participantCount < challenge.maxParticipants && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openAddStudentModal(challenge)}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                      >
                        <UserPlus className="w-4 h-4" />
                        Agregar
                      </motion.button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {challenge.participants.map((participant, pIndex) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {participant.firstName.charAt(0)}{participant.lastName.charAt(0)}
                            </div>
                            {challenge.status === 'completed' && participant.studentId === challenge.winnerId && (
                              <div className="absolute -top-1 -right-1">
                                <Crown className="w-4 h-4 text-yellow-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {participant.firstName} {participant.lastName}
                            </p>
                            {challenge.status !== 'pending' && (
                              <p className="text-xs text-gray-500">
                                {participant.correctAnswers}/{participant.exercisesCompleted} correctas
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600">{participant.score}</p>
                          <p className="text-xs text-gray-500">puntos</p>
                        </div>
                      </div>
                    ))}

                    {challenge.participants.length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No hay participantes
                      </div>
                    )}
                  </div>

                  {/* Winner */}
                  {challenge.status === 'completed' && challenge.winnerName && (
                    <div className="mt-4 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Ganador: {challenge.winnerName}
                        </span>
                      </div>
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
                        disabled={challenge.participantCount < 2}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play className="w-4 h-4" />
                        Iniciar
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
                      Finalizar
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
          <p className="text-gray-500 mb-4">Crea tu primera competencia para motivar a tus estudiantes</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Crear Competencia
          </motion.button>
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
                  <h2 className="text-xl font-bold text-gray-900">Nueva Competencia</h2>
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
                    Título
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Batalla de Fracciones"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows="2"
                    placeholder="Describe la competencia..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paralelo
                  </label>
                  <select
                    value={formData.paraleloId}
                    onChange={(e) => handleParaleloChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar paralelo</option>
                    {paralelos.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ejercicios
                    </label>
                    <input
                      type="number"
                      value={formData.numExercises}
                      onChange={(e) => setFormData({ ...formData, numExercises: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min="5"
                      max="50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiempo (min)
                    </label>
                    <input
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Sin límite"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Participantes
                    </label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min="2"
                      max="10"
                      required
                    />
                  </div>
                </div>

                {/* Student Selection */}
                {formData.paraleloId && students.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar Participantes ({formData.studentIds.length}/{formData.maxParticipants})
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                      {students.map(student => (
                        <div
                          key={student.id}
                          onClick={() => toggleStudentSelection(student.id)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            formData.studentIds.includes(student.id)
                              ? 'bg-indigo-100 border-2 border-indigo-500'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-900">
                            {student.firstName} {student.lastName}
                          </span>
                          {formData.studentIds.includes(student.id) && (
                            <CheckCircle className="w-4 h-4 text-indigo-600 ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Crear Competencia
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddStudentModal && selectedChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddStudentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Agregar Participante</h2>
                  <button
                    onClick={() => setShowAddStudentModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {students
                    .filter(s => !selectedChallenge.participants.some(p => p.studentId === s.id))
                    .map(student => (
                      <motion.div
                        key={student.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAddParticipant(student.id)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                        <UserPlus className="w-5 h-5 text-indigo-600 ml-auto" />
                      </motion.div>
                    ))}

                  {students.filter(s => !selectedChallenge.participants.some(p => p.studentId === s.id)).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No hay estudiantes disponibles
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
