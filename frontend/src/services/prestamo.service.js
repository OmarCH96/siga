/**
 * Servicio de Préstamos
 * Funciones para gestionar préstamos de números de oficio
 */

import apiClient from './api';

/**
 * Obtener áreas prestamistas autorizadas para el usuario actual
 * Retorna las áreas ancestras que pueden prestar números al usuario
 * @returns {Promise<Object>} Lista de áreas prestamistas
 */
export const getAreasPrestamistas = async () => {
  const response = await apiClient.get('/prestamos/areas-prestamistas');
  return response.data;
};

/**
 * Obtener vista previa del formato de folio para un área y tipo de documento
 * @param {number} areaId - ID del área
 * @param {number} tipoDocumentoId - ID del tipo de documento
 * @returns {Promise<Object>} Vista previa del folio
 */
export const getPreviewFolio = async (areaId, tipoDocumentoId) => {
  const response = await apiClient.get(`/prestamos/preview-folio?area_id=${areaId}&tipo_documento_id=${tipoDocumentoId}`);
  return response.data;
};

/**
 * Solicitar préstamo de número de oficio
 * @param {Object} datos - Datos de la solicitud
 * @param {number} datos.area_prestamista_id - ID del área prestamista
 * @param {string} datos.motivacion - Motivo de la solicitud
 * @returns {Promise<Object>} Préstamo creado
 */
export const solicitarPrestamo = async (datos) => {
  const response = await apiClient.post('/prestamos/solicitar', datos);
  return response.data;
};

/**
 * Solicitar préstamo con reserva inmediata de folio y creación de documento bloqueado.
 * @param {Object} datos - Datos de solicitud y del documento OFICIO
 * @returns {Promise<Object>} Resultado con prestamo_id, documento_id, nodo_id, folio_reservado
 */
export const solicitarPrestamoConReserva = async (datos) => {
  const response = await apiClient.post('/prestamos/solicitar-con-reserva', datos);
  return response.data;
};

/**
 * Obtener préstamos aprobados disponibles para el usuario
 * @returns {Promise<Object>} Lista de préstamos aprobados
 */
export const getPrestamosAprobados = async () => {
  const response = await apiClient.get('/prestamos/aprobados');
  return response.data;
};

/**
 * Obtener préstamos pendientes del área
 * @returns {Promise<Object>} Lista de préstamos pendientes
 */
export const getPrestamosPendientes = async () => {
  const response = await apiClient.get('/prestamos/pendientes');
  return response.data;
};

/**
 * Resolver (aprobar o rechazar) un préstamo
 * @param {number} prestamoId - ID del préstamo
 * @param {Object} datos - Datos de la resolución
 * @param {boolean} datos.aprobar - true para aprobar, false para rechazar
 * @param {string} [datos.motivo] - Motivo (obligatorio al rechazar)
 * @param {number} [datos.dias_vencimiento=5] - Días de vigencia (solo al aprobar)
 * @returns {Promise<Object>} Resultado de la resolución
 */
export const resolverPrestamo = async (prestamoId, datos) => {
  const response = await apiClient.post(`/prestamos/${prestamoId}/resolver`, datos);
  return response.data;
};

/**
 * Marcar préstamo como utilizado
 * @param {number} prestamoId - ID del préstamo
 * @returns {Promise<Object>} Resultado de la operación
 */
export const marcarPrestamoUtilizado = async (prestamoId) => {
  const response = await apiClient.post(`/prestamos/${prestamoId}/utilizar`);
  return response.data;
};
