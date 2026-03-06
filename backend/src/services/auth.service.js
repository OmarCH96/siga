/**
 * Servicio de Autenticación
 * Maneja el login, registro y gestión de tokens JWT
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const usuarioRepository = require('../repositories/usuario.repository');
const auditoriaRepository = require('../repositories/auditoria.repository');
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
   * Autentica un usuario y genera un token JWT
   * @param {string} nombreUsuario - Nombre de usuario
   * @param {string} contraseña - Contraseña en texto plano
   * @param {string} ipAddress - IP del cliente
   * @returns {Promise<Object>} Usuario y token
   */
  async login(nombreUsuario, contraseña, ipAddress = null) {
    // Validar campos requeridos
    if (!nombreUsuario || !contraseña) {
      throw new ValidationError('Nombre de usuario y contraseña son requeridos');
    }

    // Buscar usuario
    const usuario = await usuarioRepository.findByUsername(nombreUsuario);

    if (!usuario) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      throw new AuthenticationError('Usuario inactivo. Contacte al administrador');
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!passwordMatch) {
      // Registrar intento fallido
      try {
        await auditoriaRepository.registrarEventoSistema({
          accion: 'LOGIN_FALLIDO',
          descripcion: `Intento de login fallido para usuario: ${nombreUsuario}`,
          ipAddress,
        });
      } catch (auditError) {
        // Log error pero no bloquear el proceso
        console.error('Error al registrar auditoría de login fallido:', auditError.message);
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
      // Log error pero no bloquear el proceso
      console.error('Error al registrar auditoría de login exitoso:', auditError.message);
    }

    // Generar token JWT
    const token = this.generateToken(usuario);

    // Remover contraseña del objeto usuario
    delete usuario.contraseña;

    return {
      usuario,
      token,
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

    // Remover contraseña del resultado
    delete nuevoUsuario.contraseña;

    return nuevoUsuario;
  }

  /**
   * Genera un token JWT para un usuario
   * @param {Object} usuario - Usuario
   * @returns {string} Token JWT
   */
  generateToken(usuario) {
    const payload = {
      id: usuario.id,
      nombreUsuario: usuario.nombre_usuario,
      email: usuario.email,
      rolId: usuario.rol_id,
      rolNombre: usuario.rol_nombre,
      permisos: usuario.rol_permisos,
      areaId: usuario.area_id,
      areaNombre: usuario.area_nombre,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  /**
   * Verifica y decodifica un token JWT
   * @param {string} token - Token JWT
   * @returns {Object} Payload del token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
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

    return usuario;
  }
}

module.exports = new AuthService();
