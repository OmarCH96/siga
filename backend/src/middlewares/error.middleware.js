/**
 * Middleware de manejo de errores
 * Captura y procesa todos los errores de la aplicación de forma segura
 */

const { AppError } = require('../utils/errors');
const config = require('../config');
const log = require('../utils/logger');

/**
 * Maneja errores de base de datos PostgreSQL
 * @param {Error} err - Error de PostgreSQL
 * @returns {AppError} Error normalizado
 */
function handleDatabaseError(err) {
  // Error de violación de restricción única
  if (err.code === '23505') {
    const match = err.detail?.match(/Key \((.*?)\)=/);
    const field = match ? match[1] : 'campo';
    return new AppError(`El ${field} ya existe en el sistema`, 409);
  }

  // Error de violación de llave foránea
  if (err.code === '23503') {
    return new AppError('Referencia inválida a recurso relacionado', 400);
  }

  // Error de violación de restricción NOT NULL
  if (err.code === '23502') {
    return new AppError('Falta un campo requerido', 400);
  }

  // Error de sintaxis SQL
  if (err.code === '42601') {
    return new AppError('Error de consulta a base de datos', 500);
  }

  return new AppError('Error de base de datos', 500);
}

/**
 * Middleware principal de manejo de errores
 */
function errorHandler(err, req, res, next) {
  let error = err;

  // Log del error (sanitizado - sin info sensible)
  log.error('Error handled', {
    message: err.message,
    statusCode: err.statusCode,
    stack: config.env === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
  });

  // Convertir errores de base de datos
  if (err.code && err.code.length === 5) {
    error = handleDatabaseError(err);
  }

  // Si no es un error operacional, convertirlo
  if (!(error instanceof AppError)) {
    // No exponer detalles internos en producción
    const message = config.env === 'development' 
      ? error.message 
      : 'Error interno del servidor';
    error = new AppError(message, 500);
  }

  // Respuesta de error
  const response = {
    success: false,
    status: error.status,
    message: error.message,
    code: error.code || 'INTERNAL_ERROR',
  };

  // Incluir stack trace solo en desarrollo
  if (config.env === 'development') {
    response.stack = error.stack;
    response.originalError = err.message;
  }

  res.status(error.statusCode).json(response);
}

/**
 * Middleware para rutas no encontradas
 */
function notFoundHandler(req, res, next) {
  log.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  const error = new AppError(
    `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
}

/**
 * Wrapper para funciones asíncronas en rutas
 * Captura errores y los pasa al middleware de errores
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
