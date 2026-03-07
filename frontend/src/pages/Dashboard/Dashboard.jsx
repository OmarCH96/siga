/**
 * Dashboard administrativo
 * Reemplaza el dashboard legacy con una version modular basada en componentes.
 */

import { useAuth } from '@hooks/useAuth';
import { useAdminDashboard } from '@hooks/useAdminDashboard';
import AdminSidebar from '@components/dashboard/AdminSidebar';
import AdminTopNavbar from '@components/dashboard/AdminTopNavbar';
import UnitCards from '@components/dashboard/UnitCards';
import DashboardMetrics from '@components/dashboard/DashboardMetrics';
import RecentDocumentsTable from '@components/dashboard/RecentDocumentsTable';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const {
    datos,
    registros,
    totals,
    tabs,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    selectedUnit,
    selectedUnitId,
    setSelectedUnitId,
    isLoading,
    isSubmitting,
    error,
    handleCreateRegistro,
  } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-4 flex-col bg-background-light dark:bg-background-dark">
        <div className="spinner" />
        <p className="text-slate-500">Cargando dashboard administrativo...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <AdminSidebar user={user} onLogout={logout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopNavbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedUnitName={selectedUnit?.nombre || user?.area_nombre || 'Sede Central'}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <section>
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Unidades Administrativas
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Seleccione una unidad para gestionar su correspondencia y metricas operativas.
            </p>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <UnitCards
            units={datos.unidades}
            selectedUnitId={selectedUnitId}
            onSelectUnit={setSelectedUnitId}
          />
          <DashboardMetrics
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedUnit={selectedUnit}
            weekMetrics={datos.metricasSemanales}
            distribution={datos.distribucionEstados}
          />

          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs uppercase font-semibold text-slate-400">Registros Totales</p>
              <p className="text-2xl font-black mt-2">{totals.total}</p>
            </article>
            <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs uppercase font-semibold text-slate-400">En Proceso</p>
              <p className="text-2xl font-black mt-2 text-amber-500">{totals.enProceso}</p>
            </article>
            <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs uppercase font-semibold text-slate-400">Completados</p>
              <p className="text-2xl font-black mt-2 text-emerald-500">{totals.completado}</p>
            </article>
            <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs uppercase font-semibold text-slate-400">Cancelados</p>
              <p className="text-2xl font-black mt-2 text-red-500">{totals.cancelado}</p>
            </article>
          </section>

          <RecentDocumentsTable registros={registros} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
