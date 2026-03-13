import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Loader2, Lock } from 'lucide-react';
import api from '../../services/api';

const REQUIREMENTS = [
  { value: 'first_exercise', label: 'Completar el primer ejercicio', hasValue: false },
  { value: 'exercises_count', label: 'Completar N ejercicios', hasValue: true },
  { value: 'correct_streak', label: 'Acumular N respuestas correctas seguidas', hasValue: true },
  { value: 'sessions_count', label: 'Jugar N sesiones', hasValue: true },
  { value: 'first_goal', label: 'Completar la primera meta', hasValue: false },
  { value: 'goals_completed', label: 'Completar N metas', hasValue: true },
  { value: 'goal_completed', label: 'Al completar una meta (asignada por el profesor)', hasValue: false },
];

const CATEGORIES = [
  { value: 'achievement', label: 'Logro' },
  { value: 'streak', label: 'Racha' },
  { value: 'mastery', label: 'Maestría' },
  { value: 'social', label: 'Social' },
];

const ICONS = ['🏅', '🥇', '🥈', '🥉', '🏆', '⭐', '🌟', '💫', '✨', '🎖️', '👑', '🔥', '💪', '🎯', '🧮', '📝', '🎮', '🌱', '🎉', '🦁', '🐉', '🦅'];

const emptyForm = {
  name: '',
  description: '',
  icon: '🏅',
  category: 'achievement',
  requirement: 'first_exercise',
  requirement_value: 1,
  points: 10,
};

export default function TeacherBadges() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { loadBadges(); }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/badges');
      if (res.data.success) setBadges(res.data.data);
    } catch (err) {
      console.error('Error al cargar insignias:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingBadge(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (badge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description || '',
      icon: badge.icon || '🏅',
      category: badge.category,
      requirement: badge.requirement,
      requirement_value: badge.requirementValue ?? 1,
      points: badge.points,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon,
        category: formData.category,
        requirement: formData.requirement,
        requirement_value: parseInt(formData.requirement_value),
        points: parseInt(formData.points),
      };
      if (editingBadge) {
        await api.put(`/teacher/badges/${editingBadge.id}`, payload);
      } else {
        await api.post('/teacher/badges', payload);
      }
      setShowModal(false);
      loadBadges();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (badge) => {
    try {
      await api.patch(`/teacher/badges/${badge.id}/toggle`);
      loadBadges();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  };

  const handleDelete = async (badge) => {
    if (!confirm(`¿Eliminar la insignia "${badge.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/teacher/badges/${badge.id}`);
      loadBadges();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar');
    }
  };

  const requirementInfo = REQUIREMENTS.find(r => r.value === formData.requirement);
  const ownBadges = badges.filter(b => b.isOwn);
  const systemBadges = badges.filter(b => !b.isOwn);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Insignias</h1>
          <p className="text-gray-500 text-sm mt-1">
            {ownBadges.length} propias · {systemBadges.length} del sistema
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-colors"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus className="w-5 h-5" />
          Nueva Insignia
        </motion.button>
      </div>

      {/* Insignias propias */}
      {ownBadges.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Creadas por mí</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {ownBadges.map((badge, index) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  index={index}
                  onEdit={openEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  canEdit={true}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {ownBadges.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">Aún no has creado insignias</p>
          <p className="text-gray-400 text-sm mt-1">Crea insignias para motivar a tus estudiantes</p>
        </div>
      )}

      {/* Insignias del sistema */}
      {systemBadges.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Insignias del sistema</h2>
          <p className="text-xs text-gray-400 mb-3">Estas insignias se otorgan automáticamente y no se pueden editar.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemBadges.map((badge, index) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                index={index}
                onEdit={null}
                onToggle={null}
                onDelete={null}
                canEdit={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingBadge ? 'Editar Insignia' : 'Nueva Insignia'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {/* Selector de ícono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ícono</label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-10 h-10 text-xl rounded-lg transition-all ${
                          formData.icon === icon
                            ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Campeón del Álgebra"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Domina los ejercicios de álgebra"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puntos</label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={e => setFormData({ ...formData, points: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requisito para obtenerla</label>
                  <select
                    value={formData.requirement}
                    onChange={e => setFormData({ ...formData, requirement: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {REQUIREMENTS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {formData.requirement === 'goal_completed' && (
                    <p className="text-xs text-indigo-600 mt-1">
                      Esta insignia se puede asignar a una meta específica al crearla.
                    </p>
                  )}
                </div>

                {requirementInfo?.hasValue && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor de N</label>
                    <input
                      type="number"
                      value={formData.requirement_value}
                      onChange={e => setFormData({ ...formData, requirement_value: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min="1"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      El estudiante necesita alcanzar este número para ganar la insignia.
                    </p>
                  </div>
                )}

                {/* Preview */}
                <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                    {formData.icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{formData.name || 'Nombre de la insignia'}</p>
                    <p className="text-sm text-gray-500">{formData.description || 'Descripción'}</p>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">{formData.points} pts</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-70"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingBadge ? 'Guardar Cambios' : 'Crear Insignia'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BadgeCard({ badge, index, onEdit, onToggle, onDelete, canEdit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-white rounded-2xl shadow-md p-5 border-2 transition-all ${
        badge.isActive ? 'border-transparent' : 'border-gray-200 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl">
            {badge.icon}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h3 className="font-bold text-gray-800">{badge.name}</h3>
              {!canEdit && <Lock className="w-3 h-3 text-gray-400" />}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {CATEGORIES.find(c => c.value === badge.category)?.label || badge.category}
            </span>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          badge.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {badge.isActive ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {badge.description && (
        <p className="text-sm text-gray-500 mb-3">{badge.description}</p>
      )}

      <div className="text-xs text-gray-400 space-y-1 mb-4">
        <div>Requisito: <span className="text-gray-600 font-medium">
          {REQUIREMENTS.find(r => r.value === badge.requirement)?.label || badge.requirement}
          {badge.requirementValue > 0 && REQUIREMENTS.find(r => r.value === badge.requirement)?.hasValue
            ? ` (${badge.requirementValue})`
            : ''}
        </span></div>
        <div>Puntos: <span className="text-indigo-600 font-bold">{badge.points} pts</span></div>
      </div>

      {canEdit && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(badge)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            onClick={() => onToggle(badge)}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              badge.isActive
                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {badge.isActive
              ? <><ToggleRight className="w-3.5 h-3.5" />Desactivar</>
              : <><ToggleLeft className="w-3.5 h-3.5" />Activar</>
            }
          </button>
          <button
            onClick={() => onDelete(badge)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
