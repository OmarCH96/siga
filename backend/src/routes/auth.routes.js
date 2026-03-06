/**
 * Rutas de Autenticación
 * Define las rutas de login, registro y perfil
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { validateBody } = require('../middlewares/validate.middleware');

/**
 * POST /auth/login
 * Login de usuario
 */
router.post(
  '/login',
  validateBody('nombreUsuario', 'contraseña'),
  authController.login
);

/**
 * POST /auth/register
 * Registro de nuevo usuario (solo administradores)
 */
router.post(
  '/register',
  authenticate,
  requireRole('Administrador'),
  validateBody(
    'nombre',
    'apellidos',
    'email',
    'nombreUsuario',
    'contraseña',
    'areaId',
    'rolId'
  ),
  authController.register
);

/**
 * GET /auth/me
 * Obtener perfil del usuario autenticado
 */
router.get('/me', authenticate, authController.getProfile);

/**
 * GET /auth/verify
 * Verificar validez del token
 */
router.get('/verify', authenticate, authController.verifyToken);

module.exports = router;
