/**
 * Repositorio para Refresh Tokens
 * Gestiona el almacenamiento y validación de refresh tokens en PostgreSQL
 */

const db = require('../config/database');
const log = require('../utils/logger');

class TokenRepository {
  /**
   * Crea la tabla de refresh tokens si no existe
   * Ejecutar en las migraciones de base de datos
   */
  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(500) UNIQUE NOT NULL,
        usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        ip_address VARCHAR(45),
        user_agent TEXT,
        revoked BOOLEAN DEFAULT FALSE,
        revoked_at TIMESTAMP,
        replaced_by_token VARCHAR(500),
        INDEX idx_token (token),
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_expires_at (expires_at)
      );
    `;

    try {
      await db.query(query);
      log.info('Tabla refresh_tokens verificada/creada');
    } catch (error) {
      log.error('Error creating refresh_tokens table', { error: error.message });
      throw error;
    }
  }

  /**
   * Guarda un nuevo refresh token
   * @param {Object} tokenData - Datos del token
   * @returns {Promise<Object>} Token guardado
   */
  async create(tokenData) {
    const { token, usuarioId, expiresAt, ipAddress, userAgent } = tokenData;

    const query = `
      INSERT INTO refresh_tokens (token, usuario_id, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, token, usuario_id, expires_at, created_at
    `;

    try {
      const result = await db.query(query, [
        token,
        usuarioId,
        expiresAt,
        ipAddress,
        userAgent,
      ]);

      log.debug('Refresh token created', { usuarioId, tokenId: result.rows[0].id });

      return result.rows[0];
    } catch (error) {
      log.error('Error creating refresh token', {
        error: error.message,
        usuarioId,
      });
      throw error;
    }
  }

  /**
   * Busca un refresh token por su valor
   * @param {string} token - Token a buscar
   * @returns {Promise<Object|null>} Token encontrado o null
   */
  async findByToken(token) {
    const query = `
      SELECT * FROM refresh_tokens
      WHERE token = $1
    `;

    try {
      const result = await db.query(query, [token]);
      return result.rows[0] || null;
    } catch (error) {
      log.error('Error finding refresh token', { error: error.message });
      throw error;
    }
  }

  /**
   * Revoca un refresh token
   * @param {string} token - Token a revocar
   * @param {string} replacedByToken - Token que lo reemplaza (opcional)
   * @returns {Promise<boolean>} true si fue revocado
   */
  async revoke(token, replacedByToken = null) {
    const query = `
      UPDATE refresh_tokens
      SET revoked = TRUE,
          revoked_at = NOW(),
          replaced_by_token = $2
      WHERE token = $1
      RETURNING id
    `;

    try {
      const result = await db.query(query, [token, replacedByToken]);
      
      if (result.rowCount > 0) {
        log.debug('Refresh token revoked', { token: token.substring(0, 20) });
        return true;
      }

      return false;
    } catch (error) {
      log.error('Error revoking refresh token', { error: error.message });
      throw error;
    }
  }

  /**
   * Revoca todos los tokens de un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<number>} Número de tokens revocados
   */
  async revokeAllByUser(usuarioId) {
    const query = `
      UPDATE refresh_tokens
      SET revoked = TRUE,
          revoked_at = NOW()
      WHERE usuario_id = $1 AND revoked = FALSE
      RETURNING id
    `;

    try {
      const result = await db.query(query, [usuarioId]);
      
      log.info('All user tokens revoked', {
        usuarioId,
        count: result.rowCount,
      });

      return result.rowCount;
    } catch (error) {
      log.error('Error revoking all user tokens', {
        error: error.message,
        usuarioId,
      });
      throw error;
    }
  }

  /**
   * Elimina tokens expirados (limpieza)
   * @returns {Promise<number>} Número de tokens eliminados
   */
  async deleteExpired() {
    const query = `
      DELETE FROM refresh_tokens
      WHERE expires_at < NOW() OR (revoked = TRUE AND revoked_at < NOW() - INTERVAL '30 days')
      RETURNING id
    `;

    try {
      const result = await db.query(query);
      
      if (result.rowCount > 0) {
        log.info('Expired tokens deleted', { count: result.rowCount });
      }

      return result.rowCount;
    } catch (error) {
      log.error('Error deleting expired tokens', { error: error.message });
      throw error;
    }
  }

  /**
   * Obtiene todos los tokens activos de un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Array>} Lista de tokens activos
   */
  async findActiveByUser(usuarioId) {
    const query = `
      SELECT id, token, expires_at, created_at, ip_address, user_agent
      FROM refresh_tokens
      WHERE usuario_id = $1 AND revoked = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC
    `;

    try {
      const result = await db.query(query, [usuarioId]);
      return result.rows;
    } catch (error) {
      log.error('Error finding active tokens', {
        error: error.message,
        usuarioId,
      });
      throw error;
    }
  }

  /**
   * Cuenta tokens activos de un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<number>} Número de tokens activos
   */
  async countActiveByUser(usuarioId) {
    const query = `
      SELECT COUNT(*) as count
      FROM refresh_tokens
      WHERE usuario_id = $1 AND revoked = FALSE AND expires_at > NOW()
    `;

    try {
      const result = await db.query(query, [usuarioId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      log.error('Error counting active tokens', {
        error: error.message,
        usuarioId,
      });
      throw error;
    }
  }
}

module.exports = new TokenRepository();
