import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useCorrespondenciaUnidad } from '@hooks/useCorrespondenciaUnidad';
import AppLayout from '@components/Layout/AppLayout';
import Paginacion from '@components/Paginacion';

// ─── Mapas de estilos ────────────────────────────────────────────────────────
const BADGE_ESTADO = {
    REGISTRADO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    TURNADO: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    RECIBIDO: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
    EN_PROCESO: 'bg-primary/10 text-primary dark:bg-primary/20',
    RESPONDIDO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    DESPACHADO: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
    CERRADO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    DEVUELTO: 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
    CANCELADO: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    PENDIENTE_PRESTAMO: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
};

const DOT_ESTADO = {
    REGISTRADO: 'bg-blue-500',
    TURNADO: 'bg-amber-500',
    RECIBIDO: 'bg-sky-500',
    EN_PROCESO: 'bg-primary',
    RESPONDIDO: 'bg-emerald-500',
    DESPACHADO: 'bg-teal-500',
    CERRADO: 'bg-slate-400',
    DEVUELTO: 'bg-rose-500',
    CANCELADO: 'bg-red-500',
    PENDIENTE_PRESTAMO: 'bg-orange-500',
};

const LABEL_ESTADO = {
    REGISTRADO: 'Registrado',
    TURNADO: 'Turnado',
    RECIBIDO: 'Recibido',
    EN_PROCESO: 'En Proceso',
    RESPONDIDO: 'Respondido',
    DESPACHADO: 'Despachado',
    CERRADO: 'Cerrado',
    DEVUELTO: 'Devuelto',
    CANCELADO: 'Cancelado',
    PENDIENTE_PRESTAMO: 'Pend. Préstamo',
};

const TIPOS_EMISION = [
    { value: '', label: 'Tipo de emisión' },
    { value: 'EC', label: 'EC: Circulares' },
    { value: 'EO', label: 'EO: Oficios' },
    { value: 'EM', label: 'EM: Memorándum' },
    { value: 'ET', label: 'ET: Tarjeta Informativa' },
    { value: 'MC', label: 'MC: Memorándum Circular' },
];

const ESTADOS_FILTRO = [
    { value: '', label: 'Todos los estatus' },
    { value: 'REGISTRADO', label: 'Registrado' },
    { value: 'TURNADO', label: 'Turnado' },
    { value: 'EN_PROCESO', label: 'En Proceso' },
    { value: 'RESPONDIDO', label: 'Respondido' },
    { value: 'CERRADO', label: 'Cerrado' },
    { value: 'DEVUELTO', label: 'Devuelto' },
];

// Genera iniciales a partir de nombre + apellidos
const getIniciales = (nombre = '', apellidos = '') =>
    `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase() || '?';

// ─── Componente ──────────────────────────────────────────────────────────────
const CorrespondenciaUnidad = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const {
        documentos,
        total,
        totalPages,
        currentPage,
        loading,
        error,
        pageSize,
        areasHijas,
        esUnidadPadre,
        activeTab,
        busqueda,
        filtroEstado,
        filtroTipoEmision,
        areaEspecifica,
        handleTabChange,
        handlePageChange,
        handleAreaEspecificaChange,
        setBusqueda,
        setFiltroEstado,
        setFiltroTipoEmision,
    } = useCorrespondenciaUnidad();

    return (
        <AppLayout activeRoute="correspondencia">
            <div className="p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Título y descripción */}
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Correspondencia de Unidad
                            {total > 0 && (
                                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                                    {total} {total === 1 ? 'documento' : 'documentos'}
                                </span>
                            )}
                        </h3>
                        <p className="text-slate-500 text-sm">
                            {user?.area?.nombre || 'Mi Unidad'}
                            {esUnidadPadre && (
                                <span className="ml-2 text-xs text-primary">
                                    · Vista jerárquica: {areasHijas.length} unidades
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Loading */}
                    {loading && !documentos.length && (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Cargando correspondencia...</p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="material-symbols-outlined text-2xl">error</span>
                            </div>
                            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Error al cargar</h3>
                            <p className="text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            {/* Tabs + Filtros */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                                {/* Tabs */}
                                <div className="border-b border-slate-200 dark:border-slate-800 px-6">
                                    <nav className="flex gap-2 -mb-px">
                                        {['TODOS', 'EMISION', 'RECEPCION'].map((tab) => (
                                            <button
                                                key={tab}
                                                type="button"
                                                onClick={() => handleTabChange(tab)}
                                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                                        ? 'border-primary text-primary'
                                                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                {tab === 'TODOS' && 'Todos'}
                                                {tab === 'EMISION' && 'Emitidos'}
                                                {tab === 'RECEPCION' && 'Recibidos'}
                                            </button>
                                        ))}
                                    </nav>
                                </div>

                                {/* Filtros */}
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Búsqueda */}
                                    <div className="lg:col-span-2">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                                                search
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Buscar por folio o asunto..."
                                                value={busqueda}
                                                onChange={(e) => setBusqueda(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Estado */}
                                    <select
                                        value={filtroEstado}
                                        onChange={(e) => setFiltroEstado(e.target.value)}
                                        className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        {ESTADOS_FILTRO.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Tipo de Emisión (solo visible en tab EMISION o TODOS) */}
                                    {(activeTab === 'EMISION' || activeTab === 'TODOS') && (
                                        <select
                                            value={filtroTipoEmision}
                                            onChange={(e) => setFiltroTipoEmision(e.target.value)}
                                            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            {TIPOS_EMISION.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {/* Selector de Área Específica (solo si es unidad padre) */}
                                    {esUnidadPadre && (
                                        <select
                                            value={areaEspecifica || ''}
                                            onChange={(e) => handleAreaEspecificaChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                                            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="">Todas las unidades</option>
                                            {areasHijas.map((area) => (
                                                <option key={area.id} value={area.id}>
                                                    {area.clave} - {area.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* Estadísticas */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400">description</span>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            Mostrando <span className="font-semibold text-slate-900 dark:text-white">{documentos.length}</span> de{' '}
                                            <span className="font-semibold text-slate-900 dark:text-white">{total}</span> documentos
                                        </span>
                                    </div>
                                    {loading && (
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            Actualizando...
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Lista de Documentos */}
                            {documentos.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-3xl">inbox</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                        No hay documentos
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        No se encontraron documentos con los filtros seleccionados.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {documentos.map((doc) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => navigate(`/documentos/${doc.id}`)}
                                            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="font-mono text-sm font-bold text-primary">
                                                                {doc.folio}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${BADGE_ESTADO[doc.estado_documento] || BADGE_ESTADO.REGISTRADO}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${DOT_ESTADO[doc.estado_documento] || DOT_ESTADO.REGISTRADO}`}></span>
                                                                {LABEL_ESTADO[doc.estado_documento] || doc.estado_documento}
                                                            </span>
                                                            {doc.tipo_nodo && (
                                                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs font-medium">
                                                                    {doc.tipo_nodo === 'EMISION' ? 'Emitido' : 'Recibido'}
                                                                </span>
                                                            )}
                                                            {/* Indicador de unidad responsable (si es diferente a la del usuario) */}
                                                            {esUnidadPadre && doc.area_responsable_id !== user?.areaId && (
                                                                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium" title={`Responsable: ${doc.area_responsable_nombre}`}>
                                                                    {doc.area_responsable_clave}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                                                            {doc.asunto}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                                            {doc.contenido || 'Sin contenido'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                                            {new Date(doc.fecha_creacion || doc.nodo_fecha_generacion).toLocaleDateString('es-MX')}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[16px]">folder</span>
                                                            {doc.tipo_documento_nombre}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[16px]">business</span>
                                                            {doc.area_origen_nombre}
                                                        </div>
                                                        {(doc.usuario_creador_nombre || doc.usuario_responsable_nombre) && (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                                                    {getIniciales(
                                                                        doc.usuario_creador_nombre || doc.usuario_responsable_nombre || '',
                                                                        doc.usuario_creador_apellidos || doc.usuario_responsable_apellidos || ''
                                                                    )}
                                                                </div>
                                                                {doc.usuario_creador_nombre || doc.usuario_responsable_nombre}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                                                        arrow_forward
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Paginación */}
                            {totalPages > 1 && (
                                <Paginacion
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    pageSize={pageSize}
                                    total={total}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default CorrespondenciaUnidad;
