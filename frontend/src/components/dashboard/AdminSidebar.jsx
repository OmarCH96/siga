import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getInitials } from '@utils/dataFormatters';
import { useAuth } from '@hooks/useAuth';

const navMain = [
  { id: 'inicio', label: 'Inicio', icon: 'home', path: '/dashboard' },
  { id: 'unidades', label: 'Unidades Administrativas', icon: 'business', path: '/unidades' },
  { id: 'reportes', label: 'Consultas y Reportes', icon: 'bar_chart', path: '/reportes' },
  { id: 'usuarios', label: 'Usuarios', icon: 'people', path: '/usuarios' },
  { id: 'accesos', label: 'Registro de Accesos', icon: 'history', path: '/accesos' },
];

const navGestion = [
  // { id: 'emision', label: 'Emitir Documento', icon: 'edit_document', path: '/documentos/emitir' },
  { id: 'documentos', label: 'Tipo de documentos', icon: 'description', path: '/documentos' },
  { id: 'configuracion', label: 'Configuracion', icon: 'settings', path: '/configuracion' },
];

function SidebarLink({ item, isActive, onClick }) {
  const baseClass =
    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm';

  const stateClass = isActive
    ? 'bg-primary/10 text-primary font-medium'
    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClass} ${stateClass} w-full text-left`}
    >
      <span className="material-symbols-outlined">{item.icon}</span>
      <span>{item.label}</span>
    </button>
  );
}

SidebarLink.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

const AdminSidebar = ({ user = null, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Filtrar enlaces de gestión según permisos
  const navGestionFiltrado = navGestion.filter((item) => {
    // Solo mostrar "Emitir Documento" si tiene el permiso
    if (item.id === 'emision') {
      return hasPermission('CREAR_DOCUMENTO');
    }
    // Los demás enlaces se muestran siempre (puedes agregar validaciones adicionales)
    return true;
  });

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex-col shrink-0 hidden md:flex">
      <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-xl">account_balance</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold tracking-tight">Admin Panel</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Gobierno Digital
          </p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navMain.map((item) => (
          <SidebarLink
            key={item.id}
            item={item}
            isActive={location.pathname === item.path}
            onClick={() => handleNavigation(item.path)}
          />
        ))}

        <div className="pt-4 pb-2">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gestion</p>
        </div>

        {navGestionFiltrado.map((item) => (
          <SidebarLink
            key={item.id}
            item={item}
            isActive={location.pathname === item.path}
            onClick={() => handleNavigation(item.path)}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold">
            {getInitials(user?.nombre, user?.apellidos)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">
              {user?.nombre || 'Administrador'} {user?.apellidos || ''}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{user?.rol_nombre || 'Administrador'}</p>
          </div>
          <button 
            type="button" 
            onClick={onLogout} 
            className="text-slate-400 hover:text-primary transition-colors"
            aria-label="Cerrar sesión"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

AdminSidebar.propTypes = {
  user: PropTypes.shape({
    nombre: PropTypes.string,
    apellidos: PropTypes.string,
    rol_nombre: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
};

export default memo(AdminSidebar);
