import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminLayout from './components/layout/AdminLayout';
import TeacherLayout from './components/layout/TeacherLayout';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Paralelos from './pages/admin/Paralelos';
import Settings from './pages/admin/Settings';
import TeacherDashboard from './pages/teacher/Dashboard';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
        <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="paralelos" element={<Paralelos />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="paralelos" element={<div className="p-6">Mis Paralelos - En construcción</div>} />
          <Route path="goals" element={<div className="p-6">Metas - En construcción</div>} />
          <Route path="versus" element={<div className="p-6">Versus - En construcción</div>} />
          <Route path="ranking" element={<div className="p-6">Ranking - En construcción</div>} />
        </Route>

        {/* Unauthorized */}
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Acceso Denegado</h1>
              <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
            </div>
          </div>
        } />

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-gray-600">Página no encontrada.</p>
            </div>
          </div>
        } />
      </Routes>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
