/**
 * Rutas de Usuarios
 * Define las rutas para gestión de usuarios
 */

const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuario.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole, requirePermission } = require('../middlewares/authorize.middleware');
const { validateIdParam, validateBody } = require('../middlewares/validate.middleware');
const { validateCreateUsuario, validateUpdateUsuario, validateUpdateStatus } = require('../middlewares/usuario.validator');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /usuarios
 * Obtener todos los usuarios
 */
router.get('/', requirePermission('VER_TODO'), usuarioController.getAllUsuarios);

/**
 * GET /usuarios/stats
 * Obtener estadísticas de usuarios (total, activos, inactivos)
 * OPTIMIZADO: Un solo query agregado en lugar de múltiples requests
 * IMPORTANTE: Debe ir antes de /usuarios/:id para evitar conflictos
 */
router.get('/stats', requirePermission('VER_TODO'), usuarioController.getUsuariosStats);

/**
 * GET /usuarios/area/:areaId
 * Obtener usuarios de un área
 * IMPORTANTE: Debe ir antes de /usuarios/:id para evitar conflictos
 */
router.get(
  '/area/:areaId',
  validateIdParam('areaId'),
  usuarioController.getUsuariosByArea
);

/**
 * POST /usuarios
 * Crear un nuevo usuario
 */
router.post(
  '/',
  requireRole('Administrador'),
  validateCreateUsuario,
  usuarioController.createUsuario
);

/**
 * GET /usuarios/:id
 * Obtener usuario por ID
 */
router.get('/:id', validateIdParam(), usuarioController.getUsuarioById);

/**
 * PATCH /usuarios/:id
 * Actualizar usuario completo
 */
router.patch(
  '/:id',
  requireRole('Administrador'),
  validateIdParam(),
  validateUpdateUsuario,
  usuarioController.updateUsuario
);

/**
 * PATCH /usuarios/:id/status
 * Actualizar estado activo del usuario
 */
router.patch(
  '/:id/status',
  requireRole('Administrador'),
  validateUpdateStatus,
  usuarioController.updateUsuarioStatus
);

module.exports = router;
