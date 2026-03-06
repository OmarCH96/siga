/**
 * Repositorio de Roles
 * Capa de acceso a datos para la tabla 'rol'
 */

const db = require('../config/database');

class RolRepository {
  /**
   * Busca un rol por su ID
   * @param {number} id - ID del rol
   * @returns {Promise<Object|null>} Rol encontrado o null
   */
  async findById(id) {
    const query = `
      SELECT * FROM rol WHERE id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtiene todos los roles activos
   * @returns {Promise<Array>} Lista de roles
   */
  async findAllActive() {
    const query = `
      SELECT id, nombre, descripcion, permisos, activo, fecha_creacion
      FROM rol
      WHERE activo = true
      ORDER BY nombre
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Obtiene todos los roles
   * @returns {Promise<Array>} Lista de roles
   */
  async findAll() {
    const query = `
      SELECT id, nombre, descripcion, permisos, activo, fecha_creacion
      FROM rol
      ORDER BY nombre
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Verifica si un rol tiene un permiso específico
   * @param {number} rolId - ID del rol
   * @param {string} permiso - Permiso a verificar
   * @returns {Promise<boolean>} true si tiene el permiso
   */
  async hasPermission(rolId, permiso) {
    const query = `
      SELECT permisos FROM rol WHERE id = $1 AND activo = true
    `;
    
    const result = await db.query(query, [rolId]);
    
    if (result.rows.length === 0) {
      return false;
    }

    const permisos = result.rows[0].permisos;
    
    // Si tiene permiso de todo (*)
    if (permisos === '*') {
      return true;
    }

    // Verificar si el permiso está en la lista
    const listaPermisos = permisos.split(',').map(p => p.trim());
    return listaPermisos.includes(permiso);
  }
}

module.exports = new RolRepository();
