/**
 * Repositorio de Préstamos
 * Capa de acceso a datos para préstamo de números de oficio
 */

const db = require('../config/database');

class PrestamoRepository {
  /**
   * Obtiene las áreas ancestras autorizadas para prestar números al usuario actual
   * @param {number} areaId - ID del área del usuario
   * @returns {Promise<Array>} Lista de áreas prestamistas
   */
  async findAreasPrestamistas(areaId) {
    const query = `
      WITH RECURSIVE ancestros AS (
        -- Área actual (puede usar su propio número)
        SELECT id, nombre, clave, tipo, area_padre_id, nivel
        FROM area
        WHERE id = $1 AND activa = true
        
        UNION ALL
        
        -- Ancestros recursivamente
        SELECT a.id, a.nombre, a.clave, a.tipo, a.area_padre_id, a.nivel
        FROM area a
        INNER JOIN ancestros anc ON a.id = anc.area_padre_id
        WHERE a.activa = true
      )
      SELECT id, nombre, clave, tipo, nivel
      FROM ancestros
      WHERE tipo IN ('SECRETARIA', 'SUBSECRETARIA', 'INSTITUTO', 'DIRECCION_GENERAL', 'DIRECCION')
         OR id = $1  -- Incluir el área propia
      ORDER BY nivel ASC
    `;
    
    const result = await db.query(query, [areaId]);
    return result.rows;
  }

  /**
   * Obtiene la vista previa del folio (formato sin incrementar consecutivo)
   * @param {number} areaId - ID del área
   * @param {number} tipoDocumentoId - ID del tipo de documento
   * @returns {Promise<string>} Formato del folio
   */
  async previewFolio(areaId, tipoDocumentoId) {
    const query = `
      SELECT 
        td.clave || '-' || a.clave || '-####/' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT AS formato_folio,
        a.clave,
        a.nombre,
        td.nombre AS tipo_documento_nombre
      FROM area a
      CROSS JOIN tipo_documento td
      WHERE a.id = $1 
        AND a.activa = true
        AND td.id = $2
        AND td.activo = true
    `;
    
    const result = await db.query(query, [areaId, tipoDocumentoId]);
    return result.rows[0] || null;
  }

  /**
   * Crea una solicitud de préstamo de número
   * @param {number} areaSolicitanteId - ID del área solicitante
   * @param {number} areaPrestamistaId - ID del área prestamista
   * @param {number} usuarioSolicitaId - ID del usuario que solicita
   * @param {string} motivacion - Motivo de la solicitud
   * @returns {Promise<Object>} Préstamo creado
   */
  async solicitar(areaSolicitanteId, areaPrestamistaId, usuarioSolicitaId, motivacion) {
    const query = `
      SELECT sp_solicitar_prestamo_numero($1, $2, $3, $4) AS prestamo_id
    `;
    
    const result = await db.query(query, [areaSolicitanteId, areaPrestamistaId, usuarioSolicitaId, motivacion]);
    
    // Obtener el préstamo completo
    if (result.rows[0]?.prestamo_id) {
      return this.findById(result.rows[0].prestamo_id);
    }
    
    return null;
  }

  /**
   * Crea solicitud de préstamo con reserva inmediata de folio y documento bloqueado.
   * Flujo de migración 006: crea documento en estado PENDIENTE_PRESTAMO.
   *
   * @param {Object} params - Datos para solicitud con reserva
   * @returns {Promise<Object|null>} Resultado de la SP con IDs y folio reservado
   */
  async solicitarConReserva(params) {
    const query = `
      SELECT *
      FROM sp_solicitar_prestamo_con_reserva(
        $1::INTEGER,                    -- p_area_solicitante_id
        $2::INTEGER,                    -- p_area_prestamista_id
        $3::INTEGER,                    -- p_usuario_solicita_id
        $4::TEXT,                       -- p_motivacion
        $5::INTEGER,                    -- p_tipo_documento_id
        $6::VARCHAR,                    -- p_asunto
        $7::TEXT,                       -- p_contenido
        $8::TIMESTAMP,                  -- p_fecha_limite
        $9::prioridad_enum,             -- p_prioridad
        $10::TEXT,                      -- p_instrucciones
        $11::TEXT,                      -- p_observaciones
        $12::contexto_documento_enum    -- p_contexto
      )
    `;

    const values = [
      params.area_solicitante_id,
      params.area_prestamista_id,
      params.usuario_solicita_id,
      params.motivacion,
      params.tipo_documento_id,
      params.asunto,
      params.contenido || null,
      params.fecha_limite || null,
      params.prioridad || 'MEDIA',
      params.instrucciones || null,
      params.observaciones || null,
      params.contexto || 'OTRO'
    ];

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Busca un préstamo por su ID
   * @param {number} prestamoId - ID del préstamo
   * @returns {Promise<Object|null>} Préstamo encontrado o null
   */
  async findById(prestamoId) {
    const query = `
      SELECT 
        p.*,
        as_area.nombre AS area_solicitante_nombre,
        as_area.clave AS area_solicitante_clave,
        ap_area.nombre AS area_prestamista_nombre,
        ap_area.clave AS area_prestamista_clave,
        u_sol.nombre_usuario AS usuario_solicita_nombre,
        u_res.nombre_usuario AS usuario_resuelve_nombre
      FROM prestamo_numero_oficio p
      LEFT JOIN area as_area ON p.area_solicitante_id = as_area.id
      LEFT JOIN area ap_area ON p.area_prestamista_id = ap_area.id
      LEFT JOIN usuario u_sol ON p.usuario_solicita_id = u_sol.id
      LEFT JOIN usuario u_res ON p.usuario_resuelve_id = u_res.id
      WHERE p.id = $1
    `;
    
    const result = await db.query(query, [prestamoId]);
    return result.rows[0] || null;
  }

  /**
   * Obtiene préstamos aprobados disponibles para el usuario
   * @param {number} areaSolicitanteId - ID del área solicitante
   * @returns {Promise<Array>} Lista de préstamos aprobados
   */
  async findAprobadosDisponibles(areaSolicitanteId) {
    const query = `
      SELECT 
        p.id,
        p.folio_asignado,
        p.fecha_vencimiento,
        p.area_prestamista_id,
        a.nombre AS area_prestamista_nombre,
        a.clave AS area_prestamista_clave,
        EXTRACT(DAY FROM (p.fecha_vencimiento - CURRENT_TIMESTAMP)) AS dias_restantes
      FROM prestamo_numero_oficio p
      INNER JOIN area a ON p.area_prestamista_id = a.id
      WHERE p.area_solicitante_id = $1
        AND p.estado = 'APROBADO'
        AND p.fecha_vencimiento > CURRENT_TIMESTAMP
      ORDER BY p.fecha_vencimiento ASC
    `;
    
    const result = await db.query(query, [areaSolicitanteId]);
    return result.rows;
  }

  /**
   * Obtiene préstamos pendientes (solicitados) del área
   * @param {number} areaId - ID del área
   * @returns {Promise<Array>} Lista de préstamos pendientes
   */
  async findPendientes(areaId) {
    const query = `
      SELECT 
        p.*,
        as_area.nombre AS area_solicitante_nombre,
        as_area.clave AS area_solicitante_clave,
        ap_area.nombre AS area_prestamista_nombre,
        ap_area.clave AS area_prestamista_clave,
        u_sol.nombre || ' ' || u_sol.apellidos AS usuario_solicita_nombre_completo
      FROM prestamo_numero_oficio p
      INNER JOIN area as_area ON p.area_solicitante_id = as_area.id
      INNER JOIN area ap_area ON p.area_prestamista_id = ap_area.id
      INNER JOIN usuario u_sol ON p.usuario_solicita_id = u_sol.id
      WHERE (p.area_solicitante_id = $1 OR p.area_prestamista_id = $1)
        AND p.estado = 'SOLICITADO'
      ORDER BY p.fecha_solicitud DESC
    `;
    
    const result = await db.query(query, [areaId]);
    return result.rows;
  }

  /**
   * Resuelve (aprueba o rechaza) un préstamo
   * @param {number} prestamoId - ID del préstamo
   * @param {number} usuarioResuelveId - ID del usuario que resuelve
   * @param {boolean} aprobar - true para aprobar, false para rechazar
   * @param {string} motivo - Motivo (obligatorio al rechazar)
   * @param {number} diasVencimiento - Días de vigencia (solo al aprobar)
   * @returns {Promise<Object>} Resultado con folio asignado
   */
  async resolver(prestamoId, usuarioResuelveId, aprobar, motivo = null, diasVencimiento = 5) {
    const query = `
      SELECT * FROM sp_resolver_prestamo_numero($1, $2, $3, $4, $5) AS folio_asignado
    `;
    
    const result = await db.query(query, [prestamoId, usuarioResuelveId, aprobar, motivo, diasVencimiento]);
    return result.rows[0] || null;
  }

  /**
   * Marca un préstamo como utilizado
   * @param {number} prestamoId - ID del préstamo
   * @param {number} areaSolicitanteId - ID del área solicitante (verificación de propiedad)
   * @returns {Promise<boolean>} true si se marcó correctamente
   */
  async marcarUtilizado(prestamoId, areaSolicitanteId) {
    const query = `
      UPDATE prestamo_numero_oficio
      SET estado = 'UTILIZADO',
          fecha_uso = CURRENT_TIMESTAMP
      WHERE id = $1 AND estado = 'APROBADO' AND area_solicitante_id = $2
      RETURNING id
    `;
    
    const result = await db.query(query, [prestamoId, areaSolicitanteId]);
    return result.rows.length > 0;
  }
}

module.exports = new PrestamoRepository();
