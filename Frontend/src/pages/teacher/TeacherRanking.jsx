import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Users,
  Target,
  Zap,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Flame,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import teacherService from '../../services/teacherService';

export default function TeacherRanking() {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [stats, setStats] = useState({});
  const [paralelos, setParalelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paraleloFilter, setParaleloFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [paraleloFilter, periodFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rankingRes, paralelosRes] = await Promise.all([
        teacherService.getRanking(paraleloFilter || null, periodFilter),
        teacherService.getMyParalelos()
      ]);

      if (rankingRes.success) {
        setRanking(rankingRes.data.ranking);
        setStats(rankingRes.data.stats);
      }
      if (paralelosRes.success) {
        setParalelos(paralelosRes.data);
      }
    } catch (error) {
      console.error('Error al cargar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (position) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">{position}</span>;
    }
  };

  const getPositionStyle = (position) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const handleStudentClick = (studentId) => {
    navigate(`/teacher/student/${studentId}`);
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
        <h1 className="text-3xl font-bold text-gray-900">Ranking</h1>
        <p className="text-gray-600 mt-1">Clasificación de tus estudiantes por rendimiento</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Estudiantes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents || 0}</p>
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ejercicios Totales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalExercises || 0}</p>
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
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Precisión Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgAccuracy || 0}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Mejor Puntaje</p>
              <p className="text-2xl font-bold text-gray-900">{stats.topScore || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-200">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0"
          >
            <option value="all">Todo el tiempo</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-200">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={paraleloFilter}
            onChange={(e) => setParaleloFilter(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0"
          >
            <option value="">Todos los paralelos</option>
            {paralelos.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 3 Podium */}
      {ranking.length >= 3 && (
        <div className="flex justify-center items-end gap-4 py-8">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div
              onClick={() => handleStudentClick(ranking[1].studentId)}
              className="cursor-pointer"
            >
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-2xl font-bold mb-2 mx-auto border-4 border-gray-300">
                  {ranking[1].firstName.charAt(0)}{ranking[1].lastName.charAt(0)}
                </div>
                <div className="absolute -top-2 -right-2">
                  <Medal className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <p className="font-bold text-gray-900">{ranking[1].firstName}</p>
              <p className="text-sm text-gray-500">{ranking[1].lastName}</p>
              <p className="text-lg font-bold text-gray-600 mt-1">{ranking[1].totalScore} pts</p>
            </div>
            <div className="w-24 h-20 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-600">2</span>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div
              onClick={() => handleStudentClick(ranking[0].studentId)}
              className="cursor-pointer"
            >
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white text-3xl font-bold mb-2 mx-auto border-4 border-yellow-300 shadow-lg">
                  {ranking[0].firstName.charAt(0)}{ranking[0].lastName.charAt(0)}
                </div>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Crown className="w-10 h-10 text-yellow-500" />
                </div>
              </div>
              <p className="font-bold text-gray-900 text-lg">{ranking[0].firstName}</p>
              <p className="text-sm text-gray-500">{ranking[0].lastName}</p>
              <p className="text-xl font-bold text-yellow-600 mt-1">{ranking[0].totalScore} pts</p>
            </div>
            <div className="w-28 h-28 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-4xl font-bold text-yellow-700">1</span>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div
              onClick={() => handleStudentClick(ranking[2].studentId)}
              className="cursor-pointer"
            >
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-2xl font-bold mb-2 mx-auto border-4 border-amber-400">
                  {ranking[2].firstName.charAt(0)}{ranking[2].lastName.charAt(0)}
                </div>
                <div className="absolute -top-2 -right-2">
                  <Medal className="w-8 h-8 text-amber-600" />
                </div>
              </div>
              <p className="font-bold text-gray-900">{ranking[2].firstName}</p>
              <p className="text-sm text-gray-500">{ranking[2].lastName}</p>
              <p className="text-lg font-bold text-amber-600 mt-1">{ranking[2].totalScore} pts</p>
            </div>
            <div className="w-24 h-16 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-3xl font-bold text-amber-700">3</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Full Ranking Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Clasificación Completa
          </h2>
        </div>

        {ranking.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay datos de ranking</h3>
            <p className="text-gray-500">Los estudiantes aún no han completado ejercicios</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ranking.map((student, index) => (
              <motion.div
                key={student.studentId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleStudentClick(student.studentId)}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${getPositionStyle(student.position)}`}
              >
                {/* Position */}
                <div className="w-12 flex justify-center">
                  {getMedalIcon(student.position)}
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">
                      {student.firstName} {student.lastName}
                    </p>
                    {student.streak > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">
                        <Flame className="w-3 h-3" />
                        <span>{student.streak}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{student.paraleloName}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Zap className="w-4 h-4" />
                      <span className="font-medium">{student.exercisesCompleted}</span>
                    </div>
                    <p className="text-xs text-gray-500">Ejercicios</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-green-600">{student.correctAnswers}</span>
                      <span className="text-gray-400">/</span>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="font-medium text-red-500">{student.wrongAnswers}</span>
                    </div>
                    <p className="text-xs text-gray-500">Correctas/Incorrectas</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center gap-1 text-purple-600">
                      <Target className="w-4 h-4" />
                      <span className="font-medium">{student.accuracy}%</span>
                    </div>
                    <p className="text-xs text-gray-500">Precisión</p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right min-w-[80px]">
                  <p className="text-xl font-bold text-indigo-600">{student.totalScore}</p>
                  <p className="text-xs text-gray-500">puntos</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
