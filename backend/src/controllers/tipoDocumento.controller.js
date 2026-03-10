/**
 * Controlador de Tipos de Documento
 * Maneja las operaciones CRUD de tipos de documento
 */

const tipoDocumentoRepository = require('../repositories/tipoDocumento.repository');
const { asyncHandler } = require('../middlewares/error.middleware');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');

/**
 * Obtener todos los tipos de documento
 * GET /tipo-documento
 */
const getAllTiposDocumento = asyncHandler(async (req, res) => {
  const filters = {
    activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
    search: req.query.search || undefined,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
  };

  const result = await tipoDocumentoRepository.findAll(filters);

  res.status(200).json({
    success: true,
    count: result.rows.length,
    total: result.total,
    data: result.rows,
  });
});

/**
 * Obtener tipo de documento por ID
 * GET /tipo-documento/:id
 */
const getTipoDocumentoById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const tipoDocumento = await tipoDocumentoRepository.findById(id);

  if (!tipoDocumento) {
    throw new NotFoundError('Tipo de documento no encontrado');
  }

  res.status(200).json({
    success: true,
    data: tipoDocumento,
  });
});

/**
 * Crear un nuevo tipo de documento
 * POST /tipo-documento
 */
const createTipoDocumento = asyncHandler(async (req, res) => {
  const { nombre, clave, descripcion, plantilla, requiere_respuesta } = req.body;

  // Validar que el nombre no esté vacío
  if (!nombre || nombre.trim().length === 0) {
    throw new BadRequestError('El nombre del tipo de documento es requerido');
  }

  // Validar que la clave no esté vacía
  if (!clave || clave.trim().length === 0) {
    throw new BadRequestError('La clave del tipo de documento es requerida');
  }

  // Verificar que la clave no exista
  const existingTipoDocumento = await tipoDocumentoRepository.findByClave(clave);
  if (existingTipoDocumento) {
    throw new ConflictError('Ya existe un tipo de documento con esa clave');
  }

  // Crear el tipo de documento
  const nuevoTipoDocumento = await tipoDocumentoRepository.create({
    nombre: nombre.trim(),
    clave: clave.trim().toUpperCase(),
    descripcion: descripcion?.trim() || null,
    plantilla: plantilla?.trim() || null,
    requiere_respuesta: requiere_respuesta || false,
  });

  res.status(201).json({
    success: true,
    message: 'Tipo de documento creado exitosamente',
    data: nuevoTipoDocumento,
  });
});

/**
 * Actualizar tipo de documento
 * PATCH /tipo-documento/:id
 */
const updateTipoDocumento = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre, clave, descripcion, plantilla, requiere_respuesta } = req.body;

  // Verificar que el tipo de documento existe
  const tipoDocumento = await tipoDocumentoRepository.findById(id);
  if (!tipoDocumento) {
    throw new NotFoundError('Tipo de documento no encontrado');
  }

  // Si se está cambiando la clave, verificar que no exista otra con la misma
  if (clave && clave !== tipoDocumento.clave) {
    const existingTipoDocumento = await tipoDocumentoRepository.findByClave(clave);
    if (existingTipoDocumento) {
      throw new ConflictError('Ya existe un tipo de documento con esa clave');
    }
  }

  // Preparar datos para actualizar
  const updateData = {};
  if (nombre !== undefined) updateData.nombre = nombre.trim();
  if (clave !== undefined) updateData.clave = clave.trim().toUpperCase();
  if (descripcion !== undefined) updateData.descripcion = descripcion?.trim() || null;
  if (plantilla !== undefined) updateData.plantilla = plantilla?.trim() || null;
  if (requiere_respuesta !== undefined) updateData.requiere_respuesta = requiere_respuesta;

  // Actualizar
  const tipoDocumentoActualizado = await tipoDocumentoRepository.update(id, updateData);

  res.status(200).json({
    success: true,
    message: 'Tipo de documento actualizado exitosamente',
    data: tipoDocumentoActualizado,
  });
});

/**
 * Actualizar estado de tipo de documento
 * PATCH /tipo-documento/:id/status
 */
const updateTipoDocumentoStatus = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { activo } = req.body;

  if (activo === undefined) {
    throw new BadRequestError('El campo activo es requerido');
  }

  // Verificar que el tipo de documento existe
  const tipoDocumento = await tipoDocumentoRepository.findById(id);
  if (!tipoDocumento) {
    throw new NotFoundError('Tipo de documento no encontrado');
  }

  // Actualizar estado
  const tipoDocumentoActualizado = await tipoDocumentoRepository.updateStatus(id, activo);

  res.status(200).json({
    success: true,
    message: `Tipo de documento ${activo ? 'activado' : 'desactivado'} exitosamente`,
    data: tipoDocumentoActualizado,
  });
});

/**
 * Eliminar tipo de documento (soft delete)
 * DELETE /tipo-documento/:id
 */
const deleteTipoDocumento = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  // Verificar que el tipo de documento existe
  const tipoDocumento = await tipoDocumentoRepository.findById(id);
  if (!tipoDocumento) {
    throw new NotFoundError('Tipo de documento no encontrado');
  }

  // Eliminar (soft delete)
  await tipoDocumentoRepository.delete(id);

  res.status(200).json({
    success: true,
    message: 'Tipo de documento eliminado exitosamente',
  });
});

/**
 * Obtener estadísticas de tipos de documento
 * GET /tipo-documento/stats
 * OPTIMIZADO: Hace un solo query agregado en lugar de múltiples requests
 */
const getTiposDocumentoStats = asyncHandler(async (req, res) => {
  const stats = await tipoDocumentoRepository.getStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

module.exports = {
  getAllTiposDocumento,
  getTipoDocumentoById,
  createTipoDocumento,
  updateTipoDocumento,
  updateTipoDocumentoStatus,
  deleteTipoDocumento,
  getTiposDocumentoStats,
};
