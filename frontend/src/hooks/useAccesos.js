/**
 * Hook personalizado para el Registro de Accesos.
 * Encapsula fetch, paginación y filtros del endpoint GET /api/accesos.
 */

import { useState, useEffect, useCallback } from 'react';
import { getAccesos } from '../services/accesos.service';

const PAGE_SIZE = 10;

export const useAccesos = () => {
    const [accesos, setAccesos] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filtros locales (sin debounce, se aplican al presionar o seleccionar)
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('Todos');
    const [filtroDispositivo, setFiltroDispositivo] = useState('Todos');

    const fetchAccesos = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAccesos({
                page,
                limit: PAGE_SIZE,
                busqueda,
                estado: filtroEstado,
                dispositivo: filtroDispositivo,
            });
            setAccesos(data.accesos || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
            setCurrentPage(data.page || 1);
        } catch (err) {
            setError('No se pudo cargar el registro de accesos.');
            setAccesos([]);
        } finally {
            setIsLoading(false);
        }
    }, [busqueda, filtroEstado, filtroDispositivo]);

    // Recarga cuando cambian filtros (resetea a página 1)
    useEffect(() => {
        setCurrentPage(1);
        fetchAccesos(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busqueda, filtroEstado, filtroDispositivo]);

    const handlePageChange = (page) => {
        fetchAccesos(page);
    };

    const handleBusqueda = (valor) => {
        setBusqueda(valor);
    };

    const handleFiltroEstado = (valor) => {
        setFiltroEstado(valor);
    };

    const handleFiltroDispositivo = (valor) => {
        setFiltroDispositivo(valor);
    };

    return {
        accesos,
        total,
        totalPages,
        currentPage,
        isLoading,
        error,
        busqueda,
        filtroEstado,
        filtroDispositivo,
        PAGE_SIZE,
        handlePageChange,
        handleBusqueda,
        handleFiltroEstado,
        handleFiltroDispositivo,
    };
};
