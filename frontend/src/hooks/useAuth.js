/**
 * Hook personalizado para autenticación
 * Proporciona acceso fácil al store de autenticación
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@store/authStore';

/**
 * Hook para acceder al estado de autenticación
 */
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    hasPermission,
    hasRole,
    clearError,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    hasPermission,
    hasRole,
    clearError,
  };
};

/**
 * Hook para requerir autenticación
 * Redirige a login si no está autenticado
 */
export const useRequireAuth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isAuthenticated, isLoading };
};

/**
 * Hook para requerir un permiso específico
 */
export const useRequirePermission = (permiso) => {
  const navigate = useNavigate();
  const { hasPermission, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !hasPermission(permiso)) {
      navigate('/unauthorized', { replace: true });
    }
  }, [permiso, hasPermission, isLoading, navigate]);

  return { hasPermission: hasPermission(permiso), isLoading };
};

/**
 * Hook para requerir un rol específico
 */
export const useRequireRole = (rol) => {
  const navigate = useNavigate();
  const { hasRole, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !hasRole(rol)) {
      navigate('/unauthorized', { replace: true });
    }
  }, [rol, hasRole, isLoading, navigate]);

  return { hasRole: hasRole(rol), isLoading };
};
