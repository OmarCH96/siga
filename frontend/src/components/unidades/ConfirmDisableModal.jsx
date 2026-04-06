import { useEffect } from 'react';
import PropTypes from 'prop-types';

const ConfirmDisableModal = ({ isOpen, onClose, onConfirm, unitName, isActivating }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actionText = isActivating ? 'activar' : 'desactivar';

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-background-dark rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
                warning
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">
                {isActivating ? '¿Activar' : '¿Desactivar'} Unidad Administrativa?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Está a punto de <span className="font-bold">{actionText}</span> la unidad:
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{unitName}</p>
              <p className="text-xs text-slate-500 mt-3">
                Esta acción puede revertirse más adelante desde esta misma pantalla.
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">check</span>
            <span>Confirmar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmDisableModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  unitName: PropTypes.string.isRequired,
  isActivating: PropTypes.bool.isRequired,
};

export default ConfirmDisableModal;
