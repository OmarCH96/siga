const badgeByEstado = {
  'En Proceso': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  Completado: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  Cancelado: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  Enviado: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
};

const RecentDocumentsTable = ({ registros }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <h4 className="text-sm font-bold">Documentos Recientes</h4>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50" type="button">
            <span className="material-symbols-outlined text-sm">filter_list</span>
          </button>
          <button className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-2" type="button">
            <span className="material-symbols-outlined text-sm">add</span>
            Nuevo Tramite
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Folio</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Asunto</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Origen / Destino</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {registros.map((registro) => (
              <tr key={registro.folio} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-primary">{registro.folio}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{registro.asunto}</span>
                    <span className="text-[10px] text-slate-400">Prioridad: {registro.prioridad}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{registro.origenDestino}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{registro.fecha}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${badgeByEstado[registro.estado] || 'bg-slate-100 text-slate-700'}`}>
                    {registro.estado}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="p-1 hover:text-primary transition-colors" type="button">
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </button>
                  <button className="p-1 hover:text-primary transition-colors" type="button">
                    <span className="material-symbols-outlined text-lg">more_vert</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-500">Mostrando {registros.length} documentos</span>
        <div className="flex gap-2">
          <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold disabled:opacity-50" type="button" disabled>
            Anterior
          </button>
          <button className="px-3 py-1 bg-primary text-white rounded text-xs font-bold" type="button">
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentDocumentsTable;
