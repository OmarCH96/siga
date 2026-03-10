/**
 * Rutas de Áreas
 * Define las rutas para gestión de áreas organizacionales
 */

const express = require('express');
const router = express.Router();

const areaController = require('../controllers/area.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /areas
 * Obtener todas las áreas activas
 */
router.get('/', areaController.getAllAreas);

/**
 * GET /areas/jerarquia
 * Obtener jerarquía de áreas
 */
router.get('/jerarquia', areaController.getAreasHierarchy);

module.exports = router;
