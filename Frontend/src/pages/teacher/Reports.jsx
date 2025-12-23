import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Users, Loader2, Calendar, BarChart3, CheckCircle, AlertCircle } from 'lucide-react';
import teacherService from '../../services/teacherService';
import { getApiUrl } from '../../services/api';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [paralelos, setParalelos] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadParalelos();
  }, []);

  const loadParalelos = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getParalelos();
      if (response.success) {
        // Cargar estudiantes de cada paralelo
        const paralelosWithStudents = await Promise.all(
          response.data.map(async (paralelo) => {
            try {
              const studentsRes = await teacherService.getParaleloStudents(paralelo.id);
              return {
                ...paralelo,
                studentCount: studentsRes.success ? studentsRes.data.length : 0
              };
            } catch {
              return { ...paralelo, studentCount: 0 };
            }
          })
        );
        setParalelos(paralelosWithStudents);
      }
    } catch (error) {
      console.error('Error loading paralelos:', error);
      setMessage({ type: 'error', text: 'Error al cargar los paralelos' });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (paraleloId, paraleloName) => {
    try {
      setDownloading(paraleloId);
      setMessage({ type: '', text: '' });

      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();

      const response = await fetch(`${apiUrl}/teacher/reports/paralelo/${paraleloId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al generar el reporte');
      }

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${paraleloName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'Reporte descargado exitosamente' });
    } catch (error) {
      console.error('Error downloading report:', error);
      setMessage({ type: 'error', text: 'Error al descargar el reporte' });
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
          <p className="text-gray-500">Genera y descarga reportes PDF de tus estudiantes</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl">
          <FileText className="w-5 h-5" />
          <span className="font-medium">{paralelos.length} paralelos disponibles</span>
        </div>
      </div>

      {/* Mensaje de estado */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Reportes de Estudiantes</h2>
            <p className="text-white/80">
              Los reportes incluyen informacion detallada de cada estudiante: nombre, ejercicios completados,
              respuestas correctas, precision, puntaje total y nivel de desempeno.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Lista de Paralelos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paralelos.length === 0 ? (
          <div className="col-span-full bg-gray-50 rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tienes paralelos asignados</p>
            <p className="text-gray-400 text-sm">Crea un paralelo para generar reportes</p>
          </div>
        ) : (
          paralelos.map((paralelo, index) => (
            <motion.div
              key={paralelo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {paralelo.studentCount} estudiantes
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-1">{paralelo.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Reporte completo con estadisticas de todos los estudiantes
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>Creado: {new Date(paralelo.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => downloadReport(paralelo.id, paralelo.name)}
                  disabled={downloading === paralelo.id || paralelo.studentCount === 0}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                    paralelo.studentCount === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : downloading === paralelo.id
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {downloading === paralelo.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Descargar PDF</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Informacion adicional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-50 rounded-xl p-6"
      >
        <h3 className="font-bold text-gray-800 mb-3">Contenido del Reporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Datos del Estudiante</p>
              <p className="text-xs text-gray-500">Nombre completo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Progreso</p>
              <p className="text-xs text-gray-500">Ejercicios y respuestas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Precision</p>
              <p className="text-xs text-gray-500">Porcentaje de aciertos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FileText className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Nivel</p>
              <p className="text-xs text-gray-500">Basico, Intermedio, Avanzado</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
