/**
 * Servicio de Áreas (Unidades Administrativas)
 * Funciones para gestionar áreas/unidades en el sistema
 */

import apiClient from './api';

/**
 * Obtener todas las áreas con filtros y paginación
 * @param {Object} filters - Filtros opcionales (activa, tipo, areaPadreId, busqueda, page, limit)
 * @returns {Promise<Object>} Lista de áreas con paginación
 */
export const getAllAreas = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.activa !== undefined) {
    params.append('activa', filters.activa);
  }
  
  if (filters.tipo) {
    params.append('tipo', filters.tipo);
  }

  if (filters.areaPadreId !== undefined) {
    params.append('areaPadreId', filters.areaPadreId);
  }

  if (filters.busqueda || filters.search) {
    params.append('busqueda', filters.busqueda || filters.search);
  }

  if (filters.page) {
    params.append('page', filters.page);
  }

  if (filters.limit) {
    params.append('limit', filters.limit);
  }

  const response = await apiClient.get(`/areas?${params.toString()}`);
  return response.data;
};

/**
 * Obtener todas las áreas activas (sin paginación)
 * Útil para selectores y listas desplegables
 * @returns {Promise<Object>} Lista de áreas activas
 */
export const getAreasActivas = async () => {
  const response = await apiClient.get('/areas/activas');
  return response.data;
};

/**
 * Obtener árbol jerárquico de áreas
 * @param {number} areaPadreId - ID del área padre (opcional)
 * @returns {Promise<Object>} Árbol jerárquico
 */
export const getArbolJerarquico = async (areaPadreId = null) => {
  const params = areaPadreId ? `?areaPadreId=${areaPadreId}` : '';
  const response = await apiClient.get(`/areas/arbol${params}`);
  return response.data;
};

/**
 * Obtener jerarquía completa de áreas (alias para compatibilidad)
 * @returns {Promise<Object>} Áreas en jerarquía
 */
export const getJerarquiaAreas = async () => {
  const response = await apiClient.get('/areas/jerarquia');
  return response.data;
};

/**
 * Obtener estadísticas de áreas
 * @returns {Promise<Object>} Estadísticas
 */
export const getEstadisticas = async () => {
  const response = await apiClient.get('/areas/estadisticas');
  return response.data;
};

/**
 * Obtener un área por ID
 * @param {number} id - ID del área
 * @returns {Promise<Object>} Área encontrada
 */
export const getAreaById = async (id) => {
  const response = await apiClient.get(`/areas/${id}`);
  return response.data;
};

/**
 * Obtener ruta jerárquica de un área
 * @param {number} id - ID del área
 * @returns {Promise<Object>} Ruta desde raíz hasta área
 */
export const getRutaJerarquica = async (id) => {
  const response = await apiClient.get(`/areas/${id}/ruta`);
  return response.data;
};

/**
 * Obtener subáreas de un área
 * @param {number} id - ID del área padre
 * @param {boolean} soloActivas - Solo áreas activas (default: true)
 * @returns {Promise<Object>} Lista de subáreas
 */
export const getSubareas = async (id, soloActivas = true) => {
  const params = soloActivas !== undefined ? `?soloActivas=${soloActivas}` : '';
  const response = await apiClient.get(`/areas/${id}/subareas${params}`);
  return response.data;
};

/**
 * Crear una nueva área
 * @param {Object} data - Datos del área
 * @param {string} data.nombre - Nombre del área
 * @param {string} data.clave - Clave única del área
 * @param {string} data.tipo - Tipo de área (ENUM)
 * @param {number} data.areaPadreId - ID del área padre (opcional)
 * @param {string} data.descripcion - Descripción (opcional)
 * @returns {Promise<Object>} Área creada
 */
export const createArea = async (data) => {
  // Transformar datos al formato del backend
  const payload = {
    nombre: data.nombre?.trim(),
    clave: data.clave?.trim().toUpperCase(),
    tipo: data.tipo,
    areaPadreId: data.areaPadreId || data.area_padre_id || null,
    descripcion: data.descripcion?.trim() || null,
  };

  const response = await apiClient.post('/areas', payload);
  return response.data;
};

/**
 * Actualizar un área existente
 * @param {number} id - ID del área
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Área actualizada
 */
export const updateArea = async (id, data) => {
  // Transformar datos al formato del backend
  const payload = {};

  if (data.nombre !== undefined) {
    payload.nombre = data.nombre?.trim();
  }

  if (data.clave !== undefined) {
    payload.clave = data.clave?.trim().toUpperCase();
  }

  if (data.tipo !== undefined) {
    payload.tipo = data.tipo;
  }

  if (data.areaPadreId !== undefined || data.area_padre_id !== undefined) {
    payload.areaPadreId = data.areaPadreId || data.area_padre_id || null;
  }

  if (data.descripcion !== undefined) {
    payload.descripcion = data.descripcion?.trim() || null;
  }

  if (data.activa !== undefined) {
    payload.activa = data.activa;
  }

  const response = await apiClient.put(`/areas/${id}`, payload);
  return response.data;
};

/**
 * Activar/Desactivar un área
 * @param {number} id - ID del área
 * @param {boolean} activa - Estado activo/inactivo
 * @returns {Promise<Object>} Área actualizada
 */
export const toggleAreaStatus = async (id, activa) => {
  const response = await apiClient.patch(`/areas/${id}/status`, { activa });
  return response.data;
};

// Aliases para compatibilidad con código existente
export const getUsuariosPorArea = async (id) => {
  // Este endpoint debe estar en usuario.service.js, pero lo dejamos como placeholder
  const response = await apiClient.get(`/usuarios?areaId=${id}`);
  return response.data;
};

export const getAreasHijas = getSubareas;

/**
 * Obtiene los documentos (emisiones o recepciones) de un área.
 * @param {number|string} id    - ID del área
 * @param {Object} filters
 * @param {string}  filters.tipo       - 'emisiones' | 'recepciones'
 * @param {number}  [filters.page]     - Página (default 1)
 * @param {number}  [filters.limit]    - Registros por página (default 10)
 * @param {string}  [filters.busqueda] - Búsqueda libre
 * @param {string}  [filters.estado]   - Estado del documento
 * @param {string}  [filters.claveTipo]- Clave tipo de doc (solo emisiones)
 * @returns {Promise<{ documentos: Array, total: number, page: number, limit: number, totalPages: number }>}
 */
export const getDocumentosPorArea = async (id, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.tipo) params.append('tipo', filters.tipo);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.busqueda) params.append('busqueda', filters.busqueda);
  if (filters.estado) params.append('estado', filters.estado);
  if (filters.claveTipo) params.append('claveTipo', filters.claveTipo);

  const response = await apiClient.get(`/areas/${id}/documentos?${params.toString()}`);
  return response.data.data;
};

export default {
  getAllAreas,
  getAreasActivas,
  getArbolJerarquico,
  getJerarquiaAreas,
  getEstadisticas,
  getAreaById,
  getRutaJerarquica,
  getSubareas,
  createArea,
  updateArea,
  toggleAreaStatus,
  getUsuariosPorArea,
  getAreasHijas,
  getDocumentosPorArea,
};
