import { memo } from 'react';
import PropTypes from 'prop-types';
import { formatNumber, getSafeValue } from '@utils/dataFormatters';

const iconPalette = [
  { wrapper: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600', glyph: 'payments' },
  { wrapper: 'bg-primary', icon: 'text-white', glyph: 'corporate_fare' },
  { wrapper: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600', glyph: 'groups' },
  { wrapper: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-600', glyph: 'domain' },
];

const UnitCards = ({ units, selectedUnitId, onSelectUnit }) => {
  // Validar que units sea un array
  const safeUnits = Array.isArray(units) ? units : [];

  if (safeUnits.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2">
          business_center
        </span>
        <p className="text-slate-500 dark:text-slate-400">No hay unidades administrativas disponibles</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {safeUnits.map((unit, index) => {
        const selected = unit.id === selectedUnitId;
        const palette = iconPalette[index % iconPalette.length];
        
        // Obtener valores seguros con fallbacks
        const nombre = getSafeValue(unit.nombre, 'Sin nombre');
        const clave = getSafeValue(unit.clave, 'N/A');
        const tipo = getSafeValue(unit.tipo, 'Unidad Administrativa');
        const totalDocumentos = parseInt(unit.totalDocumentos) || 0;
        const totalUsuarios = parseInt(unit.totalUsuarios) || 0;

        return (
          <button
            key={unit.id}
            type="button"
            onClick={() => onSelectUnit(unit.id)}
            className={`text-left group bg-white dark:bg-slate-900 rounded-xl p-5 transition-all border ${
              selected
                ? 'border-2 border-primary shadow-xl shadow-primary/5'
                : 'border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/50'
            }`}
            aria-label={`Seleccionar unidad ${nombre}`}
            aria-pressed={selected}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${palette.wrapper} ${palette.icon}`}>
                <span className="material-symbols-outlined text-2xl">{palette.glyph}</span>
              </div>
              <span
                className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${
                  selected
                    ? 'bg-primary text-white'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                }`}
              >
                {selected ? 'Seleccionado' : 'Activo'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{nombre}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 min-h-10">
              {tipo} • Clave: {clave}
            </p>

            <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Documentos</span>
                <span className="text-sm font-bold">{formatNumber(totalDocumentos)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Usuarios</span>
                <span className="text-sm font-bold text-primary">{formatNumber(totalUsuarios)}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

UnitCards.propTypes = {
  units: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      nombre: PropTypes.string,
      clave: PropTypes.string,
      tipo: PropTypes.string,
      totalDocumentos: PropTypes.number,
      totalUsuarios: PropTypes.number,
    })
  ),
  selectedUnitId: PropTypes.number,
  onSelectUnit: PropTypes.func.isRequired,
};

UnitCards.defaultProps = {
  units: [],
  selectedUnitId: null,
};

export default memo(UnitCards);
