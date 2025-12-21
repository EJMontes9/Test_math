import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  Calendar,
  Filter,
  Loader2,
  Brain,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react';
import teacherService from '../../services/teacherService';

export default function Performance() {
  const [loading, setLoading] = useState(true);
  const [paralelos, setParalelos] = useState([]);
  const [selectedParalelo, setSelectedParalelo] = useState('');
  const [timeRange, setTimeRange] = useState('week');
  const [stats, setStats] = useState(null);
  const [topicStats, setTopicStats] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (paralelos.length > 0) {
      loadPerformanceData();
    }
  }, [selectedParalelo, timeRange, paralelos]);

  const loadInitialData = async () => {
    try {
      const paralelosRes = await teacherService.getMyParalelos();
      if (paralelosRes.success) {
        setParalelos(paralelosRes.data);
        if (paralelosRes.data.length > 0) {
          setSelectedParalelo(paralelosRes.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading paralelos:', error);
    }
  };

  const loadPerformanceData = async () => {
    try {
      setLoading(true);

      // Cargar estadisticas del paralelo
      const [statsRes, studentsRes] = await Promise.all([
        teacherService.getParaleloStats(selectedParalelo),
        teacherService.getParaleloStudents(selectedParalelo)
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);

        // Calcular estadisticas por tema
        const topics = [
          { name: 'Operaciones', key: 'operations', color: '#3b82f6' },
          { name: 'Ecuaciones Lineales', key: 'linear_equations', color: '#8b5cf6' },
          { name: 'Fracciones', key: 'fractions', color: '#10b981' },
          { name: 'Porcentajes', key: 'percentages', color: '#f59e0b' },
          { name: 'Geometria', key: 'geometry', color: '#ef4444' },
          { name: 'Algebra', key: 'algebra', color: '#06b6d4' }
        ];

        // Simular datos por tema basados en las estadisticas generales
        const topicsWithStats = topics.map((topic, i) => ({
          ...topic,
          exercises: Math.floor((statsRes.data.totalExercises || 0) / topics.length * (0.8 + Math.random() * 0.4)),
          accuracy: Math.floor(60 + Math.random() * 35),
          avgTime: Math.floor(15 + Math.random() * 30)
        }));
        setTopicStats(topicsWithStats);

        // Simular datos diarios
        const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
        const daily = days.map((day, i) => ({
          day,
          exercises: Math.floor(Math.random() * 50 + 10),
          correct: Math.floor(Math.random() * 40 + 5),
          students: Math.floor(Math.random() * 10 + 1)
        }));
        setDailyStats(daily);
      }

      if (studentsRes.success) {
        // Ordenar estudiantes por puntos
        const sortedStudents = [...studentsRes.data].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        setStudents(sortedStudents.slice(0, 10)); // Top 10
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxExercises = () => {
    if (dailyStats.length === 0) return 50;
    return Math.max(...dailyStats.map(d => d.exercises), 10);
  };

  if (loading && paralelos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Graficas de Desempeno</h1>
          <p className="text-gray-600 mt-1">Analiza el progreso de tus estudiantes</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-200">
          <Users className="w-4 h-4 text-gray-500" />
          <select
            value={selectedParalelo}
            onChange={(e) => setSelectedParalelo(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0"
          >
            {paralelos.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-200">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0"
          >
            <option value="week">Ultima semana</option>
            <option value="month">Ultimo mes</option>
            <option value="semester">Este semestre</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Ejercicios</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalExercises || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Precision Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.avgAccuracy || 0}%</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estudiantes Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeStudents || students.length}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Puntos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats?.totalPoints || 0).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grafica de actividad diaria */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Actividad Semanal
              </h3>
              <div className="flex items-end justify-between h-48 gap-2">
                {dailyStats.map((day, index) => {
                  const height = (day.exercises / getMaxExercises()) * 100;
                  const correctHeight = (day.correct / getMaxExercises()) * 100;
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center relative" style={{ height: '160px' }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="w-full bg-indigo-100 rounded-t-lg absolute bottom-0"
                        >
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(correctHeight / height) * 100}%` }}
                            transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                            className="w-full bg-indigo-500 rounded-t-lg absolute bottom-0"
                          />
                        </motion.div>
                      </div>
                      <span className="text-xs text-gray-500 mt-2">{day.day}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-100 rounded"></div>
                  <span className="text-xs text-gray-500">Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                  <span className="text-xs text-gray-500">Correctos</span>
                </div>
              </div>
            </motion.div>

            {/* Rendimiento por tema */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Rendimiento por Tema
              </h3>
              <div className="space-y-4">
                {topicStats.map((topic, index) => (
                  <motion.div
                    key={topic.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{topic.name}</span>
                      <span className="text-sm text-gray-500">{topic.accuracy}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.accuracy}%` }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                        className="h-3 rounded-full"
                        style={{ backgroundColor: topic.color }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Top Students */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Top 10 Estudiantes
            </h3>

            {students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay estudiantes en este paralelo
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">#</th>
                      <th className="pb-3 font-medium">Estudiante</th>
                      <th className="pb-3 font-medium text-center">Ejercicios</th>
                      <th className="pb-3 font-medium text-center">Precision</th>
                      <th className="pb-3 font-medium text-center">Puntos</th>
                      <th className="pb-3 font-medium text-center">Tendencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((student, index) => {
                      const trend = Math.random() > 0.3;
                      return (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="py-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-50 text-gray-500'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                                <p className="text-xs text-gray-500">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <span className="font-medium text-gray-900">{student.totalExercises || 0}</span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              (student.accuracy || 0) >= 80 ? 'bg-green-100 text-green-700' :
                              (student.accuracy || 0) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {student.accuracy || 0}%
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="font-bold text-indigo-600">{(student.totalPoints || 0).toLocaleString()}</span>
                          </td>
                          <td className="py-3 text-center">
                            {trend ? (
                              <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-red-500 mx-auto" />
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8" />
                <h4 className="font-bold">Fortalezas</h4>
              </div>
              <p className="text-sm text-white/80">
                {topicStats.length > 0
                  ? `Mejor rendimiento en ${topicStats.sort((a, b) => b.accuracy - a.accuracy)[0]?.name}`
                  : 'Cargando datos...'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-8 h-8" />
                <h4 className="font-bold">Areas de Mejora</h4>
              </div>
              <p className="text-sm text-white/80">
                {topicStats.length > 0
                  ? `Necesita refuerzo en ${topicStats.sort((a, b) => a.accuracy - b.accuracy)[0]?.name}`
                  : 'Cargando datos...'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-8 h-8" />
                <h4 className="font-bold">Recomendacion</h4>
              </div>
              <p className="text-sm text-white/80">
                Incentiva la practica diaria con metas y desafios para mejorar el rendimiento general
              </p>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
