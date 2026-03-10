import { useEffect, useMemo, useState, useRef } from 'react';
import { dashboardApi } from '@services/api';
import { processWeekMetrics, processDistribution } from '@utils/dataFormatters';

// Tiempo de caché en milisegundos (30 segundos)
const CACHE_TIME = 30000;

const TABS = [
    { id: 'estadisticas', label: 'Estadisticas', icon: 'analytics' },
    { id: 'salientes', label: 'Salientes', icon: 'upload_file' },
    { id: 'entrantes', label: 'Entrantes', icon: 'download_for_offline' },
    { id: 'correspondencia', label: 'Correspondencia General', icon: 'mail' },
];

const emptyForm = {
    asunto: '',
    destino: '',
    prioridad: 'Media',
};

/**
 * Hook personalizado para el dashboard administrativo
 * Maneja el estado y la lógica del dashboard
 * OPTIMIZADO: Incluye caché para evitar llamadas repetidas
 */
export function useAdminDashboard() {
    const [usuarios, setUsuarios] = useState([]);
    const [datos, setDatos] = useState({
        unidades: [],
        metricasSemanales: [],
        distribucionEstados: [],
    });
    const [registros, setRegistros] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('estadisticas');
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [newRegistro, setNewRegistro] = useState(emptyForm);

    // Referencias para caché
    const lastLoadTime = useRef(0);
    const isLoadingRef = useRef(false);

    useEffect(() => {
        const loadDashboard = async () => {
            // Verificar caché
            const now = Date.now();
            if (now - lastLoadTime.current < CACHE_TIME) {
                return; // Usar datos cacheados
            }

            // Evitar solicitudes concurrentes
            if (isLoadingRef.current) {
                return;
            }

            isLoadingRef.current = true;
            setIsLoading(true);
            setError(null);

            try {
                const [usuariosData, datosData, registrosData] = await Promise.all([
                    dashboardApi.getUsuarios(),
                    dashboardApi.getDatos(),
                    dashboardApi.getRegistros(),
                ]);

                // Sanitizar y validar los datos recibidos
                const unidades = Array.isArray(datosData?.unidades) ? datosData.unidades : [];
                const metricasSemanales = Array.isArray(datosData?.metricasSemanales) 
                    ? datosData.metricasSemanales 
                    : [];
                const distribucionEstados = Array.isArray(datosData?.distribucionEstados)
                    ? datosData.distribucionEstados
                    : [];

                setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
                setDatos({
                    unidades,
                    metricasSemanales,
                    distribucionEstados,
                });
                setRegistros(Array.isArray(registrosData) ? registrosData : []);

                // Seleccionar la primera unidad si hay datos
                if (unidades.length > 0 && !selectedUnitId) {
                    setSelectedUnitId(unidades[0].id);
                }

                // Actualizar timestamp del caché
                lastLoadTime.current = now;
            } catch (loadError) {
                console.error('Error loading dashboard:', loadError);
                setError(loadError.message || 'No fue posible cargar la informacion del dashboard');
            } finally {
                setIsLoading(false);
                isLoadingRef.current = false;
            }
        };

        loadDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Solo cargar una vez al montar

    const selectedUnit = useMemo(() => {
        return datos.unidades.find((unidad) => unidad.id === selectedUnitId) || null;
    }, [datos.unidades, selectedUnitId]);

    const filteredRegistros = useMemo(() => {
        if (!searchTerm.trim()) {
            return registros;
        }

        const needle = searchTerm.toLowerCase().trim();
        return registros.filter((registro) => {
            const haystack = [
                registro.folio || '',
                registro.asunto || '',
                registro.origenDestino || '',
                registro.estado || '',
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(needle);
        });
    }, [registros, searchTerm]);

    const totals = useMemo(() => {
        return registros.reduce(
            (acc, item) => {
                acc.total += 1;
                const estado = (item.estado || '').toLowerCase();
                if (estado.includes('proceso')) acc.enProceso += 1;
                if (estado.includes('complet')) acc.completado += 1;
                if (estado.includes('cancel')) acc.cancelado += 1;
                return acc;
            },
            { total: 0, enProceso: 0, completado: 0, cancelado: 0 }
        );
    }, [registros]);

    const handleCreateRegistro = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const created = await dashboardApi.createRegistro({
                ...newRegistro,
                unidadId: selectedUnitId,
            });
            setRegistros((prev) => [created, ...prev]);
            setNewRegistro(emptyForm);
        } catch (submitError) {
            setError(submitError.message || 'No fue posible guardar el registro');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        usuarios,
        datos,
        registros: filteredRegistros,
        totals,
        tabs: TABS,
        searchTerm,
        setSearchTerm,
        activeTab,
        setActiveTab,
        selectedUnit,
        selectedUnitId,
        setSelectedUnitId,
        isLoading,
        isSubmitting,
        error,
        handleCreateRegistro,
    };
}
