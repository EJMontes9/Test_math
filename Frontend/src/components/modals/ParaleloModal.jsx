import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, AlertCircle, Users } from 'lucide-react';
import userService from '../../services/userService';

const ParaleloModal = ({ isOpen, onClose, onSave, paralelo = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    teacherId: '',
    description: ''
  });

  const [teachers, setTeachers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTeachers();
    }

    if (paralelo) {
      setFormData({
        name: paralelo.name || '',
        level: paralelo.level || '',
        teacherId: paralelo.teacherId || '',
        description: paralelo.description || ''
      });
    } else {
      setFormData({
        name: '',
        level: '',
        teacherId: '',
        description: ''
      });
    }
    setErrors({});
  }, [paralelo, isOpen]);

  const loadTeachers = async () => {
    try {
      const response = await userService.getAllUsers({ role: 'teacher', status: 'active' });
      if (response.success) {
        setTeachers(response.data);
      }
    } catch (error) {
      console.error('Error al cargar profesores:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo al editar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.level.trim()) {
      newErrors.level = 'El nivel es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const dataToSend = {
        ...formData,
        teacherId: formData.teacherId || null
      };

      await onSave(dataToSend);
      onClose();
    } catch (error) {
      console.error('Error al guardar paralelo:', error);
      setErrors({ submit: error.message || 'Error al guardar paralelo' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center">
                <BookOpen className="w-6 h-6 mr-2" />
                {paralelo ? 'Editar Paralelo' : 'Crear Paralelo'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{errors.submit}</span>
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Paralelo *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Primero A"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Nivel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel *
              </label>
              <input
                type="text"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.level ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: 1ro Básica"
              />
              {errors.level && (
                <p className="text-red-500 text-xs mt-1">{errors.level}</p>
              )}
            </div>

            {/* Profesor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Tutor Asignado
              </label>
              <select
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sin asignar</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (Opcional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Información adicional sobre el paralelo..."
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Guardando...' : paralelo ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ParaleloModal;
