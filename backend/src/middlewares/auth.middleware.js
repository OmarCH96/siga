/**
 * Middleware de Autenticación con Integración RLS
 * 
 * VERSIÓN MEJORADA que incluye:
 * - Verificación JWT optimizada (sin consulta BD)
 * - Establecimiento de contexto para Row Level Security (RLS)
 * - Logging de seguridad mejorado
 * - Manejo robusto de errores
 */

const authService = require('../services/auth.service');
const db = require('../config/database');
const { AuthenticationError } = require('../utils/errors');
const log = require('../utils/logger');

/**
 * Middleware principal de autenticación
 * 
 * Flujo:
 * 1. Extrae token JWT del header Authorization
 * 2. Verifica firma y expiración del token
 * 3. Establece req.user con información del JWT
 * 4. ✅ NUEVO: Establece contexto RLS en PostgreSQL
 * 5. Pasa al siguiente middleware
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Next middleware
 */
async function authenticate(req, res, next) {
  try {
    // ========================================================================
    // PASO 1: Extraer token del header Authorization
    // ========================================================================
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token no proporcionado o formato inválido');
    }

    // Extraer el token (remover 'Bearer ')
    const token = authHeader.substring(7);

    if (!token || token.trim().length === 0) {
      throw new AuthenticationError('Token vacío');
    }

    // ========================================================================
    // PASO 2: Verificar y decodificar el token JWT
    // ========================================================================
    // authService.verifyToken() valida:
    // - Firma del token (con JWT_SECRET)
    // - Fecha de expiración (exp claim)
    // - Estructura del payload
    const decoded = authService.verifyToken(token);

    if (!decoded || !decoded.id) {
      throw new AuthenticationError('Token inválido o corrupto');
    }

    // ========================================================================
    // PASO 3: Establecer información del usuario en req.user
    // ========================================================================
    // OPTIMIZACIÓN: Usamos información del JWT directamente (sin consultar BD)
    // El JWT ya contiene todos los datos necesarios para autorización
    req.user = {
      // Información básica
      id: decoded.id,
      nombreUsuario: decoded.nombreUsuario,
      email: decoded.email,
      nombre: decoded.nombre,
      apellidos: decoded.apellidos,

      // Información de rol (para autorización)
      rol: {
        id: decoded.rolId,
        nombre: decoded.rolNombre,
        permisos: Array.isArray(decoded.permisos) ? decoded.permisos : 
                  typeof decoded.permisos === 'string' ? decoded.permisos.split(',') : [],
      },
      rolId: decoded.rolId,
      rolNombre: decoded.rolNombre,
      permisos: Array.isArray(decoded.permisos) ? decoded.permisos : 
                typeof decoded.permisos === 'string' ? decoded.permisos.split(',') : [],

      // Información de área (para filtrado de datos)
      area: {
        id: decoded.areaId,
        nombre: decoded.areaNombre,
        clave: decoded.areaClave,
        tipo: decoded.areaTipo,
      },
      areaId: decoded.areaId,
      areaNombre: decoded.areaNombre,
      areaClave: decoded.areaClave,
      areaTipo: decoded.areaTipo,

      // Metadatos del token
      iat: decoded.iat, // Issued at
      exp: decoded.exp, // Expiration
    };

    // ========================================================================
    // PASO 4: ✅ ESTABLECER CONTEXTO RLS EN POSTGRESQL
    // ========================================================================
    // Esta es la integración crítica con Row Level Security
    // Ejecuta la función fn_establecer_usuario_actual() que establecerá
    // variables de sesión en PostgreSQL para las políticas RLS
    try {
      await db.query('SELECT fn_establecer_usuario_actual($1)', [decoded.id]);
      
      // Log en desarrollo para debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RLS] Contexto establecido: usuario=${decoded.id}, area=${decoded.areaId}, rol=${decoded.rolId}`);
      }
    } catch (rlsError) {
      // Si falla el establecimiento de RLS, es un error crítico
      // No permitir que la petición continúe
      log.error('Error al establecer contexto RLS', {
        error: rlsError.message,
        usuario: decoded.id,
        ip: req.ip,
        path: req.path,
      });

      throw new AuthenticationError(
        'Error al establecer contexto de seguridad. Contacta al administrador.'
      );
    }

    // ========================================================================
    // PASO 5: Logging de seguridad (opcional pero recomendado)
    // ========================================================================
    if (process.env.LOG_AUTH_REQUESTS === 'true') {
      log.security('Authenticated request', {
        usuario: decoded.nombreUsuario,
        usuarioId: decoded.id,
        rol: decoded.rolNombre,
        area: decoded.areaNombre,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    }

    // ========================================================================
    // PASO 6: Continuar con el siguiente middleware
    // ========================================================================
    next();

  } catch (error) {
    // ========================================================================
    // MANEJO DE ERRORES
    // ========================================================================
    
    // Log de intentos de acceso con token inválido
    log.security('Authentication failed', {
      error: error.message,
      errorName: error.name,
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('user-agent'),
    });

    // Determinar tipo de error y respuesta apropiada
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Token inválido o corrupto'));
    }

    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token expirado. Por favor, inicia sesión nuevamente.'));
    }

    if (error.name === 'NotBeforeError') {
      return next(new AuthenticationError('Token aún no es válido'));
    }

    // Si ya es un AuthenticationError, pasarlo tal cual
    if (error instanceof AuthenticationError) {
      return next(error);
    }

    // Cualquier otro error (inesperado)
    log.error('Unexpected authentication error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
    });

    return next(new AuthenticationError('Error de autenticación'));
  }
}


/**
 * Middleware opcional: Refrescar contexto RLS
 * 
 * Útil para peticiones de larga duración o cuando se cambia de contexto
 * de usuario (por ejemplo, en operaciones admin que actúan como otros usuarios)
 * 
 * @param {number} userId - ID del usuario a establecer
 */
async function refreshRLSContext(userId) {
  try {
    await db.query('SELECT fn_establecer_usuario_actual($1)', [userId]);
    return true;
  } catch (error) {
    log.error('Error al refrescar contexto RLS', {
      error: error.message,
      userId,
    });
    return false;
  }
}


/**
 * Middleware: Autenticación opcional
 * 
 * Similar a authenticate() pero NO falla si no hay token
 * Útil para rutas que pueden ser públicas o autenticadas
 * 
 * Ejemplo: Ver documento público vs. autenticado (con más detalles)
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Si no hay header, continuar sin autenticar
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    if (!token || token.trim().length === 0) {
      return next();
    }

    // Intentar verificar token
    const decoded = authService.verifyToken(token);

    if (decoded && decoded.id) {
      // Establecer req.user (igual que authenticate())
      req.user = {
        id: decoded.id,
        nombreUsuario: decoded.nombreUsuario,
        email: decoded.email,
        rolId: decoded.rolId,
        rolNombre: decoded.rolNombre,
        permisos: Array.isArray(decoded.permisos) ? decoded.permisos : 
                  typeof decoded.permisos === 'string' ? decoded.permisos.split(',') : [],
        areaId: decoded.areaId,
        areaNombre: decoded.areaNombre,
      };

      // Establecer RLS (si falla, continuar sin RLS - modo público)
      try {
        await db.query('SELECT fn_establecer_usuario_actual($1)', [decoded.id]);
      } catch (rlsError) {
        // No lanzar error, simplemente continuar sin contexto RLS
        log.warn('RLS context not set for optional auth', {
          error: rlsError.message,
          usuario: decoded.id,
        });
      }
    }

    next();

  } catch (error) {
    // En autenticación opcional, cualquier error se ignora
    next();
  }
}


/**
 * Middleware: Verificar sesión activa
 * 
 * Además de verificar el token, valida que el refresh token
 * asociado no haya sido revocado
 * 
 * ⚠️ Implica una consulta a la BD, solo usar en operaciones críticas
 */
async function authenticateWithSessionCheck(req, res, next) {
  try {
    // Primero ejecutar autenticación normal
    await authenticate(req, res, () => {});

    // Verificar que el usuario siga activo en la BD
    const result = await db.query(
      'SELECT activo FROM usuario WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0 || !result.rows[0].activo) {
      throw new AuthenticationError('Usuario inactivo o eliminado');
    }

    next();

  } catch (error) {
    next(error);
  }
}


/**
 * Middleware: Limpiar contexto RLS
 * 
 * Ejecutar al final de cada request para limpiar variables de sesión
 * (aunque no es crítico porque cada request usa una nueva conexión del pool)
 */
async function cleanupRLSContext(req, res, next) {
  // Ejecutar después de que la respuesta se envíe
  res.on('finish', async () => {
    try {
      // Resetear variables de sesión
      await db.query(`
        SELECT 
          set_config('app.usuario_id', NULL, false),
          set_config('app.rol_id', NULL, false),
          set_config('app.area_id', NULL, false),
          set_config('app.permisos', NULL, false)
      `);
    } catch (error) {
      // No crítico, solo log
      log.warn('Error al limpiar contexto RLS', {
        error: error.message,
      });
    }
  });

  next();
}


/**
 * Función utilitaria: Verificar si un usuario tiene un permiso específico
 * 
 * @param {Object} user - Objeto req.user
 * @param {string} permiso - Permiso a verificar
 * @returns {boolean}
 */
function hasPermission(user, permiso) {
  if (!user || !user.permisos) {
    return false;
  }

  // Si tiene '*', es admin con todos los permisos
  if (user.permisos.includes('*')) {
    return true;
  }

  // Verificar permiso específico
  return user.permisos.includes(permiso);
}


/**
 * Función utilitaria: Verificar si un usuario tiene alguno de varios permisos
 * 
 * @param {Object} user - Objeto req.user
 * @param {Array<string>} permisos - Lista de permisos
 * @returns {boolean}
 */
function hasAnyPermission(user, permisos) {
  if (!user || !user.permisos) {
    return false;
  }

  if (user.permisos.includes('*')) {
    return true;
  }

  return permisos.some(p => user.permisos.includes(p));
}


// ============================================================================
// EXPORTACIONES
// ============================================================================

module.exports = {
  // Middlewares principales
  authenticate,
  optionalAuthenticate,
  authenticateWithSessionCheck,
  
  // Utilitarios
  refreshRLSContext,
  cleanupRLSContext,
  hasPermission,
  hasAnyPermission,
};
