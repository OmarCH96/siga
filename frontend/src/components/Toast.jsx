import { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Toast individual para mostrar notificaciones
 * Soporta 4 tipos: success, error, warning, info
 * Auto-dismiss en 5 segundos por defecto
 */
const Toast = ({ id, type = 'info', message, onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    const styles = {
        success: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            border: 'border-emerald-500',
            text: 'text-emerald-800 dark:text-emerald-200',
            icon: 'check_circle'
        },
        error: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-500',
            text: 'text-red-800 dark:text-red-200',
            icon: 'error'
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-500',
            text: 'text-amber-800 dark:text-amber-200',
            icon: 'warning'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-500',
            text: 'text-blue-800 dark:text-blue-200',
            icon: 'info'
        }
    };

    const style = styles[type] || styles.info;

    return (
        <div
            className={`${style.bg} ${style.text} border-l-4 ${style.border} rounded-lg shadow-lg p-4 mb-3 min-w-[320px] max-w-md animate-slide-in-right`}
            role="alert"
        >
            <div className="flex items-start gap-3">
                <span className={`material-symbols-outlined flex-shrink-0 ${style.text}`}>
                    {style.icon}
                </span>
                <div className="flex-1 text-sm font-medium leading-relaxed">
                    {message}
                </div>
                <button
                    onClick={() => onClose(id)}
                    className={`${style.text} hover:opacity-70 transition-opacity flex-shrink-0`}
                    aria-label="Cerrar notificación"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
        </div>
    );
};

Toast.propTypes = {
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    message: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    duration: PropTypes.number
};

/**
 * Contenedor de toasts - posicionado en la esquina superior derecha
 * Soporta múltiples toasts apilados
 */
export const ToastContainer = ({ toasts, onClose }) => {
    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="fixed top-20 right-6 z-[9999] flex flex-col items-end space-y-2">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    type={toast.type}
                    message={toast.message}
                    onClose={onClose}
                    duration={toast.duration}
                />
            ))}
        </div>
    );
};

ToastContainer.propTypes = {
    toasts: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            type: PropTypes.string,
            message: PropTypes.string.isRequired,
            duration: PropTypes.number
        })
    ).isRequired,
    onClose: PropTypes.func.isRequired
};

export default Toast;
