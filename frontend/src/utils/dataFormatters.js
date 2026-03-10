/**
 * Utilidades para formateo seguro de datos
 * Previene XSS y asegura que los datos sean válidos antes de renderizar
 */

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
export const escapeHtml = (text) => {
  if (typeof text !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * Formatea una fecha de manera segura
 * @param {string|Date} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'Fecha inválida';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };
    
    return new Intl.DateTimeFormat('es-MX', defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error de formato';
  }
};

/**
 * Formatea un número de manera segura
 * @param {number|string} value - Número a formatear
 * @param {number} decimals - Número de decimales
 * @returns {string} Número formateado
 */
export const formatNumber = (value, decimals = 0) => {
  const num = Number(value);
  
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Trunca texto de manera segura
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength).trim()}...`;
};

/**
 * Sanitiza un objeto eliminando propiedades peligrosas
 * @param {Object} obj - Objeto a sanitizar
 * @param {Array<string>} allowedKeys - Claves permitidas
 * @returns {Object} Objeto sanitizado
 */
export const sanitizeObject = (obj, allowedKeys = []) => {
  if (!obj || typeof obj !== 'object') return {};
  
  if (allowedKeys.length === 0) {
    // Si no se especifican claves, devolver todas menos las peligrosas
    const { __proto__, constructor, prototype, ...safe } = obj;
    return safe;
  }
  
  return allowedKeys.reduce((acc, key) => {
    if (obj.hasOwnProperty(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Valida y obtiene un valor seguro con fallback
 * @param {*} value - Valor a validar
 * @param {*} fallback - Valor por defecto
 * @param {Function} validator - Función de validación opcional
 * @returns {*} Valor validado o fallback
 */
export const getSafeValue = (value, fallback = '', validator = null) => {
  if (value === null || value === undefined) return fallback;
  
  if (validator && typeof validator === 'function') {
    return validator(value) ? value : fallback;
  }
  
  return value;
};

/**
 * Formatea una prioridad con color
 * @param {string} priority - Prioridad (Alta, Media, Baja)
 * @returns {Object} Objeto con texto y clase CSS
 */
export const formatPriority = (priority) => {
  const priorities = {
    Alta: { text: 'Alta', class: 'text-red-600 dark:text-red-400' },
    Media: { text: 'Media', class: 'text-amber-600 dark:text-amber-400' },
    Baja: { text: 'Baja', class: 'text-green-600 dark:text-green-400' },
  };
  
  return priorities[priority] || { text: 'N/A', class: 'text-slate-400' };
};

/**
 * Procesa métricas semanales del backend
 * @param {Array} metricas - Array de métricas del backend
 * @returns {Array} Métricas procesadas con días de la semana
 */
export const processWeekMetrics = (metricas = []) => {
  if (!Array.isArray(metricas)) return [];
  
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  return metricas.map((metrica) => {
    const date = new Date(metrica.fecha);
    const dayName = dayNames[date.getDay()];
    
    return {
      day: dayName,
      total: parseInt(metrica.total) || 0,
      entrantesRatio: 45, // Valor por defecto si no viene del backend
      fecha: metrica.fecha,
    };
  });
};

/**
 * Procesa distribución de estados del backend
 * @param {Array} distribucion - Array de distribución del backend
 * @returns {Array} Distribución procesada
 */
export const processDistribution = (distribucion = []) => {
  if (!Array.isArray(distribucion)) return [];
  
  return distribucion.map((item) => ({
    label: item.estado || 'Desconocido',
    value: parseInt(item.total) || 0,
  }));
};

/**
 * Genera iniciales de un nombre de manera segura
 * @param {string} firstName - Nombre
 * @param {string} lastName - Apellido
 * @returns {string} Iniciales en mayúsculas
 */
export const getInitials = (firstName = '', lastName = '') => {
  const first = typeof firstName === 'string' ? firstName.trim()[0] : '';
  const last = typeof lastName === 'string' ? lastName.trim()[0] : '';
  
  return `${first}${last}`.toUpperCase() || 'A';
};
