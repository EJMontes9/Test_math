const { Setting } = require('../models');
const path = require('path');
const fs = require('fs');

// Obtener todas las configuraciones agrupadas por categoría
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    // Agrupar por categoría
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push({
        key: setting.key,
        value: parseValue(setting.value, setting.type),
        type: setting.type,
        description: setting.description
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuraciones',
      error: error.message
    });
  }
};

// Obtener una configuración específica
exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await Setting.findOne({ where: { key } });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        key: setting.key,
        value: parseValue(setting.value, setting.type),
        type: setting.type,
        category: setting.category,
        description: setting.description
      }
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración',
      error: error.message
    });
  }
};

// Actualizar o crear configuración
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type, category, description } = req.body;

    const stringValue = stringifyValue(value, type);

    const [setting, created] = await Setting.findOrCreate({
      where: { key },
      defaults: {
        key,
        value: stringValue,
        type: type || 'string',
        category: category || 'general',
        description
      }
    });

    if (!created) {
      await setting.update({
        value: stringValue,
        type: type || setting.type,
        category: category || setting.category,
        description: description !== undefined ? description : setting.description
      });
    }

    res.json({
      success: true,
      message: created ? 'Configuración creada' : 'Configuración actualizada',
      data: {
        key: setting.key,
        value: parseValue(setting.value, setting.type),
        type: setting.type,
        category: setting.category
      }
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración',
      error: error.message
    });
  }
};

// Actualizar múltiples configuraciones
exports.updateMultipleSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'Se esperaba un array de configuraciones'
      });
    }

    const results = [];

    for (const item of settings) {
      const { key, value, type, category, description } = item;
      const stringValue = stringifyValue(value, type);

      const [setting, created] = await Setting.findOrCreate({
        where: { key },
        defaults: {
          key,
          value: stringValue,
          type: type || 'string',
          category: category || 'general',
          description
        }
      });

      if (!created) {
        await setting.update({
          value: stringValue,
          type: type || setting.type,
          category: category || setting.category,
          description: description !== undefined ? description : setting.description
        });
      }

      results.push({
        key: setting.key,
        value: parseValue(setting.value, setting.type),
        updated: !created
      });
    }

    res.json({
      success: true,
      message: 'Configuraciones actualizadas',
      data: results
    });
  } catch (error) {
    console.error('Error al actualizar configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuraciones',
      error: error.message
    });
  }
};

// Inicializar configuraciones por defecto
exports.initializeDefaults = async (req, res) => {
  try {
    const defaults = [
      // Configuración de la Aplicación
      { key: 'app_name', value: 'MathMaster', type: 'string', category: 'application', description: 'Nombre de la institución educativa' },
      { key: 'app_primary_color', value: '#3B82F6', type: 'string', category: 'application', description: 'Color primario del tema' },
      { key: 'app_secondary_color', value: '#8B5CF6', type: 'string', category: 'application', description: 'Color secundario del tema' },
      { key: 'academic_year', value: '2025', type: 'string', category: 'application', description: 'Año lectivo actual' },
      { key: 'academic_period', value: 'Primer Trimestre', type: 'string', category: 'application', description: 'Período académico actual' },

      // Configuración de Ejercicios
      { key: 'exercise_default_difficulty', value: 'medium', type: 'string', category: 'exercises', description: 'Dificultad por defecto de ejercicios' },
      { key: 'exercise_time_limit', value: '30', type: 'number', category: 'exercises', description: 'Tiempo límite en minutos' },
      { key: 'exercise_pass_score', value: '70', type: 'number', category: 'exercises', description: 'Puntuación mínima de aprobación (%)' },
      { key: 'exercise_max_attempts', value: '3', type: 'number', category: 'exercises', description: 'Número máximo de intentos' },

      // Seguridad
      { key: 'session_timeout', value: '60', type: 'number', category: 'security', description: 'Tiempo de sesión en minutos' },
      { key: 'password_min_length', value: '6', type: 'number', category: 'security', description: 'Longitud mínima de contraseña' },
      { key: 'require_password_change', value: 'false', type: 'boolean', category: 'security', description: 'Requerir cambio de contraseña inicial' }
    ];

    const results = [];
    for (const def of defaults) {
      const [setting, created] = await Setting.findOrCreate({
        where: { key: def.key },
        defaults: def
      });
      results.push({ key: def.key, created });
    }

    res.json({
      success: true,
      message: 'Configuraciones inicializadas',
      data: results
    });
  } catch (error) {
    console.error('Error al inicializar configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al inicializar configuraciones',
      error: error.message
    });
  }
};

// Helpers para parsear valores
function parseValue(value, type) {
  if (value === null || value === undefined) return null;

  switch (type) {
    case 'number':
      return parseFloat(value);
    case 'boolean':
      return value === 'true' || value === true;
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}

function stringifyValue(value, type) {
  if (value === null || value === undefined) return null;

  switch (type) {
    case 'json':
      return JSON.stringify(value);
    case 'boolean':
      return value.toString();
    case 'number':
      return value.toString();
    default:
      return value;
  }
}

// Subir logo
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ningún archivo'
      });
    }

    // Generar URL del logo
    const logoUrl = `/uploads/${req.file.filename}`;

    // Actualizar configuración del logo
    const [setting, created] = await Setting.findOrCreate({
      where: { key: 'app_logo' },
      defaults: {
        value: logoUrl,
        type: 'string',
        category: 'application',
        description: 'Logo de la aplicación'
      }
    });

    if (!created) {
      // Eliminar logo anterior si existe
      if (setting.value && setting.value.startsWith('/uploads/')) {
        const oldLogoPath = path.join(__dirname, '../../', setting.value);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      // Actualizar con nuevo logo
      setting.value = logoUrl;
      await setting.save();
    }

    res.json({
      success: true,
      message: 'Logo subido correctamente',
      data: {
        logoUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Error al subir logo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir logo',
      error: error.message
    });
  }
};
