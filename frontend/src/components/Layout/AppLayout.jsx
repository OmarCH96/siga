import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Layout principal de la aplicación
 * Combina Sidebar + Header + contenido principal
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido principal de la página
 * @param {string} props.activeRoute - Ruta activa actual ('emitir', 'recepciones', 'reportes')
 */
const AppLayout = ({ children, activeRoute }) => {
    const navigate = useNavigate();
    const { logout, user, hasPermission } = useAuth();

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            {/* Sidebar de navegación */}
            <Sidebar
                user={user}
                hasPermission={hasPermission}
                logout={logout}
                navigate={navigate}
                activeRoute={activeRoute}
            />

            {/* Área de contenido principal */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <Header user={user} />

                {/* Contenido principal con scroll */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

AppLayout.propTypes = {
    children: PropTypes.node.isRequired,
    activeRoute: PropTypes.oneOf(['emitir', 'recepciones', 'reportes', 'correspondencia', null])
};

export default AppLayout;
