import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Save, RefreshCw, Database, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import settingService from '../../services/settingService';
import { useSettings } from '../../context/SettingsContext';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { refreshSettings } = useSettings();

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

      {/* Personalización del Tema */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Palette className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-800">Personalización del Tema</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
};

export default Settings;
