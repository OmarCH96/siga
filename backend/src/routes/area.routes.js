/**
 * Rutas de Áreas (Unidades Administrativas)
 * Define las rutas para gestión de áreas organizacionales
 */

const express = require('express');
const router = express.Router();

const areaController = require('../controllers/area.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole, requirePermission } = require('../middlewares/authorize.middleware');
const { validateIdParam } = require('../middlewares/validate.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/areas/activas
 * Obtener todas las áreas activas sin paginación
 * Útil para selectores, listas desplegables
 * IMPORTANTE: Debe ir antes de /api/areas/:id
 */
router.get('/activas', areaController.getAreasActivas);

/**
 * GET /api/areas/arbol
 * Obtener árbol jerárquico de áreas
 * Query params: areaPadreId (opcional)
 * IMPORTANTE: Debe ir antes de /api/areas/:id
 */
router.get('/arbol', areaController.getArbolJerarquico);

/**
 * GET /api/areas/jerarquia
 * Obtener jerarquía de áreas (alias para compatibilidad)
 * IMPORTANTE: Debe ir antes de /api/areas/:id
 */
router.get('/jerarquia', areaController.getAreasHierarchy);

/**
 * GET /api/areas/estadisticas
 * Obtener estadísticas de áreas
 * Solo administradores
 * IMPORTANTE: Debe ir antes de /api/areas/:id
 */
router.get(
  '/estadisticas',
  requireRole('Administrador'),
  areaController.getEstadisticas
);

/**
 * GET /api/areas
 * Obtener todas las áreas con filtros y paginación
 * Query params: activa, tipo, areaPadreId, busqueda, page, limit
 */
router.get('/', areaController.getAllAreas);

/**
 * POST /api/areas
 * Crear una nueva área
 * Solo administradores
 * Body: { nombre, clave, tipo, areaPadreId?, descripcion? }
 */
router.post(
  '/',
  requireRole('Administrador'),
  areaController.createArea
);

/**
 * GET /api/areas/:id
 * Obtener un área por ID
 */
router.get(
  '/:id',
  validateIdParam(),
  areaController.getAreaById
);

/**
 * GET /api/areas/:id/ruta
 * Obtener ruta jerárquica de un área
 */
router.get(
  '/:id/ruta',
  validateIdParam(),
  areaController.getRutaJerarquica
);

/**
 * GET /api/areas/:id/subareas
 * Obtener subáreas de un área
 * Query params: soloActivas (default: true)
 */
router.get(
  '/:id/subareas',
  validateIdParam(),
  areaController.getSubareas
);

/**
 * PUT /api/areas/:id
 * Actualizar un área
 * Solo administradores
 * Body: { nombre?, clave?, tipo?, areaPadreId?, descripcion?, activa? }
 */
router.put(
  '/:id',
  requireRole('Administrador'),
  validateIdParam(),
  areaController.updateArea
);

/**
 * PATCH /api/areas/:id/status
 * Activar o desactivar un área
 * Solo administradores
 * Body: { activa: boolean }
 */
router.patch(
  '/:id/status',
  requireRole('Administrador'),
  validateIdParam(),
  areaController.toggleStatusArea
);

/**
 * GET /api/areas/:id/documentos
 * Obtiene los documentos (emisiones o recepciones) de un área.
 * Query params: tipo, page, limit, busqueda, estado, claveTipo
 */
router.get(
  '/:id/documentos',
  validateIdParam(),
  areaController.getDocumentosPorArea
);

module.exports = router;
