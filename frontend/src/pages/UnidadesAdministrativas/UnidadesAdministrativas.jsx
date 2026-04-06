import { useState, useMemo } from 'react';
import Sidebar from '../../components/dashboard/AdminSidebar';
import UnitCard from '../../components/unidades/UnitCard';
import UnitModal from '../../components/unidades/UnitModal';
import ConfirmDisableModal from '../../components/unidades/ConfirmDisableModal';
import { useAreas } from '../../hooks/useAreas';

const UnidadesAdministrativas = () => {
  // Hook de áreas - Reemplaza mock data con API real
  const {
    areas,
    loading,
    error,
    filters,
    total,
    totalPages,
    stats,
    createArea,
    updateArea,
    toggleAreaStatus,
    updateFilters,
    changePage,
    setError,
  } = useAreas();

  // Estado local del componente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [pendingToggle, setPendingToggle] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  /**
   * Mapear áreas del backend a formato esperado por UnitCard
   * Backend: { id, nombre, clave, area_padre_id, activa, usuario_count }
   * Frontend: { id, name, code, parent, active, users }
   */
  const units = useMemo(() => {
    return areas.map((area) => ({
      id: area.id,
      name: area.nombre,
      code: area.clave,
      parent: area.area_padre_id || null,
      active: area.activa,
      users: area.usuario_count || 0,
      tipo: area.tipo, // Preservar tipo para el modal
    }));
  }, [areas]);

  // Handler: Abrir modal para crear nueva unidad
  const handleCreate = () => {
    setEditingUnit(null);
    setIsModalOpen(true);
  };

  // Handler: Abrir modal para editar unidad
  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setIsModalOpen(true);
  };

  // Handler: Cerrar modal de unidad
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUnit(null);
  };

  // Handler: Submit del formulario (crear o editar)
  const handleSubmit = async (formData) => {
    setLocalLoading(true);
    setError(null);

    try {
      if (editingUnit) {
        // Modo edición - Llamar API real
        await updateArea(editingUnit.id, {
          nombre: formData.nombre,
          clave: formData.codigo,
          areaPadreId: formData.dependencia ? parseInt(formData.dependencia) : null,
          tipo: formData.tipo_area || undefined,
        });
      } else {
        // Modo creación - Llamar API real
        await createArea({
          nombre: formData.nombre,
          clave: formData.codigo,
          areaPadreId: formData.dependencia ? parseInt(formData.dependencia) : null,
          tipo: formData.tipo_area || 'DEPARTAMENTO',
        });
      }
      
      // Cerrar modal después del éxito
      handleCloseModal();
    } catch (err) {
      console.error('Error al guardar área:', err);
      // El error ya está establecido por el hook
    } finally {
      setLocalLoading(false);
    }
  };

  // Handler: Iniciar toggle de estado (abre modal de confirmación)
  const handleToggleStatus = (unitId, newStatus) => {
    const unit = units.find((u) => u.id === unitId);
    if (unit) {
      setPendingToggle({ unitId, newStatus });
      setIsConfirmModalOpen(true);
    }
  };

  // Handler: Confirmar el cambio de estado
  const handleConfirmToggle = async () => {
    if (pendingToggle) {
      const { unitId, newStatus } = pendingToggle;
      setLocalLoading(true);
      setError(null);

      try {
        // Llamar API real para cambiar estado
        await toggleAreaStatus(unitId, newStatus);
        
        setPendingToggle(null);
        setIsConfirmModalOpen(false);
      } catch (err) {
        console.error('Error al cambiar estado:', err);
        // El error ya está establecido por el hook
      } finally {
        setLocalLoading(false);
      }
    }
  };

  // Handler: Cancelar el cambio de estado
  const handleCancelToggle = () => {
    setPendingToggle(null);
    setIsConfirmModalOpen(false);
  };

  // Handler: Búsqueda - Actualizar filtros del hook
  const handleSearch = (e) => {
    const searchValue = e.target.value;
    updateFilters({ busqueda: searchValue, page: 1 });
  };

  // Handler: Filtros de estado - Actualizar filtros del hook
  const handleFilterChange = (filter) => {
    let activaValue = undefined;
    
    if (filter === 'active') {
      activaValue = true;
    } else if (filter === 'inactive') {
      activaValue = false;
    }
    
    updateFilters({ activa: activaValue, page: 1 });
  };

  // Handler: Cambiar página
  const handlePageChange = (newPage) => {
    changePage(newPage);
  };

  // Determinar filtro activo basado en filters.activa
  const activeFilter = filters.activa === true ? 'active' : filters.activa === false ? 'inactive' : 'all';

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Gestión de Unidades Administrativas</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Administre las dependencias y su personal autorizado.
              </p>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading || localLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Nueva Unidad</span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                value={filters.busqueda || ''}
                onChange={handleSearch}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Buscar unidad por nombre o código ID..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => handleFilterChange('all')}
                disabled={loading}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => handleFilterChange('active')}
                disabled={loading}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeFilter === 'active'
                    ? 'bg-white dark:bg-slate-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Activas
              </button>
              <button
                onClick={() => handleFilterChange('inactive')}
                disabled={loading}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeFilter === 'inactive'
                    ? 'bg-white dark:bg-slate-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Inactivas
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          {stats.total_areas > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total_areas}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Activas</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{stats.areas_activas}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Inactivas</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.areas_inactivas}</p>
              </div>
              <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4">
                <p className="text-xs font-medium text-primary dark:text-primary">Niveles</p>
                <p className="text-2xl font-bold text-primary dark:text-primary mt-1">{stats.nivel_maximo}</p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-900 dark:text-red-200">Error</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              >
                <span className="material-symbols-outlined text-sm text-red-600 dark:text-red-400">close</span>
              </button>
            </div>
          )}
        </header>

        {/* Grid View */}
        <section className="p-8">
          {/* Loading State */}
          {loading && units.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm">Cargando unidades...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && units.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-400">folder_off</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-bold">No se encontraron unidades</p>
              <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                {filters.busqueda || filters.activa !== undefined
                  ? 'Intente ajustar los filtros de búsqueda'
                  : 'Comience creando una nueva unidad administrativa'}
              </p>
            </div>
          )}

          {/* Grid de unidades */}
          {units.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {units.map((unit) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  onEdit={handleEdit}
                  onToggleStatus={handleToggleStatus}
                />
              ))}

              {/* Add New Unit Placeholder Card */}
              <button
                onClick={handleCreate}
                disabled={loading || localLoading}
                className="bg-slate-100/50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-8 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <p className="mt-4 font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary">
                  Nueva Unidad
                </p>
                <p className="text-xs text-slate-400 mt-1">Haga clic para expandir el sistema</p>
              </button>
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <footer className="mt-auto px-8 py-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Mostrando {units.length} de {total} unidades administrativas
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1 || loading}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              {/* Botones de páginas */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (filters.page <= 3) {
                  pageNum = i + 1;
                } else if (filters.page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = filters.page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      filters.page === pageNum
                        ? 'bg-primary text-white'
                        : 'border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === totalPages || loading}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </footer>
        )}
      </main>

      {/* Modals */}
      <UnitModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingUnit={editingUnit}
        availableUnits={units.filter((u) => u.id !== editingUnit?.id)}
      />

      <ConfirmDisableModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelToggle}
        onConfirm={handleConfirmToggle}
        unitName={units.find((u) => u.id === pendingToggle?.unitId)?.name || ''}
        isActivating={pendingToggle?.newStatus || false}
      />
    </div>
  );
};

export default UnidadesAdministrativas;
