/**
 * Middleware de autenticación
 * Verifica que el usuario esté autenticado mediante JWT
 */

const authService = require('../services/auth.service');
const { AuthenticationError } = require('../utils/errors');

/**
 * Verifica que el token JWT sea válido
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

    // Verificar el token
    const decoded = authService.verifyToken(token);

    // Obtener información completa del usuario
    const usuario = await authService.getAuthenticatedUser(decoded.id);

    // Agregar usuario al request
    req.user = usuario;

    next();
  } catch (error) {
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
      req.user = usuario;
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
