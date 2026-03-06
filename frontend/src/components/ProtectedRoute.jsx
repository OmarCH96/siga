/**
 * Componente de rutas protegidas
 * Requiere autenticación para acceder
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loader mientras verifica autenticación
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner" />
        <p>Verificando sesión...</p>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizar children o Outlet
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
