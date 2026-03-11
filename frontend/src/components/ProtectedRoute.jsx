/**
 * Componente de rutas protegidas
 * Requiere autenticación para acceder
 * Soporta validación por rol o permiso
 */

import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@store/authStore';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredPermission = null,
  unauthorizedPath = '/unauthorized' 
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    hasRole, 
    hasPermission, 
    user 
  } = useAuthStore();

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
  // Guardar la ubicación actual para redirigir después del login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  // Si la ruta requiere rol específico y el usuario no lo tiene, redirigir
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to={unauthorizedPath} replace />;
  }

  // Si la ruta requiere permiso específico y el usuario no lo tiene, redirigir
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={unauthorizedPath} replace />;
  }

  // Si está autenticado, renderizar children o Outlet
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
