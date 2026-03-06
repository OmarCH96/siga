/**
 * Middleware de manejo de errores
 * Captura y procesa todos los errores de la aplicación
 */

const { AppError } = require('../utils/errors');
const config = require('../config');

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

  // Log del error
  console.error('Error capturado:', {
    message: err.message,
    stack: config.env === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.id,
  });

  // Convertir errores de base de datos
  if (err.code && err.code.length === 5) {
    error = handleDatabaseError(err);
  }

  // Si no es un error operacional, convertirlo
  if (!(error instanceof AppError)) {
    error = new AppError('Error interno del servidor', 500);
  }

  // Respuesta de error
  const response = {
    status: error.status,
    message: error.message,
  };

  // Incluir stack trace solo en desarrollo
  if (config.env === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
}

/**
 * Middleware para rutas no encontradas
 */
function notFoundHandler(req, res, next) {
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
