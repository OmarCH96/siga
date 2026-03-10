/**
 * Rutas de Autenticación
 * Define las rutas de login, registro, logout y gestión de sesiones
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { validateBody } = require('../middlewares/validate.middleware');
const { checkBruteForce } = require('../middlewares/rateLimit.middleware');
const csrfMiddleware = require('../middlewares/csrf.middleware');

/**
 * POST /auth/login
 * Login de usuario
 * Protegido con rate limiting y anti brute force
 */
router.post(
  '/login',
  checkBruteForce,
  validateBody('nombreUsuario', 'contraseña'),
  authController.login
);

/**
 * POST /auth/refresh
 * Refrescar access token usando refresh token
 */
router.post(
  '/refresh',
  validateBody('refreshToken'),
  authController.refreshToken
);

/**
 * POST /auth/logout
 * Cerrar sesión actual
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * POST /auth/logout-all
 * Cerrar todas las sesiones del usuario
 */
router.post(
  '/logout-all',
  authenticate,
  authController.logoutAll
);

/**
 * POST /auth/register
 * Registro de nuevo usuario (solo administradores)
 * Protegido con CSRF
 */
router.post(
  '/register',
  authenticate,
  requireRole('Administrador'),
  csrfMiddleware.validateToken,
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
 * GET /auth/sessions
 * Obtener sesiones activas del usuario
 */
router.get('/sessions', authenticate, authController.getSessions);

/**
 * GET /auth/verify
 * Verificar validez del token
 */
router.get('/verify', authenticate, authController.verifyToken);

/**
 * GET /auth/csrf-token
 * Obtener token CSRF para formularios
 */
router.get(
  '/csrf-token',
  authenticate,
  csrfMiddleware.generateToken,
  (req, res) => {
    res.json({
      success: true,
      data: { csrfToken: req.csrfToken },
    });
  }
);

module.exports = router;
