import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useDetalleUnidad } from '@hooks/useDetalleUnidad';
import AdminSidebar from '@components/dashboard/AdminSidebar';
import AdminTopNavbar from '@components/dashboard/AdminTopNavbar';
import Paginacion from '@components/Paginacion';
import { formatDate } from '@utils/dataFormatters';

// â”€â”€â”€ Mapas de estilos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BADGE_ESTADO = {
  REGISTRADO:         'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  TURNADO:            'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  RECIBIDO:           'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
  EN_PROCESO:         'bg-primary/10 text-primary dark:bg-primary/20',
  RESPONDIDO:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  DESPACHADO:         'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  CERRADO:            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  DEVUELTO:           'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  CANCELADO:          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  PENDIENTE_PRESTAMO: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
};

const DOT_ESTADO = {
  REGISTRADO:         'bg-blue-500',
  TURNADO:            'bg-amber-500',
  RECIBIDO:           'bg-sky-500',
  EN_PROCESO:         'bg-primary',
  RESPONDIDO:         'bg-emerald-500',
  DESPACHADO:         'bg-teal-500',
  CERRADO:            'bg-slate-400',
  DEVUELTO:           'bg-rose-500',
  CANCELADO:          'bg-red-500',
  PENDIENTE_PRESTAMO: 'bg-orange-500',
};

const LABEL_ESTADO = {
  REGISTRADO:         'Registrado',
  TURNADO:            'Turnado',
  RECIBIDO:           'Recibido',
  EN_PROCESO:         'En Proceso',
  RESPONDIDO:         'Respondido',
  DESPACHADO:         'Despachado',
  CERRADO:            'Cerrado',
  DEVUELTO:           'Devuelto',
  CANCELADO:          'Cancelado',
  PENDIENTE_PRESTAMO: 'Pend. PrÃ©stamo',
};

const TIPOS_EMISION = [
  { value: '', label: 'Tipo de emisiÃ³n' },
  { value: 'EC', label: 'EC: Circulares' },
  { value: 'EO', label: 'EO: Oficios' },
  { value: 'EM', label: 'EM: MemorÃ¡ndum' },
  { value: 'ET', label: 'ET: Tarjeta Informativa' },
  { value: 'MC', label: 'MC: MemorÃ¡ndum Circular' },
];

const ESTADOS_FILTRO = [
  { value: '', label: 'Todos los estatus' },
  { value: 'REGISTRADO', label: 'Registrado' },
  { value: 'TURNADO', label: 'Turnado' },
  { value: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'RESPONDIDO', label: 'Respondido' },
  { value: 'CERRADO', label: 'Cerrado' },
  { value: 'DEVUELTO', label: 'Devuelto' },
];

// Genera iniciales a partir de nombre + apellidos
const getIniciales = (nombre = '', apellidos = '') =>
  `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase() || '?';

// â”€â”€â”€ Componente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DetalleUnidad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const {
    area,
    areaLoading,
    areaError,
    documentos,
    total,
    totalPages,
    currentPage,
    docsLoading,
    docsError,
    pageSize,
    activeTab,
    busqueda,
    filtroEstado,
    filtroTipoEmision,
    handleTabChange,
    handlePageChange,
    setBusqueda,
    setFiltroEstado,
    setFiltroTipoEmision,
  } = useDetalleUnidad(id);

  // â”€â”€ Loading inicial del Ã¡rea â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (areaLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-background-dark">
        <AdminSidebar user={user} onLogout={logout} />
        <main className="flex-1 flex items-center justify-center flex-col gap-3">
          <div className="spinner" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Cargando informaciÃ³n de la unidad...
          </p>
        </main>
      </div>
    );
  }

  // â”€â”€ Error al cargar el Ã¡rea â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (areaError) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-background-dark">
        <AdminSidebar user={user} onLogout={logout} />
        <main className="flex-1 flex items-center justify-center flex-col gap-4">
          <span className="material-symbols-outlined text-5xl text-red-400">error</span>
          <p className="text-slate-600 dark:text-slate-300">{areaError}</p>
          <button
            type="button"
            onClick={() => navigate('/unidades')}
            className="text-sm text-primary font-medium hover:underline"
          >
            Volver a Unidades Administrativas
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <AdminSidebar user={user} onLogout={logout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopNavbar
          searchTerm={busqueda}
          onSearchChange={(v) => setBusqueda(v)}
          selectedUnitName={area?.nombre || 'Unidad Administrativa'}
          searchPlaceholder="Buscar por folio o asunto..."
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-7">

            {/* â”€â”€ Cabecera â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <button
                    type="button"
                    onClick={() => navigate('/unidades')}
                    className="hover:text-primary transition-colors"
                  >
                    Unidades Administrativas
                  </button>
                  <span className="material-symbols-outlined text-base leading-none">
                    chevron_right
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">Detalle</span>
                  {area?.clave && (
                    <>
                      <span className="material-symbols-outlined text-base leading-none">
                        chevron_right
                      </span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        {area.clave}
                      </span>
                    </>
                  )}
                </nav>

                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                  {area?.nombre || `Unidad #${id}`}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl text-sm">
                  {area?.descripcion ||
                    'GestiÃ³n y seguimiento de trÃ¡mites, emisiones y recepciones de esta unidad.'}
                </p>
                {area?.tipo && (
                  <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-xs">account_tree</span>
                    {area.tipo.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-3 shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  Editar Unidad
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Reporte
                </button>
              </div>
            </div>

            {/* â”€â”€ Tabs + Filtros â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 pb-5 border-b border-slate-200 dark:border-slate-800">
              {/* Tabs */}
              <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  aria-pressed={activeTab === 'emisiones'}
                  onClick={() => handleTabChange('emisiones')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'emisiones'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">send</span>
                    Emisiones
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={activeTab === 'recepciones'}
                  onClick={() => handleTabChange('recepciones')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'recepciones'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">move_to_inbox</span>
                    Recepciones
                  </span>
                </button>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3">
                {/* BÃºsqueda */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar folio..."
                    maxLength={60}
                    className="pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none w-44 placeholder:text-slate-400"
                  />
                </div>

                {/* Filtro estado */}
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary/30 outline-none text-slate-700 dark:text-slate-200"
                >
                  {ESTADOS_FILTRO.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Filtro tipo de emisiÃ³n â€” solo en tab Emisiones */}
                {activeTab === 'emisiones' && (
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                      tune
                    </span>
                    <select
                      value={filtroTipoEmision}
                      onChange={(e) => setFiltroTipoEmision(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary/30 outline-none text-slate-700 dark:text-slate-200"
                    >
                      {TIPOS_EMISION.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* â”€â”€ Tabla de documentos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">

              {/* Loading de documentos */}
              {docsLoading && (
                <div className="flex items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
                  <div className="spinner-sm" />
                  <span className="text-sm">Cargando documentos...</span>
                </div>
              )}

              {/* Error de documentos */}
              {!docsLoading && docsError && (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <span className="material-symbols-outlined text-4xl text-red-400">
                    error_outline
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{docsError}</p>
                </div>
              )}

              {/* Tabla */}
              {!docsLoading && !docsError && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <th className="py-4 px-6">Folio</th>
                        <th className="py-4 px-6">Tema / Asunto</th>
                        <th className="py-4 px-6">Estatus</th>
                        <th className="py-4 px-6">Fecha</th>
                        <th className="py-4 px-6">
                          {activeTab === 'emisiones' ? 'Destino' : 'Origen'}
                        </th>
                        <th className="py-4 px-6">Responsable</th>
                        <th className="py-4 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
                      {documentos.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 block mb-2">
                              inbox
                            </span>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                              No se encontraron documentos con los filtros aplicados.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        documentos.map((doc) => {
                          const estadoKey = doc.estado;
                          const iniciales = getIniciales(
                            doc.responsable?.nombre,
                            doc.responsable?.apellidos
                          );
                          return (
                            <tr
                              key={doc.id}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                            >
                              {/* Folio */}
                              <td className="py-4 px-6 font-mono text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                {doc.folio}
                              </td>

                              {/* Tema / Asunto */}
                              <td className="py-4 px-6">
                                <p className="text-slate-800 dark:text-slate-100 font-medium truncate max-w-xs">
                                  {doc.asunto}
                                </p>
                                {doc.tipoDocumento?.nombre && (
                                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
                                    {doc.tipoDocumento.nombre}
                                  </p>
                                )}
                              </td>

                              {/* Estatus */}
                              <td className="py-4 px-6">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                    BADGE_ESTADO[estadoKey] ?? 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      DOT_ESTADO[estadoKey] ?? 'bg-slate-400'
                                    }`}
                                  />
                                  {LABEL_ESTADO[estadoKey] ?? estadoKey}
                                </span>
                              </td>

                              {/* Fecha */}
                              <td className="py-4 px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                                {doc.fechaCreacion
                                  ? formatDate(doc.fechaCreacion)
                                  : 'â€”'}
                              </td>

                              {/* Destino / Origen */}
                              <td className="py-4 px-6 text-slate-700 dark:text-slate-200 text-sm">
                                {doc.contraparte?.nombre || 'â€”'}
                              </td>

                              {/* Responsable */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {iniciales}
                                  </div>
                                  <span className="text-slate-700 dark:text-slate-200 text-sm">
                                    {doc.responsable?.nombre
                                      ? `${doc.responsable.nombre} ${doc.responsable.apellidos ?? ''}`
                                      : 'â€”'}
                                  </span>
                                </div>
                              </td>

                              {/* Acciones */}
                              <td className="py-4 px-6 text-right">
                                <button
                                  type="button"
                                  title="Ver documento"
                                  className="text-slate-400 hover:text-primary p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    visibility
                                  </span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* â”€â”€ PaginaciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              {!docsLoading && !docsError && documentos.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <Paginacion
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    total={total}
                    pageSize={pageSize}
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DetalleUnidad;
