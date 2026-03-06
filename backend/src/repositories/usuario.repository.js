/**
 * Repositorio de Usuarios
 * Capa de acceso a datos para la tabla 'usuario'
 */

const db = require('../config/database');

class UsuarioRepository {
  /**
   * Busca un usuario por su ID
   * @param {number} id - ID del usuario
   * @returns {Promise<Object|null>} Usuario encontrado o null
   */
  async findById(id) {
    const query = `
      SELECT 
        u.id, u.nombre, u.apellidos, u.email, u.nombre_usuario,
        u.telefono, u.celular, u.activo, u.fecha_alto AS fecha_alta,
        u.fecha_ultimo_acceso, u.area_id, u.rol_id,
        r.nombre AS rol_nombre, r.permisos AS rol_permisos,
        a.nombre AS area_nombre, a.clave AS area_clave, a.tipo AS area_tipo
      FROM usuario u
      INNER JOIN rol r ON u.rol_id = r.id
      INNER JOIN area a ON u.area_id = a.id
      WHERE u.id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Busca un usuario por nombre de usuario
   * @param {string} nombreUsuario - Nombre de usuario
   * @returns {Promise<Object|null>} Usuario encontrado o null
   */
  async findByUsername(nombreUsuario) {
    const query = `
      SELECT 
        u.id, u.nombre, u.apellidos, u.email, u.nombre_usuario,
        u.contraseña, u.activo, u.area_id, u.rol_id,
        r.nombre AS rol_nombre, r.permisos AS rol_permisos,
        a.nombre AS area_nombre, a.clave AS area_clave, a.tipo AS area_tipo
      FROM usuario u
      INNER JOIN rol r ON u.rol_id = r.id
      INNER JOIN area a ON u.area_id = a.id
      WHERE u.nombre_usuario = $1
    `;
    
    const result = await db.query(query, [nombreUsuario]);
    return result.rows[0] || null;
  }

  /**
   * Busca un usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>} Usuario encontrado o null
   */
  async findByEmail(email) {
    const query = `
      SELECT u.* FROM usuario u WHERE u.email = $1
    `;
    
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Crea un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado
   */
  async create(userData) {
    const {
      nombre,
      apellidos,
      email,
      nombreUsuario,
      contraseña,
      areaId,
      rolId,
      telefono = null,
      celular = null,
    } = userData;

    const query = `
      INSERT INTO usuario (
        nombre, apellidos, email, nombre_usuario, contraseña,
        area_id, rol_id, telefono, celular
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, nombre, apellidos, email, nombre_usuario, area_id, rol_id, activo, fecha_alta
    `;

    const values = [
      nombre,
      apellidos,
      email,
      nombreUsuario,
      contraseña,
      areaId,
      rolId,
      telefono,
      celular,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Actualiza la fecha del último acceso
   * @param {number} id - ID del usuario
   * @returns {Promise<void>}
   */
  async updateLastAccess(id) {
    const query = `
      UPDATE usuario 
      SET fecha_ultimo_acceso = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    
    await db.query(query, [id]);
  }

  /**
   * Actualiza el estado activo del usuario
   * @param {number} id - ID del usuario
   * @param {boolean} activo - Estado activo
   * @returns {Promise<void>}
   */
  async updateActiveStatus(id, activo) {
    const query = `
      UPDATE usuario SET activo = $1 WHERE id = $2
    `;
    
    await db.query(query, [activo, id]);
  }

  /**
   * Obtiene todos los usuarios activos de un área
   * @param {number} areaId - ID del área
   * @returns {Promise<Array>} Lista de usuarios
   */
  async findByArea(areaId) {
    const query = `
      SELECT 
        u.id, u.nombre, u.apellidos, u.email, u.nombre_usuario,
        u.activo, u.area_id, u.rol_id,
        r.nombre AS rol_nombre,
        a.nombre AS area_nombre
      FROM usuario u
      INNER JOIN rol r ON u.rol_id = r.id
      INNER JOIN area a ON u.area_id = a.id
      WHERE u.area_id = $1 AND u.activo = true
      ORDER BY u.apellidos, u.nombre
    `;
    
    const result = await db.query(query, [areaId]);
    return result.rows;
  }

  /**
   * Obtiene todos los usuarios con filtros opcionales
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>} Lista de usuarios
   */
  async findAll(filters = {}) {
    let query = `
      SELECT 
        u.id, u.nombre, u.apellidos, u.email, u.nombre_usuario,
        u.activo, u.fecha_alta, u.area_id, u.rol_id,
        r.nombre AS rol_nombre,
        a.nombre AS area_nombre, a.clave AS area_clave
      FROM usuario u
      INNER JOIN rol r ON u.rol_id = r.id
      INNER JOIN area a ON u.area_id = a.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (filters.activo !== undefined) {
      query += ` AND u.activo = $${paramIndex}`;
      values.push(filters.activo);
      paramIndex++;
    }

    if (filters.rolId) {
      query += ` AND u.rol_id = $${paramIndex}`;
      values.push(filters.rolId);
      paramIndex++;
    }

    query += ` ORDER BY u.apellidos, u.nombre`;

    const result = await db.query(query, values);
    return result.rows;
  }
}

module.exports = new UsuarioRepository();
