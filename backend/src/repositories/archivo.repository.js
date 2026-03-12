/**
 * Repositorio de Archivos
 * Capa de acceso a datos para las tablas 'archivo', 'archivo_documento' y 'archivo_nodo'
 * Implementa el patrón Repository con SQL nativo (NO ORM)
 */

const db = require('../config/database');
const logger = require('../utils/logger');

class ArchivoRepository {
  /**
   * Inserta un nuevo archivo en la base de datos
   * @param {Object} datosArchivo - Datos del archivo
   * @returns {Promise<Object>} - Archivo insertado con ID
   */
  async insertarArchivo(datosArchivo) {
    const query = `
      INSERT INTO archivo (
        nombre_archivo,
        ruta_archivo,
        tipo_mime,
        tamaño,
        usuario_carga_id,
        hash
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nombre_archivo, tipo_mime, tamaño
    `;

    const values = [
      datosArchivo.nombre_archivo,
      datosArchivo.ruta_archivo,
      datosArchivo.tipo_mime,
      datosArchivo.tamaño,
      datosArchivo.usuario_carga_id,
      datosArchivo.hash,
    ];

    try {
      const result = await db.query(query, values);
      logger.info('Archivo insertado en BD', {
        archivoId: result.rows[0].id,
        nombre: result.rows[0].nombre_archivo,
      });
      return result.rows[0];
    } catch (error) {
      logger.error('Error al insertar archivo', { error: error.message, datosArchivo });
      throw error;
    }
  }

  /**
   * Vincula un archivo con un documento
   * @param {number} documentoId - ID del documento
   * @param {number} archivoId - ID del archivo
   * @param {string} tipoRelacion - Tipo de relación (ADJUNTO, RESPALDO, etc.)
   * @returns {Promise<void>}
   */
  async vincularArchivoDocumento(documentoId, archivoId, tipoRelacion = 'ADJUNTO') {
    const query = `
      INSERT INTO archivo_documento (documento_id, archivo_id, tipo_relacion)
      VALUES ($1, $2, $3)
    `;

    try {
      await db.query(query, [documentoId, archivoId, tipoRelacion]);
      logger.info('Archivo vinculado a documento', { documentoId, archivoId, tipoRelacion });
    } catch (error) {
      logger.error('Error al vincular archivo a documento', {
        error: error.message,
        documentoId,
        archivoId,
      });
      throw error;
    }
  }

  /**
   * Vincula un archivo con un nodo
   * @param {number} nodoId - ID del nodo
   * @param {number} archivoId - ID del archivo
   * @param {string} tipoRelacion - Tipo de relación (ADJUNTO, RESPALDO, etc.)
   * @returns {Promise<void>}
   */
  async vincularArchivoNodo(nodoId, archivoId, tipoRelacion = 'ADJUNTO') {
    const query = `
      INSERT INTO archivo_nodo (nodo_id, archivo_id, tipo_relacion)
      VALUES ($1, $2, $3)
    `;

    try {
      await db.query(query, [nodoId, archivoId, tipoRelacion]);
      logger.info('Archivo vinculado a nodo', { nodoId, archivoId, tipoRelacion });
    } catch (error) {
      logger.error('Error al vincular archivo a nodo', {
        error: error.message,
        nodoId,
        archivoId,
      });
      throw error;
    }
  }

  /**
   * Obtiene todos los archivos asociados a un documento
   * @param {number} documentoId - ID del documento
   * @returns {Promise<Array>} - Lista de archivos
   */
  async obtenerArchivosPorDocumento(documentoId) {
    const query = `
      SELECT 
        a.id,
        a.nombre_archivo,
        a.ruta_archivo,
        a.tipo_mime,
        a.tamaño,
        a.hash,
        a.fecha_carga,
        ad.tipo_relacion,
        u.nombre AS usuario_carga_nombre,
        u.apellidos AS usuario_carga_apellidos
      FROM archivo a
      INNER JOIN archivo_documento ad ON a.id = ad.archivo_id
      LEFT JOIN usuario u ON a.usuario_carga_id = u.id
      WHERE ad.documento_id = $1
      ORDER BY a.fecha_carga DESC
    `;

    try {
      const result = await db.query(query, [documentoId]);
      return result.rows;
    } catch (error) {
      logger.error('Error al obtener archivos por documento', {
        error: error.message,
        documentoId,
      });
      throw error;
    }
  }

  /**
   * Obtiene todos los archivos asociados a un nodo
   * @param {number} nodoId - ID del nodo
   * @returns {Promise<Array>} - Lista de archivos
   */
  async obtenerArchivosPorNodo(nodoId) {
    const query = `
      SELECT 
        a.id,
        a.nombre_archivo,
        a.ruta_archivo,
        a.tipo_mime,
        a.tamaño,
        a.hash,
        a.fecha_carga,
        an.tipo_relacion,
        u.nombre AS usuario_carga_nombre,
        u.apellidos AS usuario_carga_apellidos
      FROM archivo a
      INNER JOIN archivo_nodo an ON a.id = an.archivo_id
      LEFT JOIN usuario u ON a.usuario_carga_id = u.id
      WHERE an.nodo_id = $1
      ORDER BY a.fecha_carga DESC
    `;

    try {
      const result = await db.query(query, [nodoId]);
      return result.rows;
    } catch (error) {
      logger.error('Error al obtener archivos por nodo', {
        error: error.message,
        nodoId,
      });
      throw error;
    }
  }
}

module.exports = new ArchivoRepository();
