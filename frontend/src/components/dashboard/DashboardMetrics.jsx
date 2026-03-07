const statusColor = {
  Completado: 'bg-primary',
  'En Proceso': 'bg-amber-400',
  Enviado: 'bg-emerald-500',
  Devuelto: 'bg-red-400',
};

const DashboardMetrics = ({ tabs, activeTab, onTabChange, selectedUnit, weekMetrics, distribution }) => {
  const maxValue = Math.max(...weekMetrics.map((item) => item.total), 1);
  const distributionTotal = distribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <div className="flex gap-8">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`pb-4 px-1 text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'font-bold border-primary text-primary'
                    : 'font-medium border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h4 className="text-sm font-bold mb-6 flex items-center justify-between">
            Flujo de Correspondencia (Ultimos 7 dias)
            <span className="text-xs font-normal text-slate-500">
              Filtrado por: {selectedUnit?.nombre || 'Direccion General'}
            </span>
          </h4>
          <div className="h-64 flex items-end justify-between gap-3 px-1">
            {weekMetrics.map((item) => {
              const height = Math.max(12, Math.round((item.total / maxValue) * 100));

              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg relative flex flex-col justify-end overflow-hidden"
                    style={{ height: `${height}%` }}
                  >
                    <div className="w-full bg-primary/40" style={{ height: `${item.entrantesRatio || 45}%` }} />
                    <div className="w-full bg-primary flex-1" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col">
          <h4 className="text-sm font-bold mb-6">Distribucion por Estado</h4>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-40 h-40 rounded-full border-[12px] border-primary border-r-emerald-500 border-b-amber-400 relative">
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-black">{distributionTotal}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {distribution.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColor[item.label] || 'bg-slate-400'}`} />
                <span className="text-[10px] font-medium text-slate-500 uppercase">
                  {item.label} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;
