/**
 * Controlador de Usuarios
 * Maneja las operaciones CRUD de usuarios
 */

const usuarioRepository = require('../repositories/usuario.repository');
const { asyncHandler } = require('../middlewares/error.middleware');
const { NotFoundError } = require('../utils/errors');

/**
 * Obtener todos los usuarios
 * GET /usuarios
 */
const getAllUsuarios = asyncHandler(async (req, res) => {
  const filters = {
    activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
    rolId: req.query.rolId ? parseInt(req.query.rolId, 10) : undefined,
    areaId: req.query.areaId ? parseInt(req.query.areaId, 10) : undefined,
    search: req.query.search || undefined,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
  };

  const result = await usuarioRepository.findAll(filters);

  res.status(200).json({
    success: true,
    count: result.rows.length,
    total: result.total,
    data: result.rows,
  });
});

/**
 * Obtener usuario por ID
 * GET /usuarios/:id
 */
const getUsuarioById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const usuario = await usuarioRepository.findById(id);

  if (!usuario) {
    throw new NotFoundError('Usuario no encontrado');
  }

  res.status(200).json({
    success: true,
    data: usuario,
  });
});

/**
 * Obtener usuarios por área
 * GET /usuarios/area/:areaId
 */
const getUsuariosByArea = asyncHandler(async (req, res) => {
  const areaId = parseInt(req.params.areaId, 10);
  const usuarios = await usuarioRepository.findByArea(areaId);

  res.status(200).json({
    success: true,
    count: usuarios.length,
    data: usuarios,
  });
});

/**
 * Crear un nuevo usuario
 * POST /usuarios
 */
const createUsuario = asyncHandler(async (req, res) => {
  const bcrypt = require('bcrypt');
  const { 
    nombre, apellidos, email, nombreUsuario, contraseña,
    areaId, rolId, telefono, celular,
    curp, rfc, fechaNacimiento, sexo,
    calle, numExterior, numInterior, colonia, codigoPostal, ciudad, estado
  } = req.body;

  // Validar duplicados
  const existingUsername = await usuarioRepository.findByUsername(nombreUsuario);
  if (existingUsername) {
    return res.status(409).json({
      success: false,
      error: 'El nombre de usuario ya existe',
    });
  }

  const existingEmail = await usuarioRepository.findByEmail(email);
  if (existingEmail) {
    return res.status(409).json({
      success: false,
      error: 'El email ya está registrado',
    });
  }

  // Hash de contraseña
  const hashedPassword = await bcrypt.hash(contraseña, 10);

  // Crear usuario
  const nuevoUsuario = await usuarioRepository.create({
    nombre,
    apellidos,
    email,
    nombreUsuario,
    contraseña: hashedPassword,
    areaId: parseInt(areaId, 10),
    rolId: parseInt(rolId, 10),
    telefono: telefono || null,
    celular: celular || null,
  });

  // Registrar en auditoría
  try {
    const auditoriaRepository = require('../repositories/auditoria.repository');
    await auditoriaRepository.registrarEventoSistema({
      accion: 'CREAR_USUARIO',
      descripcion: `Usuario ${nombreUsuario} creado`,
      usuarioId: req.user.id,
      areaId: nuevoUsuario.area_id,
      detalles: JSON.stringify({
        usuarioCreado: nuevoUsuario.id,
        nombreUsuario,
        email,
      }),
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error('Error al registrar auditoría:', err);
  }

  res.status(201).json({
    success: true,
    message: 'Usuario creado exitosamente',
    data: nuevoUsuario,
  });
});

/**
 * Actualizar un usuario existente
 * PATCH /usuarios/:id
 */
const updateUsuario = asyncHandler(async (req, res) => {
  const bcrypt = require('bcrypt');
  const id = parseInt(req.params.id, 10);
  const { 
    nombre, apellidos, email, areaId, rolId, 
    telefono, celular, activo, contraseña 
  } = req.body;

  // Verificar que el usuario existe
  const usuario = await usuarioRepository.findById(id);
  if (!usuario) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Verificar si el email cambió y si ya está en uso
  if (email && email !== usuario.email) {
    const existingEmail = await usuarioRepository.findByEmail(email);
    if (existingEmail && existingEmail.id !== id) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está registrado por otro usuario',
      });
    }
  }

  // Si se proporcionó una nueva contraseña, actualizarla en la base de datos
  if (contraseña && contraseña.trim()) {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    await usuarioRepository.updatePassword(id, hashedPassword);
  }

  // Actualizar usuario
  const usuarioActualizado = await usuarioRepository.update(id, {
    nombre,
    apellidos,
    email,
    areaId: parseInt(areaId, 10),
    rolId: parseInt(rolId, 10),
    telefono: telefono || null,
    celular: celular || null,
    activo: activo !== undefined ? activo : usuario.activo,
  });

  // Registrar en auditoría
  try {
    const auditoriaRepository = require('../repositories/auditoria.repository');
    await auditoriaRepository.registrarEventoSistema({
      accion: 'ACTUALIZAR_USUARIO',
      descripcion: `Usuario ${usuario.nombre_usuario} actualizado`,
      usuarioId: req.user.id,
      areaId: usuario.area_id,
      detalles: JSON.stringify({
        usuarioModificado: id,
        campos: Object.keys(req.body),
      }),
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error('Error al registrar auditoría:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Usuario actualizado exitosamente',
    data: usuarioActualizado,
  });
});

/**
 * Activar/desactivar usuario
 * PATCH /usuarios/:id/status
 */
const updateUsuarioStatus = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { activo } = req.body;

  const usuario = await usuarioRepository.findById(id);
  if (!usuario) {
    throw new NotFoundError('Usuario no encontrado');
  }

  await usuarioRepository.updateActiveStatus(id, activo);

  res.status(200).json({
    success: true,
    message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
  });
});

/**
 * Obtener estadísticas de usuarios
 * GET /usuarios/stats
 * OPTIMIZADO: Hace un solo query agregado en lugar de múltiples requests
 */
const getUsuariosStats = asyncHandler(async (req, res) => {
  const stats = await usuarioRepository.getStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

module.exports = {
  getAllUsuarios,
  getUsuarioById,
  getUsuariosByArea,
  createUsuario,
  updateUsuario,
  updateUsuarioStatus,
  getUsuariosStats,
};
