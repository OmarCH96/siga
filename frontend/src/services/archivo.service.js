/**
 * Servicio de Archivos
 * Funciones para gestionar carga y descarga de archivos adjuntos
 */

import apiClient from './api';

/**
 * Subir uno o varios archivos al servidor
 * @param {FileList|Array<File>} archivos - Lista de archivos a subir
 * @param {Function} onUploadProgress - Callback para progreso de carga
 * @returns {Promise<Object>} Archivos subidos con IDs
 */
export const uploadArchivos = async (archivos, onUploadProgress = null) => {
  const formData = new FormData();
  
  // Agregar cada archivo al FormData
  if (archivos instanceof FileList) {
    Array.from(archivos).forEach(archivo => {
      formData.append('archivos', archivo);
    });
  } else if (Array.isArray(archivos)) {
    archivos.forEach(archivo => {
      formData.append('archivos', archivo);
    });
  } else {
    // Un solo archivo
    formData.append('archivos', archivos);
  }

  const response = await apiClient.post('/archivos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onUploadProgress ? (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onUploadProgress(percentCompleted);
    } : undefined,
  });

  return response.data;
};

/**
 * Vincular archivos previamente subidos a un documento
 * @param {number} documentoId - ID del documento
 * @param {Array<number>} archivosIds - IDs de los archivos a vincular
 * @param {string} tipoRelacion - Tipo de relación (ADJUNTO, RESPALDO, EVIDENCIA, etc.)
 * @returns {Promise<Object>} Resultado de la vinculación
 */
export const vincularArchivosDocumento = async (documentoId, archivosIds, tipoRelacion = 'ADJUNTO') => {
  const response = await apiClient.post('/archivos/vincular-documento', {
    documento_id: documentoId,
    archivos_ids: archivosIds,
    tipo_relacion: tipoRelacion,
  });
  return response.data;
};

/**
 * Vincular archivos previamente subidos a un nodo
 * @param {number} nodoId - ID del nodo
 * @param {Array<number>} archivosIds - IDs de los archivos a vincular
 * @param {string} tipoRelacion - Tipo de relación (ADJUNTO, RESPALDO, EVIDENCIA, etc.)
 * @returns {Promise<Object>} Resultado de la vinculación
 */
export const vincularArchivosNodo = async (nodoId, archivosIds, tipoRelacion = 'ADJUNTO') => {
  const response = await apiClient.post('/archivos/vincular-nodo', {
    nodo_id: nodoId,
    archivos_ids: archivosIds,
    tipo_relacion: tipoRelacion,
  });
  return response.data;
};

/**
 * Obtener archivos asociados a un documento
 * @param {number} documentoId - ID del documento
 * @returns {Promise<Array>} Lista de archivos del documento
 */
export const obtenerArchivosPorDocumento = async (documentoId) => {
  const response = await apiClient.get(`/archivos/documento/${documentoId}`);
  return response.data;
};

/**
 * Formatear tamaño de archivo de bytes a formato legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado (KB, MB, GB)
 */
export const formatearTamaño = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Obtener ícono de Material Symbols según tipo MIME
 * @param {string} tipoMime - Tipo MIME del archivo
 * @returns {Object} { icono, color }
 */
export const obtenerIconoPorTipoMime = (tipoMime) => {
  if (!tipoMime) {
    return { icono: 'attach_file', color: 'text-slate-400' };
  }

  if (tipoMime === 'application/pdf') {
    return { icono: 'picture_as_pdf', color: 'text-danger' };
  }

  if (tipoMime.includes('word') || tipoMime === 'application/msword') {
    return { icono: 'description', color: 'text-primary' };
  }

  if (tipoMime.includes('sheet') || tipoMime.includes('excel')) {
    return { icono: 'table_chart', color: 'text-success' };
  }

  if (tipoMime.startsWith('image/')) {
    return { icono: 'image', color: 'text-warning' };
  }

  return { icono: 'attach_file', color: 'text-slate-400' };
};

/**
 * Validar archivo antes de subir
 * @param {File} archivo - Archivo a validar
 * @returns {Object} { valido, error }
 */
export const validarArchivo = (archivo) => {
  const TAMAÑO_MAXIMO = 50 * 1024 * 1024; // 50 MB
  const TIPOS_PERMITIDOS = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'image/jpeg',
    'image/png',
  ];

  if (archivo.size > TAMAÑO_MAXIMO) {
    return {
      valido: false,
      error: `El archivo "${archivo.name}" excede el tamaño máximo de 50 MB`,
    };
  }

  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return {
      valido: false,
      error: `El archivo "${archivo.name}" tiene un formato no permitido. Solo se permiten PDF, DOCX, XLSX, JPG, PNG`,
    };
  }

  return { valido: true, error: null };
};

const archivoService = {
  uploadArchivos,
  vincularArchivosDocumento,
  vincularArchivosNodo,
  obtenerArchivosPorDocumento,
  formatearTamaño,
  obtenerIconoPorTipoMime,
  validarArchivo,
};

export default archivoService;
