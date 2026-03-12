/**
 * Controlador de Préstamos
 * Maneja las operaciones de préstamo de números de oficio
 */

const prestamoRepository = require('../repositories/prestamo.repository');
const { asyncHandler } = require('../middlewares/error.middleware');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Obtener áreas prestamistas autorizadas para el usuario actual
 * GET /prestamos/areas-prestamistas
 */
const getAreasPrestamistas = asyncHandler(async (req, res) => {
  const { areaId } = req.user;

  if (!areaId) {
    throw new ValidationError('Usuario no tiene área asignada');
  }

  const areas = await prestamoRepository.findAreasPrestamistas(areaId);

  // Marcar cuál es el área propia del usuario
  const areasConMarca = areas.map(area => ({
    ...area,
    es_area_propia: area.id === areaId
  }));

  res.status(200).json({
    success: true,
    count: areasConMarca.length,
    data: areasConMarca,
  });
});

/**
 * Obtener vista previa del folio para un área y tipo de documento
 * GET /prestamos/preview-folio?area_id=X&tipo_documento_id=Y
 */
const getPreviewFolio = asyncHandler(async (req, res) => {
  const { area_id, tipo_documento_id } = req.query;

  if (!area_id) {
    throw new ValidationError('El parámetro area_id es requerido');
  }

  if (!tipo_documento_id) {
    throw new ValidationError('El parámetro tipo_documento_id es requerido');
  }

  const preview = await prestamoRepository.previewFolio(
    parseInt(area_id),
    parseInt(tipo_documento_id)
  );

  if (!preview) {
    throw new NotFoundError(`No se pudo generar preview del folio para área ${area_id} y tipo de documento ${tipo_documento_id}`);
  }

  res.status(200).json({
    success: true,
    data: preview,
  });
});

/**
 * Solicitar préstamo de número
 * POST /prestamos/solicitar
 * Body: { area_prestamista_id, motivacion }
 */
const solicitarPrestamo = asyncHandler(async (req, res) => {
  const { area_prestamista_id, motivacion } = req.body;
  const { id: usuario_id, areaId: area_solicitante_id } = req.user;

  // Validaciones
  if (!area_prestamista_id) {
    throw new ValidationError('El área prestamista es requerida');
  }

  // Si el área prestamista es la misma que el área solicitante, no crear préstamo
  if (parseInt(area_prestamista_id) === area_solicitante_id) {
    return res.status(200).json({
      success: true,
      message: 'Se utilizará el número del área propia. No se requiere préstamo.',
      data: {
        requiere_prestamo: false,
        area_id: area_solicitante_id
      }
    });
  }

  if (!motivacion || motivacion.trim().length === 0) {
    throw new ValidationError('La motivación es requerida para solicitar un préstamo');
  }

  if (motivacion.trim().length < 10) {
    throw new ValidationError('La motivación debe tener al menos 10 caracteres');
  }

  // Crear solicitud
  const prestamo = await prestamoRepository.solicitar(
    area_solicitante_id,
    parseInt(area_prestamista_id),
    usuario_id,
    motivacion.trim()
  );

  if (!prestamo) {
    throw new ValidationError('No se pudo crear la solicitud de préstamo');
  }

  res.status(201).json({
    success: true,
    message: `Solicitud enviada al área ${prestamo.area_prestamista_nombre}. Será revisada y aprobada.`,
    data: {
      requiere_prestamo: true,
      prestamo_id: prestamo.id,
      estado: prestamo.estado,
      area_prestamista: {
        id: prestamo.area_prestamista_id,
        nombre: prestamo.area_prestamista_nombre,
        clave: prestamo.area_prestamista_clave
      }
    }
  });
});

/**
 * Obtener préstamos aprobados disponibles para el usuario
 * GET /prestamos/aprobados
 */
const getPrestamosAprobados = asyncHandler(async (req, res) => {
  const { areaId } = req.user;

  if (!areaId) {
    throw new ValidationError('Usuario no tiene área asignada');
  }

  const prestamos = await prestamoRepository.findAprobadosDisponibles(areaId);

  res.status(200).json({
    success: true,
    count: prestamos.length,
    data: prestamos,
  });
});

/**
 * Obtener préstamos pendientes del área
 * GET /prestamos/pendientes
 */
const getPrestamosPendientes = asyncHandler(async (req, res) => {
  const { areaId } = req.user;

  if (!areaId) {
    throw new ValidationError('Usuario no tiene área asignada');
  }

  const prestamos = await prestamoRepository.findPendientes(areaId);

  res.status(200).json({
    success: true,
    count: prestamos.length,
    data: prestamos,
  });
});

/**
 * Resolver (aprobar o rechazar) un préstamo
 * POST /prestamos/:id/resolver
 * Body: { aprobar, motivo?, dias_vencimiento? }
 */
const resolverPrestamo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { aprobar, motivo, dias_vencimiento = 5 } = req.body;
  const { id: usuario_id } = req.user;

  if (typeof aprobar !== 'boolean') {
    throw new ValidationError('El campo "aprobar" es requerido (true/false)');
  }

  if (!aprobar && (!motivo || motivo.trim().length === 0)) {
    throw new ValidationError('El motivo es obligatorio al rechazar un préstamo');
  }

  const resultado = await prestamoRepository.resolver(
    parseInt(id),
    usuario_id,
    aprobar,
    motivo || null,
    parseInt(dias_vencimiento)
  );

  if (!resultado) {
    throw new ValidationError('No se pudo resolver el préstamo');
  }

  res.status(200).json({
    success: true,
    message: aprobar 
      ? `Préstamo aprobado. Folio asignado: ${resultado.folio_asignado}`
      : 'Préstamo rechazado',
    data: resultado
  });
});

/**
 * Marcar préstamo como utilizado
 * POST /prestamos/:id/utilizar
 */
const marcarUtilizado = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const utilizado = await prestamoRepository.marcarUtilizado(parseInt(id));

  if (!utilizado) {
    throw new ValidationError('No se pudo marcar el préstamo como utilizado');
  }

  res.status(200).json({
    success: true,
    message: 'Préstamo marcado como utilizado',
  });
});

module.exports = {
  getAreasPrestamistas,
  getPreviewFolio,
  solicitarPrestamo,
  getPrestamosAprobados,
  getPrestamosPendientes,
  resolverPrestamo,
  marcarUtilizado,
};
