/**
 * Utilidades de validación
 * Funciones para validar datos de entrada
 */

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validatePassword(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida un nombre de usuario
 * @param {string} username - Nombre de usuario
 * @returns {boolean} true si es válido
 */
function isValidUsername(username) {
  // Solo letras, números y guión bajo, 3-20 caracteres
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Sanitiza una cadena de texto, removiendo caracteres peligrosos
 * @param {string} str - Cadena a sanitizar
 * @returns {string} Cadena sanitizada
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  
  // Remover caracteres HTML peligrosos
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valida que un objeto tenga los campos requeridos
 * @param {Object} obj - Objeto a validar
 * @param {Array<string>} requiredFields - Campos requeridos
 * @returns {Object} { valid: boolean, missingFields: Array }
 */
function validateRequiredFields(obj, requiredFields) {
  const missingFields = requiredFields.filter(field => {
    return !obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '');
  });

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

module.exports = {
  isValidEmail,
  validatePassword,
  isValidUsername,
  sanitizeString,
  validateRequiredFields,
};
