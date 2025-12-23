import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Lock, Mail, LogIn, Plus, Minus, X, Divide, AlertCircle, CheckCircle, Settings, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { setApiUrl, getConfiguredApiUrl } from '../services/api';
import logoImg from '../assets/logo.PNG';

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [apiUrl, setApiUrlState] = useState(getConfiguredApiUrl());

  // Limpiar mensajes después de un tiempo
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    // Cargar email recordado si existe
    const rememberedEmail = authService.getRememberedEmail();
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('🔐 Intentando login con:', { email, password: '***' });

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      console.log('📡 Llamando a authLogin del contexto...');
      // Usar la función login del contexto para actualizar el estado global
      const result = await authLogin(email, password, rememberMe);
      console.log('📥 Respuesta del servidor:', result);

      if (result.success) {
        setSuccess('¡Bienvenido!');
        console.log('✅ Login exitoso!');
        console.log('🎉 ¡Bienvenido!', result.user);
        console.log('👤 Usuario:', result.user.firstName, result.user.lastName);
        console.log('📧 Email:', result.user.email);
        console.log('🔐 Rol:', result.user.role);

        // Redirigir según el rol inmediatamente
        const redirectPath = result.user.role === 'admin'
          ? '/admin/dashboard'
          : result.user.role === 'teacher'
          ? '/teacher/dashboard'
          : '/student/dashboard';
        console.log('🚀 Redirigiendo a:', redirectPath);
        navigate(redirectPath, { replace: true });
      } else {
        console.error('❌ Login falló:', result.message);
        setError(result.message || 'Credenciales incorrectas');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('❌ ERROR CAPTURADO:', err);
      console.error('❌ Error completo:', JSON.stringify(err, null, 2));
      console.error('❌ Tipo de error:', err.constructor.name);
      console.error('❌ Stack:', err.stack);

      const errorMessage = err.message || 'Error de conexión con el servidor. Verifica que el backend esté funcionando.';
      console.error('❌ Mensaje mostrado al usuario:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }

    return false;
  };

  const handleSaveApiUrl = () => {
    if (apiUrl && apiUrl.trim()) {
      setApiUrl(apiUrl.trim());
      // La página se recargará automáticamente
    }
  };

  const handleResetApiUrl = () => {
    localStorage.removeItem('API_URL');
    window.location.reload();
  };

  // Múltiples iconos flotantes distribuidos por la pantalla
  const floatingIcons = [
    { Icon: Plus, delay: 0, duration: 3, top: '10%', left: '15%' },
    { Icon: Minus, delay: 0.5, duration: 3.5, top: '20%', left: '85%' },
    { Icon: X, delay: 1, duration: 4, top: '70%', left: '10%' },
    { Icon: Divide, delay: 1.5, duration: 3.2, top: '80%', left: '80%' },
    { Icon: Plus, delay: 0.8, duration: 3.8, top: '45%', left: '5%' },
    { Icon: Minus, delay: 1.2, duration: 3.3, top: '30%', left: '90%' },
    { Icon: X, delay: 0.3, duration: 3.6, top: '60%', left: '88%' },
    { Icon: Divide, delay: 1.8, duration: 3.4, top: '85%', left: '20%' },
    { Icon: Calculator, delay: 0.6, duration: 4.2, top: '15%', left: '75%' },
    { Icon: Calculator, delay: 1.4, duration: 3.9, top: '75%', left: '50%' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingIcons.map(({ Icon, delay, duration, top, left }, index) => (
          <motion.div
            key={index}
            className="absolute text-white/40"
            style={{
              top,
              left,
            }}
            animate={{
              y: [0, -40, 0],
              rotate: [0, 360],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Icon size={64} strokeWidth={1.5} />
          </motion.div>
        ))}
      </div>

      {/* Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent pointer-events-none" />

      {/* Config Button (esquina superior derecha) */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setShowConfig(!showConfig)}
        className="absolute top-4 right-4 z-20 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
        title="Configuración del servidor"
      >
        <Settings className="w-5 h-5 text-white" />
      </motion.button>

      {/* Config Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 right-4 z-20 bg-white rounded-xl shadow-xl p-4 w-80"
          >
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-800">Configuración API</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Para demos remotas, ingresa la URL del túnel del backend.
            </p>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrlState(e.target.value)}
              placeholder="https://xxx.trycloudflare.com/api"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSaveApiUrl}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={handleResetApiUrl}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Actual: {getConfiguredApiUrl()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30">
          {/* Logo and Title */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="relative">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden"
              >
                <img src={logoImg} alt="MathMaster Logo" className="w-full h-full object-contain" />
              </motion.div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl -z-10"
              />
            </div>
            <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MathMaster
            </h1>
            <p className="mt-2 text-gray-700 text-center font-medium">
              Domina las operaciones y ecuaciones
            </p>
          </motion.div>

          {/* Alert Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700"
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Email Input */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  placeholder="tu@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            </motion.div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="ml-2 text-gray-700">Recordarme</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={isLoading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Calculator className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Exercise Types Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 pt-6 border-t border-gray-300"
          >
            <p className="text-sm text-gray-600 text-center mb-3 font-medium">
              Tipos de ejercicios disponibles:
            </p>
            <div className="flex justify-center space-x-4">
              <div className="flex-1 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-3 text-center border border-blue-200">
                <Calculator className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                <p className="text-xs font-medium text-blue-800">
                  Operaciones Combinadas
                </p>
              </div>
              <div className="flex-1 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-3 text-center border border-purple-200">
                <X className="w-6 h-6 mx-auto text-purple-600 mb-1" />
                <p className="text-xs font-medium text-purple-800">
                  Ecuaciones
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
