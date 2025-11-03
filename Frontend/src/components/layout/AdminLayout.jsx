import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import authService from '../../services/authService';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getStoredUser();

  // Redirigir si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir si no es admin
  if (user?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
