/**
 * Rutas de Registro de Accesos
 * Endpoint protegido solo para administradores.
 */

const express = require('express');
const router = express.Router();
const accesosController = require('../controllers/accesos.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');

router.use(authenticate);
router.use(requireRole('Administrador'));

/**
 * @route  GET /api/accesos
 * @desc   Lista registros de auditoria_sistema con paginación y filtros
 * @access Privado — solo Administrador
 */
router.get('/', accesosController.listarAccesos);

module.exports = router;
