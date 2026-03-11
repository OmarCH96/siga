/**
 * Rutas de Tipos de Documento
 * Define las rutas para gestión de tipos de documento
 */

const express = require('express');
const router = express.Router();

const tipoDocumentoController = require('../controllers/tipoDocumento.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole, requirePermission } = require('../middlewares/authorize.middleware');
const { validateIdParam } = require('../middlewares/validate.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /tipo-documento/activos
 * Obtener solo tipos de documento activos (sin restricción de permisos)
 * Útil para formularios de emisión de documentos
 */
router.get('/activos', (req, res, next) => {
  req.query.activo = 'true';
  next();
}, tipoDocumentoController.getAllTiposDocumento);

/**
 * GET /tipo-documento
 * Obtener todos los tipos de documento (requiere permiso VER_TODO)
 */
router.get('/', requirePermission('VER_TODO'), tipoDocumentoController.getAllTiposDocumento);

/**
 * GET /tipo-documento/stats
 * Obtener estadísticas de tipos de documento (total, activos, inactivos)
 * OPTIMIZADO: Un solo query agregado en lugar de múltiples requests
 */
router.get('/stats', requirePermission('VER_TODO'), tipoDocumentoController.getTiposDocumentoStats);

/**
 * POST /tipo-documento
 * Crear un nuevo tipo de documento
 */
router.post(
  '/',
  requireRole('Administrador'),
  tipoDocumentoController.createTipoDocumento
);

/**
 * GET /tipo-documento/:id
 * Obtener tipo de documento por ID
 */
router.get('/:id', validateIdParam(), tipoDocumentoController.getTipoDocumentoById);

/**
 * PATCH /tipo-documento/:id
 * Actualizar tipo de documento completo
 */
router.patch(
  '/:id',
  requireRole('Administrador'),
  validateIdParam(),
  tipoDocumentoController.updateTipoDocumento
);

/**
 * PATCH /tipo-documento/:id/status
 * Actualizar solo el estado de un tipo de documento
 */
router.patch(
  '/:id/status',
  requireRole('Administrador'),
  validateIdParam(),
  tipoDocumentoController.updateTipoDocumentoStatus
);

/**
 * DELETE /tipo-documento/:id
 * Eliminar tipo de documento (soft delete)
 */
router.delete(
  '/:id',
  requireRole('Administrador'),
  validateIdParam(),
  tipoDocumentoController.deleteTipoDocumento
);

module.exports = router;
