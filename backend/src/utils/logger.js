/**
 * Sistema de Logging Profesional
 * Utiliza Winston para logging seguro y configurable
 * 
 * Niveles:
 * - error: Errores críticos del sistema
 * - warn: Advertencias
 * - info: Información general (producción)
 * - debug: Información detallada (solo desarrollo)
 */

const winston = require('winston');
const path = require('path');
const config = require('../config');

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Agregar metadata si existe (excepto información sensible)
    if (Object.keys(metadata).length > 0) {
      const sanitizedMetadata = sanitizeMetadata(metadata);
      if (Object.keys(sanitizedMetadata).length > 0) {
        log += ` ${JSON.stringify(sanitizedMetadata)}`;
      }
    }
    
    // Agregar stack trace si existe
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

/**
 * Sanitiza metadata para evitar logging de información sensible
 * @param {Object} metadata - Metadata del log
 * @returns {Object} Metadata sanitizada
 */
function sanitizeMetadata(metadata) {
  const sensitiveFields = [
    'password',
    'contraseña',
    'token',
    'jwt',
    'secret',
    'apiKey',
    'authorization',
    'cookie',
    'session'
  ];

  const sanitized = { ...metadata };

  // Buscar y ocultar campos sensibles en cualquier nivel
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      const lowerKey = key.toLowerCase();
      
      // Si es un campo sensible, ocultarlo
      if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Sanitizar recursivamente
        sanitizeObject(obj[key]);
      }
    }
  };

  sanitizeObject(sanitized);
  return sanitized;
}

// Transportes del logger
const transports = [];

// Console transport (siempre activo)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    )
  })
);

// File transport para errores (producción y desarrollo)
transports.push(
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

// File transport para todos los logs (solo en producción)
if (config.env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: customFormat,
  transports,
  exitOnError: false,
});

// Wrapper functions para uso más fácil
const log = {
  /**
   * Log de error
   * @param {string} message - Mensaje de error
   * @param {Object} metadata - Metadata adicional
   */
  error: (message, metadata = {}) => {
    logger.error(message, metadata);
  },

  /**
   * Log de advertencia
   * @param {string} message - Mensaje de advertencia
   * @param {Object} metadata - Metadata adicional
   */
  warn: (message, metadata = {}) => {
    logger.warn(message, metadata);
  },

  /**
   * Log de información
   * @param {string} message - Mensaje informativo
   * @param {Object} metadata - Metadata adicional
   */
  info: (message, metadata = {}) => {
    logger.info(message, metadata);
  },

  /**
   * Log de debug (solo en desarrollo)
   * @param {string} message - Mensaje de debug
   * @param {Object} metadata - Metadata adicional
   */
  debug: (message, metadata = {}) => {
    logger.debug(message, metadata);
  },

  /**
   * Log de evento de auditoría
   * @param {string} action - Acción realizada
   * @param {Object} details - Detalles del evento
   */
  audit: (action, details = {}) => {
    logger.info(`[AUDIT] ${action}`, { ...details, type: 'audit' });
  },

  /**
   * Log de evento de seguridad
   * @param {string} event - Evento de seguridad
   * @param {Object} details - Detalles del evento
   */
  security: (event, details = {}) => {
    logger.warn(`[SECURITY] ${event}`, { ...details, type: 'security' });
  },
};

module.exports = log;
