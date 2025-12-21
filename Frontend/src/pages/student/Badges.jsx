import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Star, Crown, Flame, Target, Zap, Check, X, Loader2 } from 'lucide-react';
import badgeService from '../../services/badgeService';

const rarityColors = {
  common: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600', gradient: 'from-gray-400 to-gray-600' },
  rare: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-600', gradient: 'from-blue-400 to-blue-600' },
  epic: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-600', gradient: 'from-purple-400 to-purple-600' },
  legendary: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-600', gradient: 'from-yellow-400 to-amber-600' }
};

const rarityLabels = {
  common: 'Comun',
  rare: 'Raro',
  epic: 'Epico',
  legendary: 'Legendario'
};

export default function Badges() {
  const [myBadges, setMyBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [showNewBadgeModal, setShowNewBadgeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('my-badges');

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const [myBadgesRes, allBadgesRes] = await Promise.all([
        badgeService.getMyBadges(),
        badgeService.getAllBadges()
      ]);

      if (myBadgesRes.success) {
        setMyBadges(myBadgesRes.data);
      }
      if (allBadgesRes.success) {
        setAllBadges(allBadgesRes.data);
      }

      // Verificar nuevas insignias
      const achievementRes = await badgeService.checkAchievements();
      if (achievementRes.success && achievementRes.data.newBadges?.length > 0) {
        setNewBadges(achievementRes.data.newBadges);
        setShowNewBadgeModal(true);
        // Recargar insignias
        const updatedBadges = await badgeService.getMyBadges();
        if (updatedBadges.success) {
          setMyBadges(updatedBadges.data);
        }
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEquip = async (badgeId) => {
    try {
      setEquipping(badgeId);
      const response = await badgeService.equipBadge(badgeId);
      if (response.success) {
        // Actualizar estado local
        setMyBadges(prev => prev.map(b => ({
          ...b,
          isEquipped: b.badgeId === badgeId
        })));
      }
    } catch (error) {
      console.error('Error equipping badge:', error);
    } finally {
      setEquipping(null);
    }
  };

  const handleUnequip = async () => {
    try {
      const response = await badgeService.unequipBadge();
      if (response.success) {
        setMyBadges(prev => prev.map(b => ({
          ...b,
          isEquipped: false
        })));
      }
    } catch (error) {
      console.error('Error unequipping badge:', error);
    }
  };

  const getLockedBadges = () => {
    const ownedIds = new Set(myBadges.map(b => b.badgeId));
    return allBadges.filter(b => !ownedIds.has(b.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const equippedBadge = myBadges.find(b => b.isEquipped);
  const lockedBadges = getLockedBadges();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Insignias</h1>
          <p className="text-gray-500">Colecciona insignias y muestra tus logros</p>
        </div>
        <div className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl">
          <Award className="w-5 h-5" />
          <span className="font-bold">{myBadges.length}</span>
          <span className="text-white/80">de {allBadges.length}</span>
        </div>
      </div>

      {/* Insignia equipada actual */}
      {equippedBadge && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
                {equippedBadge.icon}
              </div>
              <div>
                <p className="text-white/70 text-sm">Insignia Equipada</p>
                <h3 className="text-xl font-bold">{equippedBadge.name}</h3>
                <p className="text-white/80 text-sm">{equippedBadge.description}</p>
              </div>
            </div>
            <button
              onClick={handleUnequip}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              Desequipar
            </button>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('my-badges')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'my-badges'
              ? 'bg-white text-indigo-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Mis Insignias ({myBadges.length})
        </button>
        <button
          onClick={() => setActiveTab('locked')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'locked'
              ? 'bg-white text-indigo-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Por Desbloquear ({lockedBadges.length})
        </button>
      </div>

      {/* Contenido de tabs */}
      <AnimatePresence mode="wait">
        {activeTab === 'my-badges' ? (
          <motion.div
            key="my-badges"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {myBadges.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aun no tienes insignias</p>
                <p className="text-gray-400 text-sm">Sigue jugando para desbloquear logros</p>
              </div>
            ) : (
              myBadges.map((badge, index) => {
                const colors = rarityColors[badge.rarity];
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative bg-white rounded-xl p-4 border-2 ${colors.border} ${
                      badge.isEquipped ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                    }`}
                  >
                    {badge.isEquipped && (
                      <div className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                        Equipada
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colors.bg}`}
                        style={{ backgroundColor: badge.color + '20' }}
                      >
                        {badge.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{badge.name}</h3>
                        <p className="text-sm text-gray-500">{badge.description}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                            {rarityLabels[badge.rarity]}
                          </span>
                          <span className="text-xs text-gray-400">
                            {badge.badgeType === 'title' ? 'Titulo' : badge.badgeType === 'border' ? 'Borde' : 'Efecto'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!badge.isEquipped && (
                      <button
                        onClick={() => handleEquip(badge.badgeId)}
                        disabled={equipping === badge.badgeId}
                        className="mt-3 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        {equipping === badge.badgeId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Equipar</span>
                          </>
                        )}
                      </button>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        ) : (
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {lockedBadges.map((badge, index) => {
              const colors = rarityColors[badge.rarity];
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative bg-gray-100 rounded-xl p-4 border-2 border-gray-200 opacity-75"
                >
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <X className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-2xl grayscale">
                      {badge.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-600">{badge.name}</h3>
                      <p className="text-sm text-gray-400">{badge.description}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500`}>
                          {rarityLabels[badge.rarity]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 py-2 bg-gray-200 text-gray-500 rounded-lg text-center text-sm">
                    Bloqueada
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de nueva insignia */}
      <AnimatePresence>
        {showNewBadgeModal && newBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewBadgeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Nueva Insignia Desbloqueada!</h2>
              </div>

              <div className="space-y-3">
                {newBadges.map((badge) => {
                  const colors = rarityColors[badge.rarity];
                  return (
                    <div
                      key={badge.id}
                      className={`flex items-center space-x-3 p-3 rounded-xl ${colors.bg} border ${colors.border}`}
                    >
                      <div className="text-3xl">{badge.icon}</div>
                      <div>
                        <h3 className="font-bold text-gray-800">{badge.name}</h3>
                        <p className="text-sm text-gray-600">{badge.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowNewBadgeModal(false)}
                className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-colors"
              >
                Genial!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
