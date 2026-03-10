/**
 * Controlador de Áreas
 * Maneja las operaciones de áreas organizacionales
 */

const areaRepository = require('../repositories/area.repository');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Obtener todas las áreas activas
 * GET /areas
 */
const getAllAreas = asyncHandler(async (req, res) => {
  const areas = await areaRepository.findAllActive();

  res.status(200).json({
    success: true,
    count: areas.length,
    data: areas,
  });
});

/**
 * Obtener jerarquía de áreas
 * GET /areas/jerarquia
 */
const getAreasHierarchy = asyncHandler(async (req, res) => {
  const areas = await areaRepository.findHierarchy();

  res.status(200).json({
    success: true,
    count: areas.length,
    data: areas,
  });
});

module.exports = {
  getAllAreas,
  getAreasHierarchy,
};
