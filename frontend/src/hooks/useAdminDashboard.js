import { useEffect, useMemo, useState } from 'react';
import { dashboardApi } from '@services/api';

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

    useEffect(() => {
        const loadDashboard = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const [usuariosData, datosData, registrosData] = await Promise.all([
                    dashboardApi.getUsuarios(),
                    dashboardApi.getDatos(),
                    dashboardApi.getRegistros(),
                ]);

                setUsuarios(usuariosData);
                setDatos({
                    unidades: datosData?.unidades || [],
                    metricasSemanales: datosData?.metricasSemanales || [],
                    distribucionEstados: datosData?.distribucionEstados || [],
                });
                setRegistros(registrosData);

                if ((datosData?.unidades || []).length > 0) {
                    setSelectedUnitId(datosData.unidades[0].id);
                }
            } catch (loadError) {
                setError(loadError.message || 'No fue posible cargar la informacion del dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const selectedUnit = useMemo(() => {
        return datos.unidades.find((unidad) => unidad.id === selectedUnitId) || null;
    }, [datos.unidades, selectedUnitId]);

    const filteredRegistros = useMemo(() => {
        if (!searchTerm.trim()) {
            return registros;
        }

        const needle = searchTerm.toLowerCase();
        return registros.filter((registro) => {
            const haystack = [
                registro.folio,
                registro.asunto,
                registro.origenDestino,
                registro.estado,
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
