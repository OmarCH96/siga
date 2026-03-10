// TablaDocumentos
const TablaDocumentos = () => {
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Buscar por folio o asunto
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary"
              placeholder="Ej. SMA-2023-001"
              type="text"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tipo de Documento
          </label>
          <select className="w-full py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary">
            <option>Todos los tipos</option>
            <option>Oficio</option>
            <option>Circular</option>
            <option>Memorándum</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Rango de Fechas
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              calendar_today
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary"
              placeholder="Seleccionar rango..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-end">
          <button className="w-full bg-slate-900 dark:bg-primary text-white py-2 px-4 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Tabla de datos */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Folio</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo / Asunto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Remitente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Recibido</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Fila 1 */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-primary">SMA-2023-0452</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Oficio</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      Solicitud de impacto ambiental Predio Los Olivos
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center text-[10px] font-bold">
                      JD
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Juan Delgado</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">24 Oct 2023</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    ALTA
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Pendiente
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                    title="Ver detalles"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                  <button
                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                    title="Responder"
                  >
                    <span className="material-symbols-outlined">reply</span>
                  </button>
                </td>
              </tr>
              {/* Fila 2 */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-primary">SMA-2023-0450</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Circular</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      Actualización de lineamientos operativos Q4
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                      DA
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Dir. Administrativa</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">23 Oct 2023</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    MEDIA
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    En Revisión
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                    title="Ver detalles"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                  <button
                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                    title="Responder"
                  >
                    <span className="material-symbols-outlined">reply</span>
                  </button>
                </td>
              </tr>
              {/* Fila 3 */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-primary">SMA-2023-0448</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Memorándum</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      Asignación de recursos brigada contra incendios
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                      MG
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Mario Guerrero</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">21 Oct 2023</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    ALTA
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Atendido
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                    title="Ver detalles"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                  <button
                    className="p-1.5 bg-slate-100 text-slate-300 rounded-lg cursor-not-allowed"
                    disabled
                  >
                    <span className="material-symbols-outlined">reply</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">Mostrando 1-3 de 12 documentos</p>
          <div className="flex items-center gap-2">
            <button
              className="p-1 rounded border border-slate-300 text-slate-400 hover:bg-white disabled:opacity-50"
              disabled
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded bg-primary text-white text-xs font-bold">1</button>
            <button className="w-8 h-8 rounded hover:bg-white text-xs font-medium">2</button>
            <button className="w-8 h-8 rounded hover:bg-white text-xs font-medium">3</button>
            <button className="p-1 rounded border border-slate-300 text-slate-600 hover:bg-white">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-xs font-medium text-slate-600">Prioridad Alta (Respuesta &lt; 24h)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-xs font-medium text-slate-600">Pendiente de Procesar</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span className="text-xs font-medium text-slate-600">En Trámite</span>
        </div>
      </div>
    </div>
  );
};

export default TablaDocumentos;
