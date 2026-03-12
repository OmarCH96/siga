/**
 * Rutas de Préstamos
 * Define las rutas para gestión de préstamos de números de oficio
 */

const express = require('express');
const router = express.Router();

const prestamoController = require('../controllers/prestamo.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /prestamos/areas-prestamistas
 * Obtener áreas ancestras autorizadas para prestar números al usuario actual
 */
router.get('/areas-prestamistas', prestamoController.getAreasPrestamistas);

/**
 * GET /prestamos/preview-folio?area_id=X
 * Obtener vista previa del formato de folio para un área
 */
router.get('/preview-folio', prestamoController.getPreviewFolio);

/**
 * GET /prestamos/aprobados
 * Obtener préstamos aprobados disponibles para el usuario
 */
router.get('/aprobados', prestamoController.getPrestamosAprobados);

/**
 * GET /prestamos/pendientes
 * Obtener préstamos pendientes (solicitados) del área
 */
router.get('/pendientes', prestamoController.getPrestamosPendientes);

/**
 * POST /prestamos/solicitar
 * Solicitar un préstamo de número de oficio
 * Body: { area_prestamista_id, motivacion }
 */
router.post('/solicitar', prestamoController.solicitarPrestamo);

/**
 * POST /prestamos/:id/resolver
 * Aprobar o rechazar un préstamo
 * Body: { aprobar: boolean, motivo?: string, dias_vencimiento?: number }
 */
router.post('/:id/resolver', prestamoController.resolverPrestamo);

/**
 * POST /prestamos/:id/utilizar
 * Marcar un préstamo como utilizado
 */
router.post('/:id/utilizar', prestamoController.marcarUtilizado);

module.exports = router;
