import PropTypes from 'prop-types';

/**
 * Modal de confirmación reutilizable
 * 
 * @param {boolean} isOpen - Si el modal está visible
 * @param {function} onClose - Callback al cerrar
 * @param {function} onConfirm - Callback al confirmar
 * @param {string} title - Título del modal
 * @param {React.ReactNode} children - Contenido del modal
 * @param {string} confirmText - Texto del botón de confirmar
 * @param {string} cancelText - Texto del botón de cancelar
 * @param {boolean} loading - Si está procesando
 */
const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = '¿Confirmar acción?',
    children,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    loading = false
}) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !loading) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">
                                check_circle
                            </span>
                            {title}
                        </h3>
                        {!loading && (
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Contenido */}
                <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
                    {children}
                </div>

                {/* Footer con botones */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin material-symbols-outlined text-lg">
                                    refresh
                                </span>
                                Procesando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">
                                    send
                                </span>
                                {confirmText}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

ConfirmDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string,
    children: PropTypes.node,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    loading: PropTypes.bool
};

export default ConfirmDialog;
