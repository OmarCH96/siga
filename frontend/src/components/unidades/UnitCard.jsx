import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const UnitCard = ({ unit, onEdit, onToggleStatus }) => {
  const navigate = useNavigate();
  const getIconByName = (name) => {
    const iconMap = {
      'Dirección General': 'account_balance',
      'Recursos Humanos': 'groups',
      'Departamento Legal': 'gavel',
      'Finanzas': 'payments',
      'Operaciones': 'precision_manufacturing',
      'Comunicaciones': 'campaign',
    };
    return iconMap[name] || 'account_tree';
  };

  return (
    <div
      data-unit-id={unit.id}
      className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">
              {getIconByName(unit.name)}
            </span>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
              unit.active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {unit.active ? 'Activa' : 'Inactiva'}
          </span>
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{unit.name}</h3>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
          Código: {unit.code}
        </p>
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span className="material-symbols-outlined text-sm">group</span>
          <span className="text-xs">{unit.users} Usuarios asignados</span>
        </div>
      </div>
      <div className="px-5 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(unit)}
            className="btn-edit-unit p-2 text-slate-400 hover:text-primary transition-colors"
            title="Editar"
          >
            <span className="material-symbols-outlined text-xl">edit</span>
          </button>
          <label className="relative inline-flex items-center cursor-pointer ml-1" title="Activar/Desactivar">
            <input
              type="checkbox"
              checked={unit.active}
              onChange={(e) => onToggleStatus(unit.id, e.target.checked)}
              className="toggle-unit-status sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/unidades/${unit.id}`)}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          <span>Ver Detalle</span>
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

UnitCard.propTypes = {
  unit: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    parent: PropTypes.number,
    active: PropTypes.bool.isRequired,
    users: PropTypes.number.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
};

export default UnitCard;
