/**
 * Middleware de validación de requests
 * Valida el cuerpo, parámetros y query de las peticiones
 */

const { ValidationError } = require('../utils/errors');
const { validateRequiredFields } = require('../utils/validation');

/**
 * Middleware para validar campos requeridos en el body
 * @param {Array<string>} fields - Lista de campos requeridos
 */
function validateBody(...fields) {
  return (req, res, next) => {
    try {
      const validation = validateRequiredFields(req.body, fields);

      if (!validation.valid) {
        throw new ValidationError(
          `Faltan campos requeridos: ${validation.missingFields.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para validar que un parámetro sea un ID numérico válido
 * @param {string} paramName - Nombre del parámetro
 */
function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    try {
      const id = parseInt(req.params[paramName], 10);

      if (isNaN(id) || id <= 0) {
        throw new ValidationError(`${paramName} debe ser un número positivo válido`);
      }

      // Agregar ID parseado al request
      req.params[`${paramName}Parsed`] = id;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para validar query parameters
 * @param {Object} schema - Esquema de validación
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const errors = [];

      for (const [key, validator] of Object.entries(schema)) {
        const value = req.query[key];

        if (value !== undefined) {
          const result = validator(value);
          if (result !== true) {
            errors.push(result);
          }
        }
      }

      if (errors.length > 0) {
        throw new ValidationError(`Parámetros inválidos: ${errors.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Sanitiza el body del request removiendo campos no permitidos
 * @param {Array<string>} allowedFields - Campos permitidos
 */
function sanitizeBody(...allowedFields) {
  return (req, res, next) => {
    const sanitized = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        sanitized[field] = req.body[field];
      }
    }

    req.body = sanitized;
    next();
  };
}

module.exports = {
  validateBody,
  validateIdParam,
  validateQuery,
  sanitizeBody,
};
