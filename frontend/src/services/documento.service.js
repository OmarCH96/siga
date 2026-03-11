/**
 * Servicio de Documentos
 * Funciones para gestionar documentos en el sistema
 */

import apiClient from './api';

/**
 * Obtener bandeja de recepción del usuario actual
 * Retorna documentos con nodo activo PENDIENTE en el área del usuario
 * @returns {Promise<Object>} Lista de documentos pendientes
 */
export const getBandejaRecepcion = async () => {
  const response = await apiClient.get('/documentos/bandeja-recepcion');
  return response.data;
};

/**
 * Obtener detalle de un documento específico
 * @param {number} id - ID del documento
 * @returns {Promise<Object>} Documento con detalles completos
 */
export const getDocumentoById = async (id) => {
  const response = await apiClient.get(`/documentos/${id}`);
  return response.data;
};

/**
 * Emitir un nuevo documento
 * @param {Object} datos - Datos del documento a emitir
 * @param {number} datos.tipo_documento_id - ID del tipo de documento
 * @param {string} datos.asunto - Asunto del documento
 * @param {string} datos.contenido - Contenido del documento
 * @param {string} datos.contexto - Contexto (OFICIO, MEMORANDUM, etc.)
 * @param {string} datos.prioridad - Prioridad (BAJA, MEDIA, ALTA, URGENTE)
 * @param {string} [datos.instrucciones] - Instrucciones adicionales
 * @returns {Promise<Object>} Documento emitido con folio generado
 */
export const emitirDocumento = async (datos) => {
  const response = await apiClient.post('/documentos', datos);
  return response.data;
};

// Exportación por defecto con todos los métodos
export default {
  getBandejaRecepcion,
  getDocumentoById,
  emitirDocumento,
};
