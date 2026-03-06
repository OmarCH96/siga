/**
 * Componente principal de la aplicación
 * Configura las rutas y el sistema de autenticación
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '@store/authStore';
import ProtectedRoute from '@components/ProtectedRoute';
import Login from '@pages/Login/Login';
import Dashboard from '@pages/Dashboard/Dashboard';

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  // Inicializar autenticación al cargar la app
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz redirige a dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Ruta pública de login */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <h1>404 - Página no encontrada</h1>
            <a href="/dashboard" style={{
              color: '#1976d2',
              textDecoration: 'none'
            }}>
              Volver al Dashboard
            </a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
