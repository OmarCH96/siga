// TablaDocumentos
import PropTypes from 'prop-types';

const TablaDocumentos = ({ 
  documentos = [], 
  loading = false, 
  error = null,
  filters = {},
  onFiltersChange = () => {},
}) => {
  /**
   * Formatear fecha a formato legible
   */
  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  /**
   * Obtener color según prioridad
   */
  const getPrioridadClasses = (prioridad) => {
    const classes = {
      'ALTA': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'URGENTE': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'MEDIA': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      'BAJA': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return classes[prioridad] || classes['MEDIA'];
  };

  /**
   * Obtener iniciales del nombre
   */
  const getIniciales = (nombre, apellidos) => {
    const inicial1 = nombre?.charAt(0)?.toUpperCase() || '';
    const inicial2 = apellidos?.charAt(0)?.toUpperCase() || '';
    return `${inicial1}${inicial2}`;
  };

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
              placeholder="Ej. EM-SMADSOT.DPG-0013/2026"
              type="text"
              value={filters.busqueda || ''}
              onChange={(e) => onFiltersChange({ busqueda: e.target.value })}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tipo de Documento
          </label>
          <select 
            className="w-full py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary"
            value={filters.tipoDocumento || ''}
            onChange={(e) => onFiltersChange({ tipoDocumento: e.target.value })}
          >
            <option value="">Todos los tipos</option>
            {/* Opciones dinámicas se agregarán del hook */}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Fecha Desde
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              calendar_today
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary"
              type="date"
              value={filters.fechaDesde || ''}
              onChange={(e) => onFiltersChange({ fechaDesde: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-end">
          <button 
            className="w-full bg-slate-900 dark:bg-primary text-white py-2 px-4 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            onClick={() => onFiltersChange({ busqueda: '', tipoDocumento: '', fechaDesde: '' })}
          >
            <span className="material-symbols-outlined text-sm">filter_alt_off</span>
            Limpiar
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Estado de carga */}
              {loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-slate-500">Cargando documentos...</span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Estado de error */}
              {error && !loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-red-500">error</span>
                      <span className="text-sm text-slate-500">{error}</span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Sin datos */}
              {!loading && !error && documentos.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
                      <span className="text-sm text-slate-500">No hay documentos pendientes</span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Filas de datos */}
              {!loading && !error && documentos.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-primary">{doc.folio}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {doc.tipo_documento_nombre}
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[300px]" title={doc.asunto}>
                        {doc.asunto}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center text-[10px] font-bold">
                        {getIniciales(doc.usuario_turna_nombre, doc.usuario_turna_apellidos)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {doc.usuario_turna_nombre} {doc.usuario_turna_apellidos}
                        </span>
                        <span className="text-[10px] text-slate-400">{doc.area_origen_nombre}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {formatearFecha(doc.nodo_fecha_generacion)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getPrioridadClasses(doc.prioridad)}`}>
                      {doc.prioridad}
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
                      title="Atender documento"
                    >
                      <span className="material-symbols-outlined">task_alt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Mostrando {documentos.length} de {documentos.length} documentos
          </p>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-xs font-medium text-slate-600">Prioridad Alta/Urgente</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-400"></span>
          <span className="text-xs font-medium text-slate-600">Prioridad Media</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span className="text-xs font-medium text-slate-600">Prioridad Baja</span>
        </div>
      </div>
    </div>
  );
};

TablaDocumentos.propTypes = {
  documentos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      folio: PropTypes.string.isRequired,
      asunto: PropTypes.string.isRequired,
      prioridad: PropTypes.string.isRequired,
      tipo_documento_nombre: PropTypes.string.isRequired,
      area_origen_nombre: PropTypes.string.isRequired,
      nodo_fecha_generacion: PropTypes.string.isRequired,
      usuario_turna_nombre: PropTypes.string.isRequired,
      usuario_turna_apellidos: PropTypes.string.isRequired,
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.string,
  filters: PropTypes.object,
  onFiltersChange: PropTypes.func,
};

export default TablaDocumentos;
