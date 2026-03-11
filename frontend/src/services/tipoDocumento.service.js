/**
 * Servicio de Tipos de Documento
 * Funciones para gestionar tipos de documento en el sistema
 */

import apiClient from './api';

/**
 * Obtener todos los tipos de documento
 * @param {Object} filters - Filtros opcionales (activo, search, limit, offset)
 * @returns {Promise<Object>} Lista de tipos de documento con total
 */
export const getAllTiposDocumento = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.activo !== undefined) {
    params.append('activo', filters.activo);
  }

  if (filters.search) {
    params.append('search', filters.search);
  }

  if (filters.limit) {
    params.append('limit', filters.limit);
  }

  if (filters.offset !== undefined) {
    params.append('offset', filters.offset);
  }

  const response = await apiClient.get(`/tipo-documento?${params.toString()}`);
  return response.data;
};

/**
 * Obtener solo tipos de documento activos (sin restricción de permisos)
 * Útil para formularios de emisión
 * @returns {Promise<Object>} Lista de tipos de documento activos
 */
export const getTiposDocumentoActivos = async () => {
  const response = await apiClient.get('/tipo-documento/activos?activo=true');
  return response.data;
};

/**
 * Obtener un tipo de documento por ID
 * @param {number} id - ID del tipo de documento
 * @returns {Promise<Object>} Tipo de documento
 */
export const getTipoDocumentoById = async (id) => {
  const response = await apiClient.get(`/tipo-documento/${id}`);
  return response.data;
};

/**
 * Crear un nuevo tipo de documento
 * @param {Object} tipoDocumentoData - Datos del tipo de documento
 * @returns {Promise<Object>} Tipo de documento creado
 */
export const createTipoDocumento = async (tipoDocumentoData) => {
  const response = await apiClient.post('/tipo-documento', tipoDocumentoData);
  return response.data;
};

/**
 * Actualizar un tipo de documento existente
 * @param {number} id - ID del tipo de documento
 * @param {Object} tipoDocumentoData - Datos a actualizar
 * @returns {Promise<Object>} Tipo de documento actualizado
 */
export const updateTipoDocumento = async (id, tipoDocumentoData) => {
  const response = await apiClient.patch(`/tipo-documento/${id}`, tipoDocumentoData);
  return response.data;
};

/**
 * Actualizar el estado (activo/inactivo) de un tipo de documento
 * @param {number} id - ID del tipo de documento
 * @param {boolean} activo - Nuevo estado
 * @returns {Promise<Object>} Tipo de documento actualizado
 */
export const updateTipoDocumentoStatus = async (id, activo) => {
  const response = await apiClient.patch(`/tipo-documento/${id}/status`, { activo });
  return response.data;
};

/**
 * Eliminar un tipo de documento
 * @param {number} id - ID del tipo de documento
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const deleteTipoDocumento = async (id) => {
  const response = await apiClient.delete(`/tipo-documento/${id}`);
  return response.data;
};

/**
 * Obtener estadísticas de tipos de documento (total, activos, inactivos)
 * OPTIMIZADO: Un solo request en lugar de 3
 * @returns {Promise<Object>} Estadísticas de tipos de documento
 */
export const getTiposDocumentoStats = async () => {
  const response = await apiClient.get('/tipo-documento/stats');
  return response.data;
};

export default {
  getAllTiposDocumento,
  getTiposDocumentoActivos,
  getTipoDocumentoById,
  createTipoDocumento,
  updateTipoDocumento,
  updateTipoDocumentoStatus,
  deleteTipoDocumento,
  getTiposDocumentoStats,
};
