import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, Trophy, Target, Zap, Award } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [paralelos, setParalelos] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data para gamificación (luego será real)
  const mockTopStudents = [
    { id: 1, name: 'María García', points: 2450, level: 15, avatar: 'MG', trend: 'up' },
    { id: 2, name: 'Carlos Ruiz', points: 2280, level: 14, avatar: 'CR', trend: 'up' },
    { id: 3, name: 'Ana López', points: 2150, level: 14, avatar: 'AL', trend: 'same' },
    { id: 4, name: 'Pedro Sánchez', points: 2050, level: 13, avatar: 'PS', trend: 'down' },
    { id: 5, name: 'Laura Morales', points: 1980, level: 13, avatar: 'LM', trend: 'up' },
  ];

  const mockNeedHelp = [
    { id: 6, name: 'Juan Pérez', points: 450, level: 3, avatar: 'JP', struggles: 'Álgebra' },
    { id: 7, name: 'Sofía Torres', points: 380, level: 2, avatar: 'ST', struggles: 'Geometría' },
    { id: 8, name: 'Miguel Ángel', points: 320, level: 2, avatar: 'MA', struggles: 'Fracciones' },
  ];

  const mockStats = {
    totalStudents: 45,
    activeToday: 32,
    avgProgress: 68,
    completedExercises: 234,
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Obtener paralelos del profesor
      const paralelosRes = await api.get('/paralelos/');
      const myParalelos = paralelosRes.data.data.filter(
        p => p.teacher?.id === user.id
      );
      setParalelos(myParalelos);

      // Obtener todos los estudiantes
      const studentsRes = await api.get('/users/?role=student');
      setStudents(studentsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
            trend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-xs font-semibold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );

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
            Aquí está el resumen de tus clases
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Target className="w-5 h-5 inline mr-2" />
          Nueva Meta
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Estudiantes"
          value={mockStats.totalStudents}
          subtitle={`${mockStats.activeToday} activos hoy`}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend={12}
        />
        <StatCard
          icon={TrendingUp}
          title="Progreso Promedio"
          value={`${mockStats.avgProgress}%`}
          subtitle="Del curso completo"
          color="bg-gradient-to-br from-green-500 to-green-600"
          trend={8}
        />
        <StatCard
          icon={Zap}
          title="Ejercicios Completos"
          value={mockStats.completedExercises}
          subtitle="Esta semana"
          color="bg-gradient-to-br from-yellow-500 to-yellow-600"
          trend={15}
        />
        <StatCard
          icon={Award}
          title="Mis Paralelos"
          value={paralelos.length}
          subtitle={`${students.length} estudiantes totales`}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      {/* Top Students & Need Help */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Students */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Top Estudiantes</h2>
            </div>
          </div>

          <div className="space-y-4">
            {mockTopStudents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {student.avatar}
                    </div>
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{student.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Nivel {student.level}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {student.points} pts
                      </span>
                    </div>
                  </div>
                </div>
                {student.trend === 'up' && (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                )}
                {student.trend === 'down' && (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Students Need Help */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Necesitan Ayuda</h2>
            </div>
          </div>

          <div className="space-y-4">
            {mockNeedHelp.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold">
                  {student.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{student.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Nivel {student.level}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-red-600">{student.struggles}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{student.points}</p>
                  <p className="text-xs text-gray-500">puntos</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
          >
            Ver todos los que necesitan ayuda
          </motion.button>
        </motion.div>
      </div>

      {/* Mis Paralelos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Mis Paralelos</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Ver todos
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paralelos.map((paralelo, index) => (
            <motion.div
              key={paralelo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{paralelo.name}</h3>
                  <p className="text-sm text-gray-500">{paralelo.level}</p>
                </div>
                <div className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold">
                  {paralelo.studentCount} estudiantes
                </div>
              </div>

              {/* Mock progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progreso</span>
                  <span>{Math.floor(Math.random() * 30 + 60)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                    style={{ width: `${Math.floor(Math.random() * 30 + 60)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Zap className="w-3 h-3" />
                <span>{Math.floor(Math.random() * 50 + 20)} ejercicios completados</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
