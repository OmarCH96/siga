import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { formatNumber, getSafeValue } from '@utils/dataFormatters';
import Paginacion from '@components/Paginacion';

const PAGE_SIZE = 10;

const iconPalette = [
  { wrapper: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600', glyph: 'payments' },
  { wrapper: 'bg-primary', icon: 'text-white', glyph: 'corporate_fare' },
  { wrapper: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600', glyph: 'groups' },
  { wrapper: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-600', glyph: 'domain' },
];

const UnitCards = ({ units = [], selectedUnitId = null, onSelectUnit }) => {
  // Validar que units sea un array
  const safeUnits = Array.isArray(units) ? units : [];
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);

  // Reiniciar a página 1 cuando cambia la fuente de datos
  useEffect(() => {
    setCurrentPage(1);
  }, [units]);

  const totalPages = Math.max(1, Math.ceil(safeUnits.length / PAGE_SIZE));
  const paginatedUnits = safeUnits.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-4">
        {paginatedUnits.map((unit, index) => {
        const selected = unit.id === selectedUnitId;
        const palette = iconPalette[index % iconPalette.length];
        
        // Obtener valores seguros con fallbacks
        const nombre = getSafeValue(unit.nombre, 'Sin nombre');
        const clave = getSafeValue(unit.clave, 'N/A');
        const tipo = getSafeValue(unit.tipo, 'Unidad Administrativa');
        const totalDocumentos = parseInt(unit.totalDocumentos) || 0;
        const totalUsuarios = parseInt(unit.totalUsuarios) || 0;

        return (
          <div
            key={unit.id}
            onClick={() => onSelectUnit(unit.id)}
            className={`text-left group bg-white dark:bg-slate-900 rounded-xl p-5 transition-all border cursor-pointer ${
              selected
                ? 'border-2 border-primary shadow-xl shadow-primary/5'
                : 'border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/50'
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectUnit(unit.id); }}
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

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Documentos</span>
                  <span className="text-sm font-bold">{formatNumber(totalDocumentos)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Usuarios</span>
                  <span className="text-sm font-bold text-primary">{formatNumber(totalUsuarios)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); navigate(`/unidades/${unit.id}`); }}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span>Ver Detalle</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
          </div>
        );
      })}
      </div>

      {safeUnits.length > PAGE_SIZE && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-4">
          <Paginacion
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            total={safeUnits.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}
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

export default memo(UnitCards);
