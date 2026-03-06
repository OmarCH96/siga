/**
 * Repositorio de Áreas
 * Capa de acceso a datos para la tabla 'area'
 */

const db = require('../config/database');

class AreaRepository {
  /**
   * Busca un área por su ID
   * @param {number} id - ID del área
   * @returns {Promise<Object|null>} Área encontrada o null
   */
  async findById(id) {
    const query = `
      SELECT * FROM area WHERE id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtiene todas las áreas activas
   * @returns {Promise<Array>} Lista de áreas
   */
  async findAllActive() {
    const query = `
      SELECT 
        id, nombre, clave, tipo, area_padre_id, nivel, activa, descripcion
      FROM area
      WHERE activa = true
      ORDER BY nivel, nombre
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Obtiene la jerarquía completa de áreas
   * @returns {Promise<Array>} Lista jerárquica de áreas
   */
  async findHierarchy() {
    const query = `
      SELECT 
        a.id, a.nombre, a.clave, a.tipo, a.area_padre_id, a.nivel, a.activa,
        ap.nombre AS area_padre_nombre
      FROM area a
      LEFT JOIN area ap ON a.area_padre_id = ap.id
      WHERE a.activa = true
      ORDER BY a.nivel, a.nombre
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Obtiene las áreas hijas de un área específica
   * @param {number} areaPadreId - ID del área padre
   * @returns {Promise<Array>} Lista de áreas hijas
   */
  async findByParent(areaPadreId) {
    const query = `
      SELECT 
        id, nombre, clave, tipo, area_padre_id, nivel, activa
      FROM area
      WHERE area_padre_id = $1 AND activa = true
      ORDER BY nombre
    `;
    
    const result = await db.query(query, [areaPadreId]);
    return result.rows;
  }

  /**
   * Obtiene las áreas raíz (sin padre)
   * @returns {Promise<Array>} Lista de áreas raíz
   */
  async findRootAreas() {
    const query = `
      SELECT 
        id, nombre, clave, tipo, nivel, activa
      FROM area
      WHERE area_padre_id IS NULL AND activa = true
      ORDER BY nombre
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Obtiene la ruta completa de un área (jerarquía de padres)
   * @param {number} areaId - ID del área
   * @returns {Promise<Array>} Lista de áreas desde la raíz hasta el área
   */
  async getAreaPath(areaId) {
    const query = `
      WITH RECURSIVE area_path AS (
        SELECT id, nombre, clave, tipo, area_padre_id, nivel, 1 as depth
        FROM area
        WHERE id = $1
        
        UNION ALL
        
        SELECT a.id, a.nombre, a.clave, a.tipo, a.area_padre_id, a.nivel, ap.depth + 1
        FROM area a
        INNER JOIN area_path ap ON a.id = ap.area_padre_id
      )
      SELECT * FROM area_path ORDER BY depth DESC
    `;
    
    const result = await db.query(query, [areaId]);
    return result.rows;
  }
}

module.exports = new AreaRepository();
