/**
 * Validador de datos de usuario
 * Reglas de validación centralizadas para usuarios
 */

const { ValidationError } = require('../utils/errors');
const { 
  isValidEmail, 
  isValidUsername, 
  validatePassword,
  sanitizeString 
} = require('../utils/validation');

/**
 * Middleware de validación para creación de usuario
 */
const validateCreateUsuario = (req, res, next) => {
  const { 
    nombre, 
    apellidos, 
    email, 
    nombreUsuario, 
    contraseña,
    areaId,
    rolId 
  } = req.body;

  const errors = [];

  // Validar campos requeridos
  if (!nombre || nombre.trim() === '') {
    errors.push('El nombre es requerido');
  } else if (nombre.length > 100) {
    errors.push('El nombre no debe exceder 100 caracteres');
  }

  if (!apellidos || apellidos.trim() === '') {
    errors.push('Los apellidos son requeridos');
  } else if (apellidos.length > 100) {
    errors.push('Los apellidos no deben exceder 100 caracteres');
  }

  // Validar email
  if (!email || email.trim() === '') {
    errors.push('El email es requerido');
  } else if (!isValidEmail(email)) {
    errors.push('El formato del email es inválido');
  } else if (email.length > 255) {
    errors.push('El email no debe exceder 255 caracteres');
  }

  // Validar nombre de usuario
  if (!nombreUsuario || nombreUsuario.trim() === '') {
    errors.push('El nombre de usuario es requerido');
  } else if (!isValidUsername(nombreUsuario)) {
    errors.push('El nombre de usuario debe tener entre 3-20 caracteres (solo letras, números y _)');
  }

  // Validar contraseña
  if (!contraseña || contraseña.trim() === '') {
    errors.push('La contraseña es requerida');
  } else {
    const passwordValidation = validatePassword(contraseña);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }
  }

  // Validar área y rol
  if (!areaId || isNaN(parseInt(areaId, 10))) {
    errors.push('El área es requerida y debe ser un número válido');
  }

  if (!rolId || isNaN(parseInt(rolId, 10))) {
    errors.push('El rol es requerido y debe ser un número válido');
  }

  // Validar teléfonos si están presentes
  if (req.body.telefono && req.body.telefono.length > 20) {
    errors.push('El teléfono no debe exceder 20 caracteres');
  }

  if (req.body.celular && req.body.celular.length > 20) {
    errors.push('El celular no debe exceder 20 caracteres');
  }

  // Si hay errores, devolver respuesta
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Errores de validación',
      details: errors,
    });
  }

  // Sanitizar strings para prevenir XSS
  req.body.nombre = sanitizeString(nombre.trim());
  req.body.apellidos = sanitizeString(apellidos.trim());
  req.body.email = email.trim().toLowerCase();
  req.body.nombreUsuario = nombreUsuario.trim();

  if (req.body.telefono) {
    req.body.telefono = sanitizeString(req.body.telefono.trim());
  }
  if (req.body.celular) {
    req.body.celular = sanitizeString(req.body.celular.trim());
  }

  next();
};

/**
 * Middleware de validación para actualización de usuario
 */
const validateUpdateUsuario = (req, res, next) => {
  const { 
    nombre, 
    apellidos, 
    email, 
    areaId,
    rolId,
    contraseña 
  } = req.body;

  const errors = [];

  // Validar campos requeridos
  if (!nombre || nombre.trim() === '') {
    errors.push('El nombre es requerido');
  } else if (nombre.length > 100) {
    errors.push('El nombre no debe exceder 100 caracteres');
  }

  if (!apellidos || apellidos.trim() === '') {
    errors.push('Los apellidos son requeridos');
  } else if (apellidos.length > 100) {
    errors.push('Los apellidos no deben exceder 100 caracteres');
  }

  // Validar email
  if (!email || email.trim() === '') {
    errors.push('El email es requerido');
  } else if (!isValidEmail(email)) {
    errors.push('El formato del email es inválido');
  } else if (email.length > 255) {
    errors.push('El email no debe exceder 255 caracteres');
  }

  // Validar contraseña si se proporciona (opcional en actualización)
  if (contraseña && contraseña.trim()) {
    const passwordValidation = validatePassword(contraseña);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }
  }

  // Validar área y rol
  if (!areaId || isNaN(parseInt(areaId, 10))) {
    errors.push('El área es requerida y debe ser un número válido');
  }

  if (!rolId || isNaN(parseInt(rolId, 10))) {
    errors.push('El rol es requerido y debe ser un número válido');
  }

  // Validar teléfonos si están presentes
  if (req.body.telefono && req.body.telefono.length > 20) {
    errors.push('El teléfono no debe exceder 20 caracteres');
  }

  if (req.body.celular && req.body.celular.length > 20) {
    errors.push('El celular no debe exceder 20 caracteres');
  }

  // Si hay errores, devolver respuesta
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Errores de validación',
      details: errors,
    });
  }

  // Sanitizar strings para prevenir XSS
  req.body.nombre = sanitizeString(nombre.trim());
  req.body.apellidos = sanitizeString(apellidos.trim());
  req.body.email = email.trim().toLowerCase();

  if (req.body.telefono) {
    req.body.telefono = sanitizeString(req.body.telefono.trim());
  }
  if (req.body.celular) {
    req.body.celular = sanitizeString(req.body.celular.trim());
  }

  next();
};

/**
 * Middleware de validación para actualización de estado
 */
const validateUpdateStatus = (req, res, next) => {
  let { activo } = req.body;

  // Convertir string a booleano si es necesario
  if (typeof activo === 'string') {
    activo = activo === 'true';
    req.body.activo = activo;
  }

  if (activo === undefined || activo === null) {
    return res.status(400).json({
      success: false,
      error: 'El campo activo es requerido',
    });
  }

  if (typeof activo !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'El campo activo debe ser un booleano',
    });
  }

  next();
};

module.exports = {
  validateCreateUsuario,
  validateUpdateUsuario,
  validateUpdateStatus,
};
