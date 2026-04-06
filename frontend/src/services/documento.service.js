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
 * @param {string} [datos.fecha_limite] - Fecha límite (YYYY-MM-DD)
 * @param {string} [datos.prioridad] - Prioridad: NORMAL, ALTA, URGENTE
 * @param {string} [datos.contexto] - Contexto: INTERNO, EXTERNO, ORGANO_DESCONCENTRADO
 * @param {string} [datos.prestamo_numero_id] - Número de identificación del préstamo
 * @param {string} [datos.instrucciones] - Instrucciones adicionales
 * @param {string} [datos.observaciones] - Observaciones del documento
 * @returns {Promise<Object>} Documento emitido con documento_id, nodo_id, folio
 */
export const emitirDocumento = async (datos) => {
  const response = await apiClient.post('/documentos/emitir', datos);
  return response.data;
};

/**
 * Listar documentos del usuario actual
 * @param {Object} filtros - Filtros de búsqueda
 * @param {number} [filtros.page=1] - Página actual
 * @param {number} [filtros.limit=10] - Documentos por página
 * @param {string} [filtros.estado] - Estado del documento (PENDIENTE, EN_PROCESO, FINALIZADO)
 * @param {string} [filtros.busqueda] - Búsqueda por folio o asunto
 * @param {string} [filtros.fecha_inicio] - Filtro de fecha inicio (YYYY-MM-DD)
 * @param {string} [filtros.fecha_fin] - Filtro de fecha fin (YYYY-MM-DD)
 * @returns {Promise<Object>} Lista de documentos con paginación
 */
export const listarMisDocumentos = async (filtros = {}) => {
  const params = new URLSearchParams();
  
  if (filtros.page) {
    params.append('page', filtros.page);
  }
  
  if (filtros.limit) {
    params.append('limit', filtros.limit);
  }
  
  if (filtros.estado) {
    params.append('estado', filtros.estado);
  }
  
  if (filtros.busqueda) {
    params.append('busqueda', filtros.busqueda);
  }
  
  if (filtros.fecha_inicio) {
    params.append('fecha_inicio', filtros.fecha_inicio);
  }
  
  if (filtros.fecha_fin) {
    params.append('fecha_fin', filtros.fecha_fin);
  }
  
  const response = await apiClient.get(`/documentos?${params.toString()}`);
  return response.data;
};

/**
 * Obtener lista de tipos de documento disponibles
 * @returns {Promise<Array>} Lista de tipos de documento
 */
export const obtenerTiposDocumento = async () => {
  const response = await apiClient.get('/documentos/tipos');
  return response.data;
};

/**
 * Recibir un documento pendiente
 * @param {number} documentoId - ID del documento a recibir
 * @param {string} [observaciones] - Observaciones opcionales
 * @returns {Promise<Object>} Resultado de la recepción con folio asignado
 */
export const recibirDocumento = async (documentoId, observaciones = null) => {
  const datos = observaciones ? { observaciones } : {};
  const response = await apiClient.post(`/documentos/${documentoId}/recibir`, datos);
  return response.data;
};

/**
 * Obtener detalles completos de un tipo de documento
 * @param {number} tipoId - ID del tipo de documento
 * @returns {Promise<Object>} Tipo de documento completo
 */
export const obtenerTipoDocumento = async (tipoId) => {
  const response = await apiClient.get(`/documentos/tipos/${tipoId}`);
  return response.data;
};

/**
 * Adjuntar archivo a un documento
 * @param {number} documentoId - ID del documento
 * @param {FormData} formData - FormData con el archivo
 * @returns {Promise<Object>} Información del adjunto
 */
export const adjuntarArchivo = async (documentoId, formData) => {
  const response = await apiClient.post(
    `/documentos/${documentoId}/adjuntos`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Obtener adjuntos de un documento
 * @param {number} documentoId - ID del documento
 * @returns {Promise<Array>} Lista de adjuntos
 */
export const obtenerAdjuntos = async (documentoId) => {
  const response = await apiClient.get(`/documentos/${documentoId}/adjuntos`);
  return response.data;
};

/**
 * Validar si un turno es permitido desde el área del usuario a un área destino
 * @param {number} areaDestinoId - ID del área destino
 * @returns {Promise<Object>} { valido: boolean, mensaje: string|null }
 */
export const validarTurno = async (areaDestinoId) => {
  const response = await apiClient.get(`/documentos/validar-turno?area_destino_id=${areaDestinoId}`);
  return response.data;
};

/**
 * Turnar un documento a un área destino
 * @param {number} documentoId - ID del documento
 * @param {number} areaDestinoId - ID del área destino
 * @param {string} [observaciones] - Observaciones del turno
 * @param {string} [instrucciones] - Instrucciones para el área destino
 * @returns {Promise<Object>} Resultado del turno con nodo_nuevo_id
 */
export const turnarDocumento = async (documentoId, areaDestinoId, observaciones = null, instrucciones = null) => {
  const response = await apiClient.post(`/documentos/${documentoId}/turnar`, {
    area_destino_id: areaDestinoId,
    observaciones,
    instrucciones,
  });
  return response.data;
};

/**
 * Crear copias de conocimiento de un documento para múltiples áreas
 * @param {number} documentoId - ID del documento
 * @param {Array<number>} areasIds - Array de IDs de áreas que recibirán copia
 * @returns {Promise<Object>} Resultado con estadísticas de copias creadas
 */
export const crearCopiasConocimiento = async (documentoId, areasIds) => {
  const response = await apiClient.post(`/documentos/${documentoId}/copias`, {
    areas_ids: areasIds,
  });
  return response.data;
};

/**
 * Obtener preview del próximo consecutivo que se asignará
 * NO asigna el número ni modifica la base de datos
 * @param {number} areaId - ID del área emisora
 * @param {number} tipoDocumentoId - ID del tipo de documento
 * @returns {Promise<Object>} { consecutivo, folio_completo, clave_area, clave_tipo_doc, anio }
 */
export const getPreviewConsecutivo = async (areaId, tipoDocumentoId) => {
  const response = await apiClient.get('/documentos/preview-consecutivo', {
    params: {
      areaId,
      tipoDocumentoId
    }
  });
  return response.data;
};

/**
 * Obtener diagnóstico de consecutivos (solo para depuración)
 * @param {number} areaId - ID del área
 * @param {number} tipoDocumentoId - ID del tipo de documento
 * @returns {Promise<Object>} Información de diagnóstico
 */
export const getDiagnosticoConsecutivo = async (areaId, tipoDocumentoId) => {
  const response = await apiClient.get('/documentos/diagnostico-consecutivo', {
    params: {
      areaId,
      tipoDocumentoId
    }
  });
  return response.data;
};

// Exportación por defecto con todos los métodos
export default {
  getBandejaRecepcion,
  getDocumentoById,
  emitirDocumento,
  listarMisDocumentos,
  obtenerTiposDocumento,
  obtenerTipoDocumento,
  adjuntarArchivo,
  obtenerAdjuntos,
  validarTurno,
  turnarDocumento,
  crearCopiasConocimiento,
  recibirDocumento,
  getPreviewConsecutivo,
  getDiagnosticoConsecutivo,
};
