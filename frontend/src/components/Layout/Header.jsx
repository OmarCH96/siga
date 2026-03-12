import PropTypes from 'prop-types';

/**
 * Header principal de la aplicación
 * Contiene logo de la dependencia, nombre, área activa y notificaciones
 */
const Header = ({ user }) => {
    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10">
            {/* Lado izquierdo: Logo y nombre de la dependencia + área activa */}
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

            {/* Lado derecho: Notificaciones, ayuda y selector de idioma */}
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
    );
};

Header.propTypes = {
    user: PropTypes.shape({
        area: PropTypes.shape({
            nombre: PropTypes.string
        })
    })
};

export default Header;
