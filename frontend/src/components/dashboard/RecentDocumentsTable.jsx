import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatDate, formatPriority, getSafeValue, truncateText } from '@utils/dataFormatters';
import Paginacion from '@components/Paginacion';

const PAGE_SIZE = 10;

const badgeByEstado = {
  'En Proceso': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  Completado: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  Cancelado: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  Enviado: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
};

const RecentDocumentsTable = ({ registros = [] }) => {
  // Validar que registros sea un array
  const safeRegistros = Array.isArray(registros) ? registros : [];

  const [currentPage, setCurrentPage] = useState(1);

  // Reiniciar a página 1 cuando cambia la fuente de datos
  useEffect(() => {
    setCurrentPage(1);
  }, [registros]);

  const totalPages = Math.max(1, Math.ceil(safeRegistros.length / PAGE_SIZE));
  const paginatedRegistros = safeRegistros.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <h4 className="text-sm font-bold">Documentos Recientes</h4>
        <div className="flex items-center gap-2">
          <button 
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" 
            type="button"
            aria-label="Filtrar documentos"
          >
            <span className="material-symbols-outlined text-sm">filter_list</span>
          </button>
          <button 
            className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors" 
            type="button"
            aria-label="Nuevo tramite"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Nuevo Tramite
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider" scope="col">Folio</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider" scope="col">Asunto</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider" scope="col">Origen / Destino</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider" scope="col">Fecha</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider" scope="col">Estado</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider" scope="col">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedRegistros.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2 block">
                    description
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    No hay documentos para mostrar
                  </p>
                </td>
              </tr>
            ) : (
              paginatedRegistros.map((registro) => {
                const folio = getSafeValue(registro.folio, 'N/A');
                const asunto = getSafeValue(registro.asunto, 'Sin asunto');
                const origenDestino = getSafeValue(registro.origenDestino, 'N/A');
                const estado = getSafeValue(registro.estado, 'Desconocido');
                const prioridad = formatPriority(registro.prioridad);
                const fecha = formatDate(registro.fechaCreacion || registro.fecha);

                return (
                  <tr key={registro.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-primary">{folio}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium" title={asunto}>
                          {truncateText(asunto, 50)}
                        </span>
                        <span className={`text-[10px] ${prioridad.class}`}>
                          Prioridad: {prioridad.text}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {truncateText(origenDestino, 30)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{fecha}</td>
                    <td className="px-6 py-4">
                      <span 
                        className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
                          badgeByEstado[estado] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button 
                          className="p-1 hover:text-primary transition-colors" 
                          type="button"
                          aria-label={`Ver detalles de ${folio}`}
                          title="Ver detalles"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button 
                          className="p-1 hover:text-primary transition-colors" 
                          type="button"
                          aria-label={`Más opciones para ${folio}`}
                          title="Más opciones"
                        >
                          <span className="material-symbols-outlined text-lg">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <Paginacion
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          total={safeRegistros.length}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
};

RecentDocumentsTable.propTypes = {
  registros: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      folio: PropTypes.string,
      asunto: PropTypes.string,
      origenDestino: PropTypes.string,
      estado: PropTypes.string,
      prioridad: PropTypes.string,
      fechaCreacion: PropTypes.string,
      fecha: PropTypes.string,
    })
  ),
};

export default memo(RecentDocumentsTable);
