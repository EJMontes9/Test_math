import { Menu, Bell, Search } from 'lucide-react';
import authService from '../../services/authService';

const Header = ({ toggleSidebar }) => {
  const user = authService.getStoredUser();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left: Menu Button + Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Panel de Administración
            </h2>
            <p className="text-sm text-gray-500 hidden sm:block">
              Gestiona tu plataforma educativa
            </p>
          </div>
        </div>

        {/* Right: Search + Notifications + User */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search - Hidden on mobile */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent border-none outline-none ml-2 text-sm w-40 lg:w-60"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-6 h-6 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Avatar */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-gray-800">
                {user?.firstName}
              </p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
