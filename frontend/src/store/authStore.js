/**
 * Store de autenticación con Zustand
 * Maneja el estado global de autenticación
 */

import { create } from 'zustand';
import * as authService from '@services/auth.service';

const useAuthStore = create((set, get) => ({
  // Estado
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /**
   * Inicializa el estado de autenticación desde el almacenamiento
   */
  initAuth: async () => {
    set({ isLoading: true });
    
    try {
      const storedUser = await authService.getStoredUser();
      const isAuth = await authService.isAuthenticated();

      if (isAuth && storedUser) {
        // Verificar que el token sea válido
        const isValid = await authService.verifyToken();
        
        if (isValid) {
          set({
            user: storedUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          // Token inválido, limpiar
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
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
      const { usuario, token } = await authService.login(nombreUsuario, contraseña);

      set({
        user: usuario,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
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
   * Logout de usuario
   */
  logout: async () => {
    try {
      await authService.logout();
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
    
    if (!user || !user.rol_permisos) {
      return false;
    }

    // Si tiene todos los permisos (*)
    if (user.rol_permisos === '*') {
      return true;
    }

    // Verificar si tiene el permiso específico
    const permisos = user.rol_permisos.split(',').map(p => p.trim());
    return permisos.includes(permiso);
  },

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole: (rol) => {
    const { user } = get();
    return user?.rol_nombre === rol;
  },
}));

export default useAuthStore;
