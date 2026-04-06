/**
 * Hook personalizado para gestión de áreas (unidades administrativas)
 * Maneja estado, carga de datos y operaciones CRUD
 * OPTIMIZADO: Incluye caché para evitar llamadas repetidas
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as areaService from '../services/area.service';

// Tiempo de caché en milisegundos (30 segundos)
const CACHE_TIME = 30000;

export const useAreas = () => {
  // Estado
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ 
    activa: undefined, 
    tipo: undefined,
    areaPadreId: undefined,
    busqueda: '',
    page: 1,
    limit: 10,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    total_areas: 0,
    areas_activas: 0,
    areas_inactivas: 0,
    total_tipos: 0,
    areas_raiz: 0,
    nivel_maximo: 0,
  });

  // Referencias para caché
  const lastLoadTime = useRef({
    areas: 0,
    stats: 0,
  });
  
  // Referencia de filtros anteriores para detectar cambios
  const prevFilters = useRef(filters);

  /**
   * Cargar áreas con filtros
   * OPTIMIZADO: Incluye caché de 30 segundos
   */
  const loadAreas = useCallback(async (force = false) => {
    // Verificar caché
    const now = Date.now();
    const cacheAge = now - lastLoadTime.current.areas;
    
    if (!force && cacheAge < CACHE_TIME && lastLoadTime.current.areas > 0) {
      return; // Usar datos cacheados
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await areaService.getAllAreas(filters);
      
      setAreas(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 0);
      
      // Actualizar timestamp del caché
      lastLoadTime.current.areas = now;
    } catch (err) {
      console.error('Error al cargar áreas:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al cargar áreas';
      setError(errorMsg);
      setAreas([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Cargar estadísticas de áreas
   * OPTIMIZADO: Incluye caché de 30 segundos y usa el endpoint de estadísticas
   */
  const loadStats = useCallback(async (force = false) => {
    const now = Date.now();
    const cacheAge = now - lastLoadTime.current.stats;
    
    if (!force && cacheAge < CACHE_TIME && lastLoadTime.current.stats > 0) {
      return;
    }

    try {
      const response = await areaService.getEstadisticas();
      
      setStats({
        total_areas: parseInt(response.data.total_areas) || 0,
        areas_activas: parseInt(response.data.areas_activas) || 0,
        areas_inactivas: parseInt(response.data.areas_inactivas) || 0,
        total_tipos: parseInt(response.data.total_tipos) || 0,
        areas_raiz: parseInt(response.data.areas_raiz) || 0,
        nivel_maximo: parseInt(response.data.nivel_maximo) || 0,
      });
      
      lastLoadTime.current.stats = now;
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      // No mostrar error en UI para estadísticas, solo log
    }
  }, []);

  /**
   * Crear nueva área
   */
  const createArea = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await areaService.createArea(data);
      
      // Invalidar caché y recargar
      lastLoadTime.current.areas = 0;
      lastLoadTime.current.stats = 0;
      await loadAreas(true);
      await loadStats(true);
      
      return response;
    } catch (err) {
      console.error('Error al crear área:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al crear área';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [loadAreas, loadStats]);

  /**
   * Actualizar área existente
   */
  const updateArea = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await areaService.updateArea(id, data);
      
      // Invalidar caché y recargar
      lastLoadTime.current.areas = 0;
      lastLoadTime.current.stats = 0;
      await loadAreas(true);
      await loadStats(true);
      
      return response;
    } catch (err) {
      console.error('Error al actualizar área:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al actualizar área';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [loadAreas, loadStats]);

  /**
   * Activar/Desactivar área
   */
  const toggleAreaStatus = useCallback(async (id, activa) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await areaService.toggleAreaStatus(id, activa);
      
      // Actualizar en estado local para respuesta inmediata
      setAreas(prevAreas => 
        prevAreas.map(area => 
          area.id === id ? { ...area, activa } : area
        )
      );
      
      // Invalidar caché de stats
      lastLoadTime.current.stats = 0;
      await loadStats(true);
      
      return response;
    } catch (err) {
      console.error('Error al cambiar estado del área:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al cambiar estado del área';
      setError(errorMsg);
      
      // Revertir cambio local en caso de error
      lastLoadTime.current.areas = 0;
      await loadAreas(true);
      
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [loadAreas, loadStats]);

  /**
   * Actualizar filtros
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Resetear página si cambian otros filtros (excepto si se cambia explícitamente la página)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
    
    // Invalidar caché cuando cambian filtros
    lastLoadTime.current.areas = 0;
  }, []);

  /**
   * Resetear filtros
   */
  const resetFilters = useCallback(() => {
    setFilters({
      activa: undefined,
      tipo: undefined,
      areaPadreId: undefined,
      busqueda: '',
      page: 1,
      limit: 10,
    });
    lastLoadTime.current.areas = 0;
  }, []);

  /**
   * Cambiar página
   */
  const changePage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
    lastLoadTime.current.areas = 0;
  }, []);

  /**
   * Recargar datos completos
   */
  const reload = useCallback(async () => {
    lastLoadTime.current.areas = 0;
    lastLoadTime.current.stats = 0;
    await Promise.all([
      loadAreas(true),
      loadStats(true),
    ]);
  }, [loadAreas, loadStats]);

  /**
   * Cargar datos al montar o cuando cambian filtros
   */
  useEffect(() => {
    // Detectar si cambiaron filtros relevantes
    const filtersChanged = 
      prevFilters.current.activa !== filters.activa ||
      prevFilters.current.tipo !== filters.tipo ||
      prevFilters.current.areaPadreId !== filters.areaPadreId ||
      prevFilters.current.busqueda !== filters.busqueda ||
      prevFilters.current.page !== filters.page ||
      prevFilters.current.limit !== filters.limit;

    if (filtersChanged) {
      loadAreas(true);
      prevFilters.current = filters;
    } else {
      loadAreas(false);
    }
  }, [filters, loadAreas]);

  /**
   * Cargar stats al montar
   */
  useEffect(() => {
    loadStats(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  return {
    // Estado
    areas,
    loading,
    error,
    filters,
    total,
    totalPages,
    stats,
    
    // Acciones
    createArea,
    updateArea,
    toggleAreaStatus,
    updateFilters,
    resetFilters,
    changePage,
    reload,
    
    // Utilidades
    setError,
  };
};

export default useAreas;
