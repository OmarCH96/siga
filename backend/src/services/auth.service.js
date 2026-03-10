/**
 * Servicio de Autenticación
 * Maneja el login, registro y gestión de tokens JWT
 */

const bcrypt = require('bcrypt');
const config = require('../config');
const usuarioRepository = require('../repositories/usuario.repository');
const auditoriaRepository = require('../repositories/auditoria.repository');
const tokenService = require('./token.service');
const UsuarioDTO = require('../dtos/usuario.dto');
const log = require('../utils/logger');
const {
  AuthenticationError,
  ValidationError,
  ConflictError,
} = require('../utils/errors');
const {
  isValidEmail,
  isValidUsername,
  validatePassword,
  validateRequiredFields,
} = require('../utils/validation');

class AuthService {
  /**
   * Autentica un usuario y genera tokens (access + refresh)
   * @param {string} nombreUsuario - Nombre de usuario
   * @param {string} contraseña - Contraseña en texto plano
   * @param {string} ipAddress - IP del cliente
   * @param {string} userAgent - User agent del cliente
   * @returns {Promise<Object>} Usuario, tokens y metadata
   */
  async login(nombreUsuario, contraseña, ipAddress = null, userAgent = null) {
    // Validar campos requeridos
    if (!nombreUsuario || !contraseña) {
      throw new ValidationError('Nombre de usuario y contraseña son requeridos');
    }

    // Buscar usuario
    const usuario = await usuarioRepository.findByUsername(nombreUsuario);

    if (!usuario) {
      log.security('Login attempt with non-existent user', {
        nombreUsuario,
        ipAddress,
      });
      throw new AuthenticationError('Credenciales inválidas');
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      log.security('Login attempt on inactive account', {
        usuarioId: usuario.id,
        nombreUsuario,
        ipAddress,
      });
      throw new AuthenticationError('Usuario inactivo. Contacte al administrador');
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!passwordMatch) {
      // Registrar intento fallido en auditoría (sin exponer que el usuario existe)
      try {
        await auditoriaRepository.registrarEventoSistema({
          accion: 'LOGIN_FALLIDO',
          descripcion: `Intento de login fallido para usuario: ${nombreUsuario}`,
          ipAddress,
        });
      } catch (auditError) {
        log.error('Error logging failed login attempt', { error: auditError.message });
      }

      throw new AuthenticationError('Credenciales inválidas');
    }

    // Actualizar fecha de último acceso
    await usuarioRepository.updateLastAccess(usuario.id);

    // Registrar login exitoso
    try {
      await auditoriaRepository.registrarEventoSistema({
        accion: 'LOGIN_EXITOSO',
        descripcion: `Login exitoso de usuario: ${nombreUsuario}`,
        usuarioId: usuario.id,
        areaId: usuario.area_id,
        ipAddress,
      });
    } catch (auditError) {
      log.error('Error logging successful login', { error: auditError.message });
    }

    // Generar par de tokens (access + refresh)
    const tokens = await tokenService.generateTokenPair(usuario, {
      ipAddress,
      userAgent,
    });

    log.audit('User logged in', {
      usuarioId: usuario.id,
      nombreUsuario: usuario.nombre_usuario,
      ipAddress,
    });

    return {
      usuario: UsuarioDTO.toPublic(usuario),
      ...tokens,
    };
  }

  /**
   * Registra un nuevo usuario (solo para administradores)
   * @param {Object} userData - Datos del usuario
   * @param {Object} adminUser - Usuario administrador que crea el usuario
   * @returns {Promise<Object>} Usuario creado
   */
  async register(userData, adminUser) {
    // Validar campos requeridos
    const validation = validateRequiredFields(userData, [
      'nombre',
      'apellidos',
      'email',
      'nombreUsuario',
      'contraseña',
      'areaId',
      'rolId',
    ]);

    if (!validation.valid) {
      throw new ValidationError(
        `Faltan campos requeridos: ${validation.missingFields.join(', ')}`
      );
    }

    // Validar email
    if (!isValidEmail(userData.email)) {
      throw new ValidationError('Email inválido');
    }

    // Validar nombre de usuario
    if (!isValidUsername(userData.nombreUsuario)) {
      throw new ValidationError(
        'Nombre de usuario inválido. Debe contener solo letras, números y guión bajo (3-20 caracteres)'
      );
    }

    // Validar contraseña
    const passwordValidation = validatePassword(userData.contraseña);
    if (!passwordValidation.valid) {
      throw new ValidationError(passwordValidation.errors.join('. '));
    }

    // Verificar que no exista el email
    const emailExists = await usuarioRepository.findByEmail(userData.email);
    if (emailExists) {
      throw new ConflictError('El email ya está registrado');
    }

    // Verificar que no exista el nombre de usuario
    const usernameExists = await usuarioRepository.findByUsername(
      userData.nombreUsuario
    );
    if (usernameExists) {
      throw new ConflictError('El nombre de usuario ya está en uso');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(userData.contraseña, 10);

    // Crear usuario
    const nuevoUsuario = await usuarioRepository.create({
      ...userData,
      contraseña: hashedPassword,
    });

    // Registrar en auditoría
    await auditoriaRepository.registrarEvento({
      accion: 'USUARIO_CREADO',
      descripcion: `Usuario creado: ${nuevoUsuario.nombre_usuario}`,
      usuarioId: adminUser.id,
      areaId: adminUser.area_id,
      detalles: JSON.stringify({
        usuarioNuevoId: nuevoUsuario.id,
        nombreUsuario: nuevoUsuario.nombre_usuario,
      }),
    });

    log.audit('User created', {
      createdUserId: nuevoUsuario.id,
      createdByUserId: adminUser.id,
      username: nuevoUsuario.nombre_usuario,
    });

    // Retornar usuario con DTO
    return UsuarioDTO.toPublic(nuevoUsuario);
  }

  /**
   * Refresca un access token usando un refresh token
   * @param {string} refreshToken - Refresh token
   * @param {string} ipAddress - IP del cliente
   * @param {string} userAgent - User agent del cliente
   * @returns {Promise<Object>} Nuevo par de tokens
   */
  async refreshToken(refreshToken, ipAddress = null, userAgent = null) {
    return tokenService.refreshAccessToken(refreshToken, {
      ipAddress,
      userAgent,
    });
  }

  /**
   * Cierra sesión (revoca refresh token)
   * @param {string} refreshToken - Refresh token a revocar
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<void>}
   */
  async logout(refreshToken, usuarioId) {
    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }

    log.audit('User logged out', { usuarioId });
  }

  /**
   * Cierra todas las sesiones de un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<number>} Número de sesiones cerradas
   */
  async logoutAll(usuarioId) {
    const count = await tokenService.revokeAllUserTokens(usuarioId);

    log.audit('All user sessions terminated', { usuarioId, count });

    return count;
  }

  /**
   * Verifica un access token (para middleware)
   * @param {string} token - Access token JWT
   * @returns {Object} Payload del token
   */
  verifyToken(token) {
    return tokenService.verifyAccessToken(token);
  }

  /**
   * Obtiene información del usuario autenticado
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Información del usuario
   */
  async getAuthenticatedUser(userId) {
    const usuario = await usuarioRepository.findById(userId);

    if (!usuario) {
      throw new AuthenticationError('Usuario no encontrado');
    }

    if (!usuario.activo) {
      throw new AuthenticationError('Usuario inactivo');
    }

    return UsuarioDTO.toPublic(usuario);
  }

  /**
   * Obtiene las sesiones activas de un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Array>} Lista de sesiones
   */
  async getActiveSessions(usuarioId) {
    return tokenService.getActiveSessions(usuarioId);
  }
}

module.exports = new AuthService();
