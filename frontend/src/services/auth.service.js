/**
 * Servicio de autenticación
 * Maneja las operaciones de login, logout y gestión de sesión
 */

import apiClient, { setToken, removeToken } from './api';
import secureStorage from '@utils/secureStorage';

/**
 * Login de usuario
 * @param {string} nombreUsuario - Nombre de usuario
 * @param {string} contraseña - Contraseña
 * @returns {Promise<Object>} Usuario y token
 */
export const login = async (nombreUsuario, contraseña) => {
  try {
    const response = await apiClient.post('/auth/login', {
      nombreUsuario,
      contraseña,
    });

    const { usuario, token } = response.data.data;

    // Guardar token y usuario en almacenamiento seguro
    await setToken(token);
    await secureStorage.setItem('user', usuario);

    return { usuario, token };
  } catch (error) {
    throw error;
  }
};

/**
 * Cierra sesión del usuario
 */
export const logout = async () => {
  try {
    // Limpiar almacenamiento
    await removeToken();
    await secureStorage.removeItem('user');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};

/**
 * Obtiene el perfil del usuario autenticado
 * @returns {Promise<Object>} Información del usuario
 */
export const getProfile = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  } catch (error) {
    throw error;
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
 * Obtiene el usuario almacenado localmente
 * @returns {Promise<Object|null>} Usuario o null
 */
export const getStoredUser = async () => {
  try {
    return await secureStorage.getItem('user');
  } catch (error) {
    return null;
  }
};

/**
 * Verifica si el usuario está autenticado
 * @returns {Promise<boolean>} true si está autenticado
 */
export const isAuthenticated = async () => {
  const token = await secureStorage.getItem('authToken');
  return token !== null;
};
