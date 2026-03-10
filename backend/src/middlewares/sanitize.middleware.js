/**
 * Middleware de Sanitización de Datos
 * Protege contra XSS y otros ataques de inyección
 * Sanitiza todos los inputs antes de procesarlos
 */

const validator = require('validator');
const log = require('../utils/logger');

/**
 * Lista blanca de campos que pueden contener HTML (si aplica)
 * Por seguridad, por defecto no permitimos HTML en ningún campo
 */
const HTML_ALLOWED_FIELDS = [
  // Agregar aquí campos específicos que necesiten HTML
  // Ejemplo: 'descripcion_documento'
];

/**
 * Sanitiza un valor individual
 * @param {*} value - Valor a sanitizar
 * @param {string} fieldName - Nombre del campo (para determinar si permite HTML)
 * @returns {*} Valor sanitizado
 */
function sanitizeValue(value, fieldName = '') {
  // Si es null o undefined, retornar tal cual
  if (value === null || value === undefined) {
    return value;
  }

  // Si es un string, sanitizar
  if (typeof value === 'string') {
    // Detectar intentos de XSS
    if (containsXSS(value)) {
      log.security('XSS attempt detected', { 
        field: fieldName,
        value: value.substring(0, 100), // Solo primeros 100 chars
      });
    }

    // Si el campo permite HTML (lista blanca), sanitizar pero permitir algunos tags
    if (HTML_ALLOWED_FIELDS.includes(fieldName)) {
      // Escapar solo scripts y tags peligrosos
      return validator.escape(value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''));
    }

    // Para todos los demás campos, escapar todo HTML
    return validator.escape(value.trim());
  }

  // Si es un array, sanitizar cada elemento
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, fieldName));
  }

  // Si es un objeto, sanitizar recursivamente
  if (typeof value === 'object') {
    return sanitizeObject(value);
  }

  // Para otros tipos (números, booleanos, etc.), retornar tal cual
  return value;
}

/**
 * Detecta posibles intentos de XSS
 * @param {string} value - Valor a verificar
 * @returns {boolean} true si detecta patrones sospechosos
 */
function containsXSS(value) {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick=, onload=, etc.
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(value));
}

/**
 * Sanitiza un objeto completo
 * @param {Object} obj - Objeto a sanitizar
 * @returns {Object} Objeto sanitizado
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeValue(obj[key], key);
    }
  }

  return sanitized;
}

/**
 * Middleware para sanitizar req.body
 * Se aplica antes de procesar cualquier ruta
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Middleware para sanitizar req.query
 */
function sanitizeQuery(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
}

/**
 * Middleware para sanitizar req.params
 */
function sanitizeParams(req, res, next) {
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}

/**
 * Middleware combinado que sanitiza todo
 */
function sanitizeAll(req, res, next) {
  sanitizeBody(req, res, () => {
    sanitizeQuery(req, res, () => {
      sanitizeParams(req, res, next);
    });
  });
}

/**
 * Valida SQL injection patterns (defensa adicional)
 * Nota: Las consultas parametrizadas son la defensa principal
 * @param {string} value - Valor a validar
 * @returns {boolean} true si detecta patrones sospechosos
 */
function containsSQLInjection(value) {
  if (typeof value !== 'string') return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(UNION.*SELECT)/gi,
    /('\s*OR\s*'?\d*\s*'?\s*=\s*'?\d*)|('\s*OR\s*'[^']*'\s*=\s*'[^']*')/gi,
    /(--|\/{2})/g, // Comentarios SQL
    /(\bxp_\w+)/gi, // Procedimientos extendidos de SQL Server
  ];

  return sqlPatterns.some(pattern => pattern.test(value));
}

/**
 * Middleware para detectar intentos de SQL injection
 */
function detectSQLInjection(req, res, next) {
  const checkObject = (obj, prefix = '') => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'string' && containsSQLInjection(value)) {
          log.security('SQL Injection attempt detected', {
            field: fullKey,
            value: value.substring(0, 100),
            ip: req.ip,
            path: req.path,
          });
          
          // Por seguridad, rechazar la petición
          return res.status(400).json({
            success: false,
            message: 'Invalid input detected',
          });
        }

        if (typeof value === 'object' && value !== null) {
          checkObject(value, fullKey);
        }
      }
    }
  };

  if (req.body) checkObject(req.body, 'body');
  if (req.query) checkObject(req.query, 'query');
  if (req.params) checkObject(req.params, 'params');

  next();
}

module.exports = {
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll,
  detectSQLInjection,
  sanitizeValue,
  sanitizeObject,
};
