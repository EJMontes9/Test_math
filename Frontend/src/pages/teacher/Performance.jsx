import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Users, BookOpen, Target, Award, Loader2, Calendar } from 'lucide-react';
import teacherService from '../../services/teacherService';

const topicLabels = {
  operations: 'Operaciones Basicas',
  combined_operations: 'Operaciones Combinadas',
  linear_equations: 'Ecuaciones Lineales',
  quadratic_equations: 'Ecuaciones Cuadraticas',
  fractions: 'Fracciones',
  percentages: 'Porcentajes',
  geometry: 'Geometria',
  algebra: 'Algebra'
};

export default function Performance() {
  const [loading, setLoading] = useState(true);
  const [paralelos, setParalelos] = useState([]);
  const [selectedParalelo, setSelectedParalelo] = useState('');
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    loadParalelos();
  }, []);

  useEffect(() => {
    if (selectedParalelo) {
      loadStats();
    }
  }, [selectedParalelo, period]);

  const loadParalelos = async () => {
    try {
      const response = await teacherService.getParalelos();
      if (response.success && response.data.length > 0) {
        setParalelos(response.data);
        setSelectedParalelo(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading paralelos:', error);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getParaleloPerformance(selectedParalelo, period);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Mock data for demo
      setStats({
        general: {
          totalStudents: 25,
          activeStudents: 20,
          totalExercises: 450,
          averageAccuracy: 72.5,
          averageScore: 185,
          trend: 'up'
        },
        topicPerformance: [
          { topic: 'operations', accuracy: 85, attempts: 120 },
          { topic: 'fractions', accuracy: 68, attempts: 95 },
          { topic: 'percentages', accuracy: 75, attempts: 80 },
          { topic: 'linear_equations', accuracy: 62, attempts: 70 },
          { topic: 'geometry', accuracy: 70, attempts: 55 }
        ],
        topStudents: [
          { name: 'Maria Garcia', score: 450, accuracy: 92 },
          { name: 'Juan Perez', score: 380, accuracy: 88 },
          { name: 'Ana Lopez', score: 350, accuracy: 85 }
        ],
        needsHelp: [
          { name: 'Carlos Ruiz', score: 85, accuracy: 45 },
          { name: 'Sofia Martinez', score: 120, accuracy: 52 }
        ],
        weeklyProgress: [
          { day: 'Lun', exercises: 45 },
          { day: 'Mar', exercises: 62 },
          { day: 'Mie', exercises: 38 },
          { day: 'Jue', exercises: 55 },
          { day: 'Vie', exercises: 70 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Desempeño del Paralelo</h1>
          <p className="text-gray-500">Analiza el progreso de tus estudiantes</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedParalelo}
            onChange={(e) => setSelectedParalelo(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {paralelos.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="all">Todo el Tiempo</option>
          </select>
        </div>
      </div>

      {stats && (
        <>
          {/* Estadisticas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stats.general.activeStudents}/{stats.general.totalStudents} activos
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{stats.general.totalStudents}</p>
              <p className="text-sm text-gray-500">Estudiantes</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                {stats.general.trend === 'up' ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{stats.general.totalExercises}</p>
              <p className="text-sm text-gray-500">Ejercicios Completados</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{stats.general.averageAccuracy}%</p>
              <p className="text-sm text-gray-500">Precision Promedio</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{stats.general.averageScore}</p>
              <p className="text-sm text-gray-500">Puntaje Promedio</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Desempeno por Tema */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Desempeño por Tema
              </h3>
              <div className="space-y-4">
                {stats.topicPerformance.map((topic, index) => (
                  <div key={topic.topic}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {topicLabels[topic.topic] || topic.topic}
                      </span>
                      <span className="text-sm text-gray-500">
                        {topic.accuracy}% ({topic.attempts} intentos)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.accuracy}%` }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className={`h-full rounded-full ${
                          topic.accuracy >= 80
                            ? 'bg-green-500'
                            : topic.accuracy >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Actividad Semanal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Actividad Semanal
              </h3>
              <div className="flex items-end justify-between h-40 gap-2">
                {stats.weeklyProgress.map((day, index) => {
                  const maxExercises = Math.max(...stats.weeklyProgress.map((d) => d.exercises));
                  const height = (day.exercises / maxExercises) * 100;
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="w-full bg-indigo-500 rounded-t-lg min-h-[4px]"
                      />
                      <span className="mt-2 text-xs text-gray-500">{day.day}</span>
                      <span className="text-xs font-medium text-gray-700">{day.exercises}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Estudiantes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Top Estudiantes
              </h3>
              <div className="space-y-3">
                {stats.topStudents.map((student, index) => (
                  <div
                    key={student.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0
                            ? 'bg-yellow-500'
                            : index === 1
                            ? 'bg-gray-400'
                            : 'bg-orange-400'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-800">{student.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{student.score} pts</p>
                      <p className="text-xs text-gray-500">{student.accuracy}% precision</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Necesitan Ayuda */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500" />
                Necesitan Atencion
              </h3>
              {stats.needsHelp.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-gray-500">Todos los estudiantes van bien!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.needsHelp.map((student) => (
                    <div
                      key={student.name}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="font-medium text-gray-800">{student.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{student.accuracy}% precision</p>
                        <p className="text-xs text-gray-500">{student.score} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
