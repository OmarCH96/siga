/**
 * Controlador de Documentos
 * Maneja las operaciones de consulta de documentos
 */

const documentoService = require('../services/documento.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const log = require('../utils/logger');

/**
 * Obtener bandeja de recepción del usuario actual
 * GET /api/documentos/bandeja-recepcion
 * 
 * Retorna documentos con nodo activo en estado PENDIENTE
 * en el área del usuario autenticado
 */
const getBandejaRecepcion = asyncHandler(async (req, res) => {
  // Extraer datos del usuario autenticado (agregados por auth.middleware)
  const { id: usuarioId, areaId } = req.user;

  log.info('Solicitud de bandeja de recepción', {
    usuarioId,
    areaId,
    ip: req.ip,
  });

  // Llamar al servicio
  const documentos = await documentoService.getBandejaRecepcion(usuarioId, areaId);

  // Respuesta estándar
  res.status(200).json({
    success: true,
    count: documentos.length,
    data: documentos,
  });
});

/**
 * Obtener detalle de un documento con su cadena de custodia
 * GET /api/documentos/:id
 */
const getDocumentoDetalle = asyncHandler(async (req, res) => {
  const documentoId = parseInt(req.params.id, 10);
  const { id: usuarioId } = req.user;

  log.info('Solicitud de detalle de documento', {
    documentoId,
    usuarioId,
  });

  const documento = await documentoService.getDocumentoDetalle(documentoId, usuarioId);

  res.status(200).json({
    success: true,
    data: documento,
  });
});

/**
 * Emitir un nuevo documento
 * POST /api/documentos
 * 
 * Crea un nuevo documento en el sistema desde el área del usuario autenticado
 * Ejecuta el stored procedure sp_emitir_documento_v5
 */
const crearDocumento = asyncHandler(async (req, res) => {
  // Extraer datos del usuario autenticado
  const { id: usuarioId, areaId } = req.user;

  // Extraer datos del documento del body
  const datosDocumento = req.body;

  log.info('Solicitud de emisión de documento', {
    usuarioId,
    areaId,
    contexto: datosDocumento.contexto,
    asunto: datosDocumento.asunto?.substring(0, 50),
    ip: req.ip,
  });

  // Llamar al servicio
  const resultado = await documentoService.emitirDocumento(datosDocumento, usuarioId, areaId);

  // Respuesta estándar
  res.status(201).json({
    success: true,
    data: resultado,
    message: `Documento emitido con folio ${resultado.folio}`,
  });
});

module.exports = {
  getBandejaRecepcion,
  getDocumentoDetalle,
  crearDocumento,
};
