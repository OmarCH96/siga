/**
 * Repositorio de Tipos de Documento
 * Capa de acceso a datos para la tabla 'tipo_documento'
 */

const db = require('../config/database');

class TipoDocumentoRepository {
  /**
   * Busca un tipo de documento por su ID
   * @param {number} id - ID del tipo de documento
   * @returns {Promise<Object|null>} Tipo de documento encontrado o null
   */
  async findById(id) {
    const query = `
      SELECT 
        id, nombre, clave, descripcion, plantilla,
        requiere_respuesta, activo, fecha_creacion
      FROM tipo_documento
      WHERE id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Busca un tipo de documento por su clave
   * @param {string} clave - Clave del tipo de documento
   * @returns {Promise<Object|null>} Tipo de documento encontrado o null
   */
  async findByClave(clave) {
    const query = `
      SELECT 
        id, nombre, clave, descripcion, plantilla,
        requiere_respuesta, activo, fecha_creacion
      FROM tipo_documento
      WHERE clave = $1
    `;
    
    const result = await db.query(query, [clave]);
    return result.rows[0] || null;
  }

  /**
   * Obtiene todos los tipos de documento con filtros opcionales
   * @param {Object} filters - Filtros opcionales (activo, search, limit, offset)
   * @returns {Promise<Object>} Objeto con rows (array de tipos de documento) y total
   */
  async findAll(filters = {}) {
    // Construir condiciones WHERE
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCounter = 1;

    // Filtro por estado activo
    if (filters.activo !== undefined) {
      whereClause += ` AND activo = $${paramCounter}`;
      params.push(filters.activo);
      paramCounter++;
    }

    // Filtro de búsqueda
    if (filters.search) {
      whereClause += ` AND (nombre ILIKE $${paramCounter} OR clave ILIKE $${paramCounter} OR descripcion ILIKE $${paramCounter})`;
      params.push(`%${filters.search}%`);
      paramCounter++;
    }

    // Primero obtener el conteo total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tipo_documento
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Construir query principal con todos los campos
    let query = `
      SELECT 
        id, nombre, clave, descripcion, plantilla,
        requiere_respuesta, activo, fecha_creacion
      FROM tipo_documento
      ${whereClause}
      ORDER BY 
      CASE WHEN activo = true THEN 0 ELSE 1 END,
      nombre ASC
    `;

    // Paginación
    if (filters.limit) {
      query += ` LIMIT $${paramCounter}`;
      params.push(filters.limit);
      paramCounter++;
    }

    if (filters.offset !== undefined) {
      query += ` OFFSET $${paramCounter}`;
      params.push(filters.offset);
      paramCounter++;
    }

    const result = await db.query(query, params);

    return {
      rows: result.rows,
      total,
    };
  }

  /**
   * Crea un nuevo tipo de documento
   * @param {Object} tipoDocumentoData - Datos del tipo de documento
   * @returns {Promise<Object>} Tipo de documento creado
   */
  async create(tipoDocumentoData) {
    const {
      nombre,
      clave,
      descripcion = null,
      plantilla = null,
      requiere_respuesta = false,
      activo = true,
    } = tipoDocumentoData;

    const query = `
      INSERT INTO tipo_documento 
        (nombre, clave, descripcion, plantilla, requiere_respuesta, activo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id, nombre, clave, descripcion, plantilla,
        requiere_respuesta, activo, fecha_creacion
    `;

    const values = [nombre, clave, descripcion, plantilla, requiere_respuesta, activo];
    const result = await db.query(query, values);

    return result.rows[0];
  }

  /**
   * Actualiza un tipo de documento existente
   * @param {number} id - ID del tipo de documento
   * @param {Object} tipoDocumentoData - Datos a actualizar
   * @returns {Promise<Object>} Tipo de documento actualizado
   */
  async update(id, tipoDocumentoData) {
    const fields = [];
    const values = [];
    let paramCounter = 1;

    // Construir dinámicamente la query según los campos proporcionados
    if (tipoDocumentoData.nombre !== undefined) {
      fields.push(`nombre = $${paramCounter}`);
      values.push(tipoDocumentoData.nombre);
      paramCounter++;
    }

    if (tipoDocumentoData.clave !== undefined) {
      fields.push(`clave = $${paramCounter}`);
      values.push(tipoDocumentoData.clave);
      paramCounter++;
    }

    if (tipoDocumentoData.descripcion !== undefined) {
      fields.push(`descripcion = $${paramCounter}`);
      values.push(tipoDocumentoData.descripcion);
      paramCounter++;
    }

    if (tipoDocumentoData.plantilla !== undefined) {
      fields.push(`plantilla = $${paramCounter}`);
      values.push(tipoDocumentoData.plantilla);
      paramCounter++;
    }

    if (tipoDocumentoData.requiere_respuesta !== undefined) {
      fields.push(`requiere_respuesta = $${paramCounter}`);
      values.push(tipoDocumentoData.requiere_respuesta);
      paramCounter++;
    }

    if (tipoDocumentoData.activo !== undefined) {
      fields.push(`activo = $${paramCounter}`);
      values.push(tipoDocumentoData.activo);
      paramCounter++;
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    values.push(id);

    const query = `
      UPDATE tipo_documento
      SET ${fields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING 
        id, nombre, clave, descripcion, plantilla,
        requiere_respuesta, activo, fecha_creacion
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Actualiza el estado activo de un tipo de documento
   * @param {number} id - ID del tipo de documento
   * @param {boolean} activo - Nuevo estado
   * @returns {Promise<Object>} Tipo de documento actualizado
   */
  async updateStatus(id, activo) {
    const query = `
      UPDATE tipo_documento
      SET activo = $1
      WHERE id = $2
      RETURNING 
        id, nombre, clave, descripcion, plantilla,
        requiere_respuesta, activo, fecha_creacion
    `;

    const result = await db.query(query, [activo, id]);
    return result.rows[0] || null;
  }

  /**
   * Elimina un tipo de documento (soft delete)
   * @param {number} id - ID del tipo de documento
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async delete(id) {
    const query = `
      UPDATE tipo_documento
      SET activo = false
      WHERE id = $1
      RETURNING id
    `;

    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Elimina permanentemente un tipo de documento de la base de datos
   * @param {number} id - ID del tipo de documento
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async hardDelete(id) {
    const query = `DELETE FROM tipo_documento WHERE id = $1 RETURNING id`;
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Obtiene estadísticas de tipos de documento (solo contadores)
   * OPTIMIZADO: Hace un solo query con COUNTs agregados
   * @returns {Promise<Object>} { total, activos, inactivos }
   */
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE activo = true) as activos,
        COUNT(*) FILTER (WHERE activo = false) as inactivos
      FROM tipo_documento
    `;
    
    const result = await db.query(query);
    const stats = result.rows[0];
    
    return {
      total: parseInt(stats.total, 10),
      activos: parseInt(stats.activos, 10),
      inactivos: parseInt(stats.inactivos, 10),
    };
  }
}

module.exports = new TipoDocumentoRepository();
