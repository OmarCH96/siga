/**
 * EJEMPLO DE INTEGRACIÓN CON API
 * Este archivo muestra cómo integrar el componente UnidadesAdministrativas
 * con el hook useAreas para conectarse a la API real del backend
 */

import { useState } from 'react';
import { useAreas } from '../../hooks/useAreas';
import Sidebar from '../../components/dashboard/AdminSidebar';
import UnitCard from '../../components/unidades/UnitCard';
import UnitModal from '../../components/unidades/UnitModal';
import ConfirmDisableModal from '../../components/unidades/ConfirmDisableModal';

const UnidadesAdministrativasConAPI = () => {
  // Hook personalizado que maneja todo el estado y API
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
    reload,
  } = useAreas();

  // Estado local para UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [pendingToggle, setPendingToggle] = useState(null);

  // Mapear estructura de API a estructura de componente
  const mapAreaToUnit = (area) => ({
    id: area.id,
    name: area.nombre,
    code: area.clave,
    parent: area.area_padre_id,
    active: area.activa,
    users: area.usuarios_count || 0,
  });

  // Handler: Abrir modal para crear nueva área
  const handleCreate = () => {
    setEditingArea(null);
    setIsModalOpen(true);
  };

  // Handler: Abrir modal para editar área
  const handleEdit = (unit) => {
    // Buscar área completa en el estado
    const area = areas.find(a => a.id === unit.id);
    if (area) {
      setEditingArea({
        id: area.id,
        name: area.nombre,
        code: area.clave,
        parent: area.area_padre_id,
      });
      setIsModalOpen(true);
    }
  };

  // Handler: Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingArea(null);
  };

  // Handler: Submit del formulario
  const handleSubmit = async (formData) => {
    try {
      const apiData = {
        nombre: formData.nombre,
        clave: formData.codigo,
        area_padre_id: formData.dependencia ? parseInt(formData.dependencia) : null,
        tipo: formData.tipo_area || null,
        descripcion: '',
      };

      if (editingArea) {
        // Actualizar área existente
        await updateArea(editingArea.id, apiData);
        console.log('Área actualizada exitosamente');
      } else {
        // Crear nueva área
        await createArea(apiData);
        console.log('Área creada exitosamente');
      }

      handleCloseModal();
    } catch (err) {
      console.error('Error al guardar área:', err);
      // Aquí podrías agregar un toast de error
      alert(`Error: ${err.message}`);
    }
  };

  // Handler: Iniciar toggle de estado
  const handleToggleStatus = (unitId, newStatus) => {
    const area = areas.find((a) => a.id === unitId);
    if (area) {
      setPendingToggle({ unitId, newStatus });
      setIsConfirmModalOpen(true);
    }
  };

  // Handler: Confirmar cambio de estado
  const handleConfirmToggle = async () => {
    if (pendingToggle) {
      const { unitId, newStatus } = pendingToggle;
      
      try {
        await toggleAreaStatus(unitId, newStatus);
        console.log(`Área ${unitId} ${newStatus ? 'activada' : 'desactivada'} exitosamente`);
        
        setPendingToggle(null);
        setIsConfirmModalOpen(false);
      } catch (err) {
        console.error('Error al cambiar estado:', err);
        alert(`Error: ${err.message}`);
        setPendingToggle(null);
        setIsConfirmModalOpen(false);
      }
    }
  };

  // Handler: Cancelar cambio de estado
  const handleCancelToggle = () => {
    setPendingToggle(null);
    setIsConfirmModalOpen(false);
  };

  // Handler: Búsqueda
  const handleSearch = (e) => {
    updateFilters({ search: e.target.value, page: 1 });
  };

  // Handler: Filtros de estado
  const handleFilterChange = (filterType) => {
    let activaValue;
    
    if (filterType === 'all') {
      activaValue = undefined;
    } else if (filterType === 'active') {
      activaValue = true;
    } else {
      activaValue = false;
    }
    
    updateFilters({ activa: activaValue, page: 1 });
  };

  const getActiveFilter = () => {
    if (filters.activa === undefined) return 'all';
    if (filters.activa === true) return 'active';
    return 'inactive';
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Gestión de Unidades Administrativas</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Administre las dependencias y su personal autorizado.
              </p>
              {/* Mostrar estadísticas */}
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-slate-500">
                  Total: <span className="font-bold">{stats.total}</span>
                </span>
                <span className="text-xs text-emerald-600">
                  Activas: <span className="font-bold">{stats.activas}</span>
                </span>
                <span className="text-xs text-slate-400">
                  Inactivas: <span className="font-bold">{stats.inactivas}</span>
                </span>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading}
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
                value={filters.search}
                onChange={handleSearch}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm placeholder:text-slate-500 disabled:opacity-50"
                placeholder="Buscar unidad por nombre o código ID..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => handleFilterChange('all')}
                disabled={loading}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 ${
                  getActiveFilter() === 'all'
                    ? 'bg-white dark:bg-slate-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => handleFilterChange('active')}
                disabled={loading}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 ${
                  getActiveFilter() === 'active'
                    ? 'bg-white dark:bg-slate-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Activas
              </button>
              <button
                onClick={() => handleFilterChange('inactive')}
                disabled={loading}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 ${
                  getActiveFilter() === 'inactive'
                    ? 'bg-white dark:bg-slate-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Inactivas
              </button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">error</span>
              <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              <button
                onClick={reload}
                className="ml-auto text-xs text-red-600 hover:text-red-800 font-bold"
              >
                Reintentar
              </button>
            </div>
          )}
        </header>

        {/* Grid View */}
        <section className="p-8">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-500">Cargando áreas...</span>
              </div>
            </div>
          )}

          {!loading && areas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
                account_tree
              </span>
              <p className="text-slate-500 text-lg font-bold">No se encontraron áreas</p>
              <p className="text-slate-400 text-sm mt-1">
                {filters.search ? 'Intenta con otro término de búsqueda' : 'Crea la primera unidad administrativa'}
              </p>
            </div>
          )}

          {!loading && areas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {areas.map((area) => (
                <UnitCard
                  key={area.id}
                  unit={mapAreaToUnit(area)}
                  onEdit={handleEdit}
                  onToggleStatus={handleToggleStatus}
                />
              ))}

              {/* Add New Unit Placeholder Card */}
              <button
                onClick={handleCreate}
                disabled={loading}
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
        <footer className="mt-auto px-8 py-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            Mostrando {areas.length} de {total} unidades administrativas
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changePage(filters.page - 1)}
              disabled={filters.page === 1 || loading}
              className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => changePage(page)}
                disabled={loading}
                className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-all disabled:opacity-50 ${
                  filters.page === page
                    ? 'bg-primary text-white'
                    : 'border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => changePage(filters.page + 1)}
              disabled={filters.page >= totalPages || loading}
              className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </footer>
      </main>

      {/* Modals */}
      <UnitModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingUnit={editingArea}
        availableUnits={areas
          .filter((a) => a.id !== editingArea?.id)
          .map((a) => ({ id: a.id, name: a.nombre }))
        }
      />

      <ConfirmDisableModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelToggle}
        onConfirm={handleConfirmToggle}
        unitName={areas.find((a) => a.id === pendingToggle?.unitId)?.nombre || ''}
        isActivating={pendingToggle?.newStatus || false}
      />
    </div>
  );
};

export default UnidadesAdministrativasConAPI;
