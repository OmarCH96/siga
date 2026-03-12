/**
 * Hook personalizado para gestión de Bandeja de Recepción
 * Maneja estado, carga de datos y filtros de documentos pendientes
 */

import { useState, useEffect, useCallback } from 'react';
import documentoService from '@services/documento.service';

export const useBandejaRecepcion = () => {
  // Estado
  const [documentos, setDocumentos] = useState([]);
  const [documentosFiltrados, setDocumentosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    busqueda: '',
    tipoDocumento: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  /**
   * Cargar documentos de la bandeja de recepción
   */
  const loadDocumentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await documentoService.getBandejaRecepcion();
      
      setDocumentos(response.data || []);
      setDocumentosFiltrados(response.data || []);
    } catch (err) {
      console.error('Error al cargar bandeja de recepción:', err);
      setError(err.response?.data?.message || 'Error al cargar documentos');
      setDocumentos([]);
      setDocumentosFiltrados([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Aplicar filtros a los documentos
   */
  const aplicarFiltros = useCallback(() => {
    let resultado = [...documentos];

    // Filtrar por búsqueda (folio o asunto)
    if (filters.busqueda) {
      const busquedaLower = filters.busqueda.toLowerCase();
      resultado = resultado.filter(doc => 
        doc.folio.toLowerCase().includes(busquedaLower) ||
        doc.asunto.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtrar por tipo de documento
    if (filters.tipoDocumento && filters.tipoDocumento !== '') {
      resultado = resultado.filter(doc => 
        doc.tipo_documento_nombre === filters.tipoDocumento
      );
    }

    // Filtrar por rango de fechas
    if (filters.fechaDesde) {
      resultado = resultado.filter(doc => 
        new Date(doc.nodo_fecha_generacion) >= new Date(filters.fechaDesde)
      );
    }

    if (filters.fechaHasta) {
      resultado = resultado.filter(doc => 
        new Date(doc.nodo_fecha_generacion) <= new Date(filters.fechaHasta)
      );
    }

    setDocumentosFiltrados(resultado);
  }, [documentos, filters]);

  /**
   * Actualizar filtros
   */
  const actualizarFiltros = useCallback((nuevosFiltros) => {
    setFilters(prev => ({ ...prev, ...nuevosFiltros }));
  }, []);

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = useCallback(() => {
    setFilters({
      busqueda: '',
      tipoDocumento: '',
      fechaDesde: '',
      fechaHasta: '',
    });
    setDocumentosFiltrados(documentos);
  }, [documentos]);

  /**
   * Obtener tipos de documento únicos para el filtro
   */
  const tiposDocumento = useCallback(() => {
    const tipos = [...new Set(documentos.map(doc => doc.tipo_documento_nombre))];
    return tipos.sort();
  }, [documentos]);

  /**
   * Recibir un documento pendiente
   * @param {number} documentoId - ID del documento a recibir
   * @param {string} observaciones - Observaciones opcionales
   */
  const recibirDocumento = useCallback(async (documentoId, observaciones = null) => {
    try {
      const response = await documentoService.recibirDocumento(documentoId, observaciones);
      
      // Recargar la bandeja después de recibir exitosamente
      await loadDocumentos();
      
      return response;
    } catch (err) {
      console.error('Error al recibir documento:', err);
      throw err;
    }
  }, [loadDocumentos]);

  // Cargar documentos al montar el componente
  useEffect(() => {
    loadDocumentos();
  }, [loadDocumentos]);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  return {
    documentos: documentosFiltrados,
    documentosOriginales: documentos,
    loading,
    error,
    filters,
    refetch: loadDocumentos,
    actualizarFiltros,
    limpiarFiltros,
    tiposDocumento,
    recibirDocumento,
    total: documentosFiltrados.length,
    totalSinFiltrar: documentos.length,
  };
};

export default useBandejaRecepcion;
