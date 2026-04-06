/**
 * Controlador de Áreas (Unidades Administrativas)
 * Maneja las peticiones HTTP para operaciones CRUD de áreas
 */

const areaService = require('../services/area.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const { ValidationError } = require('../utils/errors');

/**
 * Obtener todas las áreas con filtros y paginación
 * GET /api/areas
 * Query params: activa, tipo, areaPadreId, busqueda, page, limit
 */
const getAllAreas = asyncHandler(async (req, res) => {
  const filters = {
    activa: req.query.activa !== undefined ? req.query.activa === 'true' : undefined,
    tipo: req.query.tipo || undefined,
    areaPadreId: req.query.areaPadreId ? parseInt(req.query.areaPadreId, 10) : undefined,
    busqueda: req.query.busqueda || undefined,
    page: req.query.page ? parseInt(req.query.page, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
  };

  const result = await areaService.getAllAreas(filters);

  res.status(200).json({
    success: true,
    data: result.rows,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

/**
 * Obtener todas las áreas activas (sin paginación)
 * GET /api/areas/activas
 * Útil para selectores y listas desplegables
 */
const getAreasActivas = asyncHandler(async (req, res) => {
  const areas = await areaService.getAreasActivas();

  res.status(200).json({
    success: true,
    count: areas.length,
    data: areas,
  });
});

/**
 * Obtener árbol jerárquico de áreas
 * GET /api/areas/arbol
 * Query params: areaPadreId (opcional)
 */
const getArbolJerarquico = asyncHandler(async (req, res) => {
  const areaPadreId = req.query.areaPadreId
    ? parseInt(req.query.areaPadreId, 10)
    : null;

  const arbol = await areaService.getArbolJerarquico(areaPadreId);

  res.status(200).json({
    success: true,
    count: arbol.length,
    data: arbol,
  });
});

/**
 * Obtener jerarquía de áreas (alias para compatibilidad)
 * GET /api/areas/jerarquia
 */
const getAreasHierarchy = asyncHandler(async (req, res) => {
  const areas = await areaService.getAreasActivas();

  res.status(200).json({
    success: true,
    count: areas.length,
    data: areas,
  });
});

/**
 * Obtener estadísticas de áreas
 * GET /api/areas/estadisticas
 */
const getEstadisticas = asyncHandler(async (req, res) => {
  const estadisticas = await areaService.getEstadisticas();

  res.status(200).json({
    success: true,
    data: estadisticas,
  });
});

/**
 * Obtener un área por ID
 * GET /api/areas/:id
 */
const getAreaById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    throw new ValidationError('ID de área inválido');
  }

  const area = await areaService.getAreaById(id);

  res.status(200).json({
    success: true,
    data: area,
  });
});

/**
 * Obtener ruta jerárquica de un área
 * GET /api/areas/:id/ruta
 */
const getRutaJerarquica = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    throw new ValidationError('ID de área inválido');
  }

  const ruta = await areaService.getRutaJerarquica(id);

  res.status(200).json({
    success: true,
    count: ruta.length,
    data: ruta,
  });
});

/**
 * Obtener subáreas de un área
 * GET /api/areas/:id/subareas
 * Query params: soloActivas (default: true)
 */
const getSubareas = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    throw new ValidationError('ID de área inválido');
  }

  const soloActivas = req.query.soloActivas !== 'false'; // Por defecto true

  const subareas = await areaService.getSubareas(id, soloActivas);

  res.status(200).json({
    success: true,
    count: subareas.length,
    data: subareas,
  });
});

/**
 * Crear una nueva área
 * POST /api/areas
 * Body: { nombre, clave, tipo, areaPadreId?, descripcion? }
 */
const createArea = asyncHandler(async (req, res) => {
  const { nombre, clave, tipo, areaPadreId, descripcion } = req.body;

  // Validar campos requeridos
  if (!nombre || !clave || !tipo) {
    throw new ValidationError('Nombre, clave y tipo son campos requeridos');
  }

  const areaData = {
    nombre,
    clave,
    tipo,
    areaPadreId: areaPadreId !== undefined ? areaPadreId : null,
    descripcion: descripcion || null,
  };

  const nuevaArea = await areaService.createArea(areaData, req.user);

  res.status(201).json({
    success: true,
    message: 'Área creada exitosamente',
    data: nuevaArea,
  });
});

/**
 * Actualizar un área
 * PUT /api/areas/:id
 * Body: { nombre?, clave?, tipo?, areaPadreId?, descripcion?, activa? }
 */
const updateArea = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    throw new ValidationError('ID de área inválido');
  }

  const { nombre, clave, tipo, areaPadreId, descripcion, activa } = req.body;

  // Construir objeto de actualización solo con campos proporcionados
  const updateData = {};

  if (nombre !== undefined) updateData.nombre = nombre;
  if (clave !== undefined) updateData.clave = clave;
  if (tipo !== undefined) updateData.tipo = tipo;
  if (areaPadreId !== undefined) updateData.areaPadreId = areaPadreId;
  if (descripcion !== undefined) updateData.descripcion = descripcion;
  if (activa !== undefined) updateData.activa = activa;

  // Validar que al menos un campo esté presente
  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('Debe proporcionar al menos un campo para actualizar');
  }

  const areaActualizada = await areaService.updateArea(id, updateData, req.user);

  res.status(200).json({
    success: true,
    message: 'Área actualizada exitosamente',
    data: areaActualizada,
  });
});

/**
 * Activar o desactivar un área
 * PATCH /api/areas/:id/status
 * Body: { activa: boolean }
 */
const toggleStatusArea = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    throw new ValidationError('ID de área inválido');
  }

  const { activa } = req.body;

  if (typeof activa !== 'boolean') {
    throw new ValidationError('El campo "activa" debe ser un valor booleano');
  }

  const areaActualizada = await areaService.toggleStatusArea(id, activa, req.user);

  res.status(200).json({
    success: true,
    message: `Área ${activa ? 'activada' : 'desactivada'} exitosamente`,
    data: areaActualizada,
  });
});

module.exports = {
  getAllAreas,
  getAreasActivas,
  getArbolJerarquico,
  getAreasHierarchy,
  getEstadisticas,
  getAreaById,
  getRutaJerarquica,
  getSubareas,
  createArea,
  updateArea,
  toggleStatusArea,
};
