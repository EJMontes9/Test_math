import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminLayout from './components/layout/AdminLayout';
import TeacherLayout from './components/layout/TeacherLayout';
import StudentLayout from './components/layout/StudentLayout';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Paralelos from './pages/admin/Paralelos';
import Settings from './pages/admin/Settings';
import TeacherDashboard from './pages/teacher/Dashboard';
import MyParalelos from './pages/teacher/MyParalelos';
import ParaleloStudents from './pages/teacher/ParaleloStudents';
import StudentDetail from './pages/teacher/StudentDetail';
import Goals from './pages/teacher/Goals';
import Versus from './pages/teacher/Versus';
import TeacherRanking from './pages/teacher/TeacherRanking';
import TeacherResources from './pages/teacher/Resources';
import TeacherPerformance from './pages/teacher/Performance';
import TeacherReports from './pages/teacher/Reports';
import StudentDashboard from './pages/student/Dashboard';
import Game from './pages/student/Game';
import Ranking from './pages/student/Ranking';
import StudentGoals from './pages/student/Goals';
import StudentChallenges from './pages/student/Challenges';
import StudentBadges from './pages/student/Badges';
import StudentResources from './pages/student/Resources';
import Profile from './pages/Profile';

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
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="paralelos" element={<MyParalelos />} />
          <Route path="paralelo/:paraleloId/students" element={<ParaleloStudents />} />
          <Route path="student/:studentId" element={<StudentDetail />} />
          <Route path="goals" element={<Goals />} />
          <Route path="versus" element={<Versus />} />
          <Route path="ranking" element={<TeacherRanking />} />
          <Route path="resources" element={<TeacherResources />} />
          <Route path="performance" element={<TeacherPerformance />} />
          <Route path="reports" element={<TeacherReports />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="game" element={<Game />} />
          <Route path="ranking" element={<Ranking />} />
          <Route path="goals" element={<StudentGoals />} />
          <Route path="challenges" element={<StudentChallenges />} />
          <Route path="badges" element={<StudentBadges />} />
          <Route path="resources" element={<StudentResources />} />
          <Route path="profile" element={<Profile />} />
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
