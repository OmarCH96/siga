// PestanasNavegacion
const PestanasNavegacion = () => {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <nav className="flex gap-8">
        <a
          className="py-4 border-b-2 border-primary text-primary text-sm font-semibold flex items-center gap-2"
          href="#"
        >
          Turnados
          <span className="bg-primary/10 px-2 py-0.5 rounded-full text-[10px]">12</span>
        </a>
        <a
          className="py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 text-sm font-medium transition-all"
          href="#"
        >
          Copias de conocimiento
        </a>
        <a
          className="py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 text-sm font-medium transition-all"
          href="#"
        >
          Retornados
        </a>
        <a
          className="py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 text-sm font-medium transition-all"
          href="#"
        >
          Respuestas recibidas
        </a>
      </nav>
    </div>
  );
};

export default PestanasNavegacion;
