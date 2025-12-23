import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, UserPlus, UserMinus, Search, AlertCircle, Check } from 'lucide-react';
import paraleloService from '../../services/paraleloService';

const ManageStudentsModal = ({ isOpen, onClose, paralelo, onUpdate }) => {
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchEnrolled, setSearchEnrolled] = useState('');
  const [searchAvailable, setSearchAvailable] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('enrolled'); // 'enrolled' or 'add'

  useEffect(() => {
    if (isOpen && paralelo) {
      loadData();
    }
  }, [isOpen, paralelo]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [enrolledResponse, availableResponse] = await Promise.all([
        paraleloService.getParaleloStudents(paralelo.id),
        paraleloService.getAvailableStudents(paralelo.id)
      ]);

      if (enrolledResponse.success) {
        setEnrolledStudents(enrolledResponse.data);
      }

      if (availableResponse.success) {
        setAvailableStudents(availableResponse.data);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      }
      return [...prev, studentId];
    });
  };

  const handleSelectAll = () => {
    const filteredStudents = availableStudents.filter(s =>
      `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(searchAvailable.toLowerCase())
    );

    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) return;

    try {
      setLoading(true);
      setError('');

      const response = await paraleloService.assignStudents(paralelo.id, selectedStudents);

      if (response.success) {
        setSuccessMessage(`${response.data.addedCount} estudiante(s) agregado(s)`);
        setSelectedStudents([]);
        await loadData();
        if (onUpdate) onUpdate();

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al agregar estudiantes:', err);
      setError(err.message || 'Error al agregar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      setLoading(true);
      setError('');

      const response = await paraleloService.removeStudent(paralelo.id, studentId);

      if (response.success) {
        setSuccessMessage('Estudiante removido del paralelo');
        await loadData();
        if (onUpdate) onUpdate();

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al remover estudiante:', err);
      setError(err.message || 'Error al remover estudiante');
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrolled = enrolledStudents.filter(s =>
    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(searchEnrolled.toLowerCase())
  );

  const filteredAvailable = availableStudents.filter(s =>
    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(searchAvailable.toLowerCase())
  );

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
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <Users className="w-6 h-6 mr-2" />
                  Gestionar Estudiantes
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {paralelo?.name} - {paralelo?.level}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'enrolled'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Inscritos ({enrolledStudents.length})
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'add'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Agregar Estudiantes ({availableStudents.length})
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-green-700">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : activeTab === 'enrolled' ? (
              <>
                {/* Search Enrolled */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar estudiantes inscritos..."
                    value={searchEnrolled}
                    onChange={(e) => setSearchEnrolled(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Enrolled List */}
                {filteredEnrolled.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay estudiantes inscritos en este paralelo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredEnrolled.map(student => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Remover del paralelo"
                        >
                          <UserMinus className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Search Available */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar estudiantes disponibles..."
                    value={searchAvailable}
                    onChange={(e) => setSearchAvailable(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Select All / Add Button */}
                {filteredAvailable.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {selectedStudents.length === filteredAvailable.length
                        ? 'Deseleccionar todos'
                        : 'Seleccionar todos'}
                    </button>
                    <button
                      onClick={handleAddStudents}
                      disabled={selectedStudents.length === 0 || loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Agregar ({selectedStudents.length})</span>
                    </button>
                  </div>
                )}

                {/* Available List */}
                {filteredAvailable.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay estudiantes disponibles para agregar</p>
                    <p className="text-sm mt-1">Todos los estudiantes ya están inscritos o no hay estudiantes registrados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailable.map(student => (
                      <div
                        key={student.id}
                        onClick={() => handleSelectStudent(student.id)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedStudents.includes(student.id)
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            selectedStudents.includes(student.id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
                          }`}>
                            {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedStudents.includes(student.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedStudents.includes(student.id) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ManageStudentsModal;
