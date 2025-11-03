import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  LogOut,
  Menu,
  X,
  Brain,
  Settings,
  ChevronRight
} from 'lucide-react';
import authService from '../../services/authService';
import { useSettings } from '../../context/SettingsContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const { settings } = useSettings();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      role: ['admin']
    },
    {
      path: '/admin/users',
      icon: Users,
      label: 'Usuarios',
      role: ['admin']
    },
    {
      path: '/admin/paralelos',
      icon: BookOpen,
      label: 'Paralelos',
      role: ['admin']
    },
    {
      path: '/admin/settings',
      icon: Settings,
      label: 'Configuración',
      role: ['admin']
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-80 text-white shadow-2xl z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static`}
        style={{
          background: `linear-gradient(to bottom, var(--color-primary), var(--color-secondary))`
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-lg">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{settings.app_name || 'MathMaster'}</h1>
                  <p className="text-xs text-white/70">Admin Panel</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* User Info */}
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-lg">
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-white/70">{user?.email}</p>
              <div className="mt-2">
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  {user?.role === 'admin' ? 'Administrador' : user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        active
                          ? 'bg-white shadow-lg'
                          : 'text-white/90 hover:bg-white/10'
                      }`}
                      style={active ? { color: 'var(--color-primary)' } : {}}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {active && <ChevronRight className="w-5 h-5" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
