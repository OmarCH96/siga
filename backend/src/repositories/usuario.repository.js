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
        u.telefono, u.celular, u.activo, u.fecha_alta,
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
   * Actualiza un usuario existente
   * @param {number} id - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  async update(id, userData) {
    const {
      nombre,
      apellidos,
      email,
      areaId,
      rolId,
      telefono,
      celular,
      activo,
    } = userData;

    const query = `
      UPDATE usuario 
      SET 
        nombre = $1,
        apellidos = $2,
        email = $3,
        area_id = $4,
        rol_id = $5,
        telefono = $6,
        celular = $7,
        activo = $8
      WHERE id = $9
      RETURNING id, nombre, apellidos, email, nombre_usuario, area_id, rol_id, activo, fecha_alta
    `;

    const values = [
      nombre,
      apellidos,
      email,
      areaId,
      rolId,
      telefono || null,
      celular || null,
      activo,
      id,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
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
   * Actualiza la contraseña del usuario
   * @param {number} id - ID del usuario
   * @param {string} hashedPassword - Contraseña hasheada
   * @returns {Promise<void>}
   */
  async updatePassword(id, hashedPassword) {
    const query = `
      UPDATE usuario SET contraseña = $1 WHERE id = $2
    `;
    
    await db.query(query, [hashedPassword, id]);
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
        r.nombre AS rol_nombre, r.permisos AS rol_permisos,
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
   * Obtiene todos los usuarios con filtros opcionales, búsqueda y paginación
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>} { rows: Array, total: number }
   */
  async findAll(filters = {}) {
    let query = `
      SELECT 
        u.id, u.nombre, u.apellidos, u.email, u.nombre_usuario,
        u.activo, u.fecha_alta, u.area_id, u.rol_id, u.telefono, u.celular,
        r.nombre AS rol_nombre, r.permisos AS rol_permisos,
        a.nombre AS area_nombre, a.clave AS area_clave
      FROM usuario u
      INNER JOIN rol r ON u.rol_id = r.id
      INNER JOIN area a ON u.area_id = a.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    // Filtro por activo
    if (filters.activo !== undefined) {
      query += ` AND u.activo = $${paramIndex}`;
      values.push(filters.activo);
      paramIndex++;
    }

    // Filtro por rol
    if (filters.rolId) {
      query += ` AND u.rol_id = $${paramIndex}`;
      values.push(filters.rolId);
      paramIndex++;
    }

    // Filtro por área
    if (filters.areaId) {
      query += ` AND u.area_id = $${paramIndex}`;
      values.push(filters.areaId);
      paramIndex++;
    }

    // Búsqueda por texto (nombre, apellidos, email, username, área)
    if (filters.search && filters.search.trim()) {
      query += ` AND (
        u.nombre ILIKE $${paramIndex} OR 
        u.apellidos ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex} OR 
        u.nombre_usuario ILIKE $${paramIndex} OR
        a.nombre ILIKE $${paramIndex}
      )`;
      values.push(`%${filters.search.trim()}%`);
      paramIndex++;
    }

    // Contar total antes de paginar
    const countQuery = query.replace(
      /SELECT[\s\S]+?FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    
    const countResult = await db.query(countQuery, values);
    
    const total = countResult?.rows?.[0]?.total ? parseInt(countResult.rows[0].total, 10) : 0;

    // Ordenamiento
    query += ` ORDER BY u.apellidos, u.nombre`;

    // Paginación
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      values.push(filters.offset);
      paramIndex++;
    }

    const result = await db.query(query, values);
    
    return {
      rows: result.rows,
      total,
    };
  }

  /**
   * Obtiene estadísticas de usuarios (solo contadores)
   * OPTIMIZADO: Hace un solo query con COUNTs agregados
   * @returns {Promise<Object>} { total, activos, inactivos }
   */
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE activo = true) as activos,
        COUNT(*) FILTER (WHERE activo = false) as inactivos
      FROM usuario
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

module.exports = new UsuarioRepository();
