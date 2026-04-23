/**
 * Hook personalizado para gestión de usuarios
 * Maneja estado, carga de datos y operaciones CRUD
 * OPTIMIZADO: Incluye caché para evitar llamadas repetidas
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import usuarioService from '@services/usuario.service';
import { getAreasActivas } from '@services/area.service';

// Tiempo de caché en milisegundos (30 segundos)
const CACHE_TIME = 30000;

export const useUsuarios = () => {
  // Estado
  const [usuarios, setUsuarios] = useState([]);
  const [areas, setAreas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ 
    activo: undefined, 
    rolId: undefined,
    areaId: undefined,
    search: '',
    page: 1,
    limit: 10,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
  });

  // Referencias para caché
  const lastLoadTime = useRef({
    usuarios: 0,
    catalogos: 0,
    stats: 0,
  });
  
  // Referencia de filtros anteriores para detectar cambios
  const prevFilters = useRef(filters);

  /**
   * Cargar usuarios con filtros
   * OPTIMIZADO: Incluye caché de 30 segundos
   */
  const loadUsuarios = async (force = false) => {
    // Verificar caché
    const now = Date.now();
    const cacheAge = now - lastLoadTime.current.usuarios;
    
    if (!force && cacheAge < CACHE_TIME && lastLoadTime.current.usuarios > 0) {
      return; // Usar datos cacheados
    }

    setLoading(true);
    setError(null);
    
    try {
      const offset = (filters.page - 1) * filters.limit;
      const response = await usuarioService.getAllUsuarios({
        ...filters,
        offset,
      });
      
      setUsuarios(response.data || []);
      setTotal(response.total || 0);
      setTotalPages(Math.ceil((response.total || 0) / filters.limit));
      
      // Actualizar timestamp del caché
      lastLoadTime.current.usuarios = now;
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError(err.response?.data?.error || 'Error al cargar usuarios');
      setUsuarios([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar estadísticas globales (sin filtros)
   * OPTIMIZADO: Ahora hace un solo request en lugar de 3 + caché
   */
  const loadStats = async (force = false) => {
    // Verificar caché
    const now = Date.now();
    if (!force && now - lastLoadTime.current.stats < CACHE_TIME) {
      return; // Usar datos cacheados
    }

    try {
      const response = await usuarioService.getUsuariosStats();
      
      setStats({
        total: response.data.total || 0,
        activos: response.data.activos || 0,
        inactivos: response.data.inactivos || 0,
      });
      
      // Actualizar timestamp del caché
      lastLoadTime.current.stats = now;
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  /**
   * Cargar catálogos (áreas y roles)
   * OPTIMIZADO: Incluye caché (los catálogos cambian poco)
   */
  const loadCatalogos = async (force = false) => {
    // Verificar caché
    const now = Date.now();
    if (!force && now - lastLoadTime.current.catalogos < CACHE_TIME) {
      return; // Usar datos cacheados
    }

    try {
      const [areasRes, rolesRes] = await Promise.all([
        getAreasActivas(),
        usuarioService.getAllRoles(),
      ]);
      
      // getAreasActivas devuelve { success, count, data: [...] }
      setAreas(areasRes.data || []);
      setRoles(rolesRes.data || []);
      
      // Actualizar timestamp del caché
      lastLoadTime.current.catalogos = now;
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
      setError(err.response?.data?.error || 'Error al cargar catálogos');
    }
  };

  /**
   * Crear un nuevo usuario
   * @param {Object} usuarioData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado
   */
  const createUsuario = async (usuarioData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await usuarioService.createUsuario(usuarioData);
      
      // Recargar lista de usuarios (forzar bypass del caché)
      await loadUsuarios(true);
      await loadStats(true); // También actualizar stats
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error al crear usuario:', err);
      const errorMsg = err.response?.data?.error || 'Error al crear usuario';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar un usuario existente
   * @param {number} id - ID del usuario
   * @param {Object} usuarioData - Datos del usuario
   * @returns {Promise<Object>} Usuario actualizado
   */
  const updateUsuario = async (id, usuarioData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await usuarioService.updateUsuario(id, usuarioData);
      
      // Recargar lista de usuarios (forzar bypass del caché)
      await loadUsuarios(true);
      await loadStats(true); // También actualizar stats si cambió el estado
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      const errorMsg = err.response?.data?.error || 'Error al actualizar usuario';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar estado de un usuario (activo/inactivo)
   * @param {number} id - ID del usuario
   * @param {boolean} activo - Nuevo estado
   * @returns {Promise<Object>} Resultado
   */
  const updateUsuarioStatus = async (id, activo) => {
    setLoading(true);
    setError(null);

    try {
      await usuarioService.updateUsuarioStatus(id, activo);
      
      // Actualizar lista local
      setUsuarios(prev => 
        prev.map(u => u.id === id ? { ...u, activo } : u)
      );
      
      // Invalidar caché de stats (cambió el conteo de activos/inactivos)
      await loadStats(true);
      
      return { success: true };
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      const errorMsg = err.response?.data?.error || 'Error al actualizar estado';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cambiar página
   * @param {number} newPage - Nueva página
   */
  const changePage = useCallback((newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  /**
   * Actualizar búsqueda
   * @param {string} searchTerm - Término de búsqueda
   */
  const updateSearch = useCallback((searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  }, []);

  /**
   * Actualizar filtros
   * @param {Object} newFilters - Nuevos filtros
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Limpiar errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cargar catálogos y estadísticas al montar el componente
  useEffect(() => {
    loadCatalogos();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo una vez al montar

  // Cargar usuarios cuando cambien los filtros
  useEffect(() => {
    // Detectar si cambiaron los filtros (incluye paginación)
    const filtersChanged = 
      prevFilters.current.activo !== filters.activo ||
      prevFilters.current.rolId !== filters.rolId ||
      prevFilters.current.areaId !== filters.areaId ||
      prevFilters.current.search !== filters.search ||
      prevFilters.current.page !== filters.page ||
      prevFilters.current.limit !== filters.limit;
    
    // Si cambiaron filtros, invalidar caché y forzar recarga
    if (filtersChanged) {
      lastLoadTime.current.usuarios = 0;
    }
    
    prevFilters.current = filters;
    loadUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.activo, filters.rolId, filters.areaId, filters.search]); // Dependencias específicas

  return {
    // Estado
    usuarios,
    areas,
    roles,
    loading,
    error,
    filters,
    total,
    totalPages,
    stats,
    
    // Acciones
    createUsuario,
    updateUsuario,
    updateUsuarioStatus,
    changePage,
    updateSearch,
    updateFilters,
    clearError,
  };
};

export default useUsuarios;
