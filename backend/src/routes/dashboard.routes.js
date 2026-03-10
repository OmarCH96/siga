/**
 * Rutas de Dashboard
 * Endpoints para obtener datos del dashboard administrativo
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/dashboard/datos
 * @desc    Obtiene datos del dashboard (unidades, métricas, distribución)
 * @access  Privado (autenticado)
 */
router.get('/datos', dashboardController.getDatos);

/**
 * @route   GET /api/dashboard/registros
 * @desc    Obtiene registros/documentos recientes
 * @access  Privado (autenticado)
 */
router.get('/registros', dashboardController.getRegistros);

/**
 * @route   GET /api/dashboard/usuarios
 * @desc    Obtiene lista de usuarios activos
 * @access  Privado (autenticado)
 */
router.get('/usuarios', dashboardController.getUsuarios);

module.exports = router;
