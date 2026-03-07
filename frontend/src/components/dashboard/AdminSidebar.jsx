const navMain = [
  { id: 'inicio', label: 'Inicio', icon: 'home', active: true },
  { id: 'unidades', label: 'Unidades', icon: 'business' },
  { id: 'reportes', label: 'Reportes', icon: 'bar_chart' },
];

const navGestion = [
  { id: 'documentos', label: 'Documentos', icon: 'description' },
  { id: 'configuracion', label: 'Configuracion', icon: 'settings' },
];

function SidebarLink({ item }) {
  const baseClass =
    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm';

  const stateClass = item.active
    ? 'bg-primary/10 text-primary font-medium'
    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800';

  return (
    <button type="button" className={`${baseClass} ${stateClass} w-full text-left`}>
      <span className="material-symbols-outlined">{item.icon}</span>
      <span>{item.label}</span>
    </button>
  );
}

const AdminSidebar = ({ user, onLogout }) => {
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
          <SidebarLink key={item.id} item={item} />
        ))}

        <div className="pt-4 pb-2">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gestion</p>
        </div>

        {navGestion.map((item) => (
          <SidebarLink key={item.id} item={item} />
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold">
            {user?.nombre?.[0] || 'A'}
            {user?.apellidos?.[0] || 'D'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">
              {user?.nombre || 'Administrador'} {user?.apellidos || ''}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{user?.rol_nombre || 'Administrador'}</p>
          </div>
          <button type="button" onClick={onLogout} className="text-slate-400 hover:text-primary">
            <span className="material-symbols-outlined text-sm">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
