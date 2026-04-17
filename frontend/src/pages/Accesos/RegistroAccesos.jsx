import { useAuth } from '@hooks/useAuth';
import { useAccesos } from '@hooks/useAccesos';
import AdminSidebar from '@components/dashboard/AdminSidebar';
import AdminTopNavbar from '@components/dashboard/AdminTopNavbar';
import Paginacion from '@components/Paginacion';
import { formatDate } from '@utils/dataFormatters';

// ─── Mapeo de accion BD → etiqueta visual ─────────────────────────────────────
const LABEL_ACCION = {
    LOGIN_EXITOSO: 'EXITOSO',
    LOGIN_FALLIDO: 'FALLIDO',
    MFA_REQUERIDO: 'MFA REQUERIDO',
    LOGOUT: 'LOGOUT',
    ACCESO_DENEGADO: 'DENEGADO',
};

const badgeEstado = {
    LOGIN_EXITOSO: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    LOGIN_FALLIDO: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    MFA_REQUERIDO: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    LOGOUT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    ACCESO_DENEGADO: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

const avatarEstado = {
    LOGIN_EXITOSO: 'bg-slate-100 text-slate-500',
    LOGIN_FALLIDO: 'bg-red-100 text-red-500',
    MFA_REQUERIDO: 'bg-amber-100 text-amber-600',
    LOGOUT: 'bg-slate-100 text-slate-500',
    ACCESO_DENEGADO: 'bg-red-100 text-red-500',
};

// Detecta ícono de dispositivo a partir del user_agent
const getIconDispositivo = (userAgent = '') => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
        return 'smartphone';
    }
    if (ua.includes('curl') || ua.includes('bot') || ua.includes('python') || ua.includes('java')) {
        return 'language';
    }
    return 'laptop';
};

// Extrae una descripción corta del user_agent
const parseUserAgent = (userAgent = '') => {
    if (!userAgent) return 'Desconocido';
    if (/chrome/i.test(userAgent) && !/chromium|edg/i.test(userAgent)) {
        if (/android/i.test(userAgent)) return 'Chrome / Android';
        if (/macintosh/i.test(userAgent)) return 'Chrome / macOS';
        if (/linux/i.test(userAgent)) return 'Chrome / Linux';
        return 'Chrome / Windows';
    }
    if (/edg\//i.test(userAgent)) return 'Edge / Windows';
    if (/firefox/i.test(userAgent)) return 'Firefox / Windows';
    if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
        if (/iphone|ipad/i.test(userAgent)) return 'Safari / iOS';
        return 'Safari / macOS';
    }
    if (/curl/i.test(userAgent)) return 'curl / Linux';
    return userAgent.substring(0, 40);
};

// Obtiene las iniciales del nombre de usuario o muestra '?'
const getIniciales = (nombre = '', apellidos = '') => {
    if (!nombre && !apellidos) return '?';
    return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
};

// Opciones de filtro estado (valores = accion en BD)
const FILTROS_ESTADO = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Exitoso', value: 'LOGIN_EXITOSO' },
    { label: 'Fallido', value: 'LOGIN_FALLIDO' },
    { label: 'MFA Requerido', value: 'MFA_REQUERIDO' },
];
const FILTROS_DISPOSITIVO = ['Todos', 'Escritorio', 'Móvil'];

const RegistroAccesos = () => {
    const { user, logout } = useAuth();
    const {
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
    } = useAccesos();

    const hayFiltrosActivos = filtroEstado !== 'Todos' || filtroDispositivo !== 'Todos' || busqueda;

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <AdminSidebar user={user} onLogout={logout} />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AdminTopNavbar
                    searchTerm={busqueda}
                    onSearchChange={handleBusqueda}
                    selectedUnitName="Registro de Accesos"
                    searchPlaceholder="Buscar por usuario o IP..."
                />

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto space-y-6">

                        {/* ─── Encabezado ──────────────────────────────────────────────── */}
                        <div className="flex flex-wrap justify-between items-end gap-4">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    Registro de Accesos
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                    Auditoría completa de actividad de inicio de sesión y seguridad.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                    disabled
                                    title="Funcionalidad próximamente disponible"
                                >
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                    <span>Exportar CSV</span>
                                </button>
                            </div>
                        </div>

                        {/* ─── Error ───────────────────────────────────────────────────── */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </div>
                        )}

                        {/* ─── Barra de filtros ─────────────────────────────────────────── */}
                        <div className="flex flex-wrap gap-3">
                            {/* Filtro Estado */}
                            <div className="relative group">
                                <button
                                    type="button"
                                    className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2 hover:border-primary/50 transition-colors"
                                >
                                    Estado:&nbsp;
                                    <span className="text-primary">
                                        {FILTROS_ESTADO.find((f) => f.value === filtroEstado)?.label || 'Todos'}
                                    </span>
                                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                                </button>
                                <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 hidden group-focus-within:block group-hover:block">
                                    {FILTROS_ESTADO.map((op) => (
                                        <button
                                            key={op.value}
                                            type="button"
                                            onClick={() => handleFiltroEstado(op.value)}
                                            className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors first:rounded-t-lg last:rounded-b-lg ${filtroEstado === op.value ? 'text-primary font-bold' : 'text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            {op.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Filtro Dispositivo */}
                            <div className="relative group">
                                <button
                                    type="button"
                                    className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2 hover:border-primary/50 transition-colors"
                                >
                                    Dispositivo:&nbsp;
                                    <span className="text-primary">{filtroDispositivo}</span>
                                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                                </button>
                                <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 hidden group-focus-within:block group-hover:block">
                                    {FILTROS_DISPOSITIVO.map((op) => (
                                        <button
                                            key={op}
                                            type="button"
                                            onClick={() => handleFiltroDispositivo(op)}
                                            className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors first:rounded-t-lg last:rounded-b-lg ${filtroDispositivo === op ? 'text-primary font-bold' : 'text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            {op}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Contador de resultados con filtros activos */}
                            {hayFiltrosActivos && (
                                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">filter_alt</span>
                                    {total} resultado{total !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* ─── Tabla ────────────────────────────────────────────────────── */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Usuario</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Dirección IP</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Fecha &amp; Hora</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Dispositivo / Navegador</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right" scope="col">Estado</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {/* Estado de carga */}
                                        {isLoading && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="spinner" />
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando registros...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}

                                        {/* Sin resultados */}
                                        {!isLoading && accesos.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center">
                                                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2 block">
                                                        manage_search
                                                    </span>
                                                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                                                        No se encontraron registros con los filtros aplicados
                                                    </p>
                                                </td>
                                            </tr>
                                        )}

                                        {/* Filas de datos */}
                                        {!isLoading && accesos.map((registro) => {
                                            const nombre = registro.usuario?.nombre || '';
                                            const apellidos = registro.usuario?.apellidos || '';
                                            const cargo = registro.usuario?.rolNombre
                                                ? `${registro.usuario.rolNombre}${registro.usuario.areaNombre ? ' · ' + registro.usuario.areaNombre : ''}`
                                                : 'Acceso sin usuario autenticado';
                                            const fechaObj = registro.fecha ? new Date(registro.fecha) : null;
                                            const fechaStr = fechaObj ? formatDate(fechaObj, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                                            const horaStr = fechaObj
                                                ? fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                                : '';

                                            return (
                                                <tr
                                                    key={registro.id}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                                >
                                                    {/* Usuario */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarEstado[registro.accion] || 'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                {getIniciales(nombre, apellidos)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                    {nombre && apellidos ? `${nombre} ${apellidos}` : 'Desconocido'}
                                                                </p>
                                                                <p className="text-xs text-slate-500 truncate max-w-[200px]" title={cargo}>{cargo}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* IP */}
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                                                        {registro.ipAddress}
                                                    </td>

                                                    {/* Fecha & Hora */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{fechaStr}</span>
                                                            <span className="text-xs text-slate-500">{horaStr}</span>
                                                        </div>
                                                    </td>

                                                    {/* Dispositivo */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                            <span className="material-symbols-outlined text-[18px]">
                                                                {getIconDispositivo(registro.userAgent)}
                                                            </span>
                                                            <span className="text-sm">{parseUserAgent(registro.userAgent)}</span>
                                                        </div>
                                                    </td>

                                                    {/* Estado */}
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeEstado[registro.accion] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}>
                                                            {LABEL_ACCION[registro.accion] || registro.accion}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* ─── Paginación ────────────────────────────────────────────── */}
                            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                                <Paginacion
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    total={total}
                                    pageSize={PAGE_SIZE}
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default RegistroAccesos;
