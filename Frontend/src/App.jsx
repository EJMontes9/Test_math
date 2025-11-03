import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        {/* Futuras rutas para las páginas de ejercicios */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="/operaciones" element={<OperacionesCombinadas />} /> */}
        {/* <Route path="/ecuaciones" element={<Ecuaciones />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
