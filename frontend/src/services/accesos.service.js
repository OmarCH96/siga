/**
 * Servicio de Registro de Accesos
 * Consume el endpoint GET /api/accesos
 */

import apiClient from './api';

/**
 * Obtiene los registros de auditoría del sistema (accesos).
 * @param {Object} filters
 * @param {number}  filters.page        - Página (1-based)
 * @param {number}  filters.limit       - Registros por página
 * @param {string}  [filters.busqueda]  - Texto libre (nombre o IP)
 * @param {string}  [filters.estado]    - Acción exacta (LOGIN_EXITOSO, LOGIN_FALLIDO, MFA_REQUERIDO)
 * @param {string}  [filters.dispositivo] - 'movil' | 'escritorio'
 * @returns {Promise<{ accesos: Array, total: number, page: number, limit: number, totalPages: number }>}
 */
export const getAccesos = async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.busqueda) params.append('busqueda', filters.busqueda);
    if (filters.estado && filters.estado !== 'Todos')
        params.append('estado', filters.estado);
    if (filters.dispositivo && filters.dispositivo !== 'Todos')
        params.append('dispositivo', filters.dispositivo.toLowerCase());

    const response = await apiClient.get(`/accesos?${params.toString()}`);
    return response.data.data;
};
