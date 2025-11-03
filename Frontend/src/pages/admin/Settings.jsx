import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Save, RefreshCw, Database, Shield, BookOpen, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import settingService from '../../services/settingService';
import { useSettings } from '../../context/SettingsContext';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('application');
  const [settings, setSettings] = useState({});
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { refreshSettings } = useSettings();

  const tabs = [
    { id: 'application', label: 'Aplicación', icon: Palette },
    { id: 'exercises', label: 'Ejercicios', icon: BookOpen },
    { id: 'security', label: 'Seguridad', icon: Shield }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingService.getAllSettings();

      if (response.success) {
        setSettings(response.data);

        // Convertir a formData plano
        const flatData = {};
        Object.keys(response.data).forEach(category => {
          response.data[category].forEach(setting => {
            flatData[setting.key] = setting.value;
          });
        });
        setFormData(flatData);
      }
    } catch (err) {
      console.error('Error al cargar configuraciones:', err);

      // Si no hay configuraciones, inicializarlas
      if (err.message && err.message.includes('no encontrada')) {
        await initializeSettings();
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeSettings = async () => {
    try {
      await settingService.initializeDefaults();
      await loadSettings();
      showMessage('success', 'Configuraciones inicializadas correctamente');
    } catch (err) {
      console.error('Error al inicializar:', err);
      showMessage('error', 'Error al inicializar configuraciones');
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Preparar array de configuraciones para actualizar
      const settingsToUpdate = [];
      Object.keys(formData).forEach(key => {
        // Buscar el tipo y categoría de cada setting
        let type = 'string';
        let category = 'general';

        Object.keys(settings).forEach(cat => {
          const found = settings[cat].find(s => s.key === key);
          if (found) {
            type = found.type;
            category = cat;
          }
        });

        settingsToUpdate.push({
          key,
          value: formData[key],
          type,
          category
        });
      });

      const response = await settingService.updateMultipleSettings(settingsToUpdate);

      if (response.success) {
        showMessage('success', 'Configuraciones guardadas correctamente');
        await loadSettings();
        refreshSettings(); // Actualizar contexto global
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      showMessage('error', 'Error al guardar configuraciones');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <SettingsIcon className="w-7 h-7 mr-2 text-blue-600" />
              Configuración del Sistema
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona las configuraciones generales de la plataforma
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={initializeSettings}
              className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Database className="w-5 h-5" />
              <span>Restaurar Defaults</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Message */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Configuración de la Aplicación */}
          {activeTab === 'application' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Información de la Institución</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Institución
                    </label>
                    <input
                      type="text"
                      value={formData.app_name || ''}
                      onChange={(e) => handleChange('app_name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Año Lectivo
                    </label>
                    <input
                      type="text"
                      value={formData.academic_year || ''}
                      onChange={(e) => handleChange('academic_year', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período Académico
                    </label>
                    <input
                      type="text"
                      value={formData.academic_period || ''}
                      onChange={(e) => handleChange('academic_period', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Primer Trimestre"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Personalización del Tema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Primario
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={formData.app_primary_color || '#3B82F6'}
                        onChange={(e) => handleChange('app_primary_color', e.target.value)}
                        className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.app_primary_color || '#3B82F6'}
                        onChange={(e) => handleChange('app_primary_color', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Secundario
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={formData.app_secondary_color || '#8B5CF6'}
                        onChange={(e) => handleChange('app_secondary_color', e.target.value)}
                        className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.app_secondary_color || '#8B5CF6'}
                        onChange={(e) => handleChange('app_secondary_color', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Configuración de Ejercicios */}
          {activeTab === 'exercises' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Configuración de Ejercicios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dificultad Por Defecto
                    </label>
                    <select
                      value={formData.exercise_default_difficulty || 'medium'}
                      onChange={(e) => handleChange('exercise_default_difficulty', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Fácil</option>
                      <option value="medium">Medio</option>
                      <option value="hard">Difícil</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo Límite (minutos)
                    </label>
                    <input
                      type="number"
                      value={formData.exercise_time_limit || 30}
                      onChange={(e) => handleChange('exercise_time_limit', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="5"
                      max="120"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puntuación Mínima (%)
                    </label>
                    <input
                      type="number"
                      value={formData.exercise_pass_score || 70}
                      onChange={(e) => handleChange('exercise_pass_score', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intentos Máximos
                    </label>
                    <input
                      type="number"
                      value={formData.exercise_max_attempts || 3}
                      onChange={(e) => handleChange('exercise_max_attempts', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Configuración de Seguridad */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Configuración de Seguridad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo de Sesión (minutos)
                    </label>
                    <input
                      type="number"
                      value={formData.session_timeout || 60}
                      onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="15"
                      max="480"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitud Mínima de Contraseña
                    </label>
                    <input
                      type="number"
                      value={formData.password_min_length || 6}
                      onChange={(e) => handleChange('password_min_length', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="4"
                      max="20"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.require_password_change || false}
                        onChange={(e) => handleChange('require_password_change', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Requerir cambio de contraseña inicial
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
