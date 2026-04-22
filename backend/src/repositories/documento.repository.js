/**
 * Repositorio de Documentos
 * Capa de acceso a datos para la tabla 'documento' y 'nodo_documental'
 * Implementa el patrón Repository con SQL nativo (NO ORM)
 * IMPORTANTE: Todas las operaciones activan RLS mediante fn_establecer_usuario_actual
 */

const db = require('../config/database');
const logger = require('../utils/logger');

class DocumentoRepository {
  /**
   * Obtiene la bandeja de recepción para un área específica
   * Documentos con nodo activo en estado PENDIENTE
   * @param {number} areaId - ID del área
   * @returns {Promise<Array>} Lista de documentos pendientes
   */
  async getBandejaRecepcion(areaId) {
    const query = `
      SELECT 
        d.id,
        d.folio,
        d.asunto,
        d.contenido,
        d.fecha_creacion,
        d.fecha_limite,
        d.prioridad,
        d.estado AS estado_documento,
        d.solo_conocimiento,
        d.observaciones,
        d.contexto,
        -- Tipo de documento
        td.id AS tipo_documento_id,
        td.nombre AS tipo_documento_nombre,
        td.clave AS tipo_documento_clave,
        -- Área origen
        ao.id AS area_origen_id,
        ao.nombre AS area_origen_nombre,
        ao.clave AS area_origen_clave,
        ao.tipo AS area_origen_tipo,
        -- Usuario creador
        uc.id AS usuario_creador_id,
        uc.nombre AS usuario_creador_nombre,
        uc.apellidos AS usuario_creador_apellidos,
        -- Nodo activo (PENDIENTE)
        n.id AS nodo_id,
        n.tipo_nodo,
        n.estado AS estado_nodo,
        n.folio_propio,
        n.folio_padre,
        n.folio_original,
        n.fecha_generacion AS nodo_fecha_generacion,
        n.instrucciones,
        n.observaciones AS nodo_observaciones,
        -- Usuario que turnó (responsable del nodo)
        ur.id AS usuario_turna_id,
        ur.nombre AS usuario_turna_nombre,
        ur.apellidos AS usuario_turna_apellidos,
        -- Área que turnó (padre del nodo)
        CASE 
          WHEN n.nodo_padre_id IS NOT NULL THEN np.area_id
          ELSE NULL
        END AS area_turna_id,
        CASE 
          WHEN n.nodo_padre_id IS NOT NULL THEN at.nombre
          ELSE NULL
        END AS area_turna_nombre,
        -- Entidades externas (si aplica)
        eeo.id AS entidad_externa_origen_id,
        eeo.nombre AS entidad_externa_origen_nombre,
        eed.id AS entidad_externa_destino_id,
        eed.nombre AS entidad_externa_destino_nombre
      FROM documento d
      INNER JOIN nodo_documental n ON n.documento_id = d.id
      INNER JOIN tipo_documento td ON d.tipo_documento_id = td.id
      INNER JOIN area ao ON d.area_origen_id = ao.id
      INNER JOIN usuario uc ON d.usuario_creador_id = uc.id
      LEFT JOIN usuario ur ON n.usuario_responsable_id = ur.id
      LEFT JOIN nodo_documental np ON n.nodo_padre_id = np.id
      LEFT JOIN area at ON np.area_id = at.id
      LEFT JOIN entidad_externa eeo ON d.entidad_externa_origen_id = eeo.id
      LEFT JOIN entidad_externa eed ON d.entidad_externa_destino_id = eed.id
      WHERE 
        n.es_nodo_activo = true
        AND n.estado = 'PENDIENTE'
        AND n.area_id = $1
        AND d.estado != 'CANCELADO'
      ORDER BY 
        d.prioridad DESC,
        d.fecha_creacion DESC
    `;

    const result = await db.query(query, [areaId]);
    return result.rows;
  }

  /**
   * Obtiene un documento por ID con toda su información
   * @param {number} documentoId - ID del documento
   * @returns {Promise<Object|null>} Documento encontrado o null
   */
  async findById(documentoId) {
    const query = `
      SELECT 
        d.*,
        td.nombre AS tipo_documento_nombre,
        td.clave AS tipo_documento_clave,
        ao.nombre AS area_origen_nombre,
        ao.clave AS area_origen_clave,
        uc.nombre AS usuario_creador_nombre,
        uc.apellidos AS usuario_creador_apellidos
      FROM documento d
      INNER JOIN tipo_documento td ON d.tipo_documento_id = td.id
      INNER JOIN area ao ON d.area_origen_id = ao.id
      INNER JOIN usuario uc ON d.usuario_creador_id = uc.id
      WHERE d.id = $1
    `;

    const result = await db.query(query, [documentoId]);
    return result.rows[0] || null;
  }

  /**
   * Obtiene el historial completo de nodos de un documento (cadena de custodia)
   * @param {number} documentoId - ID del documento
   * @returns {Promise<Array>} Lista de nodos ordenados cronológicamente
   */
  async getHistorialNodos(documentoId) {
    const query = `
      SELECT 
        n.id,
        n.tipo_nodo,
        n.estado,
        n.folio_propio,
        n.folio_padre,
        n.fecha_generacion,
        n.fecha_recepcion,
        n.fecha_cierre,
        n.instrucciones,
        n.observaciones,
        n.es_nodo_activo,
        a.id AS area_id,
        a.nombre AS area_nombre,
        a.clave AS area_clave,
        ur.id AS usuario_responsable_id,
        ur.nombre AS usuario_responsable_nombre,
        ur.apellidos AS usuario_responsable_apellidos,
        ure.id AS usuario_recibe_id,
        ure.nombre AS usuario_recibe_nombre,
        ure.apellidos AS usuario_recibe_apellidos
      FROM nodo_documental n
      INNER JOIN area a ON n.area_id = a.id
      LEFT JOIN usuario ur ON n.usuario_responsable_id = ur.id
      LEFT JOIN usuario ure ON n.usuario_recibe_id = ure.id
      WHERE n.documento_id = $1
      ORDER BY n.fecha_generacion ASC
    `;

    const result = await db.query(query, [documentoId]);
    return result.rows;
  }

  /**
   * Emite un nuevo documento ejecutando el stored procedure sp_emitir_documento_v5
   * IMPORTANTE: Activa RLS antes de ejecutar el SP mediante transacción
   * 
   * @param {Object} params - Parámetros del documento
   * @param {number} params.tipo_documento_id - ID del tipo de documento
   * @param {string} params.asunto - Asunto del documento
   * @param {string} params.contenido - Contenido del documento
   * @param {number} params.usuario_creador_id - ID del usuario creador
   * @param {number} params.area_origen_id - ID del área origen
   * @param {Date} params.fecha_limite - Fecha límite de respuesta (opcional)
   * @param {string} params.prioridad - Prioridad (BAJA|MEDIA|ALTA|URGENTE)
   * @param {string} params.instrucciones - Instrucciones al turnar (opcional)
   * @param {string} params.observaciones - Observaciones adicionales (opcional)
   * @param {string} params.contexto - Contexto del documento (OFICIO|MEMORANDUM|etc)
   * @param {number} params.prestamo_numero_id - ID del préstamo (obligatorio si contexto='OFICIO')
   * @returns {Promise<Object>} { documento_id, nodo_id, folio_emision }
   */
  async emitirDocumento(params) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // PASO 1: Establecer usuario actual para RLS
      await client.query('SELECT fn_establecer_usuario_actual($1)', [params.usuario_creador_id]);

      // PASO 2: Ejecutar stored procedure de emisión
      const query = `
        SELECT * FROM sp_emitir_documento_v5(
          $1::INTEGER,  -- p_tipo_documento_id
          $2::VARCHAR,  -- p_asunto
          $3::TEXT,     -- p_contenido
          $4::INTEGER,  -- p_usuario_creador_id
          $5::INTEGER,  -- p_area_origen_id
          $6::TIMESTAMP,-- p_fecha_limite
          $7::prioridad_enum, -- p_prioridad
          $8::TEXT,     -- p_instrucciones
          $9::TEXT,     -- p_observaciones
          $10::contexto_documento_enum, -- p_contexto
          $11::INTEGER  -- p_prestamo_numero_id
        )
      `;

      const values = [
        params.tipo_documento_id,
        params.asunto,
        params.contenido || null,
        params.usuario_creador_id,
        params.area_origen_id,
        params.fecha_limite || null,
        params.prioridad || 'MEDIA',
        params.instrucciones || null,
        params.observaciones || null,
        params.contexto || 'OTRO',
        params.prestamo_numero_id || null
      ];

      const result = await client.query(query, values);
      
      await client.query('COMMIT');

      logger.info('Documento emitido exitosamente', {
        documento_id: result.rows[0].documento_id,
        folio: result.rows[0].folio_emision,
        usuario_id: params.usuario_creador_id
      });

      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al emitir documento', {
        error: error.message,
        params: {
          tipo_documento_id: params.tipo_documento_id,
          usuario_creador_id: params.usuario_creador_id,
          area_origen_id: params.area_origen_id
        }
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene nodos PENDIENTES de un documento en un área específica
   * @param {number} documentoId - ID del documento
   * @param {number} areaId - ID del área
   * @returns {Promise<Array>} Lista de nodos pendientes
   */
  async obtenerNodosPendientesPorDocumento(documentoId, areaId) {
    const query = `
      SELECT 
        n.id,
        n.documento_id,
        n.tipo_nodo,
        n.estado,
        n.area_id,
        n.usuario_responsable_id,
        n.folio_original,
        n.folio_padre,
        n.fecha_generacion,
        n.instrucciones,
        n.observaciones,
        n.es_nodo_activo
      FROM nodo_documental n
      WHERE 
        n.documento_id = $1
        AND n.area_id = $2
        AND n.estado = 'PENDIENTE'
        AND n.es_nodo_activo = true
      ORDER BY n.fecha_generacion DESC
    `;

    const result = await db.query(query, [documentoId, areaId]);
    return result.rows;
  }

  /**
   * Ejecuta el stored procedure sp_recibir_documento para confirmar recepción
   * IMPORTANTE: Activa RLS antes de ejecutar el SP mediante transacción
   * 
   * @param {Object} params - Parámetros de recepción
   * @param {number} params.nodo_id - ID del nodo a recibir (debe estar PENDIENTE)
   * @param {number} params.usuario_recibe_id - ID del usuario que recibe
   * @param {string} params.observaciones - Observaciones opcionales
   * @returns {Promise<Object>} { p_folio_asignado }
   */
  async recibirDocumento(params) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // PASO 1: Establecer usuario actual para RLS
      await client.query('SELECT fn_establecer_usuario_actual($1)', [params.usuario_recibe_id]);

      // PASO 2: Ejecutar stored procedure de recepción
      const query = `
        SELECT * FROM sp_recibir_documento(
          $1::INTEGER,  -- p_nodo_id
          $2::INTEGER,  -- p_usuario_recibe_id
          $3::TEXT      -- p_observaciones
        )
      `;

      const values = [
        params.nodo_id,
        params.usuario_recibe_id,
        params.observaciones || null
      ];

      const result = await client.query(query, values);
      
      await client.query('COMMIT');

      logger.info('Documento recibido exitosamente', {
        nodo_id: params.nodo_id,
        folio_asignado: result.rows[0].p_folio_asignado,
        usuario_recibe_id: params.usuario_recibe_id
      });

      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al recibir documento', {
        error: error.message,
        params: {
          nodo_id: params.nodo_id,
          usuario_recibe_id: params.usuario_recibe_id
        }
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene un documento por su ID con toda su información relacionada
   * Incluye JOINs a tipo_documento, area, usuario_creador y nodo activo actual
   * IMPORTANTE: Activa RLS antes de consultar
   * 
   * @param {number} documentoId - ID del documento
   * @param {number} usuarioId - ID del usuario que consulta (para RLS)
   * @returns {Promise<Object|null>} Documento con información relacionada o null
   */
  async obtenerDocumentoPorId(documentoId, usuarioId) {
    const client = await db.pool.connect();

    try {
      // PASO 1: Establecer usuario actual para RLS
      await client.query('SELECT fn_establecer_usuario_actual($1)', [usuarioId]);

      // PASO 2: Consultar documento con JOINs
      const query = `
        SELECT 
          d.id,
          d.folio,
          d.tipo_documento_id,
          d.asunto,
          d.contenido,
          d.fecha_creacion,
          d.fecha_limite,
          d.prioridad,
          d.estado,
          d.usuario_creador_id,
          d.area_origen_id,
          d.solo_conocimiento,
          d.observaciones,
          d.entidad_externa_origen_id,
          d.entidad_externa_destino_id,
          d.numero_oficio_externo,
          d.es_externo,
          d.contexto,
          d.prestamo_numero_id,
          -- Tipo de documento
          td.nombre AS tipo_documento_nombre,
          td.clave AS tipo_documento_clave,
          td.requiere_respuesta AS tipo_documento_requiere_respuesta,
          -- Área origen
          ao.nombre AS area_origen_nombre,
          ao.clave AS area_origen_clave,
          ao.tipo AS area_origen_tipo,
          -- Usuario creador
          uc.nombre AS usuario_creador_nombre,
          uc.apellidos AS usuario_creador_apellidos,
          uc.email AS usuario_creador_email,
          -- Nodo activo actual
          na.id AS nodo_activo_id,
          na.tipo_nodo AS nodo_activo_tipo,
          na.estado AS nodo_activo_estado,
          na.folio_propio AS nodo_activo_folio,
          na.area_id AS nodo_activo_area_id,
          na.usuario_responsable_id AS nodo_activo_usuario_id,
          na.fecha_generacion AS nodo_activo_fecha_generacion,
          na.fecha_recepcion AS nodo_activo_fecha_recepcion,
          na.instrucciones AS nodo_activo_instrucciones,
          -- Área del nodo activo
          aa.nombre AS nodo_activo_area_nombre,
          aa.clave AS nodo_activo_area_clave,
          -- Usuario responsable del nodo activo
          ur.nombre AS nodo_activo_usuario_nombre,
          ur.apellidos AS nodo_activo_usuario_apellidos
        FROM documento d
        INNER JOIN tipo_documento td ON d.tipo_documento_id = td.id
        INNER JOIN area ao ON d.area_origen_id = ao.id
        INNER JOIN usuario uc ON d.usuario_creador_id = uc.id
        LEFT JOIN nodo_documental na ON d.id = na.documento_id AND na.es_nodo_activo = true
        LEFT JOIN area aa ON na.area_id = aa.id
        LEFT JOIN usuario ur ON na.usuario_responsable_id = ur.id
        WHERE d.id = $1
      `;

      const result = await client.query(query, [documentoId]);
      
      if (result.rows.length === 0) {
        logger.warn('Documento no encontrado o sin permisos', {
          documento_id: documentoId,
          usuario_id: usuarioId
        });
        return null;
      }

      return result.rows[0];

    } catch (error) {
      logger.error('Error al obtener documento por ID', {
        error: error.message,
        documento_id: documentoId,
        usuario_id: usuarioId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Lista documentos emitidos por un usuario en un área específica con paginación
   * IMPORTANTE: Activa RLS antes de consultar
   * 
   * @param {number} usuarioId - ID del usuario que consulta (para RLS)
   * @param {number} areaId - ID del área origen
   * @param {Object} options - Opciones de paginación y filtrado
   * @param {number} options.page - Página actual (default: 1)
   * @param {number} options.limit - Registros por página (default: 10)
   * @param {string} options.estado - Filtro por estado (opcional)
   * @returns {Promise<Object>} { documentos: Array, total: number, page: number, limit: number }
   */
  async listarDocumentosEmitidosPorUsuario(usuarioId, areaId, options = {}) {
    const { page = 1, limit = 10, estado = null } = options;
    const offset = (page - 1) * limit;

    const client = await db.pool.connect();

    try {
      // PASO 1: Establecer usuario actual para RLS
      await client.query('SELECT fn_establecer_usuario_actual($1)', [usuarioId]);

      // PASO 2: Construir query base con filtros dinámicos
      let queryConditions = 'WHERE d.area_origen_id = $2';
      const queryParams = [usuarioId, areaId];
      let paramIndex = 3;

      if (estado) {
        queryConditions += ` AND d.estado = $${paramIndex}`;
        queryParams.push(estado);
        paramIndex++;
      }

      // PASO 3: Consultar documentos con paginación
      const queryDocumentos = `
        SELECT 
          d.id,
          d.folio,
          d.tipo_documento_id,
          d.asunto,
          d.fecha_creacion,
          d.fecha_limite,
          d.prioridad,
          d.estado,
          d.solo_conocimiento,
          d.contexto,
          -- Tipo de documento
          td.nombre AS tipo_documento_nombre,
          td.clave AS tipo_documento_clave,
          -- Nodo activo
          na.id AS nodo_activo_id,
          na.estado AS nodo_activo_estado,
          na.area_id AS nodo_activo_area_id,
          na.folio_propio AS nodo_activo_folio,
          na.fecha_generacion AS nodo_activo_fecha,
          -- Área del nodo activo
          aa.nombre AS nodo_activo_area_nombre,
          aa.clave AS nodo_activo_area_clave
        FROM documento d
        INNER JOIN tipo_documento td ON d.tipo_documento_id = td.id
        LEFT JOIN nodo_documental na ON d.id = na.documento_id AND na.es_nodo_activo = true
        LEFT JOIN area aa ON na.area_id = aa.id
        ${queryConditions}
        ORDER BY d.fecha_creacion DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      const resultDocumentos = await client.query(queryDocumentos, queryParams);

      // PASO 4: Obtener total de registros para paginación
      const queryTotal = `
        SELECT COUNT(*) AS total
        FROM documento d
        ${queryConditions}
      `;

      const resultTotal = await client.query(queryTotal, queryParams.slice(0, paramIndex - 1));
      const total = parseInt(resultTotal.rows[0].total, 10);

      return {
        documentos: resultDocumentos.rows,
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      logger.error('Error al listar documentos emitidos', {
        error: error.message,
        usuario_id: usuarioId,
        area_id: areaId,
        page,
        limit
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene todos los tipos de documento activos
   * 
   * @returns {Promise<Array>} Lista de tipos de documento
   */
  async obtenerTiposDocumento() {
    try {
      const query = `
        SELECT 
          id,
          nombre,
          clave,
          descripcion,
          requiere_respuesta,
          activo
        FROM tipo_documento
        WHERE activo = true
        ORDER BY nombre
      `;

      const result = await db.query(query, []);
      
      return result.rows;

    } catch (error) {
      logger.error('Error al obtener tipos de documento', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Turna un documento a un área destino ejecutando sp_turnar_documento
   * @param {Object} params - Parámetros del turno
   * @param {number} params.documento_id - ID del documento
   * @param {number} params.area_destino_id - ID del área destino
   * @param {number} params.usuario_turna_id - ID del usuario que turna
   * @param {string} params.observaciones - Observaciones (opcional)
   * @param {string} params.instrucciones - Instrucciones (opcional)
   * @returns {Promise<Object>} { nodo_nuevo_id }
   */
  async turnarDocumento(params) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // PASO 1: Establecer usuario actual para RLS
      await client.query('SELECT fn_establecer_usuario_actual($1)', [params.usuario_turna_id]);

      // PASO 2: Ejecutar stored procedure sp_turnar_documento
      const query = `
        SELECT sp_turnar_documento(
          $1::INTEGER,  -- p_documento_id
          $2::INTEGER,  -- p_area_destino_id
          $3::INTEGER,  -- p_usuario_turna_id
          $4::VARCHAR,  -- p_observaciones
          $5::TEXT      -- p_instrucciones
        ) AS nodo_nuevo_id
      `;

      const values = [
        params.documento_id,
        params.area_destino_id,
        params.usuario_turna_id,
        params.observaciones || null,
        params.instrucciones || null
      ];

      const result = await client.query(query, values);
      
      await client.query('COMMIT');

      logger.info('Documento turnado exitosamente', {
        documento_id: params.documento_id,
        area_destino_id: params.area_destino_id,
        nodo_nuevo_id: result.rows[0].nodo_nuevo_id,
        usuario_turna_id: params.usuario_turna_id
      });

      return {
        nodo_nuevo_id: result.rows[0].nodo_nuevo_id
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al turnar documento', {
        error: error.message,
        params: {
          documento_id: params.documento_id,
          area_destino_id: params.area_destino_id,
          usuario_turna_id: params.usuario_turna_id
        }
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Crea una copia de conocimiento de un documento para un área
   * @param {Object} params - Parámetros de la copia
   * @param {number} params.documento_id - ID del documento
   * @param {number} params.area_id - ID del área que recibe la copia
   * @param {number} params.usuario_envia_id - ID del usuario que envía la copia
   * @returns {Promise<Object>} { copia_id }
   */
  async crearCopiaConocimiento(params) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // PASO 1: Establecer usuario actual para RLS
      await client.query('SELECT fn_establecer_usuario_actual($1)', [params.usuario_envia_id]);

      // PASO 2: Insertar copia de conocimiento
      const query = `
        INSERT INTO copia_conocimiento (
          documento_id,
          area_id,
          usuario_envia_id,
          fecha_envio,
          leido
        )
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, false)
        RETURNING id
      `;

      const values = [
        params.documento_id,
        params.area_id,
        params.usuario_envia_id
      ];

      const result = await client.query(query, values);
      
      await client.query('COMMIT');

      logger.info('Copia de conocimiento creada', {
        documento_id: params.documento_id,
        area_id: params.area_id,
        copia_id: result.rows[0].id,
        usuario_envia_id: params.usuario_envia_id
      });

      return {
        copia_id: result.rows[0].id
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al crear copia de conocimiento', {
        error: error.message,
        params: {
          documento_id: params.documento_id,
          area_id: params.area_id,
          usuario_envia_id: params.usuario_envia_id
        }
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene el próximo número consecutivo que se asignará (vista previa)
   * NO modifica la tabla consecutivo_area
   * @param {number} areaId - ID del área
   * @param {string} tipoOperacion - Tipo de operación (EMISION, RECEPCION, etc.)
   * @param {number} anio - Año (opcional, default: año actual)
   * @returns {Promise<number>} Próximo consecutivo
   */
  async getProximoConsecutivo(areaId, tipoOperacion, anio = null) {
    try {
      const query = `
        SELECT public.fn_preview_siguiente_consecutivo($1, $2, $3) AS proximo_consecutivo
      `;

      const currentYear = anio || new Date().getFullYear();
      const result = await db.query(query, [areaId, tipoOperacion, currentYear]);

      const proximoConsecutivo = result.rows[0]?.proximo_consecutivo;

      logger.debug('Preview de consecutivo obtenido', {
        area_id: areaId,
        tipo_operacion: tipoOperacion,
        anio: currentYear,
        proximo_consecutivo: proximoConsecutivo
      });

      return proximoConsecutivo;
    } catch (error) {
      logger.error('Error al obtener preview de consecutivo', {
        error: error.message,
        area_id: areaId,
        tipo_operacion: tipoOperacion,
        anio: anio
      });
      throw error;
    }
  }

  /**
   * Obtiene el folio completo formateado (vista previa)
   * NO asigna el número ni modifica la base de datos
   * @param {number} areaId - ID del área
   * @param {number} tipoDocumentoId - ID del tipo de documento
   * @param {number} anio - Año (opcional, default: año actual)
   * @returns {Promise<Object>} { folio_completo, consecutivo, clave_area, clave_tipo_doc }
   */
  async getPreviewFolioCompleto(areaId, tipoDocumentoId, anio = null) {
    try {
      const currentYear = anio || new Date().getFullYear();

      // Obtener información adicional del área y tipo de documento
      const queryInfo = `
        SELECT 
          a.clave AS clave_area,
          a.nombre AS nombre_area,
          td.clave AS clave_tipo_doc,
          td.nombre AS nombre_tipo_doc
        FROM area a
        CROSS JOIN tipo_documento td
        WHERE a.id = $1 AND td.id = $2
      `;

      const resultInfo = await db.query(queryInfo, [areaId, tipoDocumentoId]);
      const info = resultInfo.rows[0];

      // Desde migración 007: cada (area_id, clave_tipo, anio) tiene su propio contador.
      // fn_generar_folio con p_tipo_documento_id usa la clave del tipo como clave de contador.
      const claveTipoDoc = info?.clave_tipo_doc || 'EM';
      const queryConsecutivo = `
        SELECT public.fn_preview_siguiente_consecutivo($1, $2, $3) AS proximo_consecutivo
      `;

      const resultConsecutivo = await db.query(queryConsecutivo, [areaId, claveTipoDoc, currentYear]);

      // fn_preview_folio con tipoDocumentoId usa la misma lógica que fn_generar_folio v4
      const queryFolio = `
        SELECT public.fn_preview_folio($1, 'EMISION', $2, $3) AS folio_completo
      `;

      const resultFolio = await db.query(queryFolio, [areaId, currentYear, tipoDocumentoId]);
      const folioCompleto = resultFolio.rows[0]?.folio_completo;
      const proximoConsecutivo = resultConsecutivo.rows[0]?.proximo_consecutivo;

      logger.debug('Preview de folio completo obtenido', {
        area_id: areaId,
        tipo_documento_id: tipoDocumentoId,
        anio: currentYear,
        folio_completo: folioCompleto,
        consecutivo: proximoConsecutivo
      });

      return {
        folio_completo: folioCompleto,
        consecutivo: proximoConsecutivo,
        clave_area: info?.clave_area,
        nombre_area: info?.nombre_area,
        clave_tipo_doc: info?.clave_tipo_doc,
        nombre_tipo_doc: info?.nombre_tipo_doc,
        anio: currentYear
      };
    } catch (error) {
      logger.error('Error al obtener preview de folio completo', {
        error: error.message,
        area_id: areaId,
        tipo_documento_id: tipoDocumentoId,
        anio: anio
      });
      throw error;
    }
  }

  /**
   * Lista los documentos EMITIDOS por un área (area_origen_id = areaId)
   * con paginación y filtros opcionales.
   *
   * @param {number} areaId      - ID del área
   * @param {Object} filters
   * @param {number}  filters.page       - Página (1-based)
   * @param {number}  filters.limit      - Registros por página
   * @param {string}  [filters.busqueda] - Búsqueda libre por folio o asunto
   * @param {string}  [filters.estado]   - Estado del documento (valor del enum)
   * @param {string}  [filters.claveTipo]- Clave de tipo de emisión (EC, EO, EM…)
   * @returns {Promise<{ rows: Array, total: number }>}
   */
  async listarEmisionesPorArea(areaId, filters = {}) {
    const { page = 1, limit = 10, busqueda = '', estado = '', claveTipo = '' } = filters;
    const offset = (page - 1) * limit;
    const params = [areaId];
    const conditions = ['d.area_origen_id = $1', 'd.documento_invalidado = false'];

    if (busqueda) {
      params.push(`%${busqueda}%`);
      conditions.push(`(d.folio ILIKE $${params.length} OR d.asunto ILIKE $${params.length})`);
    }
    if (estado) {
      params.push(estado);
      conditions.push(`d.estado = $${params.length}`);
    }
    if (claveTipo) {
      params.push(claveTipo);
      conditions.push(`td.clave = $${params.length}`);
    }

    const where = conditions.join(' AND ');

    const dataQuery = `
      SELECT
        d.id,
        d.folio,
        d.asunto,
        d.estado,
        d.prioridad,
        d.fecha_creacion,
        d.contexto,
        td.id    AS tipo_documento_id,
        td.nombre AS tipo_documento_nombre,
        td.clave  AS tipo_documento_clave,
        uc.id       AS usuario_id,
        uc.nombre   AS usuario_nombre,
        uc.apellidos AS usuario_apellidos,
        -- Nodo activo: obtener el área de destino actual
        nd.area_id        AS area_destino_id,
        a_dest.nombre     AS area_destino_nombre
      FROM documento d
      INNER JOIN tipo_documento td ON d.tipo_documento_id = td.id
      INNER JOIN usuario uc ON d.usuario_creador_id = uc.id
      LEFT JOIN nodo_documental nd
        ON nd.documento_id = d.id AND nd.es_nodo_activo = true
      LEFT JOIN area a_dest ON nd.area_id = a_dest.id
      WHERE ${where}
      ORDER BY d.fecha_creacion DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM documento d
      INNER JOIN tipo_documento td ON d.tipo_documento_id = td.id
      WHERE ${where}
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...params, limit, offset]),
      db.query(countQuery, params),
    ]);

    return {
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10) || 0,
    };
  }

  /**
   * Lista los documentos RECIBIDOS por un área, identificando los nodos
   * de la cadena documental donde nodo_documental.area_id = areaId
   * y tipo_nodo IN ('RECEPCION', 'COPIA').
   *
   * @param {number} areaId      - ID del área
   * @param {Object} filters
   * @param {number}  filters.page       - Página (1-based)
   * @param {number}  filters.limit      - Registros por página
   * @param {string}  [filters.busqueda] - Búsqueda libre por folio o asunto
   * @param {string}  [filters.estado]   - Estado del documento (valor del enum)
   * @returns {Promise<{ rows: Array, total: number }>}
   */
  async listarRecepcionesPorArea(areaId, filters = {}) {
    const { page = 1, limit = 10, busqueda = '', estado = '' } = filters;
    const offset = (page - 1) * limit;
    const params = [areaId];
    const conditions = [
      'n.area_id = $1',
      "n.tipo_nodo IN ('RECEPCION', 'COPIA')",
      'd.documento_invalidado = false',
    ];

    if (busqueda) {
      params.push(`%${busqueda}%`);
      conditions.push(`(d.folio ILIKE $${params.length} OR d.asunto ILIKE $${params.length})`);
    }
    if (estado) {
      params.push(estado);
      conditions.push(`d.estado = $${params.length}`);
    }

    const where = conditions.join(' AND ');

    const dataQuery = `
      SELECT
        d.id,
        d.folio,
        d.asunto,
        d.estado,
        d.prioridad,
        n.fecha_generacion AS fecha_creacion,
        d.contexto,
        td.id    AS tipo_documento_id,
        td.nombre AS tipo_documento_nombre,
        td.clave  AS tipo_documento_clave,
        ao.nombre AS area_origen_nombre,
        ur.id       AS usuario_id,
        ur.nombre   AS usuario_nombre,
        ur.apellidos AS usuario_apellidos
      FROM nodo_documental n
      INNER JOIN documento d ON n.documento_id = d.id
      INNER JOIN tipo_documento td ON d.tipo_documento_id = td.id
      INNER JOIN area ao ON d.area_origen_id = ao.id
      INNER JOIN usuario ur ON n.usuario_responsable_id = ur.id
      WHERE ${where}
      ORDER BY n.fecha_generacion DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM nodo_documental n
      INNER JOIN documento d ON n.documento_id = d.id
      WHERE ${where}
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...params, limit, offset]),
      db.query(countQuery, params),
    ]);

    return {
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10) || 0,
    };
  }
}

module.exports = new DocumentoRepository();
