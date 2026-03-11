/**
 * Repositorio de Documentos
 * Capa de acceso a datos para la tabla 'documento' y 'nodo_documental'
 */

const db = require('../config/database');

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
   * Emite un nuevo documento usando el stored procedure sp_emitir_documento_v5
   * @param {Object} data - Datos del documento a emitir
   * @param {number} data.tipo_documento_id - ID del tipo de documento
   * @param {string} data.asunto - Asunto del documento
   * @param {string} data.contenido - Contenido del documento
   * @param {number} data.usuario_creador_id - ID del usuario creador
   * @param {number} data.area_origen_id - ID del área de origen
   * @param {string|null} data.fecha_limite - Fecha límite (opcional)
   * @param {string} data.prioridad - Prioridad (BAJA|MEDIA|ALTA|URGENTE)
   * @param {string|null} data.instrucciones - Instrucciones (opcional)
   * @param {string|null} data.observaciones - Observaciones (opcional)
   * @param {string} data.contexto - Contexto (OFICIO|MEMORANDUM|etc)
   * @param {number|null} data.prestamo_numero_id - ID del préstamo de número (obligatorio si contexto='OFICIO')
   * @returns {Promise<Object>} Resultado con p_documento_id, p_nodo_id, p_folio_emision
   */
  async emitirDocumento(data) {
    const query = `
      SELECT * FROM sp_emitir_documento_v5(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
    `;

    const params = [
      data.tipo_documento_id,
      data.asunto,
      data.contenido,
      data.usuario_creador_id,
      data.area_origen_id,
      data.fecha_limite || null,
      data.prioridad || 'MEDIA',
      data.instrucciones || null,
      data.observaciones || null,
      data.contexto || 'OTRO',
      data.prestamo_numero_id || null,
    ];

    const result = await db.query(query, params);
    return result.rows[0];
  }
}

module.exports = new DocumentoRepository();
