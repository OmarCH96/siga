/**
 * Repositorio de Auditoría
 * Capa de acceso a datos para auditoría del sistema y documentos
 * Registra eventos importantes del sistema
 */

const db = require('../config/database');

class AuditoriaRepository {
  /**
   * Registra un evento del sistema (login, logout, configuración, etc.)
   * @param {Object} eventData - Datos del evento
   * @returns {Promise<Object>} Registro de auditoría creado
   */
  async registrarEventoSistema(eventData) {
    const {
      accion,
      descripcion,
      usuarioId = null,
      areaId = null,
      detalles = null,
      ipAddress = null,
      userAgent = null,
    } = eventData;

    // Intentar insertar en auditoria_sistema, si no existe usar console.log
    try {
      const query = `
        INSERT INTO auditoria_sistema (
          accion, descripcion, usuario_id, area_id, detalles, ip_address, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        accion,
        descripcion,
        usuarioId,
        areaId,
        detalles,
        ipAddress,
        userAgent,
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      // Si la tabla no existe, solo registrar en consola
      if (error.code === '42P01') {
        console.log(`[AUDITORÍA] ${accion}: ${descripcion} (Usuario ID: ${usuarioId})`);
        return { success: false, message: 'Tabla auditoria_sistema no existe' };
      }
      throw error;
    }
  }

  /**
   * Registra un evento de auditoría de documento
   * @param {Object} eventData - Datos del evento
   * @returns {Promise<Object>} Registro de auditoría creado
   */
  async registrarEvento(eventData) {
    const {
      documentoId = null,
      accion,
      descripcion,
      usuarioId = null,
      areaId = null,
      detalles = null,
      ipAddress = null,
    } = eventData;

    const query = `
      INSERT INTO historial_documento (
        documento_id, accion, descripcion, usuario_id, area_id, detalles, ip_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      documentoId,
      accion,
      descripcion,
      usuarioId,
      areaId,
      detalles,
      ipAddress,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtiene el historial de un documento
   * @param {number} documentoId - ID del documento
   * @returns {Promise<Array>} Historial del documento
   */
  async obtenerHistorialDocumento(documentoId) {
    const query = `
      SELECT 
        h.*,
        u.nombre || ' ' || u.apellidos AS usuario_nombre,
        a.nombre AS area_nombre
      FROM historial_documento h
      LEFT JOIN usuario u ON h.usuario_id = u.id
      LEFT JOIN area a ON h.area_id = a.id
      WHERE h.documento_id = $1
      ORDER BY h.fecha DESC
    `;

    const result = await db.query(query, [documentoId]);
    return result.rows;
  }

  /**
   * Obtiene eventos de auditoría con filtros
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>} Lista de eventos
   */
  async obtenerEventos(filters = {}) {
    let query = `
      SELECT 
        h.*,
        u.nombre || ' ' || u.apellidos AS usuario_nombre,
        a.nombre AS area_nombre
      FROM historial_documento h
      LEFT JOIN usuario u ON h.usuario_id = u.id
      LEFT JOIN area a ON h.area_id = a.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (filters.usuarioId) {
      query += ` AND h.usuario_id = $${paramIndex}`;
      values.push(filters.usuarioId);
      paramIndex++;
    }

    if (filters.accion) {
      query += ` AND h.accion = $${paramIndex}`;
      values.push(filters.accion);
      paramIndex++;
    }

    if (filters.fechaInicio) {
      query += ` AND h.fecha >= $${paramIndex}`;
      values.push(filters.fechaInicio);
      paramIndex++;
    }

    if (filters.fechaFin) {
      query += ` AND h.fecha <= $${paramIndex}`;
      values.push(filters.fechaFin);
      paramIndex++;
    }

    query += ` ORDER BY h.fecha DESC LIMIT 100`;

    const result = await db.query(query, values);
    return result.rows;
  }
}

module.exports = new AuditoriaRepository();
