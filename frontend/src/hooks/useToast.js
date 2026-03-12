import { useState, useCallback } from 'react';

/**
 * Hook para gestionar el sistema de notificaciones toast
 * 
 * @returns {Object} Objeto con toasts actuales y métodos para mostrarlos
 */
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    /**
     * Agrega un nuevo toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duración en ms (0 = no auto-cerrar)
     */
    const showToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast = { id, message, type, duration };

        setToasts((prev) => [...prev, newToast]);

        return id;
    }, []);

    /**
     * Cierra un toast específico
     * @param {string} id - ID del toast a cerrar
     */
    const closeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    /**
     * Cierra todos los toasts
     */
    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    // Métodos de conveniencia
    const success = useCallback((message, duration) => {
        return showToast(message, 'success', duration);
    }, [showToast]);

    const error = useCallback((message, duration) => {
        return showToast(message, 'error', duration);
    }, [showToast]);

    const warning = useCallback((message, duration) => {
        return showToast(message, 'warning', duration);
    }, [showToast]);

    const info = useCallback((message, duration) => {
        return showToast(message, 'info', duration);
    }, [showToast]);

    return {
        toasts,
        showToast,
        closeToast,
        clearAllToasts,
        success,
        error,
        warning,
        info
    };
};

export default useToast;
