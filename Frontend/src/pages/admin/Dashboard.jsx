import { motion } from 'framer-motion';
import { Users, BookOpen, GraduationCap, TrendingUp, Activity, Award, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import userService from '../../services/userService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const intervalRef = useRef(null);

  // Cargar estadísticas y usuarios SIN mostrar loading en actualización
  const loadDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setUpdating(true);
      }

      // Obtener estadísticas de usuarios
      const statsResponse = await userService.getUserStats();

      // Obtener todos los usuarios activos para la actividad
      const usersResponse = await userService.getAllUsers({ status: 'active' });

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (usersResponse.success) {
        setUsers(usersResponse.data);
      }
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadDashboardData(true);

    // Actualizar cada 30 segundos SIN mostrar loading
    intervalRef.current = setInterval(() => {
      loadDashboardData(false);
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Calcular tarjetas de estadísticas - useMemo para evitar recalcular innecesariamente
  const statsCards = useMemo(() => {
    if (!stats) return [];

    return [
      {
        title: 'Total Usuarios',
        value: stats.total.toString(),
        change: `${stats.active} activos`,
        icon: Users,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600'
      },
      {
        title: 'Paralelos Activos',
        value: '0',
        change: 'Próximamente',
        icon: BookOpen,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-600'
      },
      {
        title: 'Estudiantes',
        value: stats.byRole.student.toString(),
        change: stats.active > 0 ? `${((stats.byRole.student / stats.active) * 100).toFixed(0)}% del total` : '0%',
        icon: GraduationCap,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
        textColor: 'text-green-600'
      },
      {
        title: 'Docentes',
        value: stats.byRole.teacher.toString(),
        change: `${stats.byRole.admin} admins`,
        icon: TrendingUp,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-600'
      },
    ];
  }, [stats]);

  // Actividad reciente - useMemo para evitar recalcular innecesariamente
  const recentActivity = useMemo(() => {
    return users.slice(0, 4).map(user => ({
      user: `${user.firstName} ${user.lastName}`,
      action: `Usuario ${user.role === 'student' ? 'estudiante' : user.role === 'teacher' ? 'docente' : 'administrador'} registrado`,
      time: new Date(user.createdAt).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
  }, [users]);

  // Top estudiantes - useMemo para evitar recalcular innecesariamente
  const topStudents = useMemo(() => {
    return users
      .filter(u => u.role === 'student')
      .slice(0, 3)
      .map((student, index) => ({
        name: `${student.firstName} ${student.lastName}`,
        score: 100 - (index * 3) // Temporal hasta tener sistema de puntos
      }));
  }, [users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-12 h-12 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">¡Bienvenido al Dashboard!</h1>
            <p className="text-blue-100">Aquí puedes gestionar toda tu plataforma educativa</p>
          </div>
          <button
            onClick={() => loadDashboardData(false)}
            disabled={updating}
            className={`p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Actualizar datos"
          >
            <RefreshCw className={`w-6 h-6 ${updating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <span className="text-sm font-medium text-gray-600">{stat.change}</span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-blue-600" />
              Actividad Reciente
            </h2>
            {updating && (
              <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {activity.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {activity.user}
                    </p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No hay actividad reciente</p>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          {/* Top Performers */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4">
              <Award className="w-6 h-6 mr-2 text-yellow-500" />
              Top Estudiantes
            </h2>
            <div className="space-y-3">
              {topStudents.length > 0 ? (
                topStudents.map((student, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {student.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                      {student.score}%
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No hay estudiantes registrados</p>
              )}
            </div>
          </div>

          {/* Quick Actions Buttons */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Acciones Rápidas</h3>
            <div className="space-y-2">
              <a
                href="/admin/users"
                className="block w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors text-sm shadow-sm text-center"
              >
                + Crear Usuario
              </a>
              <a
                href="/admin/paralelos"
                className="block w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors text-sm shadow-sm text-center"
              >
                + Crear Paralelo
              </a>
              <button
                onClick={() => loadDashboardData(false)}
                disabled={updating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
                <span>{updating ? 'Actualizando...' : 'Actualizar Datos'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
