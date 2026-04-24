import { memo } from 'react';
import PropTypes from 'prop-types';
import { getSafeValue } from '@utils/dataFormatters';

const AdminTopNavbar = ({ searchTerm = '', onSearchChange, selectedUnitName = 'Sede Central', searchPlaceholder = 'Buscar unidades o documentos...' }) => {
  const safeTerm = getSafeValue(searchTerm, '');
  const safeName = getSafeValue(selectedUnitName, 'Sede Central');
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 gap-3">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
            placeholder={searchPlaceholder}
            type="text"
            value={safeTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            maxLength={100}
            aria-label="Buscar"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hidden lg:flex"
        >
          <span className="material-symbols-outlined text-sm">account_tree</span>
          Contexto: {safeName}
          <span className="material-symbols-outlined text-sm">expand_more</span>
        </button>

        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          aria-label="Notificaciones"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>
    </header>
  );
};

AdminTopNavbar.propTypes = {
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  selectedUnitName: PropTypes.string,
  searchPlaceholder: PropTypes.string,
};

export default memo(AdminTopNavbar);
