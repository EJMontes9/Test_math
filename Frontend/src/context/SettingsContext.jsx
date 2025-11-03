import { createContext, useContext, useState, useEffect } from 'react';
import settingService from '../services/settingService';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings debe usarse dentro de SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    app_name: 'MathMaster',
    app_primary_color: '#3B82F6',
    app_secondary_color: '#8B5CF6',
    academic_year: new Date().getFullYear().toString(),
    academic_period: 'Primer Trimestre',
  });
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const response = await settingService.getAllSettings();
      if (response.success) {
        // Convertir a objeto plano
        const flatSettings = {};

        Object.keys(response.data).forEach(category => {
          response.data[category].forEach(setting => {
            flatSettings[setting.key] = setting.value;
          });
        });

        // Combinar con valores por defecto
        setSettings(prev => ({
          ...prev,
          ...flatSettings
        }));
      }
    } catch (err) {
      console.error('Error al cargar configuraciones:', err);
      // Mantener valores por defecto si hay error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const refreshSettings = () => {
    loadSettings();
  };

  // Aplicar colores dinámicamente
  useEffect(() => {
    if (!loading) {
      document.documentElement.style.setProperty('--color-primary', settings.app_primary_color);
      document.documentElement.style.setProperty('--color-secondary', settings.app_secondary_color);
    }
  }, [settings.app_primary_color, settings.app_secondary_color, loading]);

  // Aplicar título dinámicamente
  useEffect(() => {
    if (!loading && settings.app_name) {
      document.title = settings.app_name;
    }
  }, [settings.app_name, loading]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
