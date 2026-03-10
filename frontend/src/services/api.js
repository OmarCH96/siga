/**
 * Cliente API centralizado con Axios
 * Maneja todas las peticiones HTTP con refresh automático de tokens y CSRF
 */

import axios from 'axios';
import secureStorage from '@utils/secureStorage';

// URL base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Flag para evitar múltiples refresh simultáneos
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
 * Agrega el token JWT y CSRF token automáticamente
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Obtener access token del almacenamiento seguro
    const token = await secureStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Si es una petición de modificación (POST, PUT, DELETE), agregar CSRF token
    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
      const csrfToken = await secureStorage.getItem('csrfToken');
      
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuestas
 * Maneja refresh automático de tokens y errores globalmente
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (no autorizado) y no es la ruta de login/refresh
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      // Si ya estamos refrescando, agregar la petición a la cola
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Intentar refrescar el token
        const refreshToken = await secureStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Guardar nuevos tokens
        await secureStorage.setItem('authToken', accessToken);
        await secureStorage.setItem('refreshToken', newRefreshToken);

        // Actualizar header y reintentar petición original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Si falla el refresh, limpiar sesión y redirigir a login
        await secureStorage.removeItem('authToken');
        await secureStorage.removeItem('refreshToken');
        await secureStorage.removeItem('user');
        await secureStorage.removeItem('csrfToken');

        // Redirigir a login si no estamos ya allí
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Si es error 403 CSRF, recargar token CSRF
    if (error.response?.status === 403 && error.response?.data?.code === 'INVALID_CSRF_TOKEN') {
      try {
        // Recargar CSRF token
        const csrfResponse = await apiClient.get('/auth/csrf-token');
        const newCsrfToken = csrfResponse.data.data.csrfToken;
        await secureStorage.setItem('csrfToken', newCsrfToken);

        // Reintentar petición original
        originalRequest.headers['X-CSRF-Token'] = newCsrfToken;
        return apiClient(originalRequest);
      } catch (csrfError) {
        console.error('Error refreshing CSRF token:', csrfError);
      }
    }

    // Si es error 429 (rate limit)
    if (error.response?.status === 429) {
      const message = error.response?.data?.message || 'Demasiadas peticiones. Intente más tarde.';
      
      console.warn('Rate limit exceeded:', message);
      
      return Promise.reject({
        message,
        status: 429,
        data: error.response?.data,
      });
    }

    // Formato de error consistente
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Error de conexión con el servidor';

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
      code: error.response?.data?.code,
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

/**
 * Extrae los datos de la respuesta de la API
 * @param {Object} response - Respuesta de Axios
 * @returns {*} Los datos extraídos
 */
const unwrapApiData = (response) => {
  // La estructura típica es response.data.data o response.data
  return response?.data?.data || response?.data;
};

/**
 * API de dashboard administrativo.
 * Incluye fallback de datos mock para etapas tempranas de integracion.
 */
export const dashboardApi = {
  async getUsuarios() {
    try {
      const response = await apiClient.get('/dashboard/usuarios');
      return unwrapApiData(response) || [];
    } catch (error) {
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getDatos() {
    try {
      const response = await apiClient.get('/dashboard/datos');
      return unwrapApiData(response) || { unidades: [], metricasSemanales: [], distribucionEstados: [] };
    } catch (error) {
      if (error.status === 404) {
        return { unidades: [], metricasSemanales: [], distribucionEstados: [] };
      }
      throw error;
    }
  },

  async getRegistros() {
    try {
      const response = await apiClient.get('/dashboard/registros');
      return unwrapApiData(response) || [];
    } catch (error) {
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async createRegistro(payload) {
    try {
      const response = await apiClient.post('/registros', payload);
      return unwrapApiData(response);
    } catch (error) {
      if (error.status === 404) {
        return {
          id: Date.now(),
          folio: `DG-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
          asunto: payload.asunto,
          origenDestino: payload.destino,
          fecha: new Date().toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          estado: 'En Proceso',
          prioridad: payload.prioridad,
        };
      }
      throw error;
    }
  },
};

export default apiClient;
