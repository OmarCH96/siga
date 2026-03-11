/**
 * Rutas de Documentos
 * Define los endpoints para gestión de documentos
 */

const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documento.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * POST /api/documentos
 * Emitir un nuevo documento desde el área del usuario autenticado
 * Requiere autenticación - El área y usuario se toman del token JWT
 */
router.post('/', documentoController.crearDocumento);

/**
 * GET /api/documentos/bandeja-recepcion
 * Obtener bandeja de recepción del usuario actual
 * Documentos con nodo activo PENDIENTE en su área
 */
router.get('/bandeja-recepcion', documentoController.getBandejaRecepcion);

/**
 * GET /api/documentos/:id
 * Obtener detalle de un documento con cadena de custodia
 */
router.get('/:id', documentoController.getDocumentoDetalle);

module.exports = router;
