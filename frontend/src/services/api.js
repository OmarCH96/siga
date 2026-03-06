/**
 * Cliente API centralizado con Axios
 * Maneja todas las peticiones HTTP al backend
 */

import axios from 'axios';
import secureStorage from '@utils/secureStorage';

// URL base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Instancia de Axios configurada
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de peticiones
 * Agrega el token JWT automáticamente
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Obtener token del almacenamiento seguro
    const token = await secureStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuestas
 * Maneja errores globalmente
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (no autorizado), limpiar sesión
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Limpiar token y redirigir a login
      await secureStorage.removeItem('authToken');
      await secureStorage.removeItem('user');
      
      // Redirigir a login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Formato de error consistente
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Error de conexión';

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

/**
 * Obtiene el token actual
 */
export const getToken = async () => {
  return await secureStorage.getItem('authToken');
};

/**
 * Establece el token
 */
export const setToken = async (token) => {
  await secureStorage.setItem('authToken', token);
};

/**
 * Elimina el token
 */
export const removeToken = async () => {
  await secureStorage.removeItem('authToken');
};

export default apiClient;
