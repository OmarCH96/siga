/**
 * Controlador de Autenticación
 * Maneja las operaciones de login, registro, logout y gestión de sesiones
 */

const authService = require('../services/auth.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const log = require('../utils/logger');

/**
 * Login de usuario
 * POST /auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { nombreUsuario, contraseña } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  log.debug('Login attempt', { nombreUsuario, ipAddress });

  const result = await authService.login(nombreUsuario, contraseña, ipAddress, userAgent);

  res.status(200).json({
    success: true,
    message: 'Login exitoso',
    data: result,
  });
});

/**
 * Registro de nuevo usuario (solo administradores)
 * POST /auth/register
 */
const register = asyncHandler(async (req, res) => {
  const userData = req.body;
  const adminUser = req.user; // Usuario autenticado que crea el nuevo usuario

  const nuevoUsuario = await authService.register(userData, adminUser);

  res.status(201).json({
    success: true,
    message: 'Usuario creado exitosamente',
    data: nuevoUsuario,
  });
});

/**
 * Refresca el access token usando un refresh token
 * POST /auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token requerido',
    });
  }

  log.debug('Token refresh attempt', { ipAddress });

  const result = await authService.refreshToken(refreshToken, ipAddress, userAgent);

  res.status(200).json({
    success: true,
    message: 'Token refrescado exitosamente',
    data: result,
  });
});

/**
 * Logout - cierra sesión actual
 * POST /auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const usuarioId = req.user?.id;

  await authService.logout(refreshToken, usuarioId);

  res.status(200).json({
    success: true,
    message: 'Sesión cerrada exitosamente',
  });
});

/**
 * Logout de todas las sesiones
 * POST /auth/logout-all
 */
const logoutAll = asyncHandler(async (req, res) => {
  const usuarioId = req.user.id;

  const count = await authService.logoutAll(usuarioId);

  res.status(200).json({
    success: true,
    message: `${count} sesión(es) cerrada(s) exitosamente`,
    data: { sessionsTerminated: count },
  });
});

/**
 * Obtener información del usuario autenticado
 * GET /auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const usuario = await authService.getAuthenticatedUser(req.user.id);

  res.status(200).json({
    success: true,
    data: usuario,
  });
});

/**
 * Obtener sesiones activas del usuario
 * GET /auth/sessions
 */
const getSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getActiveSessions(req.user.id);

  res.status(200).json({
    success: true,
    data: sessions,
  });
});

/**
 * Verificar si el token es válido
 * GET /auth/verify
 */
const verifyToken = asyncHandler(async (req, res) => {
  // Si llega aquí, el token es válido (pasó por el middleware de autenticación)
  res.status(200).json({
    success: true,
    message: 'Token válido',
    data: {
      id: req.user.id,
      nombreUsuario: req.user.nombreUsuario,
      email: req.user.email,
      rol: req.user.rolNombre,
      area: req.user.areaNombre,
    },
  });
});

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  logoutAll,
  getProfile,
  getSessions,
  verifyToken,
};
