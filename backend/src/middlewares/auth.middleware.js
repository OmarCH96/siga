/**
 * Middleware de autenticación
 * Verifica que el usuario esté autenticado mediante JWT
 */

const authService = require('../services/auth.service');
const { AuthenticationError } = require('../utils/errors');
const log = require('../utils/logger');

/**
 * Verifica que el token JWT sea válido
 * OPTIMIZADO: Ya no consulta la BD en cada request
 */
async function authenticate(req, res, next) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token no proporcionado');
    }

    // Extraer el token
    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar el token (esto valida firma, expiración, etc.)
    const decoded = authService.verifyToken(token);

    // Usar información del JWT directamente (sin consulta a BD)
    // El JWT ya contiene toda la información necesaria
    req.user = {
      id: decoded.id,
      nombreUsuario: decoded.nombreUsuario,
      email: decoded.email,
      rol: {
        id: decoded.rolId,
        nombre: decoded.rolNombre,
        permisos: decoded.permisos || [],
      },
      rolId: decoded.rolId,
      rolNombre: decoded.rolNombre,
      permisos: decoded.permisos || [],
      area: {
        id: decoded.areaId,
        nombre: decoded.areaNombre,
      },
      areaId: decoded.areaId,
      areaNombre: decoded.areaNombre,
    };

    next();
  } catch (error) {
    // Log de intento de acceso con token inválido
    if (error.name === 'AuthenticationError') {
      log.security('Authentication failed', {
        ip: req.ip,
        path: req.path,
        error: error.message,
      });
    }
    
    next(error);
  }
}

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero lo procesa si existe
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);
      const usuario = await authService.getAuthenticatedUser(decoded.id);
      
      req.user = {
        id: usuario.id,
        nombreUsuario: usuario.nombreUsuario,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: usuario.rol,
        rolNombre: usuario.rol.nombre,
        area: usuario.area,
        areaNombre: usuario.area.nombre,
        activo: usuario.activo,
      };
    }

    next();
  } catch (error) {
    // No propagar error, solo continuar sin usuario
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuthenticate,
};
