// BandejaRecepcionLayout
import PestanasNavegacion from './PestanasNavegacion';
import TablaDocumentos from './TablaDocumentos';
import { useBandejaRecepcion } from '@hooks/useBandejaRecepcion';
import AppLayout from '@components/Layout/AppLayout';

const BandejaRecepcionLayout = () => {
    const { 
        documentos, 
        loading, 
        error, 
        filters, 
        actualizarFiltros,
        total 
    } = useBandejaRecepcion();

    return (
        <AppLayout activeRoute="recepciones">
            <div className="p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                        {/* Título */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Recepciones
                                    {total > 0 && (
                                        <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                                            {total} {total === 1 ? 'documento' : 'documentos'}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-slate-500 text-sm">
                                    Gestión y seguimiento de documentos oficiales recibidos.
                                </p>
                            </div>
                            <PestanasNavegacion />
                        </div>

                        <TablaDocumentos 
                            documentos={documentos}
                            loading={loading}
                            error={error}
                            filters={filters}
                            onFiltersChange={actualizarFiltros}
                        />
                    </div>
                </div>
        </AppLayout>
    );
};

export default BandejaRecepcionLayout;
