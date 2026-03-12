/**
 * Rutas de Documentos
 * Define los endpoints para gestión de documentos
 */

const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documento.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/authorize.middleware');
const { validateEmision } = require('../validators/documento.validator');
const { sanitizeBody } = require('../middlewares/sanitize.middleware');
const { validateIdParam } = require('../middlewares/validate.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * POST /api/documentos/emitir
 * Emitir un nuevo documento desde el área del usuario autenticado
 * Requiere: Autenticación + Permiso CREAR_DOCUMENTO + Validación de datos
 */
router.post(
  '/emitir',
  requirePermission('CREAR_DOCUMENTO'),
  validateEmision,
  sanitizeBody,
  documentoController.emitirDocumento
);

/**
 * GET /api/documentos
 * Listar documentos emitidos por el usuario/área con paginación
 * Query params: page, limit, estado
 * Requiere: Autenticación + Permiso CREAR_DOCUMENTO
 */
router.get(
  '/',
  requirePermission('CREAR_DOCUMENTO'),
  documentoController.listarMisDocumentos
);

/**
 * GET /api/documentos/tipos
 * Obtener catálogo de tipos de documento disponibles
 * Requiere solo autenticación (todos los usuarios pueden ver los tipos)
 * IMPORTANTE: Debe ir antes de /api/documentos/:id para evitar conflictos
 */
router.get('/tipos', documentoController.obtenerTiposDocumento);

/**
 * GET /api/documentos/bandeja-recepcion
 * Obtener bandeja de recepción del usuario actual
 * Documentos con nodo activo PENDIENTE en su área
 * IMPORTANTE: Debe ir antes de /api/documentos/:id para evitar conflictos
 */
router.get('/bandeja-recepcion', documentoController.getBandejaRecepcion);

/**
 * GET /api/documentos/validar-turno
 * Validar si un turno de documento es permitido desde el área del usuario a un área destino
 * Query params: area_destino_id
 * Requiere: Autenticación
 * IMPORTANTE: Debe ir antes de /api/documentos/:id para evitar conflictos
 */
router.get('/validar-turno', documentoController.validarTurno);

/**
 * GET /api/documentos/:id
 * Obtener detalle de un documento por ID con validación de permisos
 * Requiere: Autenticación (RLS valida permisos de lectura)
 */
router.get('/:id', validateIdParam(), documentoController.obtenerDocumento);

/**
 * POST /api/documentos/:id/turnar
 * Turnar un documento a otra área
 * Requiere: Autenticación + Permiso CREAR_DOCUMENTO (implica poder turnar)
 * Body: { area_destino_id, observaciones?, instrucciones? }
 */
router.post(
  '/:id/turnar',
  validateIdParam(),
  requirePermission('CREAR_DOCUMENTO'),
  sanitizeBody,
  documentoController.turnarDocumento
);

/**
 * POST /api/documentos/:id/copias
 * Crear copias de conocimiento de un documento hacia múltiples áreas
 * Requiere: Autenticación + Permiso CREAR_DOCUMENTO (implica poder copiar)
 * Body: { areas_ids: [1, 2, 3] }
 */
router.post(
  '/:id/copias',
  validateIdParam(),
  requirePermission('CREAR_DOCUMENTO'),
  sanitizeBody,
  documentoController.crearCopiasConocimiento
);

/**
 * POST /api/documentos/:id/recibir
 * Confirmar recepción de un documento pendiente en el área del usuario
 * Requiere: Autenticación + Permiso CREAR_DOCUMENTO
 * Body: { observaciones? } (opcional)
 */
router.post(
  '/:id/recibir',
  validateIdParam(),
  requirePermission('CREAR_DOCUMENTO'),
  sanitizeBody,
  documentoController.recibirDocumento
);

module.exports = router;
