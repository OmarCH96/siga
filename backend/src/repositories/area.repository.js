/**
 * Repositorio de Áreas (Unidades Administrativas)
 * Capa de acceso a datos para la tabla 'area'
 * 
 * La tabla 'area' implementa una estructura jerárquica mediante area_padre_id
 * Soporta consultas recursivas para obtener rutas completas y subáreas
 */

const db = require('../config/database');

class AreaRepository {
  /**
   * Busca un área por su ID con información del área padre
   * @param {number} id - ID del área
   * @returns {Promise<Object|null>} Área encontrada o null
   */
  async findById(id) {
    const query = `
      SELECT 
        a.id,
        a.nombre,
        a.clave,
        a.tipo,
        a.area_padre_id,
        a.nivel,
        a.activa,
        a.descripcion,
        a.fecha_creacion,
        ap.nombre AS area_padre_nombre,
        ap.clave AS area_padre_clave,
        ap.tipo AS area_padre_tipo
      FROM area a
      LEFT JOIN area ap ON a.area_padre_id = ap.id
      WHERE a.id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Busca un área por su clave única
   * @param {string} clave - Clave del área
   * @returns {Promise<Object|null>} Área encontrada o null
   */
  async findByClave(clave) {
    const query = `
      SELECT 
        a.id,
        a.nombre,
        a.clave,
        a.tipo,
        a.area_padre_id,
        a.nivel,
        a.activa,
        a.descripcion,
        a.fecha_creacion
      FROM area a
      WHERE a.clave = $1
    `;
    
    const result = await db.query(query, [clave]);
    return result.rows[0] || null;
  }

  /**
   * Obtiene todas las áreas con filtros opcionales, búsqueda y paginación
   * @param {Object} filters - Filtros opcionales
   * @param {boolean} filters.activa - Filtro por estado activo/inactivo
   * @param {string} filters.tipo - Filtro por tipo de área
   * @param {number} filters.areaPadreId - Filtro por área padre
   * @param {string} filters.busqueda - Búsqueda por nombre o clave
   * @param {number} filters.page - Página actual (default: 1)
   * @param {number} filters.limit - Registros por página (default: 50)
   * @returns {Promise<Object>} { rows: Array, total: number, page: number, limit: number }
   */
  async findAll(filters = {}) {
    let query = `
      SELECT 
        a.id,
        a.nombre,
        a.clave,
        a.tipo,
        a.area_padre_id,
        a.nivel,
        a.activa,
        a.descripcion,
        a.fecha_creacion,
        ap.nombre AS area_padre_nombre,
        ap.clave AS area_padre_clave,
        (
          SELECT COUNT(*)
          FROM area sub
          WHERE sub.area_padre_id = a.id AND sub.activa = true
        ) AS total_subareas
      FROM area a
      LEFT JOIN area ap ON a.area_padre_id = ap.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    // Filtro por estado activo
    if (filters.activa !== undefined) {
      query += ` AND a.activa = $${paramIndex}`;
      values.push(filters.activa);
      paramIndex++;
    }

    // Filtro por tipo de área
    if (filters.tipo) {
      query += ` AND a.tipo = $${paramIndex}`;
      values.push(filters.tipo);
      paramIndex++;
    }

    // Filtro por área padre
    if (filters.areaPadreId !== undefined) {
      if (filters.areaPadreId === null) {
        // Buscar áreas raíz (sin padre)
        query += ` AND a.area_padre_id IS NULL`;
      } else {
        query += ` AND a.area_padre_id = $${paramIndex}`;
        values.push(filters.areaPadreId);
        paramIndex++;
      }
    }

    // Búsqueda por nombre o clave
    if (filters.busqueda) {
      query += ` AND (
        LOWER(a.nombre) LIKE LOWER($${paramIndex}) OR 
        LOWER(a.clave) LIKE LOWER($${paramIndex})
      )`;
      values.push(`%${filters.busqueda}%`);
      paramIndex++;
    }

    // Contar total de registros para paginación
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) AS count_query`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Ordenamiento por nivel jerárquico y nombre
    query += ` ORDER BY a.nivel ASC, a.nombre ASC`;

    // Paginación
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await db.query(query, values);

    return {
      rows: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtiene todas las áreas activas de forma simple (sin paginación)
   * Útil para selectores y listas desplegables
   * @returns {Promise<Array>} Lista de áreas activas
   */
  async findAllActive() {
    const query = `
      SELECT 
        a.id,
        a.nombre,
        a.clave,
        a.tipo,
        a.area_padre_id,
        a.nivel,
        ap.nombre AS area_padre_nombre
      FROM area a
      LEFT JOIN area ap ON a.area_padre_id = ap.id
      WHERE a.activa = true
      ORDER BY a.nivel ASC, a.nombre ASC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Obtiene todas las subáreas (hijos directos) de un área específica
   * @param {number} areaPadreId - ID del área padre
   * @param {boolean} soloActivas - Si solo debe retornar áreas activas (default: true)
   * @returns {Promise<Array>} Lista de subáreas
   */
  async findByAreaPadre(areaPadreId, soloActivas = true) {
    let query = `
      SELECT 
        a.id,
        a.nombre,
        a.clave,
        a.tipo,
        a.area_padre_id,
        a.nivel,
        a.activa,
        a.descripcion,
        (
          SELECT COUNT(*)
          FROM area sub
          WHERE sub.area_padre_id = a.id AND sub.activa = true
        ) AS total_subareas
      FROM area a
      WHERE a.area_padre_id = $1
    `;

    const values = [areaPadreId];

    if (soloActivas) {
      query += ` AND a.activa = true`;
    }

    query += ` ORDER BY a.nombre ASC`;

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Obtiene el árbol completo de subáreas de forma recursiva
   * @param {number} areaPadreId - ID del área padre (null para obtener desde la raíz)
   * @returns {Promise<Array>} Árbol jerárquico de áreas
   */
  async findArbolJerarquico(areaPadreId = null) {
    const query = `
      WITH RECURSIVE arbol_areas AS (
        -- Caso base: áreas raíz o del padre especificado
        SELECT 
          a.id,
          a.nombre,
          a.clave,
          a.tipo,
          a.area_padre_id,
          a.nivel,
          a.activa,
          a.descripcion,
          ARRAY[a.id] AS ruta_ids,
          a.nombre::text AS ruta_nombres
        FROM area a
        WHERE a.area_padre_id ${areaPadreId === null ? 'IS NULL' : '= $1'}
          AND a.activa = true
        
        UNION ALL
        
        -- Caso recursivo: subáreas
        SELECT 
          a.id,
          a.nombre,
          a.clave,
          a.tipo,
          a.area_padre_id,
          a.nivel,
          a.activa,
          a.descripcion,
          aa.ruta_ids || a.id,
          aa.ruta_nombres || ' > ' || a.nombre
        FROM area a
        INNER JOIN arbol_areas aa ON a.area_padre_id = aa.id
        WHERE a.activa = true
      )
      SELECT * FROM arbol_areas
      ORDER BY ruta_nombres ASC
    `;

    const values = areaPadreId === null ? [] : [areaPadreId];
    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Obtiene la ruta jerárquica completa de un área
   * @param {number} areaId - ID del área
   * @returns {Promise<Array>} Ruta desde la raíz hasta el área especificada
   */
  async findRutaJerarquica(areaId) {
    const query = `
      WITH RECURSIVE ruta AS (
        -- Área objetivo
        SELECT 
          a.id,
          a.nombre,
          a.clave,
          a.tipo,
          a.area_padre_id,
          a.nivel,
          1 AS orden
        FROM area a
        WHERE a.id = $1
        
        UNION ALL
        
        -- Navegar hacia arriba hasta la raíz
        SELECT 
          a.id,
          a.nombre,
          a.clave,
          a.tipo,
          a.area_padre_id,
          a.nivel,
          r.orden + 1
        FROM area a
        INNER JOIN ruta r ON a.id = r.area_padre_id
      )
      SELECT * FROM ruta
      ORDER BY orden DESC
    `;

    const result = await db.query(query, [areaId]);
    return result.rows;
  }

  /**
   * Crea una nueva área
   * @param {Object} areaData - Datos del área
   * @param {string} areaData.nombre - Nombre del área
   * @param {string} areaData.clave - Clave única del área
   * @param {string} areaData.tipo - Tipo de área (ENUM)
   * @param {number} areaData.areaPadreId - ID del área padre (opcional)
   * @param {string} areaData.descripcion - Descripción del área (opcional)
   * @returns {Promise<Object>} Área creada
   */
  async create(areaData) {
    const {
      nombre,
      clave,
      tipo,
      areaPadreId = null,
      descripcion = null,
    } = areaData;

    // Calcular el nivel basado en el área padre
    let nivel = 0;
    if (areaPadreId) {
      const areaPadre = await this.findById(areaPadreId);
      if (areaPadre) {
        nivel = areaPadre.nivel + 1;
      }
    }

    const query = `
      INSERT INTO area (
        nombre,
        clave,
        tipo,
        area_padre_id,
        nivel,
        descripcion
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        nombre,
        clave,
        tipo,
        area_padre_id,
        nivel,
        activa,
        descripcion,
        fecha_creacion
    `;

    const values = [
      nombre,
      clave,
      tipo,
      areaPadreId,
      nivel,
      descripcion,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Actualiza un área existente
   * @param {number} id - ID del área
   * @param {Object} areaData - Datos a actualizar
   * @returns {Promise<Object>} Área actualizada
   */
  async update(id, areaData) {
    const {
      nombre,
      clave,
      tipo,
      areaPadreId,
      descripcion,
      activa,
    } = areaData;

    // Recalcular nivel si cambió el área padre
    let nivel;
    if (areaPadreId !== undefined) {
      if (areaPadreId === null) {
        nivel = 0;
      } else {
        const areaPadre = await this.findById(areaPadreId);
        if (areaPadre) {
          nivel = areaPadre.nivel + 1;
        } else {
          nivel = 0;
        }
      }
    }

    // Construir query dinámicamente solo con campos proporcionados
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      setClauses.push(`nombre = $${paramIndex}`);
      values.push(nombre);
      paramIndex++;
    }

    if (clave !== undefined) {
      setClauses.push(`clave = $${paramIndex}`);
      values.push(clave);
      paramIndex++;
    }

    if (tipo !== undefined) {
      setClauses.push(`tipo = $${paramIndex}`);
      values.push(tipo);
      paramIndex++;
    }

    if (areaPadreId !== undefined) {
      setClauses.push(`area_padre_id = $${paramIndex}`);
      values.push(areaPadreId);
      paramIndex++;

      if (nivel !== undefined) {
        setClauses.push(`nivel = $${paramIndex}`);
        values.push(nivel);
        paramIndex++;
      }
    }

    if (descripcion !== undefined) {
      setClauses.push(`descripcion = $${paramIndex}`);
      values.push(descripcion);
      paramIndex++;
    }

    if (activa !== undefined) {
      setClauses.push(`activa = $${paramIndex}`);
      values.push(activa);
      paramIndex++;
    }

    // Si no hay nada que actualizar, retornar el área actual
    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE area 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        nombre,
        clave,
        tipo,
        area_padre_id,
        nivel,
        activa,
        descripcion,
        fecha_creacion
    `;

    const result = await db.query(query, values);
    
    // Si cambió el nivel, actualizar niveles de todas las subáreas en cascada
    if (nivel !== undefined) {
      await this.actualizarNivelesSubareas(id);
    }

    return result.rows[0];
  }

  /**
   * Actualiza recursivamente los niveles de todas las subáreas
   * Se ejecuta cuando se cambia el área padre de un área
   * @param {number} areaId - ID del área cuyas subáreas se actualizarán
   * @private
   */
  async actualizarNivelesSubareas(areaId) {
    const query = `
      WITH RECURSIVE subareas AS (
        -- Área origen
        SELECT id, area_padre_id, nivel
        FROM area
        WHERE id = $1
        
        UNION ALL
        
        -- Subáreas recursivas
        SELECT a.id, a.area_padre_id, s.nivel + 1 AS nivel
        FROM area a
        INNER JOIN subareas s ON a.area_padre_id = s.id
      )
      UPDATE area a
      SET nivel = s.nivel
      FROM subareas s
      WHERE a.id = s.id AND a.id != $1
    `;

    await db.query(query, [areaId]);
  }

  /**
   * Activa o desactiva un área (soft delete)
   * @param {number} id - ID del área
   * @param {boolean} activa - Estado activo (true) o inactivo (false)
   * @returns {Promise<Object>} Área actualizada
   */
  async toggleStatus(id, activa) {
    const query = `
      UPDATE area 
      SET activa = $1
      WHERE id = $2
      RETURNING 
        id,
        nombre,
        clave,
        tipo,
        area_padre_id,
        nivel,
        activa,
        descripcion,
        fecha_creacion
    `;

    const result = await db.query(query, [activa, id]);
    return result.rows[0];
  }

  /**
   * Verifica si un área tiene subáreas activas
   * @param {number} areaId - ID del área
   * @returns {Promise<boolean>} true si tiene subáreas activas
   */
  async tieneSubareasActivas(areaId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 
        FROM area 
        WHERE area_padre_id = $1 AND activa = true
      ) AS tiene_subareas
    `;

    const result = await db.query(query, [areaId]);
    return result.rows[0].tiene_subareas;
  }

  /**
   * Verifica si un área tiene usuarios asignados
   * @param {number} areaId - ID del área
   * @returns {Promise<boolean>} true si tiene usuarios asignados
   */
  async tieneUsuarios(areaId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 
        FROM usuario 
        WHERE area_id = $1 AND activo = true
      ) AS tiene_usuarios
    `;

    const result = await db.query(query, [areaId]);
    return result.rows[0].tiene_usuarios;
  }

  /**
   * Verifica si una clave de área ya existe
   * @param {string} clave - Clave a verificar
   * @param {number} excludeId - ID a excluir de la búsqueda (para updates)
   * @returns {Promise<boolean>} true si la clave ya existe
   */
  async existeClave(clave, excludeId = null) {
    let query = `
      SELECT EXISTS(
        SELECT 1 
        FROM area 
        WHERE clave = $1
    `;

    const values = [clave];

    if (excludeId) {
      query += ` AND id != $2`;
      values.push(excludeId);
    }

    query += `) AS existe`;

    const result = await db.query(query, values);
    return result.rows[0].existe;
  }

  /**
   * Obtiene estadísticas generales de áreas
   * @returns {Promise<Object>} Estadísticas de áreas
   */
  async obtenerEstadisticas() {
    const query = `
      SELECT 
        COUNT(*) AS total_areas,
        COUNT(*) FILTER (WHERE activa = true) AS areas_activas,
        COUNT(*) FILTER (WHERE activa = false) AS areas_inactivas,
        COUNT(DISTINCT tipo) AS total_tipos,
        COUNT(*) FILTER (WHERE area_padre_id IS NULL) AS areas_raiz,
        MAX(nivel) AS nivel_maximo
      FROM area
    `;

    const result = await db.query(query);
    return result.rows[0];
  }

  /**
   * Obtiene el conteo de áreas agrupadas por tipo
   * @returns {Promise<Array>} Distribución de áreas por tipo
   */
  async obtenerDistribucionPorTipo() {
    const query = `
      SELECT 
        tipo,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE activa = true) AS activas,
        COUNT(*) FILTER (WHERE activa = false) AS inactivas
      FROM area
      GROUP BY tipo
      ORDER BY tipo ASC
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Obtiene la jerarquía completa de áreas
   * Alias de findAllActive para compatibilidad con código existente
   * @returns {Promise<Array>} Lista jerárquica de áreas
   */
  async findHierarchy() {
    return this.findAllActive();
  }

  /**
   * Obtiene las áreas hijas de un área específica
   * Alias de findByAreaPadre para compatibilidad con código existente
   * @param {number} areaPadreId - ID del área padre
   * @returns {Promise<Array>} Lista de áreas hijas
   */
  async findByParent(areaPadreId) {
    return this.findByAreaPadre(areaPadreId);
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
   * Alias de findRutaJerarquica para compatibilidad con código existente
   * @param {number} areaId - ID del área
   * @returns {Promise<Array>} Lista de áreas desde la raíz hasta el área
   */
  async getAreaPath(areaId) {
    return this.findRutaJerarquica(areaId);
  }
}

module.exports = new AreaRepository();
