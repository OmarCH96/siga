/**
 * Hook personalizado para gestión de tipos de documento
 * Maneja estado, carga de datos y operaciones CRUD
 * OPTIMIZADO: Incluye caché para evitar llamadas repetidas
 */

import { useState, useEffect, useRef } from 'react';
import tipoDocumentoService from '@services/tipoDocumento.service';

// Tiempo de caché en milisegundos (30 segundos)
const CACHE_TIME = 30000;

export const useTiposDocumento = () => {
  // Estado
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ 
    activo: undefined,
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
    tiposDocumento: 0,
    stats: 0,
  });
  
  // Referencia de filtros anteriores para detectar cambios
  const prevFilters = useRef(filters);

  /**
   * Cargar tipos de documento con filtros
   * OPTIMIZADO: Incluye caché de 30 segundos
   */
  const loadTiposDocumento = async (force = false) => {
    // Verificar caché
    const now = Date.now();
    if (!force && now - lastLoadTime.current.tiposDocumento < CACHE_TIME) {
      return; // Usar datos cacheados
    }

    setLoading(true);
    setError(null);
    
    try {
      const offset = (filters.page - 1) * filters.limit;
      const response = await tipoDocumentoService.getAllTiposDocumento({
        ...filters,
        offset,
      });
      setTiposDocumento(response.data || []);
      setTotal(response.total || 0);
      setTotalPages(Math.ceil((response.total || 0) / filters.limit));
      
      // Actualizar timestamp del caché
      lastLoadTime.current.tiposDocumento = now;
    } catch (err) {
      console.error('Error al cargar tipos de documento:', err);
      setError(err.response?.data?.error || 'Error al cargar tipos de documento');
      setTiposDocumento([]);
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
      const response = await tipoDocumentoService.getTiposDocumentoStats();
      
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
   * Crear un nuevo tipo de documento
   * @param {Object} tipoDocumentoData - Datos del tipo de documento
   * @returns {Promise<Object>} Tipo de documento creado
   */
  const createTipoDocumento = async (tipoDocumentoData) => {
    try {
      const response = await tipoDocumentoService.createTipoDocumento(tipoDocumentoData);
      await loadTiposDocumento(true); // Forzar recarga
      await loadStats(true); // Forzar recarga de stats
      return response;
    } catch (err) {
      console.error('Error al crear tipo de documento:', err);
      throw err;
    }
  };

  /**
   * Actualizar un tipo de documento
   * @param {number} id - ID del tipo de documento
   * @param {Object} tipoDocumentoData - Datos a actualizar
   * @returns {Promise<Object>} Tipo de documento actualizado
   */
  const updateTipoDocumento = async (id, tipoDocumentoData) => {
    try {
      const response = await tipoDocumentoService.updateTipoDocumento(id, tipoDocumentoData);
      await loadTiposDocumento(true); // Forzar recarga
      return response;
    } catch (err) {
      console.error('Error al actualizar tipo de documento:', err);
      throw err;
    }
  };

  /**
   * Cambiar estado de un tipo de documento (activar/desactivar)
   * @param {number} id - ID del tipo de documento
   * @param {boolean} activo - Nuevo estado
   * @returns {Promise<Object>} Tipo de documento actualizado
   */
  const toggleStatus = async (id, activo) => {
    try {
      const response = await tipoDocumentoService.updateTipoDocumentoStatus(id, activo);
      await loadTiposDocumento(true); // Forzar recarga
      await loadStats(true); // Forzar recarga de stats
      return response;
    } catch (err) {
      console.error('Error al cambiar estado del tipo de documento:', err);
      throw err;
    }
  };

  /**
   * Eliminar tipo de documento
   * @param {number} id - ID del tipo de documento a eliminar
   * @returns {Promise<Object>} Respuesta del servidor
   */
  const deleteTipoDocumento = async (id) => {
    try {
      const response = await tipoDocumentoService.deleteTipoDocumento(id);
      await loadTiposDocumento(true); // Forzar recarga
      await loadStats(true); // Forzar recarga de stats
      return response;
    } catch (err) {
      console.error('Error al eliminar tipo de documento:', err);
      throw err;
    }
  };

  /**
   * Cambiar página de paginación
   * @param {number} newPage - Nueva página
   */
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  /**
   * Cambiar filtros
   * @param {Object} newFilters - Nuevos filtros
   */
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  /**
   * Limpiar filtros
   */
  const clearFilters = () => {
    setFilters({
      activo: undefined,
      search: '',
      page: 1,
      limit: 10,
    });
  };

  // Efectos
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo una vez al montar

  useEffect(() => {
    // Detectar si cambiaron los filtros (incluye paginación)
    const filtersChanged = 
      prevFilters.current.activo !== filters.activo ||
      prevFilters.current.search !== filters.search ||
      prevFilters.current.page !== filters.page ||
      prevFilters.current.limit !== filters.limit;
    
    // Si cambiaron filtros, invalidar caché y forzar recarga
    if (filtersChanged) {
      lastLoadTime.current.tiposDocumento = 0;
    }
    
    prevFilters.current = filters;
    loadTiposDocumento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.activo, filters.search]);

  return {
    // Estado
    tiposDocumento,
    loading,
    error,
    filters,
    total,
    totalPages,
    stats,

    // Funciones
    loadTiposDocumento,
    loadStats,
    createTipoDocumento,
    updateTipoDocumento,
    toggleStatus,
    deleteTipoDocumento,
    handlePageChange,
    handleFilterChange,
    clearFilters,
  };
};

export default useTiposDocumento;
