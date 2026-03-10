/**
 * Sistema de Rate Limiting Avanzado y Protección contra Brute Force
 * 
 * Características:
 * - Rate limiting por IP
 * - Rate limiting por usuario
 * - Bloqueo temporal por intentos fallidos
 * - Lista negra de IPs
 * 
 * En producción usar Redis para persistencia
 * En desarrollo usa memoria (se pierde al reiniciar)
 */

const rateLimit = require('express-rate-limit');
const log = require('../utils/logger');
const config = require('../config');

// Almacenamiento en memoria (cambiar a Redis en producción)
const failedAttempts = new Map(); // IP/usuario -> { count, lockUntil }
const blockedIPs = new Set();

// Configuración
const MAX_FAILED_ATTEMPTS = 5; // Máximo de intentos fallidos
const LOCK_TIME = 15 * 60 * 1000; // 15 minutos de bloqueo
const ATTEMPTS_WINDOW = 15 * 60 * 1000; // Ventana de 15 minutos para contar intentos

/**
 * Limpia intentos fallidos antiguos cada 5 minutos
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of failedAttempts.entries()) {
    if (data.lockUntil && now > data.lockUntil) {
      failedAttempts.delete(key);
    } else if (now - data.firstAttempt > ATTEMPTS_WINDOW) {
      failedAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter general para la API
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, intente más tarde',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.security('Rate limit exceeded - General', {
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      success: false,
      message: 'Demasiadas peticiones, intente más tarde',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Rate limiter estricto para login
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana
  message: {
    success: false,
    message: 'Demasiados intentos de login, intente más tarde',
    code: 'LOGIN_RATE_LIMIT',
  },
  skipSuccessfulRequests: true, // No contar intentos exitosos
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.security('Rate limit exceeded - Login', {
      ip: req.ip,
      username: req.body?.nombreUsuario,
    });

    res.status(429).json({
      success: false,
      message: 'Demasiados intentos de login, intente más tarde',
      code: 'LOGIN_RATE_LIMIT',
    });
  },
});

/**
 * Rate limiter para endpoints de registro
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por hora por IP
  message: {
    success: false,
    message: 'Límite de registros alcanzado, intente más tarde',
    code: 'REGISTER_RATE_LIMIT',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Obtiene un identificador único para el usuario/IP
 * @param {Object} req - Request de Express
 * @returns {string} Identificador
 */
function getIdentifier(req) {
  const ip = req.ip || req.connection.remoteAddress;
  const username = req.body?.nombreUsuario || req.user?.nombreUsuario;
  
  return username ? `user:${username}` : `ip:${ip}`;
}

/**
 * Verifica si una IP está bloqueada
 * @param {string} ip - IP a verificar
 * @returns {boolean} true si está bloqueada
 */
function isIPBlocked(ip) {
  return blockedIPs.has(ip);
}

/**
 * Bloquea una IP temporalmente
 * @param {string} ip - IP a bloquear
 * @param {number} duration - Duración del bloqueo en ms
 */
function blockIP(ip, duration = LOCK_TIME) {
  blockedIPs.add(ip);
  
  log.security('IP blocked temporarily', { ip, duration });

  // Desbloquear después del tiempo especificado
  setTimeout(() => {
    blockedIPs.delete(ip);
    log.info('IP unblocked', { ip });
  }, duration);
}

/**
 * Middleware para verificar si la IP está bloqueada
 */
function checkIPBlock(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;

  if (isIPBlocked(ip)) {
    log.security('Blocked IP attempt', { ip, path: req.path });

    return res.status(403).json({
      success: false,
      message: 'Tu IP ha sido bloqueada temporalmente por actividad sospechosa',
      code: 'IP_BLOCKED',
    });
  }

  next();
}

/**
 * Registra un intento fallido de login
 * @param {string} identifier - Identificador del usuario/IP
 * @param {string} ip - IP del cliente
 */
function recordFailedAttempt(identifier, ip) {
  const now = Date.now();
  const attemptData = failedAttempts.get(identifier) || {
    count: 0,
    firstAttempt: now,
    lockUntil: null,
  };

  // Resetear si la ventana de tiempo ha pasado
  if (now - attemptData.firstAttempt > ATTEMPTS_WINDOW) {
    attemptData.count = 0;
    attemptData.firstAttempt = now;
    attemptData.lockUntil = null;
  }

  attemptData.count++;

  // Si excede el límite, bloquear
  if (attemptData.count >= MAX_FAILED_ATTEMPTS) {
    attemptData.lockUntil = now + LOCK_TIME;
    
    log.security('Account locked due to failed attempts', {
      identifier,
      ip,
      attempts: attemptData.count,
    });

    // También bloquear la IP
    blockIP(ip);
  } else {
    log.warn('Failed login attempt', {
      identifier,
      ip,
      attempts: attemptData.count,
      remaining: MAX_FAILED_ATTEMPTS - attemptData.count,
    });
  }

  failedAttempts.set(identifier, attemptData);
}

/**
 * Limpia los intentos fallidos de un identificador (en login exitoso)
 * @param {string} identifier - Identificador del usuario/IP
 */
function clearFailedAttempts(identifier) {
  failedAttempts.delete(identifier);
  log.debug('Failed attempts cleared', { identifier });
}

/**
 * Verifica si un usuario/IP está bloqueado por intentos fallidos
 * @param {string} identifier - Identificador del usuario/IP
 * @returns {Object} { blocked: boolean, remainingTime: number }
 */
function checkFailedAttempts(identifier) {
  const attemptData = failedAttempts.get(identifier);

  if (!attemptData) {
    return { blocked: false, remainingTime: 0 };
  }

  const now = Date.now();

  // Si está bloqueado y el bloqueo sigue vigente
  if (attemptData.lockUntil && now < attemptData.lockUntil) {
    return {
      blocked: true,
      remainingTime: Math.ceil((attemptData.lockUntil - now) / 1000),
      attempts: attemptData.count,
    };
  }

  // Si el bloqueo expiró, limpiar
  if (attemptData.lockUntil && now >= attemptData.lockUntil) {
    failedAttempts.delete(identifier);
    return { blocked: false, remainingTime: 0 };
  }

  return {
    blocked: false,
    remainingTime: 0,
    attempts: attemptData.count,
  };
}

/**
 * Middleware para verificar intentos fallidos antes de login
 */
function checkBruteForce(req, res, next) {
  const identifier = getIdentifier(req);
  const status = checkFailedAttempts(identifier);

  if (status.blocked) {
    log.security('Blocked login attempt - brute force protection', {
      identifier,
      ip: req.ip,
      remainingTime: status.remainingTime,
    });

    return res.status(429).json({
      success: false,
      message: `Cuenta bloqueada temporalmente. Intente de nuevo en ${status.remainingTime} segundos`,
      code: 'ACCOUNT_LOCKED',
      remainingTime: status.remainingTime,
    });
  }

  // Agregar información de intentos al request
  req.bruteForceAttempts = status.attempts || 0;

  next();
}

/**
 * Obtiene estadísticas del rate limiting (para monitoring)
 */
function getStats() {
  return {
    totalBlockedAccounts: failedAttempts.size,
    totalBlockedIPs: blockedIPs.size,
    activeAttempts: Array.from(failedAttempts.entries()).map(([key, data]) => ({
      identifier: key,
      attempts: data.count,
      locked: data.lockUntil ? data.lockUntil > Date.now() : false,
    })),
  };
}

/**
 * Limpia todas las restricciones (útil para testing)
 */
function clearAll() {
  failedAttempts.clear();
  blockedIPs.clear();
  log.debug('All rate limiting data cleared');
}

module.exports = {
  // Limiters de express-rate-limit
  generalLimiter,
  loginLimiter,
  registerLimiter,

  // Middleware de brute force
  checkBruteForce,
  checkIPBlock,

  // Funciones para usar en controladores
  recordFailedAttempt,
  clearFailedAttempts,
  checkFailedAttempts,
  blockIP,
  isIPBlocked,

  // Utilidades
  getStats,
  clearAll,
};
