/**
 * Middleware de Protección CSRF (Cross-Site Request Forgery)
 * Protege contra ataques CSRF en endpoints que modifican datos
 * 
 * Nota: En desarrollo con localhost, algunos aspectos de CSRF están relajados
 * En producción con HTTPS, se deben activar todas las protecciones
 */

const crypto = require('crypto');
const log = require('../utils/logger');
const config = require('../config');

// Almacenamiento temporal de tokens CSRF (en producción usar Redis)
// Para desarrollo usamos memoria, en producción cambiar a Redis
const csrfTokens = new Map();

// Tiempo de vida del token CSRF (1 hora)
const CSRF_TOKEN_LIFETIME = 60 * 60 * 1000;

// Limpiar tokens expirados cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (now - data.createdAt > CSRF_TOKEN_LIFETIME) {
      csrfTokens.delete(token);
    }
  }
}, 10 * 60 * 1000);

/**
 * Genera un token CSRF aleatorio
 * @returns {string} Token CSRF
 */
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Genera y almacena un token CSRF para un usuario o sesión
 * @param {string} identifier - Identificador del usuario/sesión
 * @returns {string} Token CSRF generado
 */
function createCSRFToken(identifier) {
  const token = generateCSRFToken();
  
  csrfTokens.set(token, {
    identifier,
    createdAt: Date.now(),
  });

  log.debug('CSRF token created', { identifier });

  return token;
}

/**
 * Verifica si un token CSRF es válido
 * @param {string} token - Token a verificar
 * @param {string} identifier - Identificador esperado
 * @returns {boolean} true si el token es válido
 */
function verifyCSRFToken(token, identifier) {
  if (!token) return false;

  const tokenData = csrfTokens.get(token);
  
  if (!tokenData) {
    return false;
  }

  // Verificar que no haya expirado
  if (Date.now() - tokenData.createdAt > CSRF_TOKEN_LIFETIME) {
    csrfTokens.delete(token);
    return false;
  }

  // Verificar que el identificador coincida
  if (tokenData.identifier !== identifier) {
    return false;
  }

  return true;
}

/**
 * Elimina un token CSRF usado (one-time token)
 * @param {string} token - Token a eliminar
 */
function consumeCSRFToken(token) {
  csrfTokens.delete(token);
}

/**
 * Genera un identificador único para la sesión/usuario
 * @param {Object} req - Request de Express
 * @returns {string} Identificador único
 */
function getSessionIdentifier(req) {
  // Si hay usuario autenticado, usar su ID
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }

  // Si no hay usuario, usar IP + User Agent (menos seguro pero funcional)
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';
  return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
}

/**
 * Middleware para generar token CSRF
 * Usado en el endpoint GET /api/csrf-token
 */
function generateToken(req, res, next) {
  try {
    const identifier = getSessionIdentifier(req);
    const token = createCSRFToken(identifier);

    req.csrfToken = token;
    next();
  } catch (error) {
    log.error('Error generating CSRF token', { error: error.message });
    next(error);
  }
}

/**
 * Middleware para validar token CSRF
 * Debe aplicarse en rutas POST, PUT, DELETE que modifiquen datos
 */
function validateToken(req, res, next) {
  try {
    // Obtener token del header o body
    const token = req.headers['x-csrf-token'] || req.body._csrf;

    if (!token) {
      log.security('CSRF token missing', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });

      return res.status(403).json({
        success: false,
        message: 'CSRF token missing',
        code: 'CSRF_TOKEN_MISSING',
      });
    }

    const identifier = getSessionIdentifier(req);
    const isValid = verifyCSRFToken(token, identifier);

    if (!isValid) {
      log.security('Invalid CSRF token', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
      });

      return res.status(403).json({
        success: false,
        message: 'Invalid or expired CSRF token',
        code: 'INVALID_CSRF_TOKEN',
      });
    }

    // Token válido, continuar
    log.debug('CSRF token validated successfully');
    next();
  } catch (error) {
    log.error('Error validating CSRF token', { error: error.message });
    next(error);
  }
}

/**
 * Middleware opcional de CSRF (no falla si no hay token)
 * Útil para endpoints que pueden ser públicos o privados
 */
function optionalValidation(req, res, next) {
  const token = req.headers['x-csrf-token'] || req.body._csrf;

  if (!token) {
    // No hay token, continuar sin validar
    return next();
  }

  // Si hay token, validarlo
  validateToken(req, res, next);
}

/**
 * Limpia todos los tokens CSRF (útil para testing)
 */
function clearAllTokens() {
  csrfTokens.clear();
  log.debug('All CSRF tokens cleared');
}

/**
 * Obtiene estadísticas de tokens CSRF (desarrollo/monitoring)
 */
function getStats() {
  return {
    totalTokens: csrfTokens.size,
    oldestToken: Math.min(...Array.from(csrfTokens.values()).map(t => t.createdAt)),
  };
}

module.exports = {
  generateToken,
  validateToken,
  optionalValidation,
  clearAllTokens,
  getStats,
  createCSRFToken,
  verifyCSRFToken,
};
