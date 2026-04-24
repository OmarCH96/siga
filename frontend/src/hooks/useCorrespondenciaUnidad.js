/**
 * Hook personalizado para Correspondencia de Unidad del usuario autenticado.
 * Encapsula fetch de documentos con lógica jerárquica:
 * - Unidades padre ven todos los documentos de sus descendientes
 * - Unidades hijas solo ven sus propios documentos
 * Incluye paginación, tabs (Emitidos/Recibidos/Todos) y filtros avanzados.
 */

import { useState, useEffect, useCallback } from 'react';
import { getCorrespondenciaUnidad } from '../services/documento.service';

const PAGE_SIZE = 10;

export const useCorrespondenciaUnidad = () => {
  // ── Documentos ───────────────────────────────────────────────────────────
  const [documentos, setDocumentos] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Áreas hijas (para selector cuando es unidad padre) ──────────────────
  const [areasHijas, setAreasHijas] = useState([]);

  // ── Filtros ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('TODOS'); // 'EMISION' | 'RECEPCION' | 'TODOS'
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipoEmision, setFiltroTipoEmision] = useState('');
  const [areaEspecifica, setAreaEspecifica] = useState(null); // ID de área específica (si es padre)

  // ── Carga de documentos ──────────────────────────────────────────────────
  const fetchDocumentos = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const filters = {
          page,
          limit: PAGE_SIZE,
          tipoNodo: activeTab, // 'EMISION', 'RECEPCION', 'TODOS'
        };

        if (busqueda.trim()) filters.busqueda = busqueda.trim();
        if (filtroEstado) filters.estado = filtroEstado;
        if (filtroTipoEmision) filters.claveTipo = filtroTipoEmision;
        if (areaEspecifica) filters.areaEspecifica = areaEspecifica;

        const response = await getCorrespondenciaUnidad(filters);
        
        setDocumentos(response.data || []);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
        setCurrentPage(response.page || 1);
        setAreasHijas(response.areasHijas || []);
      } catch (err) {
        console.error('Error al cargar correspondencia:', err);
        setError('No se pudo cargar la correspondencia de la unidad.');
        setDocumentos([]);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, busqueda, filtroEstado, filtroTipoEmision, areaEspecifica]
  );

  // Recarga cuando cambian los filtros (resetea página a 1)
  useEffect(() => {
    setCurrentPage(1);
    fetchDocumentos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, busqueda, filtroEstado, filtroTipoEmision, areaEspecifica]);

  // ── Handlers públicos ────────────────────────────────────────────────────
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    // No resetear otros filtros, permitir combinación
  };

  const handlePageChange = (page) => {
    fetchDocumentos(page);
  };

  const handleAreaEspecificaChange = (areaId) => {
    setAreaEspecifica(areaId || null);
  };

  const resetFiltros = () => {
    setActiveTab('TODOS');
    setBusqueda('');
    setFiltroEstado('');
    setFiltroTipoEmision('');
    setAreaEspecifica(null);
  };

  // ── Computed: Indicador si es unidad padre ──────────────────────────────
  const esUnidadPadre = areasHijas.length > 1; // Más de una área = tiene hijos

  return {
    // Documentos
    documentos,
    total,
    totalPages,
    currentPage,
    loading,
    error,
    pageSize: PAGE_SIZE,
    // Áreas
    areasHijas,
    esUnidadPadre,
    // Filtros
    activeTab,
    busqueda,
    filtroEstado,
    filtroTipoEmision,
    areaEspecifica,
    // Handlers
    handleTabChange,
    handlePageChange,
    handleAreaEspecificaChange,
    setBusqueda,
    setFiltroEstado,
    setFiltroTipoEmision,
    resetFiltros,
    // Refresh manual
    refetch: () => fetchDocumentos(currentPage),
  };
};
