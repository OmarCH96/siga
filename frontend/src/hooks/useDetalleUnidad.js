/**
 * Hook personalizado para el Detalle de Unidad Administrativa.
 * Encapsula fetch de datos del área, documentos (emisiones/recepciones),
 * paginación y filtros.
 */

import { useState, useEffect, useCallback } from 'react';
import { getAreaById, getDocumentosPorArea } from '../services/area.service';

const PAGE_SIZE = 10;

export const useDetalleUnidad = (areaId) => {
  // ── Datos del área ───────────────────────────────────────────────────────
  const [area, setArea] = useState(null);
  const [areaLoading, setAreaLoading] = useState(false);
  const [areaError, setAreaError] = useState(null);

  // ── Documentos ───────────────────────────────────────────────────────────
  const [documentos, setDocumentos] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState(null);

  // ── Filtros ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('emisiones'); // 'emisiones' | 'recepciones'
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipoEmision, setFiltroTipoEmision] = useState('');

  // ── Carga del área ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!areaId) return;

    const fetchArea = async () => {
      setAreaLoading(true);
      setAreaError(null);
      try {
        const response = await getAreaById(areaId);
        setArea(response.data || response);
      } catch (err) {
        setAreaError('No se pudo cargar la información de la unidad.');
      } finally {
        setAreaLoading(false);
      }
    };

    fetchArea();
  }, [areaId]);

  // ── Carga de documentos ──────────────────────────────────────────────────
  const fetchDocumentos = useCallback(
    async (page = 1) => {
      if (!areaId) return;

      setDocsLoading(true);
      setDocsError(null);
      try {
        const filters = {
          tipo: activeTab,
          page,
          limit: PAGE_SIZE,
        };
        if (busqueda.trim()) filters.busqueda = busqueda.trim();
        if (filtroEstado) filters.estado = filtroEstado;
        if (activeTab === 'emisiones' && filtroTipoEmision)
          filters.claveTipo = filtroTipoEmision;

        const data = await getDocumentosPorArea(areaId, filters);
        setDocumentos(data.documentos || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.page || 1);
      } catch (err) {
        setDocsError('No se pudo cargar la lista de documentos.');
        setDocumentos([]);
      } finally {
        setDocsLoading(false);
      }
    },
    [areaId, activeTab, busqueda, filtroEstado, filtroTipoEmision]
  );

  // Recarga cuando cambian los filtros (resetea página a 1)
  useEffect(() => {
    setCurrentPage(1);
    fetchDocumentos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId, activeTab, busqueda, filtroEstado, filtroTipoEmision]);

  // ── Handlers públicos ────────────────────────────────────────────────────
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setBusqueda('');
    setFiltroEstado('');
    setFiltroTipoEmision('');
  };

  const handlePageChange = (page) => {
    fetchDocumentos(page);
  };

  return {
    // Área
    area,
    areaLoading,
    areaError,
    // Documentos
    documentos,
    total,
    totalPages,
    currentPage,
    docsLoading,
    docsError,
    pageSize: PAGE_SIZE,
    // Filtros
    activeTab,
    busqueda,
    filtroEstado,
    filtroTipoEmision,
    // Handlers
    handleTabChange,
    handlePageChange,
    setBusqueda,
    setFiltroEstado,
    setFiltroTipoEmision,
  };
};
