/**
 * Servicio de autenticación del frontend
 * Maneja Access Token + Refresh Token y protección CSRF
 */

import apiClient, { setToken, removeToken } from './api';
import secureStorage from '@utils/secureStorage';

// Clave de almacenamiento para tokens
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'authToken', // Mantener compatibilidad con api.js
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  CSRF_TOKEN: 'csrfToken',
};

/**
 * Login de usuario
 * @param {string} nombreUsuario - Nombre de usuario
 * @param {string} contraseña - Contraseña
 * @returns {Promise<Object>} Usuario y tokens
 */
export const login = async (nombreUsuario, contraseña) => {
  try {
    const response = await apiClient.post('/auth/login', {
      nombreUsuario,
      contraseña,
    });

    const { usuario, accessToken, refreshToken } = response.data.data;

    // Guardar tokens y usuario
    await setToken(accessToken);
    await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await secureStorage.setItem(STORAGE_KEYS.USER, usuario);

    // Obtener token CSRF
    await fetchCSRFToken();

    return { usuario, accessToken, refreshToken };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
  }
};

/**
 * Refresca el access token usando el refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} Nuevos tokens y usuario
 */
export const refreshToken = async (refreshToken) => {
  try {
    const response = await apiClient.post('/auth/refresh', {
      refreshToken,
    });

    const { usuario, accessToken, refreshToken: newRefreshToken } = response.data.data;

    // Actualizar tokens guardados
    await setToken(accessToken);
    await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
    await secureStorage.setItem(STORAGE_KEYS.USER, usuario);

    return { usuario, accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    // Si falla el refresh, limpiar todo
    await logout();
    throw new Error('Sesión expirada');
  }
};

/**
 * Cierra sesión del usuario
 * @param {string} refreshToken - Refresh token a revocar (opcional)
 */
export const logout = async (refreshToken = null) => {
  try {
    // Obtener refresh token del storage si no se proporciona
    const tokenToRevoke = refreshToken || await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (tokenToRevoke) {
      // Enviar al backend para revocar el token
      await apiClient.post('/auth/logout', {
        refreshToken: tokenToRevoke,
      });
    }
  } catch (error) {
    console.error('Error al cerrar sesión en el servidor:', error);
    // Continuar con la limpieza local aunque falle el backend
  } finally {
    // Limpiar almacenamiento local
    await removeToken();
    await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await secureStorage.removeItem(STORAGE_KEYS.USER);
    await secureStorage.removeItem(STORAGE_KEYS.CSRF_TOKEN);
  }
};

/**
 * Cierra todas las sesiones del usuario
 */
export const logoutAll = async () => {
  try {
    await apiClient.post('/auth/logout-all');
  } catch (error) {
    console.error('Error al cerrar todas las sesiones:', error);
  } finally {
    // Limpiar almacenamiento local
    await removeToken();
    await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await secureStorage.removeItem(STORAGE_KEYS.USER);
    await secureStorage.removeItem(STORAGE_KEYS.CSRF_TOKEN);
  }
};

/**
 * Obtiene el perfil del usuario autenticado
 * @returns {Promise<Object>} Información del usuario
 */
export const getProfile = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    
    // Actualizar usuario en storage
    await secureStorage.setItem(STORAGE_KEYS.USER, response.data.data);
    
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener perfil');
  }
};

/**
 * Obtiene las sesiones activas del usuario
 * @returns {Promise<Array>} Lista de sesiones activas
 */
export const getActiveSessions = async () => {
  try {
    const response = await apiClient.get('/auth/sessions');
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener sesiones');
  }
};

/**
 * Verifica si el token es válido
 * @returns {Promise<boolean>} true si el token es válido
 */
export const verifyToken = async () => {
  try {
    await apiClient.get('/auth/verify');
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Obtiene el token CSRF del servidor
 * @returns {Promise<string>} Token CSRF
 */
export const fetchCSRFToken = async () => {
  try {
    const response = await apiClient.get('/auth/csrf-token');
    const csrfToken = response.data.data.csrfToken;
    
    await secureStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, csrfToken);
    
    return csrfToken;
  } catch (error) {
    console.error('Error obteniendo CSRF token:', error);
    return null;
  }
};

/**
 * Obtiene el token CSRF del storage
 * @returns {Promise<string|null>} Token CSRF o null
 */
export const getCSRFToken = async () => {
  return await secureStorage.getItem(STORAGE_KEYS.CSRF_TOKEN);
};

/**
 * Obtiene el usuario almacenado localmente
 * @returns {Promise<Object|null>} Usuario o null
 */
export const getStoredUser = async () => {
  try {
    return await secureStorage.getItem(STORAGE_KEYS.USER);
  } catch (error) {
    return null;
  }
};

/**
 * Obtiene los tokens almacenados
 * @returns {Promise<Object|null>} { accessToken, refreshToken } o null
 */
export const getStoredTokens = async () => {
  try {
    const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    return { accessToken, refreshToken };
  } catch (error) {
    return null;
  }
};

/**
 * Verifica si el usuario está autenticado
 * @returns {Promise<boolean>} true si está autenticado
 */
export const isAuthenticated = async () => {
  const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  return accessToken !== null;
};
