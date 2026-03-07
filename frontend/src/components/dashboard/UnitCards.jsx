const iconPalette = [
  { wrapper: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600', glyph: 'payments' },
  { wrapper: 'bg-primary', icon: 'text-white', glyph: 'corporate_fare' },
  { wrapper: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600', glyph: 'groups' },
  { wrapper: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-600', glyph: 'domain' },
];

const UnitCards = ({ units, selectedUnitId, onSelectUnit }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {units.map((unit, index) => {
        const selected = unit.id === selectedUnitId;
        const palette = iconPalette[index % iconPalette.length];

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
                {selected ? 'Seleccionado' : unit.estado || 'Activo'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{unit.nombre}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 min-h-10">{unit.descripcion}</p>

            <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Documentos</span>
                <span className="text-sm font-bold">{unit.totalDocumentos?.toLocaleString('es-MX')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Pendientes</span>
                <span className="text-sm font-bold text-primary">{unit.pendientes}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default UnitCards;
