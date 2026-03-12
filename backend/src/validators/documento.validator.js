/**
 * Validador de datos de documentos
 * Reglas de validación centralizadas para emisión y gestión de documentos
 */

const validator = require('validator');
const { ValidationError } = require('../utils/errors');
const { sanitizeString } = require('../utils/validation');

/**
 * ENUMs permitidos según el modelo de datos
 */
const PRIORIDAD_ENUM = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];
const CONTEXTO_ENUM = [
  'OFICIO',
  'MEMORANDUM',
  'CIRCULAR',
  'COMUNICADO_INT',
  'INFORME',
  'EXPEDIENTE',
  'OTRO'
];

/**
 * Middleware de validación para emisión de documentos
 * Valida los datos de entrada al crear/emitir un nuevo documento
 */
const validateEmision = (req, res, next) => {
  try {
    const {
      tipo_documento_id,
      asunto,
      contenido,
      fecha_limite,
      prioridad = 'MEDIA',
      contexto = 'OTRO',
      prestamo_numero_id,
      instrucciones,
      observaciones
    } = req.body;

    const errors = [];

    // ==========================================
    // 1. Validar tipo_documento_id (obligatorio)
    // ==========================================
    if (!tipo_documento_id) {
      errors.push('El tipo de documento es requerido');
    } else if (!Number.isInteger(Number(tipo_documento_id)) || Number(tipo_documento_id) <= 0) {
      errors.push('El tipo de documento debe ser un número entero válido');
    }

    // ==========================================
    // 2. Validar asunto (obligatorio, máx 500 caracteres)
    // ==========================================
    if (!asunto || typeof asunto !== 'string' || asunto.trim() === '') {
      errors.push('El asunto es requerido');
    } else if (asunto.length > 500) {
      errors.push('El asunto no debe exceder 500 caracteres');
    } else if (asunto.trim().length < 5) {
      errors.push('El asunto debe tener al menos 5 caracteres');
    }

    // ==========================================
    // 3. Validar contenido (opcional, pero si existe debe ser string)
    // ==========================================
    if (contenido !== undefined && contenido !== null && typeof contenido !== 'string') {
      errors.push('El contenido debe ser de tipo texto');
    }

    // ==========================================
    // 4. Validar fecha_limite (opcional, ISO 8601, >= hoy)
    // ==========================================
    if (fecha_limite) {
      if (!validator.isISO8601(fecha_limite, { strict: true, strictSeparator: true })) {
        errors.push('La fecha límite debe estar en formato ISO 8601 válido (YYYY-MM-DDTHH:mm:ss.sssZ)');
      } else {
        const fechaLimiteDate = new Date(fecha_limite);
        const ahora = new Date();
        
        if (isNaN(fechaLimiteDate.getTime())) {
          errors.push('La fecha límite no es una fecha válida');
        } else if (fechaLimiteDate < ahora) {
          errors.push('La fecha límite debe ser igual o posterior a la fecha actual');
        }
      }
    }

    // ==========================================
    // 5. Validar prioridad (enum)
    // ==========================================
    if (prioridad && !PRIORIDAD_ENUM.includes(prioridad)) {
      errors.push(`La prioridad debe ser uno de: ${PRIORIDAD_ENUM.join(', ')}`);
    }

    // ==========================================
    // 6. Validar contexto (enum)
    // ==========================================
    if (contexto && !CONTEXTO_ENUM.includes(contexto)) {
      errors.push(`El contexto debe ser uno de: ${CONTEXTO_ENUM.join(', ')}`);
    }

    // ==========================================
    // 7. Validar prestamo_numero_id (obligatorio SI contexto === 'OFICIO')
    // ==========================================
    if (contexto === 'OFICIO') {
      if (!prestamo_numero_id) {
        errors.push('El préstamo de número de oficio es requerido para documentos de tipo OFICIO');
      } else if (!Number.isInteger(Number(prestamo_numero_id)) || Number(prestamo_numero_id) <= 0) {
        errors.push('El ID de préstamo de número debe ser un número entero válido');
      }
    }

    // ==========================================
    // 8. Validar instrucciones (opcional, máx 2000 caracteres)
    // ==========================================
    if (instrucciones) {
      if (typeof instrucciones !== 'string') {
        errors.push('Las instrucciones deben ser de tipo texto');
      } else if (instrucciones.length > 2000) {
        errors.push('Las instrucciones no deben exceder 2000 caracteres');
      }
    }

    // ==========================================
    // 9. Validar observaciones (opcional)
    // ==========================================
    if (observaciones && typeof observaciones !== 'string') {
      errors.push('Las observaciones deben ser de tipo texto');
    }

    // ==========================================
    // Lanzar error si hay validaciones fallidas
    // ==========================================
    if (errors.length > 0) {
      throw new ValidationError(
        `Errores de validación en la emisión del documento: ${errors.join('; ')}`
      );
    }

    // ==========================================
    // Sanitizar campos de texto para prevenir XSS
    // ==========================================
    if (asunto) {
      req.body.asunto = sanitizeString(asunto.trim());
    }

    if (contenido) {
      req.body.contenido = sanitizeString(contenido.trim());
    }

    if (instrucciones) {
      req.body.instrucciones = sanitizeString(instrucciones.trim());
    }

    if (observaciones) {
      req.body.observaciones = sanitizeString(observaciones.trim());
    }

    // Establecer defaults si no existen
    req.body.prioridad = prioridad || 'MEDIA';
    req.body.contexto = contexto || 'OTRO';

    // Continuar al siguiente middleware
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateEmision
};
