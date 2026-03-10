/**
 * Sistema de Rate Limiting Optimizado para 200 Usuarios Concurrentes
 * 
 * MEJORAS vs. versión anterior:
 * - Rate limiting por USUARIO autenticado (no solo IP)
 * - Configuración optimizada para 200 usuarios simultáneos
 * - Separación de limiters por tipo de operación
 * - Mensajes mejorados con tiempo de espera
 * - Preparado para Redis (producción)
 * 
 * NOTA: En desarrollo usa memoria (Map), en producción usar Redis
 */

const rateLimit = require('express-rate-limit');
const log = require('../utils/logger');
const config = require('../config');

// ============================================================================
// CONFIGURACIÓN PARA 200 USUARIOS CONCURRENTES
// ============================================================================

/**
 * Cálculo de límites para 200 usuarios:
 * - Promedio: 20 requests/minuto por usuario
 * - Ventana de 15 minutos
 * - Total: 300 requests/15min por usuario
 * - Capacidad sistema: 200 usuarios × 300 req = 60,000 req/15min = 66.6 req/segundo
 */

const RATE_LIMITS = {
  // Operaciones generales (GET, POST de datos)
  general: {
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 300,                   // 300 requests por usuario
  },
  
  // Login (más restrictivo por seguridad)
  login: {
    windowMs: 15 * 60 * 1000,
    max: 5,                     // Solo 5 intentos de login
  },
  
  // Operaciones de escritura pesadas (crear documentos, subir archivos)
  heavyWrite: {
    windowMs: 5 * 60 * 1000,   // 5 minutos
    max: 50,                    // 50 operaciones
  },
  
  // Consultas de reportes (queries pesadas)
  reports: {
    windowMs: 10 * 60 * 1000,  // 10 minutos
    max: 20,                    // 20 reportes
  },
};


// ============================================================================
// GENERADOR DE KEY (USER-BASED, NO IP-BASED)
// ============================================================================

/**
 * Genera una clave única para rate limiting
 * Prioriza usuario autenticado sobre IP (evita bloqueos masivos por NAT)
 * 
 * @param {Object} req - Request de Express
 * @returns {string} Clave única para el contador
 */
function generateKey(req, prefix = 'api') {
  // Si el usuario está autenticado (req.user existe), usar su ID
  if (req.user && req.user.id) {
    return `${prefix}:user:${req.user.id}`;
  }
  
  // Si no está autenticado (rutas públicas como login), usar IP + username
  if (req.body && req.body.nombreUsuario) {
    return `${prefix}:login:${req.body.nombreUsuario}`;
  }
  
  // Fallback: usar IP (solo para rutas completamente públicas)
  return `${prefix}:ip:${req.ip}`;
}


// ============================================================================
// HANDLER DE LÍMITE EXCEDIDO
// ============================================================================

/**
 * Respuesta personalizada cuando se excede el límite
 * Incluye información sobre cuándo puede reintentar
 */
function createLimitHandler(message) {
  return (req, res) => {
    const resetTime = req.rateLimit.resetTime;
    const now = Date.now();
    const secondsRemaining = Math.ceil((resetTime - now) / 1000);
    const minutesRemaining = Math.ceil(secondsRemaining / 60);
    
    // Log de seguridad
    log.security('Rate limit exceeded', {
      ip: req.ip,
      user: req.user?.id || 'anonymous',
      path: req.path,
      limit: req.rateLimit.limit,
      current: req.rateLimit.current,
      resetIn: `${minutesRemaining}min`,
    });
    
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: message || 'Demasiadas peticiones. Intenta más tarde.',
      details: {
        limit: req.rateLimit.limit,
        remaining: 0,
        resetIn: secondsRemaining,
        resetAt: new Date(resetTime).toISOString(),
      },
      // Mensaje amigable para el usuario
      userMessage: `Has alcanzado el límite de peticiones. Podrás intentar nuevamente en ${minutesRemaining} ${minutesRemaining === 1 ? 'minuto' : 'minutos'}.`,
    });
  };
}


// ============================================================================
// SKIP FUNCTIONS (Condiciones para NO aplicar rate limiting)
// ============================================================================

/**
 * Lista de IPs que nunca se limitan (localhost, IPs internas)
 * ⚠️ NUNCA agregar IPs públicas aquí
 */
const WHITELISTED_IPS = [
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
];

/**
 * Función para saltar rate limiting en ciertas condiciones
 */
function skipRateLimitForTrustedSources(req) {
  // Saltar si es IP de desarrollo
  if (config.env === 'development' && WHITELISTED_IPS.includes(req.ip)) {
    return false; // No saltar en desarrollo (testing)
  }
  
  // Saltar si es health check
  if (req.path === '/health' || req.path === '/api/health') {
    return true;
  }
  
  return false;
}


// ============================================================================
// RATE LIMITERS ESPECÍFICOS
// ============================================================================

/**
 * 1. GENERAL LIMITER
 * Para todas las rutas autenticadas (GET, POST, PUT, DELETE)
 * Configurado para 200 usuarios concurrentes
 */
const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.general.windowMs,
  max: RATE_LIMITS.general.max,
  
  // Generar key por usuario, no por IP
  keyGenerator: (req) => generateKey(req, 'general'),
  
  // Mensaje personalizado
  handler: createLimitHandler(
    'Has excedido el límite de peticiones. Las operaciones generales están limitadas a 300 por cada 15 minutos.'
  ),
  
  // Skip para health checks
  skip: skipRateLimitForTrustedSources,
  
  // Headers estándar (RFC 6585)
  standardHeaders: true,
  legacyHeaders: false,
  
  // ⚠️ PRODUCCIÓN: Descomentar para usar Redis
  // store: new RedisStore({
  //   client: require('../config/redis').client,
  //   prefix: 'rl:general:',
  // }),
});


/**
 * 2. LOGIN LIMITER
 * Para prevenir brute force en autenticación
 * Solo 5 intentos cada 15 minutos por usuario
 */
const loginLimiter = rateLimit({
  windowMs: RATE_LIMITS.login.windowMs,
  max: RATE_LIMITS.login.max,
  
  // Key por nombreUsuario (no por user ID, porque aún no está autenticado)
  keyGenerator: (req) => generateKey(req, 'login'),
  
  // No contar logins exitosos (solo fallidos)
  skipSuccessfulRequests: true,
  
  // Mensaje específico para login
  handler: createLimitHandler(
    'Demasiados intentos de inicio de sesión. Por seguridad, tu cuenta ha sido bloqueada temporalmente.'
  ),
  
  standardHeaders: true,
  legacyHeaders: false,
  
  // ⚠️ PRODUCCIÓN: Redis es CRÍTICO aquí para sincronizar entre instancias
  // store: new RedisStore({
  //   client: require('../config/redis').client,
  //   prefix: 'rl:login:',
  // }),
});


/**
 * 3. HEAVY WRITE LIMITER
 * Para operaciones de escritura costosas:
 * - Crear documentos
 * - Subir archivos
 * - Generar folios
 */
const heavyWriteLimiter = rateLimit({
  windowMs: RATE_LIMITS.heavyWrite.windowMs,
  max: RATE_LIMITS.heavyWrite.max,
  
  keyGenerator: (req) => generateKey(req, 'write'),
  
  handler: createLimitHandler(
    'Has excedido el límite de operaciones de escritura. Las creaciones están limitadas a 50 cada 5 minutos.'
  ),
  
  skip: skipRateLimitForTrustedSources,
  standardHeaders: true,
  legacyHeaders: false,
});


/**
 * 4. REPORTS LIMITER
 * Para consultas pesadas (dashboards, reportes, exports)
 */
const reportsLimiter = rateLimit({
  windowMs: RATE_LIMITS.reports.windowMs,
  max: RATE_LIMITS.reports.max,
  
  keyGenerator: (req) => generateKey(req, 'report'),
  
  handler: createLimitHandler(
    'Has excedido el límite de generación de reportes. Los reportes están limitados a 20 cada 10 minutos.'
  ),
  
  skip: skipRateLimitForTrustedSources,
  standardHeaders: true,
  legacyHeaders: false,
});


/**
 * 5. FILE UPLOAD LIMITER
 * Para subida de archivos (más restrictivo por uso de bandwidth)
 */
const fileUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutos
  max: 30,                    // 30 archivos
  
  keyGenerator: (req) => generateKey(req, 'upload'),
  
  handler: createLimitHandler(
    'Has excedido el límite de subida de archivos. Puedes subir hasta 30 archivos cada 10 minutos.'
  ),
  
  skip: skipRateLimitForTrustedSources,
  standardHeaders: true,
  legacyHeaders: false,
});


// ============================================================================
// MIDDLEWARE INTELIGENTE: SELECCIONA LIMITER SEGÚN RUTA
// ============================================================================

/**
 * Middleware que aplica el rate limiter apropiado según la ruta
 * Permite configuración granular sin modificar cada route
 */
const smartRateLimiter = (req, res, next) => {
  // Determinar qué limiter aplicar
  if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
    return loginLimiter(req, res, next);
  }
  
  if (req.path.includes('/upload') || req.method === 'POST' && req.headers['content-type']?.includes('multipart')) {
    return fileUploadLimiter(req, res, next);
  }
  
  if (req.path.includes('/dashboard') || req.path.includes('/reporte')) {
    return reportsLimiter(req, res, next);
  }
  
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    return heavyWriteLimiter(req, res, next);
  }
  
  // Default: general limiter
  return generalLimiter(req, res, next);
};


// ============================================================================
// MONITOREO Y ESTADÍSTICAS
// ============================================================================

/**
 * Middleware opcional para registrar estadísticas de rate limiting
 * Útil para ajustar límites en producción
 */
const rateLimitStatsMiddleware = (req, res, next) => {
  // Solo en desarrollo o si está habilitado el debug
  if (config.env !== 'production' || config.rateLimit.debug) {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Agregar info de rate limit a la respuesta (solo en headers, no en body)
      if (req.rateLimit) {
        res.set('X-RateLimit-Limit', req.rateLimit.limit);
        res.set('X-RateLimit-Remaining', req.rateLimit.remaining);
        res.set('X-RateLimit-Reset', new Date(req.rateLimit.resetTime).toISOString());
      }
      
      return originalJson(data);
    };
  }
  
  next();
};


// ============================================================================
// EXPORTACIONES
// ============================================================================

module.exports = {
  // Limiters individuales (para uso específico en routes)
  generalLimiter,
  loginLimiter,
  heavyWriteLimiter,
  reportsLimiter,
  fileUploadLimiter,
  
  // Limiter inteligente (recomendado para uso global)
  smartRateLimiter,
  
  // Middleware de stats
  rateLimitStatsMiddleware,
  
  // Utilidades
  generateKey,
  createLimitHandler,
  
  // Configuración (para ajustes dinámicos)
  RATE_LIMITS,
};
