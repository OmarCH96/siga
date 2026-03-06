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

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /usuarios
 * Obtener todos los usuarios
 */
router.get('/', requirePermission('VER_TODO'), usuarioController.getAllUsuarios);

/**
 * GET /usuarios/:id
 * Obtener usuario por ID
 */
router.get('/:id', validateIdParam(), usuarioController.getUsuarioById);

/**
 * GET /usuarios/area/:areaId
 * Obtener usuarios de un área
 */
router.get(
  '/area/:areaId',
  validateIdParam('areaId'),
  usuarioController.getUsuariosByArea
);

/**
 * PATCH /usuarios/:id/status
 * Actualizar estado activo del usuario
 */
router.patch(
  '/:id/status',
  requireRole('Administrador'),
  validateIdParam(),
  validateBody('activo'),
  usuarioController.updateUsuarioStatus
);

module.exports = router;
