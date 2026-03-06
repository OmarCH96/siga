/**
 * Controlador de Autenticación
 * Maneja las operaciones de login, registro y perfil de usuario
 */

const authService = require('../services/auth.service');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Login de usuario
 * POST /auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { nombreUsuario, contraseña } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  // DEBUG: Mostrar exactamente qué llega desde el frontend
  console.log('\n🔍 DEBUG LOGIN - Datos recibidos:');
  console.log('  Body completo:', JSON.stringify(req.body, null, 2));
  console.log('  nombreUsuario:', `"${nombreUsuario}"`);
  console.log('  Longitud nombreUsuario:', nombreUsuario?.length);
  console.log('  contraseña definida:', contraseña ? 'Sí' : 'No');
  console.log('  contraseña longitud:', contraseña?.length);
  console.log('');

  const result = await authService.login(nombreUsuario, contraseña, ipAddress);

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
      nombreUsuario: req.user.nombre_usuario,
      email: req.user.email,
      rol: req.user.rol_nombre,
      area: req.user.area_nombre,
    },
  });
});

module.exports = {
  login,
  register,
  getProfile,
  verifyToken,
};
