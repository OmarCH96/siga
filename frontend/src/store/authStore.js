/**
 * Store de autenticación con Zustand
 * Maneja el estado global de autenticación con Access + Refresh Tokens
 */

import { create } from 'zustand';
import * as authService from '@services/auth.service';

const ADMIN_ROLE = 'Administrador';

const normalizeRole = (roleName = '') => {
  return roleName
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const useAuthStore = create((set, get) => ({
  // Estado
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tokenRefreshInProgress: false,

  /**
   * Inicializa el estado de autenticación desde el almacenamiento
   */
  initAuth: async () => {
    set({ isLoading: true });
    
    try {
      const storedUser = await authService.getStoredUser();
      const storedTokens = await authService.getStoredTokens();

      if (storedUser && storedTokens?.accessToken) {
        // Verificar que el token sea válido
        try {
          const isValid = await authService.verifyToken();
          
          if (isValid) {
            set({
              user: storedUser,
              accessToken: storedTokens.accessToken,
              refreshToken: storedTokens.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Token inválido
            await authService.logout();
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          // Token inválido, intentar refrescar
          if (storedTokens?.refreshToken) {
            const refreshed = await get().refreshAccessToken();
            if (!refreshed) {
              await authService.logout();
              set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } else {
            await authService.logout();
            set({ isLoading: false });
          }
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({
        isLoading: false,
        error: 'Error al inicializar sesión',
      });
    }
  },

  /**
   * Login de usuario
   */
  login: async (nombreUsuario, contraseña) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.login(nombreUsuario, contraseña);
      const { usuario, accessToken, refreshToken } = result;
      
      console.log('📝 Login response usuario completo:', usuario);
      console.log('📝 Rol del usuario:', {
        rol: usuario.rol,
        rolNombre: usuario.rol?.nombre,
        rolId: usuario.rol?.id,
        permisos: usuario.rol?.permisos
      });

      set({
        user: usuario,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, usuario };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al iniciar sesión',
      });

      return {
        success: false,
        error: error.message || 'Error al iniciar sesión',
      };
    }
  },

  /**
   * Refresca el access token usando el refresh token
   */
  refreshAccessToken: async () => {
    const state = get();
    
    // Evitar múltiples refreshes simultáneos
    if (state.tokenRefreshInProgress) {
      return false;
    }

    set({ tokenRefreshInProgress: true });

    try {
      const refreshToken = state.refreshToken;
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const result = await authService.refreshToken(refreshToken);
      const { usuario, accessToken, refreshToken: newRefreshToken } = result;

      set({
        user: usuario,
        accessToken,
        refreshToken: newRefreshToken,
        isAuthenticated: true,
        tokenRefreshInProgress: false,
      });

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      
      // Si falla el refresh, cerrar sesión
      await authService.logout();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        tokenRefreshInProgress: false,
        error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
      });

      return false;
    }
  },

  /**
   * Logout de usuario
   */
  logout: async () => {
    try {
      const refreshToken = get().refreshToken;
      await authService.logout(refreshToken);
      
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  },

  /**
   * Logout de todas las sesiones
   */
  logoutAll: async () => {
    try {
      await authService.logoutAll();
      
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error('Error al cerrar todas las sesiones:', error);
    }
  },

  /**
   * Actualiza los datos del usuario
   */
  updateUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData },
    }));
  },

  /**
   * Limpia el error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  hasPermission: (permiso) => {
    const { user } = get();
    
    // Soportar múltiples estructuras:
    // - user.permisos (actual desde login)
    // - user.rol.permisos (estructura anidada)
    // - user.rol_permisos (backward compatibility)
    const permisos = user?.permisos || user?.rol?.permisos || user?.rol_permisos;
    
    if (!user || !permisos) {
      return false;
    }

    // Si tiene todos los permisos (*)
    if (permisos === '*') {
      return true;
    }

    // Verificar si tiene el permiso específico
    const listaPermisos = Array.isArray(permisos) 
      ? permisos 
      : permisos.split(',').map(p => p.trim());
    
    return listaPermisos.includes(permiso);
  },

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole: (rol) => {
    const { user } = get();
    
    // Soportar tanto estructura nueva (rol.nombre) como antigua (rol_nombre o rolNombre)
    const rolNombre = user?.rol?.nombre || user?.rol_nombre || user?.rolNombre;
    
    // Debug temporal
    console.log('🔍 hasRole check:', {
      requiredRole: rol,
      userRole: rolNombre,
      userObject: user,
      normalized: {
        required: normalizeRole(rol),
        actual: normalizeRole(rolNombre)
      },
      matches: normalizeRole(rolNombre) === normalizeRole(rol)
    });
    
    return normalizeRole(rolNombre) === normalizeRole(rol);
  },
}));

export default useAuthStore;
