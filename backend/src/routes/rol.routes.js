/**
 * Rutas de Roles
 * Define las rutas para gestión de roles y permisos
 */

const express = require('express');
const router = express.Router();

const rolController = require('../controllers/rol.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateIdParam } = require('../middlewares/validate.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /roles
 * Obtener todos los roles activos
 */
router.get('/', rolController.getAllRoles);

/**
 * GET /roles/:id
 * Obtener rol por ID
 */
router.get('/:id', validateIdParam(), rolController.getRolById);

module.exports = router;
