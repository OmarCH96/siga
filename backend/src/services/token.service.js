/**
 * Servicio de Tokens (Access + Refresh)
 * Maneja la generación, validación y rotación de tokens
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const tokenRepository = require('../repositories/token.repository');
const usuarioRepository = require('../repositories/usuario.repository');
const UsuarioDTO = require('../dtos/usuario.dto');
const { AuthenticationError } = require('../utils/errors');
const log = require('../utils/logger');

// Configuración de tokens
const ACCESS_TOKEN_EXPIRATION = '15m'; // Access token corto (15 minutos)
const REFRESH_TOKEN_EXPIRATION_DAYS = 7; // Refresh token largo (7 días)
const MAX_ACTIVE_TOKENS_PER_USER = 5; // Máximo de refresh tokens activos por usuario

class TokenService {
  /**
   * Genera un par de tokens (access + refresh)
   * @param {Object} usuario - Usuario de la base de datos
   * @param {Object} metadata - Metadata adicional (IP, user agent)
   * @returns {Promise<Object>} { accessToken, refreshToken, expiresIn }
   */
  async generateTokenPair(usuario, metadata = {}) {
    // Generar access token (corto, JWT)
    const accessToken = this.generateAccessToken(usuario);

    // Generar refresh token (largo, aleatorio)
    const refreshToken = this.generateRefreshToken();

    // Calcular fecha de expiración del refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);

    // Guardar refresh token en la base de datos
    await tokenRepository.create({
      token: refreshToken,
      usuarioId: usuario.id,
      expiresAt,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    // Verificar límite de tokens activos
    await this.enforceTokenLimit(usuario.id);

    log.debug('Token pair generated', {
      usuarioId: usuario.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutos en segundos
      refreshExpiresIn: REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60, // 7 días en segundos
    };
  }

  /**
   * Genera un access token JWT
   * @param {Object} usuario - Usuario de la base de datos
   * @returns {string} Access token JWT
   */
  generateAccessToken(usuario) {
    const payload = UsuarioDTO.toJWTPayload(usuario);

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: ACCESS_TOKEN_EXPIRATION,
      issuer: 'siga-api',
      audience: 'siga-client',
    });
  }

  /**
   * Genera un refresh token aleatorio seguro
   * @returns {string} Refresh token
   */
  generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Verifica y decodifica un access token
   * @param {string} token - Access token JWT
   * @returns {Object} Payload del token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: 'siga-api',
        audience: 'siga-client',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token expirado');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Token inválido');
      }
      throw new AuthenticationError('Error al verificar token');
    }
  }

  /**
   * Renueva un access token usando un refresh token
   * @param {string} refreshToken - Refresh token
   * @param {Object} metadata - Metadata adicional
   * @returns {Promise<Object>} Nuevo par de tokens
   */
  async refreshAccessToken(refreshToken, metadata = {}) {
    // Buscar el refresh token en la base de datos
    const tokenData = await tokenRepository.findByToken(refreshToken);

    if (!tokenData) {
      log.security('Refresh token not found', {
        token: refreshToken.substring(0, 20),
      });
      throw new AuthenticationError('Refresh token inválido');
    }

    // Verificar que no esté revocado
    if (tokenData.revoked) {
      log.security('Attempted use of revoked refresh token', {
        tokenId: tokenData.id,
        usuarioId: tokenData.usuario_id,
      });
      
      // Token revocado usado: posible compromiso, revocar todos los tokens del usuario
      await tokenRepository.revokeAllByUser(tokenData.usuario_id);
      
      throw new AuthenticationError('Refresh token revocado. Por seguridad, todas las sesiones han sido cerradas.');
    }

    // Verificar que no haya expirado
    if (new Date() > new Date(tokenData.expires_at)) {
      log.debug('Refresh token expired', { tokenId: tokenData.id });
      throw new AuthenticationError('Refresh token expirado');
    }

    // Obtener información del usuario
    const usuario = await usuarioRepository.findById(tokenData.usuario_id);

    if (!usuario) {
      throw new AuthenticationError('Usuario no encontrado');
    }

    if (!usuario.activo) {
      throw new AuthenticationError('Usuario inactivo');
    }

    // Revocar el refresh token usado (rotación de tokens)
    await tokenRepository.revoke(refreshToken);

    // Generar nuevo par de tokens
    const newTokenPair = await this.generateTokenPair(usuario, metadata);

    log.audit('Access token refreshed', {
      usuarioId: usuario.id,
      ipAddress: metadata.ipAddress,
    });

    return {
      ...newTokenPair,
      usuario: UsuarioDTO.toPublic(usuario),
    };
  }

  /**
   * Revoca un refresh token (logout)
   * @param {string} refreshToken - Refresh token a revocar
   * @returns {Promise<boolean>} true si fue revocado
   */
  async revokeRefreshToken(refreshToken) {
    const revoked = await tokenRepository.revoke(refreshToken);

    if (revoked) {
      log.audit('Refresh token revoked (logout)', {
        token: refreshToken.substring(0, 20),
      });
    }

    return revoked;
  }

  /**
   * Revoca todos los tokens de un usuario (logout de todas las sesiones)
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<number>} Número de tokens revocados
   */
  async revokeAllUserTokens(usuarioId) {
    const count = await tokenRepository.revokeAllByUser(usuarioId);

    log.audit('All user tokens revoked', { usuarioId, count });

    return count;
  }

  /**
   * Aplica límite de tokens activos por usuario
   * Si excede el límite, revoca los más antiguos
   * @param {number} usuarioId - ID del usuario
   */
  async enforceTokenLimit(usuarioId) {
    const activeTokens = await tokenRepository.findActiveByUser(usuarioId);

    if (activeTokens.length > MAX_ACTIVE_TOKENS_PER_USER) {
      // Revocar los tokens más antiguos que excedan el límite
      const tokensToRevoke = activeTokens.slice(MAX_ACTIVE_TOKENS_PER_USER);

      for (const token of tokensToRevoke) {
        await tokenRepository.revoke(token.token);
      }

      log.info('Old tokens revoked due to limit', {
        usuarioId,
        revoked: tokensToRevoke.length,
      });
    }
  }

  /**
   * Obtiene las sesiones activas de un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Array>} Lista de sesiones activas
   */
  async getActiveSessions(usuarioId) {
    const tokens = await tokenRepository.findActiveByUser(usuarioId);

    return tokens.map(token => ({
      id: token.id,
      createdAt: token.created_at,
      expiresAt: token.expires_at,
      ipAddress: token.ip_address,
      userAgent: token.user_agent,
    }));
  }

  /**
   * Tarea de limpieza: elimina tokens expirados
   * Debe ejecutarse periódicamente (cron job)
   */
  async cleanupExpiredTokens() {
    const count = await tokenRepository.deleteExpired();

    if (count > 0) {
      log.info('Expired tokens cleaned up', { count });
    }

    return count;
  }
}

module.exports = new TokenService();
