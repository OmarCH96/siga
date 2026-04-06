/**
 * Controlador de Documentos
 * Maneja las operaciones de consulta y emisión de documentos
 */

const documentoService = require('../services/documento.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const log = require('../utils/logger');

/**
 * Emitir un nuevo documento
 * POST /api/documentos/emitir
 * 
 * Crea un nuevo documento en el sistema desde el área del usuario autenticado
 * Ejecuta el stored procedure sp_emitir_documento_v5
 */
const emitirDocumento = asyncHandler(async (req, res) => {
  // Extraer datos del usuario autenticado completo (req.user inyectado por auth.middleware)
  const usuario = {
    id: req.user.id,
    area_id: req.user.areaId,
    rol_permisos: req.user.permisos,
    ip_address: req.ip
  };

  // Extraer datos del documento del body (ya sanitizado por validateEmision)
  const datosDocumento = req.body;

  log.info('Solicitud de emisión de documento', {
    usuarioId: usuario.id,
    areaId: usuario.area_id,
    contexto: datosDocumento.contexto,
    asunto: datosDocumento.asunto?.substring(0, 50),
    ip: req.ip,
  });

  // Llamar al servicio pasando el usuario completo
  const resultado = await documentoService.emitirDocumento(datosDocumento, usuario);

  // Respuesta estándar
  res.status(201).json({
    success: true,
    data: resultado,
    message: `Documento emitido con folio ${resultado.folio}`,
  });
});

/**
 * Obtener un documento por ID
 * GET /api/documentos/:id
 * 
 * Obtiene el detalle completo de un documento verificando permisos de lectura
 */
const obtenerDocumento = asyncHandler(async (req, res) => {
  const documentoId = parseInt(req.params.id, 10);
  
  const usuario = {
    id: req.user.id,
    area_id: req.user.areaId,
    rol_permisos: req.user.permisos
  };

  log.info('Solicitud de detalle de documento', {
    documentoId,
    usuarioId: usuario.id,
  });

  const documento = await documentoService.obtenerDocumento(documentoId, usuario);

  res.status(200).json({
    success: true,
    data: documento,
  });
});

/**
 * Listar documentos emitidos por el usuario/área
 * GET /api/documentos
 * 
 * Retorna documentos emitidos desde el área del usuario con paginación
 */
const listarMisDocumentos = asyncHandler(async (req, res) => {
  const usuario = {
    id: req.user.id,
    area_id: req.user.areaId,
    rol_permisos: req.user.permisos
  };

  // Extraer filtros de query params
  const filtros = {
    page: req.query.page ? parseInt(req.query.page, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
    estado: req.query.estado || null
  };

  log.info('Solicitud de listado de documentos', {
    usuarioId: usuario.id,
    areaId: usuario.area_id,
    filtros,
  });

  const resultado = await documentoService.listarMisDocumentos(usuario, filtros);

  res.status(200).json({
    success: true,
    data: resultado.documentos,
    total: resultado.total,
    page: resultado.page,
    limit: resultado.limit,
    totalPages: resultado.totalPages,
  });
});

/**
 * Obtener catálogo de tipos de documento disponibles
 * GET /api/documentos/tipos
 * 
 * Retorna todos los tipos de documento activos en el sistema
 */
const obtenerTiposDocumento = asyncHandler(async (req, res) => {
  log.info('Solicitud de catálogo de tipos de documento', {
    usuarioId: req.user.id,
  });

  const tiposDocumento = await documentoService.obtenerTiposDocumento();

  res.status(200).json({
    success: true,
    count: tiposDocumento.length,
    data: tiposDocumento,
  });
});

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
 * Turnar un documento a un área destino
 * POST /api/documentos/:id/turnar
 * 
 * Turna un documento del área actual a otra área
 * Body: { area_destino_id, observaciones?, instrucciones? }
 */
const turnarDocumento = asyncHandler(async (req, res) => {
  const documentoId = parseInt(req.params.id, 10);
  const { area_destino_id, observaciones, instrucciones } = req.body;

  const usuario = {
    id: req.user.id,
    area_id: req.user.areaId,
    rol_permisos: req.user.permisos,
    ip_address: req.ip
  };

  log.info('Solicitud de turno de documento', {
    documentoId,
    areaDestinoId: area_destino_id,
    usuarioId: usuario.id,
    ip: req.ip,
  });

  // Validar area_destino_id
  if (!area_destino_id || isNaN(parseInt(area_destino_id, 10))) {
    return res.status(400).json({
      success: false,
      error: 'El área destino es requerida',
    });
  }

  const resultado = await documentoService.turnarDocumento(
    documentoId,
    parseInt(area_destino_id, 10),
    usuario,
    observaciones,
    instrucciones
  );

  res.status(200).json({
    success: true,
    data: resultado,
    message: `Documento turnado exitosamente`,
  });
});

/**
 * Validar si un turno es permitido
 * GET /api/documentos/validar-turno?area_destino_id=X
 * 
 * Valida si se puede turnar un documento desde el área del usuario a un área destino
 * usando las reglas de turno y excepciones configuradas en la base de datos
 */
const validarTurno = asyncHandler(async (req, res) => {
  const areaOrigenId = req.user.areaId;
  const areaDestinoId = parseInt(req.query.area_destino_id, 10);

  // Validar area_destino_id
  if (!areaDestinoId || isNaN(areaDestinoId)) {
    return res.status(400).json({
      success: false,
      error: 'El parámetro area_destino_id es requerido y debe ser un número válido',
    });
  }

  log.info('Solicitud de validación de turno', {
    areaOrigenId,
    areaDestinoId,
    usuarioId: req.user.id,
    ip: req.ip,
  });

  // Llamar al servicio
  const resultado = await documentoService.validarTurno(areaOrigenId, areaDestinoId, req.user.id);

  // Respuesta estándar
  res.status(200).json({
    success: true,
    data: resultado,
  });
});

/**
 * Recibir un documento
 * POST /api/documentos/:id/recibir
 * 
 * Confirma la recepción de un documento con nodo PENDIENTE en el área del usuario
 * Ejecuta el stored procedure sp_recibir_documento
 */
const recibirDocumento = asyncHandler(async (req, res) => {
  const documentoId = parseInt(req.params.id, 10);
  const { observaciones } = req.body;

  const usuario = {
    id: req.user.id,
    area_id: req.user.areaId,
    ip_address: req.ip
  };

  log.info('Solicitud de recepción de documento', {
    documentoId,
    usuarioId: usuario.id,
    areaId: usuario.area_id,
    ip: req.ip,
  });

  const resultado = await documentoService.recibirDocumento(
    documentoId,
    usuario,
    observaciones
  );

  res.status(200).json({
    success: true,
    data: resultado,
    message: `Documento recibido con folio ${resultado.folio_recepcion}`,
  });
});

/**
 * Crear copias de conocimiento de un documento
 * POST /api/documentos/:id/copias
 * 
 * Crea copias de conocimiento hacia múltiples áreas
 * Body: { areas_ids: [1, 2, 3] }
 */
const crearCopiasConocimiento = asyncHandler(async (req, res) => {
  const documentoId = parseInt(req.params.id, 10);
  const { areas_ids } = req.body;

  const usuario = {
    id: req.user.id,
    area_id: req.user.areaId,
    rol_permisos: req.user.permisos,
    ip_address: req.ip
  };

  log.info('Solicitud de crear copias de conocimiento', {
    documentoId,
    areasIds: areas_ids,
    usuarioId: usuario.id,
    ip: req.ip,
  });

  // Validar areas_ids
  if (!areas_ids || !Array.isArray(areas_ids) || areas_ids.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Debe proporcionar al menos un área para copia de conocimiento',
    });
  }

  // Validar que todos los IDs sean números válidos
  const areasIdsValidos = areas_ids.filter(id => !isNaN(parseInt(id, 10))).map(id => parseInt(id, 10));
  
  if (areasIdsValidos.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No hay IDs de áreas válidos',
    });
  }

  const resultado = await documentoService.crearCopiasConocimiento(
    documentoId,
    areasIdsValidos,
    usuario
  );

  // Contar exitosas y fallidas
  const exitosas = resultado.filter(c => c.success).length;
  const fallidas = resultado.filter(c => !c.success).length;

  res.status(200).json({
    success: true,
    data: resultado,
    message: `Copias procesadas: ${exitosas} exitosas, ${fallidas} fallidas`,
    stats: {
      total: resultado.length,
      exitosas,
      fallidas
    }
  });
});

/**
 * Obtener preview del próximo consecutivo
 * GET /api/documentos/preview-consecutivo
 * 
 * Obtiene el próximo número consecutivo que se asignará sin modificar la BD
 * Query params: areaId, tipoDocumentoId
 */
const getPreviewConsecutivo = asyncHandler(async (req, res) => {
  const usuario = {
    id: req.user.id,
    area_id: req.user.areaId,
    rol_permisos: req.user.permisos
  };

  // Extraer parámetros de query
  const areaId = parseInt(req.query.areaId, 10);
  const tipoDocumentoId = parseInt(req.query.tipoDocumentoId, 10);

  // Validar parámetros
  if (!areaId || isNaN(areaId)) {
    return res.status(400).json({
      success: false,
      error: 'El parámetro areaId es requerido y debe ser un número válido',
    });
  }

  if (!tipoDocumentoId || isNaN(tipoDocumentoId)) {
    return res.status(400).json({
      success: false,
      error: 'El parámetro tipoDocumentoId es requerido y debe ser un número válido',
    });
  }

  log.info('Solicitud de preview de consecutivo', {
    usuarioId: usuario.id,
    areaId,
    tipoDocumentoId,
  });

  // Llamar al servicio
  const resultado = await documentoService.getProximoConsecutivo(
    areaId,
    tipoDocumentoId,
    usuario.id
  );

  res.status(200).json({
    success: true,
    data: resultado,
    message: 'Preview de consecutivo obtenido correctamente',
  });
});

/**
 * Endpoint de diagnóstico para verificar consecutivos
 * GET /api/documentos/diagnostico-consecutivo
 */
const getDiagnosticoConsecutivo = asyncHandler(async (req, res) => {
  const areaId = parseInt(req.query.areaId, 10);
  const tipoDocumentoId = parseInt(req.query.tipoDocumentoId, 10);

  if (!areaId || !tipoDocumentoId) {
    return res.status(400).json({
      success: false,
      error: 'Se requieren areaId y tipoDocumentoId',
    });
  }

  const db = require('../config/database');
  
  // 1. Obtener info del tipo de documento
  const tipoDocQuery = 'SELECT id, nombre, clave, activo FROM tipo_documento WHERE id = $1';
  const tipoDocResult = await db.query(tipoDocQuery, [tipoDocumentoId]);
  
  // 2. Obtener info del área
  const areaQuery = 'SELECT id, nombre, clave, activa FROM area WHERE id = $1';
  const areaResult = await db.query(areaQuery, [areaId]);
  
  // 3. Verificar si existe registro en consecutivo_area
  const claveTipoDoc = tipoDocResult.rows[0]?.clave || '';
  const consecutivosQuery = `
    SELECT 
      area_id, 
      tipo_operacion, 
      anio, 
      ultimo_consecutivo
    FROM consecutivo_area
    WHERE area_id = $1
    ORDER BY anio DESC, tipo_operacion
  `;
  const consecutivosResult = await db.query(consecutivosQuery, [areaId]);
  
  // 4. Llamar a fn_preview_siguiente_consecutivo
  const previewQuery = `
    SELECT public.fn_preview_siguiente_consecutivo($1, $2, $3) AS proximo_consecutivo
  `;
  const currentYear = new Date().getFullYear();
  const previewResult = await db.query(previewQuery, [areaId, claveTipoDoc, currentYear]);
  
  // 5. Llamar a fn_preview_folio
  const folioQuery = `
    SELECT public.fn_preview_folio($1, 'EMISION', $2, $3) AS folio_completo
  `;
  const folioResult = await db.query(folioQuery, [areaId, currentYear, tipoDocumentoId]);
  
  // 6. Verificar documentos emitidos en esta área
  const documentosQuery = `
    SELECT 
      d.id, 
      d.folio, 
      d.fecha_creacion,
      td.clave AS tipo_doc_clave
    FROM documento d
    INNER JOIN tipo_documento td ON d.tipo_documento_id = td.id
    WHERE d.area_origen_id = $1
    ORDER BY d.fecha_creacion DESC
    LIMIT 10
  `;
  const documentosResult = await db.query(documentosQuery, [areaId]);

  res.status(200).json({
    success: true,
    data: {
      tipo_documento: tipoDocResult.rows[0] || null,
      area: areaResult.rows[0] || null,
      consecutivos_existentes: consecutivosResult.rows,
      documentos_emitidos: documentosResult.rows,
      clave_buscada: claveTipoDoc,
      anio_actual: currentYear,
      proximo_consecutivo: previewResult.rows[0]?.proximo_consecutivo,
      folio_completo: folioResult.rows[0]?.folio_completo,
      explicacion: {
        mensaje: 'Si consecutivos_existentes está vacío, nunca se han emitido documentos',
        solucion: 'El primer documento siempre será 0001. Después se incrementará automáticamente.'
      }
    },
  });
});

module.exports = {
  emitirDocumento,
  obtenerDocumento,
  listarMisDocumentos,
  obtenerTiposDocumento,
  getBandejaRecepcion,
  validarTurno,
  turnarDocumento,
  crearCopiasConocimiento,
  recibirDocumento,
  getPreviewConsecutivo,
  getDiagnosticoConsecutivo,
};
