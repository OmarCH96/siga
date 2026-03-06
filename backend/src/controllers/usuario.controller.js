/**
 * Controlador de Usuarios
 * Maneja las operaciones CRUD de usuarios
 */

const usuarioRepository = require('../repositories/usuario.repository');
const { asyncHandler } = require('../middlewares/error.middleware');
const { NotFoundError } = require('../utils/errors');

/**
 * Obtener todos los usuarios
 * GET /usuarios
 */
const getAllUsuarios = asyncHandler(async (req, res) => {
  const filters = {
    activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
    rolId: req.query.rolId ? parseInt(req.query.rolId, 10) : undefined,
  };

  const usuarios = await usuarioRepository.findAll(filters);

  res.status(200).json({
    success: true,
    count: usuarios.length,
    data: usuarios,
  });
});

/**
 * Obtener usuario por ID
 * GET /usuarios/:id
 */
const getUsuarioById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const usuario = await usuarioRepository.findById(id);

  if (!usuario) {
    throw new NotFoundError('Usuario no encontrado');
  }

  res.status(200).json({
    success: true,
    data: usuario,
  });
});

/**
 * Obtener usuarios por área
 * GET /usuarios/area/:areaId
 */
const getUsuariosByArea = asyncHandler(async (req, res) => {
  const areaId = parseInt(req.params.areaId, 10);
  const usuarios = await usuarioRepository.findByArea(areaId);

  res.status(200).json({
    success: true,
    count: usuarios.length,
    data: usuarios,
  });
});

/**
 * Activar/desactivar usuario
 * PATCH /usuarios/:id/status
 */
const updateUsuarioStatus = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { activo } = req.body;

  const usuario = await usuarioRepository.findById(id);
  if (!usuario) {
    throw new NotFoundError('Usuario no encontrado');
  }

  await usuarioRepository.updateActiveStatus(id, activo);

  res.status(200).json({
    success: true,
    message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
  });
});

module.exports = {
  getAllUsuarios,
  getUsuarioById,
  getUsuariosByArea,
  updateUsuarioStatus,
};
