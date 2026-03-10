// BandejaRecepcionLayout
import PestanasNavegacion from './PestanasNavegacion';
import TablaDocumentos from './TablaDocumentos';
import { useAuth } from '@hooks/useAuth';

const BandejaRecepcionLayout = () => {
    const { logout, user } = useAuth();

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
                    <a
                        className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        href="#"
                    >
                        <span className="material-symbols-outlined">send</span>
                        <span className="text-sm font-medium">Emitir</span>
                    </a>
                    <a
                        className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg transition-colors"
                        href="#"
                    >
                        <span className="material-symbols-outlined">inbox</span>
                        <span className="text-sm font-semibold">Recepciones</span>
                    </a>
                    <a
                        className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        href="#"
                    >
                        <span className="material-symbols-outlined">bar_chart</span>
                        <span className="text-sm font-medium">Reportes</span>
                    </a>
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
                                Nombre de la unidad administrativa
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

                {/* Contenido */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Título */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Recepciones</h3>
                                <p className="text-slate-500 text-sm">
                                    Gestión y seguimiento de documentos oficiales recibidos.
                                </p>
                            </div>
                            <PestanasNavegacion />
                        </div>

                        <TablaDocumentos />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default BandejaRecepcionLayout;
