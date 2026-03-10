/**
 * Controlador de Roles
 * Maneja las operaciones de roles y permisos
 */

const rolRepository = require('../repositories/rol.repository');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Obtener todos los roles activos
 * GET /roles
 */
const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await rolRepository.findAllActive();

  res.status(200).json({
    success: true,
    count: roles.length,
    data: roles,
  });
});

/**
 * Obtener rol por ID
 * GET /roles/:id
 */
const getRolById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rol = await rolRepository.findById(id);

  if (!rol) {
    return res.status(404).json({
      success: false,
      error: 'Rol no encontrado',
    });
  }

  res.status(200).json({
    success: true,
    data: rol,
  });
});

module.exports = {
  getAllRoles,
  getRolById,
};
