/**
 * Middleware de autorización y control de permisos
 * Verifica que el usuario tenga los permisos necesarios
 */

const { AuthorizationError } = require('../utils/errors');
const rolRepository = require('../repositories/rol.repository');

function normalizeText(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Verifica que el usuario tenga un rol específico
 * @param {Array<string>} rolesPermitidos - Lista de roles permitidos
 */
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Usuario no autenticado');
      }

      const rolUsuario = req.user.rol_nombre;

      const rolesNormalizados = rolesPermitidos.map((rol) => normalizeText(rol));
      const rolUsuarioNormalizado = normalizeText(rolUsuario);

      if (!rolesNormalizados.includes(rolUsuarioNormalizado)) {
        throw new AuthorizationError(
          `Acceso denegado. Rol requerido: ${rolesPermitidos.join(' o ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Verifica que el usuario tenga un permiso específico
 * @param {string} permiso - Permiso requerido
 */
function requirePermission(permiso) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Usuario no autenticado');
      }

      const permisos = req.user.rol_permisos;

      // Verificar si tiene permiso total (*)
      if (permisos === '*') {
        return next();
      }

      // Verificar si tiene el permiso específico
      const listaPermisos = permisos.split(',').map(p => p.trim());

      if (!listaPermisos.includes(permiso)) {
        throw new AuthorizationError(
          `Acceso denegado. Permiso requerido: ${permiso}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Verifica que el usuario sea propietario del recurso o administrador
 * @param {Function} getResourceOwnerId - Función que obtiene el ID del propietario del recurso
 */
function requireOwnershipOrAdmin(getResourceOwnerId) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Usuario no autenticado');
      }

      // Los administradores tienen acceso total
      if (normalizeText(req.user.rol_nombre) === normalizeText('Administrador')) {
        return next();
      }

      // Obtener el ID del propietario del recurso
      const ownerId = await getResourceOwnerId(req);

      // Verificar que el usuario sea el propietario
      if (req.user.id !== ownerId) {
        throw new AuthorizationError(
          'No tiene permisos para acceder a este recurso'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Verifica que el usuario pertenezca a un área específica o sea administrador
 * @param {Function} getRequiredAreaId - Función que obtiene el ID del área requerida
 */
function requireArea(getRequiredAreaId) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Usuario no autenticado');
      }

      // Los administradores tienen acceso total
      if (normalizeText(req.user.rol_nombre) === normalizeText('Administrador')) {
        return next();
      }

      // Obtener el ID del área requerida
      const areaId = await getRequiredAreaId(req);

      // Verificar que el usuario pertenezca al área
      if (req.user.area_id !== areaId) {
        throw new AuthorizationError(
          'No tiene permisos para acceder a recursos de esta área'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  requireRole,
  requirePermission,
  requireOwnershipOrAdmin,
  requireArea,
};
