import PropTypes from 'prop-types';

/**
 * Sidebar de navegación principal del sistema
 * Contiene el logo, navegación y perfil de usuario
 */
const Sidebar = ({ user, hasPermission, logout, navigate, activeRoute }) => {
    return (
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Logo y nombre del sistema */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">description</span>
                </div>
                <div>
                    <h1 className="text-lg font-bold leading-none text-slate-900 dark:text-white">SIGA</h1>
                    <p className="text-xs text-slate-500 font-medium">Gestión Documental</p>
                </div>
            </div>

            {/* Navegación principal */}
            <nav className="flex-1 px-4 space-y-1">
                {hasPermission('CREAR_DOCUMENTO') && (
                    <button
                        type="button"
                        onClick={() => navigate('/documentos/emitir')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            activeRoute === 'emitir'
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span className="material-symbols-outlined">send</span>
                        <span className={`text-sm ${activeRoute === 'emitir' ? 'font-semibold' : 'font-medium'}`}>
                            Emitir
                        </span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => navigate('/recepciones')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        activeRoute === 'recepciones'
                            ? 'bg-primary/10 text-primary'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <span className="material-symbols-outlined">inbox</span>
                    <span className={`text-sm ${activeRoute === 'recepciones' ? 'font-semibold' : 'font-medium'}`}>
                        Recepciones
                    </span>
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

            {/* Información del usuario y logout */}
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
    );
};

Sidebar.propTypes = {
    user: PropTypes.shape({
        nombre: PropTypes.string,
        nombreUsuario: PropTypes.string,
        rol: PropTypes.shape({
            nombre: PropTypes.string
        })
    }),
    hasPermission: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired,
    activeRoute: PropTypes.oneOf(['emitir', 'recepciones', 'reportes', null])
};

export default Sidebar;
