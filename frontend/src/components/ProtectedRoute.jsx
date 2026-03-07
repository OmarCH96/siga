/**
 * Componente de rutas protegidas
 * Requiere autenticación para acceder
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

const ProtectedRoute = ({ children, requiredRole = null, unauthorizedPath = '/unauthorized' }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

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

  // Si la ruta requiere rol específico y el usuario no lo tiene, redirigir
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to={unauthorizedPath} replace />;
  }

  // Si está autenticado, renderizar children o Outlet
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
