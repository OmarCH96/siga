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
import Usuarios from '@pages/Usuarios/Usuarios';
import UnidadesAdministrativas from '@pages/UnidadesAdministrativas/UnidadesAdministrativas';
import DetalleUnidad from '@pages/UnidadesAdministrativas/DetalleUnidad';
import TiposDocumento from '@pages/TiposDocumento/TiposDocumento';
import FormularioEmision from '@pages/Emision/FormularioEmision';
import Unauthorized from '@pages/Unauthorized/Unauthorized';
import RegistroAccesos from '@pages/Accesos/RegistroAccesos';
import { BandejaRecepcionLayout } from './pages/BandejaRecepcion';


const RootRedirect = () => {
  const user = useAuthStore((state) => state.user);
  const rolNombre = user?.rol?.nombre || user?.rolNombre || '';
  const isAdmin = normalizeRole(rolNombre) === 'administrador';
  return <Navigate to={isAdmin ? '/dashboard' : '/recepciones'} replace />;
};

const normalizeRole = (roleName = '') =>
  roleName.toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  // Inicializar autenticación al cargar la app
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz redirige según rol */}
        <Route path="/" element={<RootRedirect />} />

        {/* Ruta pública de login */}
        <Route path="/login" element={<Login />} />

        {/* Ruta de acceso no autorizado */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Rutas protegidas solo para administradores */}
        <Route element={<ProtectedRoute requiredRole="Administrador" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/unidades" element={<UnidadesAdministrativas />} />
          <Route path="/unidades/:id" element={<DetalleUnidad />} />
          <Route path="/documentos" element={<TiposDocumento />} />
          <Route path="/accesos" element={<RegistroAccesos />} />
        </Route>

        {/* Rutas protegidas por permisos específicos */}
        <Route element={<ProtectedRoute requiredPermission="CREAR_DOCUMENTO" />}>
          <Route path="/documentos/emitir" element={<FormularioEmision />} />
        </Route>

        {/* Rutas protegidas para cualquier usuario autenticado */}
        <Route element={<ProtectedRoute />}>
          <Route path="/recepciones" element={<BandejaRecepcionLayout />} />
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
              color: '#246257',
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
