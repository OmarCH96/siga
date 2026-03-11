/**
 * Formulario de Emisión de Documentos
 * Convierte el HTML maquetado con Tailwind a JSX de React
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import api from '@services/api';

const FormularioEmision = () => {
    const navigate = useNavigate();
    const { logout, user, hasPermission } = useAuth();

    // Estado del formulario
    const [formData, setFormData] = useState({
        tipo_documento_id: 2, // Por defecto Memorándum
        asunto: '',
        contenido: '',
        contexto: 'MEMORANDUM',
        prioridad: 'MEDIA',
        instrucciones: ''
    });

    // Estados para modales
    const [isModalFolioOpen, setIsModalFolioOpen] = useState(false);
    const [isModalFirmaOpen, setIsModalFirmaOpen] = useState(false);

    // Estados para el proceso de guardado
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [folioGenerado, setFolioGenerado] = useState(null);

    // Estado para tipos de documento
    const [tiposDocumento, setTiposDocumento] = useState([]);

    // Cargar tipos de documento al montar el componente
    useEffect(() => {
        const cargarTiposDocumento = async () => {
            try {
                const response = await api.get('/tipos-documento/activos');
                if (response.data.success) {
                    setTiposDocumento(response.data.data);
                }
            } catch (err) {
                console.error('Error al cargar tipos de documento:', err);
            }
        };

        cargarTiposDocumento();
    }, []);

    // Debug: Log del usuario y área
    useEffect(() => {
        console.log('Usuario completo:', user);
        console.log('Área del usuario:', user?.area);
        console.log('Clave del área:', user?.area?.clave);
        
        // Advertencia si falta la clave del área
        if (user && (!user.area || !user.area.clave)) {
            console.warn('⚠️ La clave del área no está disponible. Por favor, cierre sesión y vuelva a iniciar sesión.');
        }
    }, [user]);

    // Calcular valores dinámicos para el folio
    const areaClave = user?.area?.clave || 'AREA';
    console.log('areaClave calculada:', areaClave);
    const añoActual = new Date().getFullYear();
    const fechaActual = new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    // Obtener la clave del tipo de documento seleccionado
    const tipoDocumentoSeleccionado = tiposDocumento.find(
        tipo => tipo.id === parseInt(formData.tipo_documento_id)
    );
    const tipoDocumentoClave = tipoDocumentoSeleccionado?.clave || 'EM';
    
    const folioBase = `${tipoDocumentoClave}.${areaClave}`;
    const numeroPlaceholder = '----';
    const referenciaCompleta = `${folioBase}-${numeroPlaceholder}/${añoActual}`;

    // Handler para cambios en inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handler para guardar (emisión real)
    const handleGuardar = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await api.post('/documentos', formData);

            if (response.data.success) {
                setFolioGenerado(response.data.data.folio);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al emitir el documento';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                        <span className="material-symbols-outlined">description</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-none text-slate-900 dark:text-white">SIGA</h1>
                        <p className="text-xs text-slate-500 font-medium">Gestión Documental</p>
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-1">
                    {hasPermission('CREAR_DOCUMENTO') && (
                        <button
                            type="button"
                            onClick={() => navigate('/emision')}
                            className="w-full flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined">send</span>
                            <span className="text-sm font-semibold">Emitir</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => navigate('/recepciones')}
                        className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">inbox</span>
                        <span className="text-sm font-medium">Recepciones</span>
                    </button>
                    <button
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-not-allowed opacity-50"
                        disabled
                    >
                        <span className="material-symbols-outlined">bar_chart</span>
                        <span className="text-sm font-medium">Reportes</span>
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 p-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-semibold truncate">
                                    {user?.nombre || user?.nombreUsuario || 'Usuario'}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                    {user?.rol?.nombre || 'Sin rol'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            title="Cerrar sesión"
                            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Área de contenido principal */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 text-primary">
                                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                Secretaría de Medio Ambiente
                            </h2>
                        </div>
                        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex gap-4">
                            <button className="text-xs font-medium text-primary border-b-2 border-primary pb-1">
                                {user?.area?.nombre || 'Sin área asignada'}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <span className="material-symbols-outlined text-slate-500 p-2 hover:bg-slate-100 rounded-full cursor-pointer">
                                notifications
                            </span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </div>
                        <span className="material-symbols-outlined text-slate-500 p-2 hover:bg-slate-100 rounded-full cursor-pointer">
                            help
                        </span>
                        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
                        <button className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <span>Español</span>
                            <span className="material-symbols-outlined text-sm">expand_more</span>
                        </button>
                    </div>
                </header>

                {/* Contenido con scroll */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 max-w-7xl mx-auto w-full space-y-4 pb-24">
                        {/* Breadcrumbs & Header */}
                        <div>
                            <nav className="flex text-xs text-slate-400 mb-1 gap-2 items-center">
                                <span>Gestión Administrativa</span>
                                <span className="material-symbols-outlined !text-[12px]">chevron_right</span>
                                <span className="text-primary font-medium">Nueva Emisión</span>
                            </nav>
                            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                Emisión de Documento
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Complete los campos requeridos para la generación y firma del oficio institucional.
                            </p>
                        </div>

                        {/* Mensaje de Error */}
                        {error && (
                            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 flex items-start gap-2">
                                <span className="material-symbols-outlined !text-base">error</span>
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Mensaje de Éxito */}
                        {folioGenerado && (
                            <div className="bg-emerald-100 text-emerald-800 p-3 rounded-lg mb-4 flex items-start gap-2">
                                <span className="material-symbols-outlined !text-base">check_circle</span>
                                <div>
                                    <p className="text-sm font-bold">¡Éxito! Documento emitido</p>
                                    <p className="text-sm">Folio generado: <span className="font-mono font-semibold">{folioGenerado}</span></p>
                                </div>
                            </div>
                        )}

                        {/* Advertencia de Área sin Clave */}
                        {user && (!user.area || !user.area.clave) && (
                            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4 flex items-start gap-2">
                                <span className="material-symbols-outlined !text-base">warning</span>
                                <div>
                                    <p className="text-sm font-bold">Información del área incompleta</p>
                                    <p className="text-sm">Por favor, cierre sesión y vuelva a iniciar sesión para actualizar su información.</p>
                                </div>
                            </div>
                        )}

                        {/* Card 1: Folio y Datos */}
                        <section className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between gap-4">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary !text-base">tag</span>
                                        Folio y Datos del Documento
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalFolioOpen(true)}
                                        className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
                                    >
                                        <span className="material-symbols-outlined !text-sm">autorenew</span> Solicitar folio
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tipo de documento</label>
                                    <select 
                                        name="tipo_documento_id"
                                        value={formData.tipo_documento_id}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm py-1.5"
                                    >
                                        {tiposDocumento.length === 0 ? (
                                            <option>Cargando...</option>
                                        ) : (
                                            tiposDocumento.map(tipo => (
                                                <option key={tipo.id} value={tipo.id}>
                                                    {tipo.nombre}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Folio</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 font-mono py-1.5"
                                        disabled
                                        type="text"
                                        value={folioBase}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Número</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 font-mono py-1.5"
                                        disabled
                                        type="text"
                                        value={numeroPlaceholder}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Año</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 font-mono py-1.5"
                                        disabled
                                        type="text"
                                        value={añoActual}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Referencia</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 font-mono font-bold py-1.5"
                                        disabled
                                        type="text"
                                        value={referenciaCompleta}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fecha</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 py-1.5"
                                        disabled
                                        type="text"
                                        value={fechaActual}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Card 2: Datos del Remitente */}
                        <section className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-base">person</span>
                                    Datos del Remitente
                                </h3>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dependencia</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500"
                                        disabled
                                        type="text"
                                        value="Secretaría de Medio Ambiente, Desarrollo Sustentable y Ordenamiento Territorial"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unidad Administrativa</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500"
                                        disabled
                                        type="text"
                                        value="Dirección General de Normatividad"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cargo del remitente</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500"
                                        disabled
                                        type="text"
                                        value="Director de Área B"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Remitente</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 font-bold"
                                        disabled
                                        type="text"
                                        value="Lic. Juan Pérez Maldonado"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Card 3: Detalles del Contenido */}
                        <section className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-base">description</span>
                                    Detalles del Contenido
                                </h3>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tema / Asunto</label>
                                    <input
                                        name="asunto"
                                        value={formData.asunto}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary"
                                        placeholder="Escriba el tema principal del documento..."
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Síntesis</label>
                                    <textarea
                                        name="contenido"
                                        value={formData.contenido}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary"
                                        placeholder="Resumen detallado del contenido..."
                                        rows="2"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                            Fecha límite de atención
                                        </label>
                                        <input
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                            type="date"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estatus</label>
                                        <input
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 font-bold"
                                            disabled
                                            type="text"
                                            value="BORRADOR"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Card 4: Destinatarios y Copias */}
                        <section className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-base">group</span>
                                    Destinatarios y Copias
                                </h3>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Destinatarios</label>
                                    <select className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
                                        <option value="">Seleccionar destinatario...</option>
                                        <option>Dra. María García - Dir. General Administrativa</option>
                                        <option>Ing. Roberto Sosa - Jefe de Oficina Técnica</option>
                                    </select>
                                    <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                                            Dra. María García{' '}
                                            <button type="button" className="material-symbols-outlined !text-xs">
                                                close
                                            </button>
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Copias de conocimiento (CC)</label>
                                    <select className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
                                        <option value="">Seleccionar CC...</option>
                                        <option>Archivo de Trámite</option>
                                        <option>Coordinación Jurídica</option>
                                    </select>
                                    <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full">
                                            Archivo de Trámite{' '}
                                            <button type="button" className="material-symbols-outlined !text-xs">
                                                close
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Card 5: Control y Seguimiento */}
                        <section className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-base">visibility</span>
                                    Control y Seguimiento
                                </h3>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Capturó</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400"
                                        disabled
                                        type="text"
                                        value="Lic. Andrea Méndez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha de captura</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400"
                                        disabled
                                        type="text"
                                        value="12/10/2023 10:45 AM"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Respuesta (Lectura)</label>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 resize-none"
                                        disabled
                                        rows="1"
                                        value="Sin respuesta previa..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Aprobó</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400"
                                        disabled
                                        placeholder="Pendiente de aprobación..."
                                        type="text"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Card 6: Archivos Adjuntos */}
                        <section className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary !text-base">attach_file</span>
                                        Archivos Adjuntos
                                    </h3>
                                    <button
                                        type="button"
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined !text-sm">add</span> Agregar más archivos
                                    </button>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-800/20">
                                    <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">upload_file</span>
                                    <p className="text-xs text-slate-500">Arrastra y suelta archivos o haz clic para subir</p>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-danger">picture_as_pdf</span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate">anexo_tecnico_01.pdf</p>
                                                <p className="text-[10px] text-slate-500">2.4 MB</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="material-symbols-outlined text-slate-400 hover:text-danger transition-colors"
                                        >
                                            delete
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary">description</span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate">documento_base.docx</p>
                                                <p className="text-[10px] text-slate-500">842 KB</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="material-symbols-outlined text-slate-400 hover:text-danger transition-colors"
                                        >
                                            delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Sticky Footer Actions */}
                        <footer className="fixed bottom-0 left-64 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between z-20">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalFirmaOpen(true)}
                                    className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined !text-base">key</span> Firma Electrónica
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleGuardar}
                                    disabled={isLoading || folioGenerado !== null}
                                    className="px-5 py-2 bg-success text-white text-sm font-bold rounded-lg hover:bg-success/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading && (
                                        <span className="material-symbols-outlined !text-base animate-spin">progress_activity</span>
                                    )}
                                    {isLoading ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                    type="button"
                                    className="px-5 py-2 bg-success text-white text-sm font-bold rounded-lg hover:bg-success/90 transition-all"
                                >
                                    Enviar
                                </button>
                                <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />
                                <button
                                    type="button"
                                    className="px-5 py-2 text-white bg-danger hover:bg-danger/90 text-sm font-bold rounded-lg transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </footer>

                        {/* Modal: Firma Electrónica */}
                        {isModalFirmaOpen && (
                            <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                                <div className="modal-content bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-8 shadow-2xl border border-slate-200 dark:border-slate-800 mx-4">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">verified_user</span> Firma Electrónica
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() => setIsModalFirmaOpen(false)}
                                            className="material-symbols-outlined text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            close
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-6">
                                        Cargue sus archivos de certificados para firmar digitalmente el documento.
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Archivo .key</label>
                                            <input
                                                type="file"
                                                accept=".key"
                                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Archivo .cer</label>
                                            <input
                                                type="file"
                                                accept=".cer"
                                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Contraseña</label>
                                            <input
                                                type="password"
                                                placeholder="••••••••"
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                        <div className="flex gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalFirmaOpen(false)}
                                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30"
                                            >
                                                Firmar Documento
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal: Solicitar Folio */}
                        {isModalFolioOpen && (
                            <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                                <div className="modal-content bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 mx-4 max-h-[90vh] overflow-y-auto">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">folder_open</span> Solicitar Folio
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() => setIsModalFolioOpen(false)}
                                            className="material-symbols-outlined text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            close
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-6">
                                        Seleccione la jerarquía de áreas para generar el folio correspondiente.
                                    </p>

                                    <div className="space-y-5">
                                        {/* Secretaría */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Secretaría</label>
                                            <select className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary">
                                                <option>
                                                    Secretaría de Medio Ambiente, Desarrollo Sustentable y Ordenamiento Territorial
                                                </option>
                                                <option>Secretaría de Educación</option>
                                                <option>Secretaría de Salud</option>
                                                <option>Secretaría de Finanzas</option>
                                            </select>
                                        </div>

                                        {/* Subsecretaría */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subsecretaría</label>
                                            <select className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary">
                                                <option value="">Seleccionar subsecretaría...</option>
                                                <option>Subsecretaría de Desarrollo Sustentable</option>
                                                <option>Subsecretaría de Ordenamiento Territorial</option>
                                            </select>
                                        </div>

                                        {/* Dirección General */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dirección General</label>
                                            <select className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary">
                                                <option value="">Seleccionar dirección general...</option>
                                                <option>Dirección General de Normatividad</option>
                                                <option>Dirección General de Impacto Ambiental</option>
                                                <option>Dirección General de Recursos Naturales</option>
                                            </select>
                                        </div>

                                        {/* Dirección de Área */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dirección de Área</label>
                                            <select className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary">
                                                <option value="">Seleccionar dirección de área...</option>
                                                <option>Dirección de Área A</option>
                                                <option>Dirección de Área B</option>
                                                <option>Dirección de Área C</option>
                                            </select>
                                        </div>

                                        {/* Vista previa del folio */}
                                        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-primary !text-sm">info</span>
                                                <p className="text-xs font-bold text-slate-500 uppercase">Vista previa del folio</p>
                                            </div>
                                            <p className="text-lg font-bold font-mono text-primary">SMADSOT/OC/0042/2023</p>
                                            <p className="text-xs text-slate-500 mt-1">Esta será la nomenclatura del documento</p>
                                        </div>

                                        {/* Botones de acción */}
                                        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalFolioOpen(false)}
                                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined !text-sm">check_circle</span>
                                                Generar Folio
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormularioEmision;
