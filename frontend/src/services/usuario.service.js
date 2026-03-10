/**
 * Servicio de Usuarios
 * Funciones para gestionar usuarios en el sistema
 */

import apiClient from './api';

/**
 * Obtener todos los usuarios
 * @param {Object} filters - Filtros opcionales (activo, rolId, search, page, limit)
 * @returns {Promise<Object>} Lista de usuarios con total
 */
export const getAllUsuarios = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.activo !== undefined) {
    params.append('activo', filters.activo);
  }
  
  if (filters.rolId) {
    params.append('rolId', filters.rolId);
  }

  if (filters.areaId) {
    params.append('areaId', filters.areaId);
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

  const response = await apiClient.get(`/usuarios?${params.toString()}`);
  return response.data;
};

/**
 * Obtener un usuario por ID
 * @param {number} id - ID del usuario
 * @returns {Promise<Object>} Usuario
 */
export const getUsuarioById = async (id) => {
  const response = await apiClient.get(`/usuarios/${id}`);
  return response.data;
};

/**
 * Crear un nuevo usuario
 * @param {Object} usuarioData - Datos del usuario
 * @returns {Promise<Object>} Usuario creado
 */
export const createUsuario = async (usuarioData) => {
  // Transformar datos al formato que espera el backend (camelCase)
  const payload = {
    nombre: usuarioData.nombre?.trim(),
    apellidos: usuarioData.apellidos?.trim(),
    email: usuarioData.email?.trim().toLowerCase(),
    nombreUsuario: usuarioData.nombreUsuario?.trim(),
    contraseña: usuarioData.contraseña,
    areaId: parseInt(usuarioData.areaId, 10),
    rolId: parseInt(usuarioData.rolId, 10),
    telefono: usuarioData.telefono?.trim() || null,
    celular: usuarioData.celular?.trim() || null,
    activo: usuarioData.activo !== undefined ? usuarioData.activo : true,
  };

  const response = await apiClient.post('/usuarios', payload);
  return response.data;
};

/**
 * Actualizar un usuario existente
 * @param {number} id - ID del usuario
 * @param {Object} usuarioData - Datos actualizados del usuario
 * @returns {Promise<Object>} Usuario actualizado
 */
export const updateUsuario = async (id, usuarioData) => {
  // Transformar datos al formato que espera el backend (camelCase)
  const payload = {
    nombre: usuarioData.nombre?.trim(),
    apellidos: usuarioData.apellidos?.trim(),
    email: usuarioData.email?.trim().toLowerCase(),
    areaId: parseInt(usuarioData.areaId, 10),
    rolId: parseInt(usuarioData.rolId, 10),
    telefono: usuarioData.telefono?.trim() || null,
    celular: usuarioData.celular?.trim() || null,
    activo: usuarioData.activo !== undefined ? usuarioData.activo : true,
  };

  // Solo incluir contraseña si se proporcionó
  if (usuarioData.contraseña && usuarioData.contraseña.trim()) {
    payload.contraseña = usuarioData.contraseña;
  }

  const response = await apiClient.patch(`/usuarios/${id}`, payload);
  return response.data;
};

/**
 * Actualizar estado de un usuario
 * @param {number} id - ID del usuario
 * @param {boolean} activo - Estado activo
 * @returns {Promise<Object>} Resultado de la operación
 */
export const updateUsuarioStatus = async (id, activo) => {
  // Asegurar que activo sea un booleano
  const payload = { activo: Boolean(activo) };
  const response = await apiClient.patch(`/usuarios/${id}/status`, payload);
  return response.data;
};

/**
 * Obtener usuarios por área
 * @param {number} areaId - ID del área
 * @returns {Promise<Object>} Lista de usuarios del área
 */
export const getUsuariosByArea = async (areaId) => {
  const response = await apiClient.get(`/usuarios/area/${areaId}`);
  return response.data;
};

/**
 * Obtener todas las áreas activas
 * @returns {Promise<Object>} Lista de áreas
 */
export const getAllAreas = async () => {
  const response = await apiClient.get('/areas');
  return response.data;
};

/**
 * Obtener todos los roles activos
 * @returns {Promise<Object>} Lista de roles
 */
export const getAllRoles = async () => {
  const response = await apiClient.get('/roles');
  return response.data;
};

/**
 * Obtener estadísticas de usuarios (total, activos, inactivos)
 * OPTIMIZADO: Un solo request en lugar de 3
 * @returns {Promise<Object>} Estadísticas de usuarios
 */
export const getUsuariosStats = async () => {
  const response = await apiClient.get('/usuarios/stats');
  return response.data;
};

export default {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  updateUsuarioStatus,
  getUsuariosByArea,
  getAllAreas,
  getAllRoles,
  getUsuariosStats,
};
