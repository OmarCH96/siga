/**
 * Servicio de Documentos
 * Maneja la lógica de negocio para documentos y su flujo
 */

const db = require('../config/database');
const documentoRepository = require('../repositories/documento.repository');
const tipoDocumentoRepository = require('../repositories/tipoDocumento.repository');
const auditoriaRepository = require('../repositories/auditoria.repository');
const prestamoRepository = require('../repositories/prestamo.repository');
const log = require('../utils/logger');
const { NotFoundError, ValidationError, AuthorizationError } = require('../utils/errors');

class DocumentoService {
  /**
   * Configura el contexto RLS para el usuario actual
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<void>}
   */
  async configurarContextoRLS(usuarioId) {
    try {
      await db.query('SELECT fn_establecer_usuario_actual($1)', [usuarioId]);
      
      log.info('Contexto RLS configurado', { usuarioId });
    } catch (error) {
      log.error('Error al configurar contexto RLS', { error: error.message, usuarioId });
      throw error;
    }
  }

  /**
   * Obtiene la bandeja de recepción del usuario actual
   * Documentos con nodo activo en estado PENDIENTE en el área del usuario
   * @param {number} usuarioId - ID del usuario
   * @param {number} areaId - ID del área del usuario
   * @returns {Promise<Array>} Lista de documentos pendientes
   */
  async getBandejaRecepcion(usuarioId, areaId) {
    // Configurar contexto RLS antes de consultar
    await this.configurarContextoRLS(usuarioId);

    // Obtener documentos pendientes
    const documentos = await documentoRepository.getBandejaRecepcion(areaId);

    log.info('Bandeja de recepción obtenida', {
      usuarioId,
      areaId,
      cantidad: documentos.length,
    });

    return documentos;
  }

  /**
   * Obtiene el detalle completo de un documento con su cadena de custodia
   * @param {number} documentoId - ID del documento
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Object>} Documento con historial de nodos
   */
  async getDocumentoDetalle(documentoId, usuarioId) {
    // Configurar contexto RLS
    await this.configurarContextoRLS(usuarioId);

    // Obtener documento
    const documento = await documentoRepository.findById(documentoId);
    
    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    // Obtener historial de nodos (cadena de custodia)
    const historialNodos = await documentoRepository.getHistorialNodos(documentoId);

    return {
      ...documento,
      cadena_custodia: historialNodos,
    };
  }

  /**
   * Emite un nuevo documento desde el área del usuario
   * Orquesta validaciones de negocio antes de la emisión
   * @param {Object} datosDocumento - Datos del documento a emitir
   * @param {Object} usuario - Usuario completo con permisos y área
   * @returns {Promise<Object>} Resultado con documentoId, nodoId y folio
   */
  async emitirDocumento(datosDocumento, usuario) {
    // VALIDACIÓN 1: Verificar que el usuario tenga permiso CREAR_DOCUMENTO
    const permisos = usuario.rol_permisos || usuario.permisos || '';
    const tienePermiso = permisos === '*' || permisos.includes('CREAR_DOCUMENTO');
    
    if (!tienePermiso) {
      throw new AuthorizationError('No tiene permiso para crear documentos');
    }

    // DETECCIÓN DE FLUJO: Si area_folio_id viene y es distinta al área del usuario
    // → flujo de préstamo con reserva (documento bloqueado hasta aprobación)
    const areaFolioId = datosDocumento.area_folio_id
      ? Number(datosDocumento.area_folio_id)
      : null;
    const esPrestamoReserva = areaFolioId !== null && areaFolioId !== usuario.area_id;

    if (esPrestamoReserva) {
      return this._emitirConPrestamoReserva(datosDocumento, usuario, areaFolioId);
    }

    // VALIDACIÓN 2: Verificar que el usuario pertenezca al área de origen
    if (datosDocumento.area_origen_id && datosDocumento.area_origen_id !== usuario.area_id) {
      throw new AuthorizationError('Solo puede emitir documentos desde su área asignada');
    }

    // VALIDACIÓN 3: Si es OFICIO, validar que prestamo_numero_id sea válido y APROBADO
    if (datosDocumento.contexto === 'OFICIO') {
      if (!datosDocumento.prestamo_numero_id) {
        throw new ValidationError('Los documentos de contexto OFICIO requieren un préstamo de número autorizado');
      }

      // Validar que el préstamo existe, está APROBADO y pertenece al área del usuario
      const prestamo = await this._validarPrestamoNumero(datosDocumento.prestamo_numero_id, usuario.id, usuario.area_id);
      
      if (!prestamo) {
        throw new ValidationError('El préstamo de número especificado no existe o no pertenece a su área');
      }

      if (prestamo.estado !== 'APROBADO') {
        throw new ValidationError(`El préstamo de número debe estar APROBADO. Estado actual: ${prestamo.estado}`);
      }

      // Verificar que no haya vencido
      if (prestamo.fecha_vencimiento && new Date(prestamo.fecha_vencimiento) < new Date()) {
        throw new ValidationError('El préstamo de número ha vencido');
      }
    }

    // Configurar contexto RLS antes de emitir
    await this.configurarContextoRLS(usuario.id);

    // Preparar datos asegurando que usuario y área sean los del token
    const datosEmision = {
      tipo_documento_id: datosDocumento.tipo_documento_id,
      asunto: datosDocumento.asunto,
      contenido: datosDocumento.contenido || null,
      usuario_creador_id: usuario.id,
      area_origen_id: usuario.area_id, // Siempre usar el área del usuario autenticado
      fecha_limite: datosDocumento.fecha_limite || null,
      prioridad: datosDocumento.prioridad || 'MEDIA',
      instrucciones: datosDocumento.instrucciones || null,
      observaciones: datosDocumento.observaciones || null,
      contexto: datosDocumento.contexto || 'OTRO',
      prestamo_numero_id: datosDocumento.prestamo_numero_id || null,
    };

    // Llamar al repositorio para ejecutar el stored procedure
    const resultado = await documentoRepository.emitirDocumento(datosEmision);

    // Registrar evento en auditoría
    await auditoriaRepository.registrarEvento({
      documentoId: resultado.p_documento_id,
      accion: 'DOCUMENTO_EMITIDO',
      descripcion: `Documento emitido con folio ${resultado.p_folio_emision}`,
      usuarioId: usuario.id,
      areaId: usuario.area_id,
      detalles: JSON.stringify({
        tipo_documento_id: datosEmision.tipo_documento_id,
        contexto: datosEmision.contexto,
        prioridad: datosEmision.prioridad,
        prestamo_numero_id: datosEmision.prestamo_numero_id
      }),
      ipAddress: usuario.ip_address || null
    });

    log.info('Documento emitido exitosamente', {
      usuarioId: usuario.id,
      areaId: usuario.area_id,
      documentoId: resultado.p_documento_id,
      folio: resultado.p_folio_emision,
    });

    return {
      documentoId: resultado.p_documento_id,
      nodoId: resultado.p_nodo_id,
      folio: resultado.p_folio_emision,
    };
  }

  /**
   * Flujo interno: emitir documento vía préstamo con reserva de folio del área padre.
   * El documento se crea en estado PENDIENTE_PRESTAMO (bloqueado).
   * @param {Object} datosDocumento - Datos del documento
   * @param {Object} usuario - Usuario autenticado
   * @param {number} areaFolioId - ID del área prestamista (de donde se toma el folio)
   * @returns {Promise<Object>} { documentoId, nodoId, folio, pendienteAprobacion: true }
   * @private
   */
  async _emitirConPrestamoReserva(datosDocumento, usuario, areaFolioId) {
    // Configurar contexto RLS
    await this.configurarContextoRLS(usuario.id);

    const params = {
      area_solicitante_id: usuario.area_id,
      area_prestamista_id: areaFolioId,
      usuario_solicita_id: usuario.id,
      motivacion: datosDocumento.motivacion ||
        `Solicitud de folio del área ${areaFolioId} para documento: ${datosDocumento.asunto}`,
      tipo_documento_id: Number(datosDocumento.tipo_documento_id),
      asunto: datosDocumento.asunto,
      contenido: datosDocumento.contenido || null,
      fecha_limite: datosDocumento.fecha_limite || null,
      prioridad: datosDocumento.prioridad || 'MEDIA',
      instrucciones: datosDocumento.instrucciones || null,
      observaciones: datosDocumento.observaciones || null,
      contexto: datosDocumento.contexto || 'OTRO',
    };

    const resultado = await prestamoRepository.solicitarConReserva(params);

    if (!resultado || !resultado.p_documento_id) {
      throw new ValidationError('No se pudo crear el préstamo con reserva de folio');
    }

    await auditoriaRepository.registrarEvento({
      documentoId: resultado.p_documento_id,
      accion: 'PRESTAMO_RESERVA_INICIADO',
      descripcion: `Documento en PENDIENTE_PRESTAMO con folio reservado ${resultado.p_folio_reservado}`,
      usuarioId: usuario.id,
      areaId: usuario.area_id,
      detalles: JSON.stringify({
        area_prestamista_id: areaFolioId,
        prestamo_id: resultado.p_prestamo_id,
        folio_reservado: resultado.p_folio_reservado,
        contexto: params.contexto,
      }),
      ipAddress: usuario.ip_address || null,
    });

    log.info('Documento creado con préstamo de reserva', {
      usuarioId: usuario.id,
      areaId: usuario.area_id,
      areaFolioId,
      documentoId: resultado.p_documento_id,
      prestamoId: resultado.p_prestamo_id,
      folio: resultado.p_folio_reservado,
    });

    return {
      documentoId: resultado.p_documento_id,
      nodoId: resultado.p_nodo_id,
      folio: resultado.p_folio_reservado,
      prestamoId: resultado.p_prestamo_id,
      pendienteAprobacion: true,
      estado: 'PENDIENTE_PRESTAMO',
    };
  }

  /**
   * Valida si un turno es permitido desde un área origen a un área destino
   * Utiliza la función fn_validar_turno de PostgreSQL
   * @param {number} areaOrigenId - ID del área origen
   * @param {number} areaDestinoId - ID del área destino
   * @param {number} usuarioId - ID del usuario (para RLS)
   * @returns {Promise<Object>} { valido: boolean, mensaje: string|null }
   */
  async validarTurno(areaOrigenId, areaDestinoId, usuarioId) {
    try {
      // Configurar contexto RLS
      await this.configurarContextoRLS(usuarioId);

      // Llamar a la función fn_validar_turno
      // Retorna NULL si es válido, o un mensaje de error si está denegado
      const query = `
        SELECT fn_validar_turno($1, $2) as mensaje_error
      `;

      const result = await db.query(query, [areaOrigenId, areaDestinoId]);
      const mensajeError = result.rows[0]?.mensaje_error;

      // NULL = válido, cualquier texto = denegado
      const valido = mensajeError === null || mensajeError === undefined;

      log.info('Validación de turno realizada', {
        areaOrigenId,
        areaDestinoId,
        valido,
        mensaje: mensajeError,
      });

      return {
        valido,
        mensaje: mensajeError,
      };
    } catch (error) {
      log.error('Error al validar turno', {
        areaOrigenId,
        areaDestinoId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Valida un préstamo de número de oficio (método privado)
   * @param {number} prestamoId - ID del préstamo
   * @param {number} usuarioId - ID del usuario (para RLS)
   * @returns {Promise<Object|null>} Préstamo encontrado o null
   * @private
   */
  async _validarPrestamoNumero(prestamoId, usuarioId, areaSolicitanteId) {
    try {
      await this.configurarContextoRLS(usuarioId);

      const query = `
        SELECT 
          id,
          estado,
          fecha_vencimiento,
          folio_asignado,
          area_solicitante_id,
          area_prestamista_id
        FROM prestamo_numero_oficio
        WHERE id = $1
          AND area_solicitante_id = $2
      `;

      const result = await db.query(query, [prestamoId, areaSolicitanteId]);
      return result.rows[0] || null;
    } catch (error) {
      log.error('Error al validar préstamo de número', {
        error: error.message,
        prestamoId,
        usuarioId
      });
      throw error;
    }
  }

  /**
   * Obtiene un documento por ID verificando permisos de lectura
   * @param {number} documentoId - ID del documento
   * @param {Object} usuario - Usuario completo con permisos
   * @returns {Promise<Object>} Documento completo
   */
  async obtenerDocumento(documentoId, usuario) {
    // Configurar contexto RLS (esto ya filtrará según permisos)
    await this.configurarContextoRLS(usuario.id);

    // Obtener documento
    const documento = await documentoRepository.obtenerDocumentoPorId(documentoId, usuario.id);
    
    if (!documento) {
      throw new NotFoundError('Documento no encontrado o sin permisos para verlo');
    }

    log.info('Documento consultado', {
      usuarioId: usuario.id,
      documentoId,
      folio: documento.folio
    });

    return documento;
  }

  /**
   * Lista documentos emitidos por el usuario/área con paginación
   * @param {Object} usuario - Usuario completo
   * @param {Object} filtros - Filtros de búsqueda (page, limit, estado)
   * @returns {Promise<Object>} { documentos, total, page, limit, totalPages }
   */
  async listarMisDocumentos(usuario, filtros = {}) {
    // Configurar contexto RLS
    await this.configurarContextoRLS(usuario.id);

    // Llamar al repository con filtros
    const resultado = await documentoRepository.listarDocumentosEmitidosPorUsuario(
      usuario.id,
      usuario.area_id,
      {
        page: filtros.page || 1,
        limit: filtros.limit || 10,
        estado: filtros.estado || null
      }
    );

    log.info('Documentos listados', {
      usuarioId: usuario.id,
      areaId: usuario.area_id,
      cantidad: resultado.documentos.length,
      total: resultado.total,
      page: resultado.page
    });

    return resultado;
  }

  /**
   * Obtiene el catálogo de tipos de documento activos
   * @returns {Promise<Array>} Lista de tipos de documento
   */
  async obtenerTiposDocumento() {
    try {
      const result = await tipoDocumentoRepository.findAll({
        activo: true,
        limit: 100 // Límite razonable para catálogo
      });

      log.info('Catálogo de tipos de documento obtenido', {
        cantidad: result.rows.length
      });

      return result.rows;
    } catch (error) {
      log.error('Error al obtener tipos de documento', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Turna un documento a un área destino
   * Orquesta validaciones antes de ejecutar el turno
   * @param {number} documentoId - ID del documento
   * @param {number} areaDestinoId - ID del área destino
   * @param {Object} usuario - Usuario completo con permisos
   * @param {string} observaciones - Observaciones (opcional)
   * @param {string} instrucciones - Instrucciones (opcional)
   * @returns {Promise<Object>} { nodo_nuevo_id }
   */
  async turnarDocumento(documentoId, areaDestinoId, usuario, observaciones = null, instrucciones = null) {
    // VALIDACIÓN 1: Verificar que el documento exista y el usuario tenga acceso
    await this.configurarContextoRLS(usuario.id);
    
    const documento = await documentoRepository.findById(documentoId);
    if (!documento) {
      throw new NotFoundError('Documento no encontrado o sin permisos');
    }

    // VALIDACIÓN 2: Verificar que el documento no esté cancelado o cerrado
    if (documento.estado === 'CANCELADO' || documento.estado === 'CERRADO') {
      throw new ValidationError(`No se puede turnar un documento en estado ${documento.estado}`);
    }

    // Ejecutar turno
    const resultado = await documentoRepository.turnarDocumento({
      documento_id: documentoId,
      area_destino_id: areaDestinoId,
      usuario_turna_id: usuario.id,
      observaciones,
      instrucciones
    });

    // Registrar evento en auditoría
    await auditoriaRepository.registrarEvento({
      documentoId,
      accion: 'DOCUMENTO_TURNADO',
      descripcion: `Documento turnado a área ${areaDestinoId}`,
      usuarioId: usuario.id,
      areaId: usuario.area_id,
      detalles: JSON.stringify({
        area_destino_id: areaDestinoId,
        nodo_nuevo_id: resultado.nodo_nuevo_id,
        observaciones,
        instrucciones
      }),
      ipAddress: usuario.ip_address || null
    });

    log.info('Documento turnado exitosamente', {
      usuarioId: usuario.id,
      documentoId,
      areaDestinoId,
      nodoNuevoId: resultado.nodo_nuevo_id
    });

    return resultado;
  }

  /**
   * Crea copias de conocimiento de un documento para múltiples áreas
   * @param {number} documentoId - ID del documento
   * @param {Array<number>} areasIds - IDs de las áreas que recibirán copias
   * @param {Object} usuario - Usuario completo con permisos
   * @returns {Promise<Array>} Lista de copias creadas
   */
  async crearCopiasConocimiento(documentoId, areasIds, usuario) {
    // VALIDACIÓN 1: Verificar que el documento exista y el usuario tenga acceso
    await this.configurarContextoRLS(usuario.id);
    
    const documento = await documentoRepository.findById(documentoId);
    if (!documento) {
      throw new NotFoundError('Documento no encontrado o sin permisos');
    }

    // VALIDACIÓN 2: Verificar que haya áreas a las que copiar
    if (!areasIds || areasIds.length === 0) {
      throw new ValidationError('Debe especificar al menos un área para copia de conocimiento');
    }

    // VALIDACIÓN 3: Verificar que no se dupliquen copias (opcional, la BD podría manejarlo)
    // Por ahora dejamos que la BD maneje duplicados con un índice único si se desea

    // Crear copias para cada área
    const copiasCreadas = [];
    
    for (const areaId of areasIds) {
      try {
        const resultado = await documentoRepository.crearCopiaConocimiento({
          documento_id: documentoId,
          area_id: areaId,
          usuario_envia_id: usuario.id
        });
        
        copiasCreadas.push({
          copia_id: resultado.copia_id,
          area_id: areaId,
          success: true
        });

        // Registrar evento en auditoría
        await auditoriaRepository.registrarEvento({
          documentoId,
          accion: 'COPIA_CONOCIMIENTO_ENVIADA',
          descripcion: `Copia de conocimiento enviada a área ${areaId}`,
          usuarioId: usuario.id,
          areaId: usuario.area_id,
          detalles: JSON.stringify({
            area_destino_id: areaId,
            copia_id: resultado.copia_id
          }),
          ipAddress: usuario.ip_address || null
        });
      } catch (error) {
        log.error('Error al crear copia de conocimiento', {
          documentoId,
          areaId,
          error: error.message
        });
        
        copiasCreadas.push({
          area_id: areaId,
          success: false,
          error: error.message
        });
      }
    }

    log.info('Copias de conocimiento procesadas', {
      usuarioId: usuario.id,
      documentoId,
      total: areasIds.length,
      exitosas: copiasCreadas.filter(c => c.success).length,
      fallidas: copiasCreadas.filter(c => !c.success).length
    });

    return copiasCreadas;
  }

  /**
   * Recibe un documento confirmando su recepción en el área del usuario
   * Ejecuta el stored procedure sp_recibir_documento
   * @param {number} documentoId - ID del documento
   * @param {Object} usuario - Usuario completo con área e IP
   * @param {string} observaciones - Observaciones opcionales
   * @returns {Promise<Object>} { documento_id, nodo_id, folio_recepcion }
   */
  async recibirDocumento(documentoId, usuario, observaciones = null) {
    // Configurar contexto RLS
    await this.configurarContextoRLS(usuario.id);

    // VALIDACIÓN 1: Verificar que el documento existe y tiene nodo PENDIENTE en el área del usuario
    const nodosPendientes = await documentoRepository.obtenerNodosPendientesPorDocumento(
      documentoId,
      usuario.area_id
    );

    if (!nodosPendientes || nodosPendientes.length === 0) {
      throw new NotFoundError(
        'No se encontró un nodo pendiente para este documento en su área'
      );
    }

    if (nodosPendientes.length > 1) {
      log.warn('Múltiples nodos pendientes encontrados (inconsistencia)', {
        documentoId,
        areaId: usuario.area_id,
        cantidad: nodosPendientes.length
      });
    }

    const nodoPendiente = nodosPendientes[0];

    // VALIDACIÓN 2: Verificar que el nodo está en estado PENDIENTE
    if (nodoPendiente.estado !== 'PENDIENTE') {
      throw new ValidationError(
        `El nodo no puede ser recibido. Estado actual: ${nodoPendiente.estado}`
      );
    }

    // Ejecutar stored procedure de recepción
    const resultado = await documentoRepository.recibirDocumento({
      nodo_id: nodoPendiente.id,
      usuario_recibe_id: usuario.id,
      observaciones: observaciones || null
    });

    // Registrar evento en auditoría
    await auditoriaRepository.registrarEvento({
      documentoId,
      accion: 'DOCUMENTO_RECIBIDO',
      descripcion: `Documento recibido con folio ${resultado.p_folio_asignado}`,
      usuarioId: usuario.id,
      areaId: usuario.area_id,
      detalles: JSON.stringify({
        nodo_id: nodoPendiente.id,
        folio_recepcion: resultado.p_folio_asignado,
        observaciones: observaciones
      }),
      ipAddress: usuario.ip_address || null
    });

    log.info('Documento recibido exitosamente', {
      usuarioId: usuario.id,
      areaId: usuario.area_id,
      documentoId,
      nodoId: nodoPendiente.id,
      folio: resultado.p_folio_asignado,
    });

    return {
      documentoId,
      nodoId: nodoPendiente.id,
      folio_recepcion: resultado.p_folio_asignado,
    };
  }

  /**
   * Obtiene el próximo consecutivo que se asignará (vista previa)
   * Valida que el área y tipo de documento existan y estén activos
   * @param {number} areaId - ID del área
   * @param {number} tipoDocumentoId - ID del tipo de documento
   * @param {number} usuarioId - ID del usuario (para logging)
   * @returns {Promise<Object>} { consecutivo, folio_completo, clave_area, clave_tipo_doc, anio }
   */
  async getProximoConsecutivo(areaId, tipoDocumentoId, usuarioId) {
    try {
      // VALIDACIÓN 1: Verificar que el área existe y está activa
      const queryArea = `
        SELECT id, clave, nombre, activa 
        FROM area 
        WHERE id = $1
      `;
      const resultArea = await db.query(queryArea, [areaId]);
      
      if (resultArea.rows.length === 0) {
        throw new NotFoundError(`Área con ID ${areaId} no encontrada`);
      }

      const area = resultArea.rows[0];
      if (!area.activa) {
        throw new ValidationError(`El área ${area.nombre} no está activa`);
      }

      // VALIDACIÓN 2: Verificar que el tipo de documento existe y está activo
      const tipoDocumento = await tipoDocumentoRepository.findById(tipoDocumentoId);
      
      if (!tipoDocumento) {
        throw new NotFoundError(`Tipo de documento con ID ${tipoDocumentoId} no encontrado`);
      }

      if (!tipoDocumento.activo) {
        throw new ValidationError(`El tipo de documento ${tipoDocumento.nombre} no está activo`);
      }

      // PASO 3: Obtener el preview del folio completo
      const preview = await documentoRepository.getPreviewFolioCompleto(
        areaId,
        tipoDocumentoId
      );

      log.info('Preview de consecutivo obtenido', {
        usuario_id: usuarioId,
        area_id: areaId,
        tipo_documento_id: tipoDocumentoId,
        consecutivo: preview.consecutivo,
        folio_completo: preview.folio_completo
      });

      return {
        consecutivo: preview.consecutivo,
        folio_completo: preview.folio_completo,
        clave_area: preview.clave_area,
        nombre_area: preview.nombre_area,
        clave_tipo_doc: preview.clave_tipo_doc,
        nombre_tipo_doc: preview.nombre_tipo_doc,
        anio: preview.anio
      };

    } catch (error) {
      log.error('Error al obtener preview de consecutivo', {
        error: error.message,
        usuario_id: usuarioId,
        area_id: areaId,
        tipo_documento_id: tipoDocumentoId
      });
      throw error;
    }
  }

  /**
   * Obtiene la correspondencia de la unidad del usuario autenticado
   * Incluye lógica jerárquica: padres ven descendientes, hijos solo su área
   * @param {Object} usuario - Usuario completo con id, areaId, permisos
   * @param {Object} filtros - Filtros de búsqueda y paginación
   * @returns {Promise<Object>} { documentos, total, page, limit, totalPages, areasHijas }
   */
  async getCorrespondenciaUnidad(usuario, filtros = {}) {
    // Configurar contexto RLS
    await this.configurarContextoRLS(usuario.id);

    // Llamar al repository con el área del usuario y filtros
    const resultado = await documentoRepository.getCorrespondenciaUnidad(
      usuario.area_id,
      usuario.id,
      {
        page: filtros.page || 1,
        limit: filtros.limit || 10,
        tipoNodo: filtros.tipoNodo || 'TODOS',
        busqueda: filtros.busqueda || '',
        estado: filtros.estado || '',
        claveTipo: filtros.claveTipo || '',
        areaEspecifica: filtros.areaEspecifica || null
      }
    );

    log.info('Correspondencia de unidad obtenida', {
      usuarioId: usuario.id,
      areaId: usuario.area_id,
      total: resultado.total,
      areasHijas: resultado.areasHijas.length,
      page: resultado.page
    });

    return resultado;
  }
}

module.exports = new DocumentoService();
