/**
 * Cliente API centralizado con Axios
 * Maneja todas las peticiones HTTP al backend
 */

import axios from 'axios';
import secureStorage from '@utils/secureStorage';

const MOCK_USUARIOS = [
  {
    id: 1,
    nombre: 'Juan',
    apellidos: 'Perez',
    nombre_usuario: 'jperez',
    email: 'juan.perez@siga.gob.mx',
    rol_nombre: 'Administrador',
    area_nombre: 'Direccion General',
  },
  {
    id: 2,
    nombre: 'Maria',
    apellidos: 'Gonzalez',
    nombre_usuario: 'mgonzalez',
    email: 'maria.gonzalez@siga.gob.mx',
    rol_nombre: 'Secretario',
    area_nombre: 'Secretaria de Finanzas',
  },
];

const MOCK_DATOS = {
  unidades: [
    {
      id: 101,
      nombre: 'Secretaria de Finanzas',
      descripcion: 'Gestion presupuestaria y auditoria interna institucional.',
      estado: 'Activo',
      totalDocumentos: 1240,
      pendientes: 12,
    },
    {
      id: 102,
      nombre: 'Direccion General',
      descripcion: 'Coordinacion estrategica y supervision de proyectos criticos.',
      estado: 'Activo',
      totalDocumentos: 850,
      pendientes: 45,
    },
    {
      id: 103,
      nombre: 'Recursos Humanos',
      descripcion: 'Gestion de talento, nomina y servicios al personal administrativo.',
      estado: 'Activo',
      totalDocumentos: 420,
      pendientes: 5,
    },
  ],
  metricasSemanales: [
    { day: 'LUN', total: 60, entrantesRatio: 50 },
    { day: 'MAR', total: 85, entrantesRatio: 35 },
    { day: 'MIE', total: 45, entrantesRatio: 25 },
    { day: 'JUE', total: 100, entrantesRatio: 50 },
    { day: 'VIE', total: 70, entrantesRatio: 40 },
    { day: 'SAB', total: 30, entrantesRatio: 50 },
    { day: 'DOM', total: 20, entrantesRatio: 50 },
  ],
  distribucionEstados: [
    { label: 'Completado', value: 420 },
    { label: 'En Proceso', value: 220 },
    { label: 'Enviado', value: 170 },
    { label: 'Devuelto', value: 40 },
  ],
};

const MOCK_REGISTROS = [
  {
    id: 1,
    folio: 'DG-2023-001',
    asunto: 'Solicitud de Auditoria Trimestral',
    origenDestino: 'Secretaria de Finanzas',
    fecha: '24 Oct 2023',
    estado: 'En Proceso',
    prioridad: 'Alta',
  },
  {
    id: 2,
    folio: 'DG-2023-014',
    asunto: 'Nombramiento Jefe de Area B',
    origenDestino: 'Recursos Humanos',
    fecha: '22 Oct 2023',
    estado: 'Completado',
    prioridad: 'Media',
  },
  {
    id: 3,
    folio: 'DG-2023-019',
    asunto: 'Oficio de Comision: Tlaxcala',
    origenDestino: 'Coordinacion Regional',
    fecha: '21 Oct 2023',
    estado: 'Cancelado',
    prioridad: 'Baja',
  },
];

const unwrapApiData = (response) => {
  if (!response) return null;
  return response?.data?.data ?? response?.data ?? null;
};

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

/**
 * API de dashboard administrativo.
 * Incluye fallback de datos mock para etapas tempranas de integracion.
 */
export const dashboardApi = {
  async getUsuarios() {
    try {
      const response = await apiClient.get('/usuarios');
      return unwrapApiData(response) || [];
    } catch (error) {
      if (error.status === 404) {
        return MOCK_USUARIOS;
      }
      throw error;
    }
  },

  async getDatos() {
    try {
      const response = await apiClient.get('/datos');
      return unwrapApiData(response) || MOCK_DATOS;
    } catch (error) {
      if (error.status === 404) {
        return MOCK_DATOS;
      }
      throw error;
    }
  },

  async getRegistros() {
    try {
      const response = await apiClient.get('/registros');
      return unwrapApiData(response) || [];
    } catch (error) {
      if (error.status === 404) {
        return MOCK_REGISTROS;
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
