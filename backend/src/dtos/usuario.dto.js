/**
 * Data Transfer Objects (DTOs) para Usuario
 * Controla qué información del usuario se expone al frontend
 * Previene exposición de datos sensibles
 */

class UsuarioDTO {
  /**
   * Convierte un usuario de DB a formato público
   * Remueve campos sensibles como contraseña, tokens, etc.
   * @param {Object} usuario - Usuario de la base de datos
   * @returns {Object} Usuario sanitizado para el frontend
   */
  static toPublic(usuario) {
    if (!usuario) return null;

    return {
      id: usuario.id,
      nombreUsuario: usuario.nombre_usuario,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      email: usuario.email,
      activo: usuario.activo,
      rol: {
        id: usuario.rol_id,
        nombre: usuario.rol_nombre,
        permisos: usuario.rol_permisos || [],
      },
      area: {
        id: usuario.area_id,
        nombre: usuario.area_nombre,
        clave: usuario.area_clave,
      },
      fechaCreacion: usuario.fecha_creacion,
      ultimoAcceso: usuario.ultimo_acceso,
    };
  }

  /**
   * Convierte un usuario a formato para JWT payload
   * Solo incluye información necesaria para el token
   * @param {Object} usuario - Usuario de la base de datos
   * @returns {Object} Datos para JWT
   */
  static toJWTPayload(usuario) {
    if (!usuario) return null;

    return {
      id: usuario.id,
      nombreUsuario: usuario.nombre_usuario,
      email: usuario.email,
      rolId: usuario.rol_id,
      rolNombre: usuario.rol_nombre,
      permisos: usuario.rol_permisos || [],
      areaId: usuario.area_id,
      areaNombre: usuario.area_nombre,
      areaClave: usuario.area_clave,
    };
  }

  /**
   * Convierte múltiples usuarios a formato público
   * @param {Array<Object>} usuariosArray - Array de usuarios
   * @returns {Array<Object>} Array de usuarios sanitizados
   */
  static toPublicList(usuariosArray) {
    if (!Array.isArray(usuariosArray)) return [];
    return usuariosArray.map(usuario => this.toPublic(usuario));
  }

  /**
   * Convierte un usuario a formato mínimo (para listados)
   * @param {Object} usuario - Usuario de la base de datos
   * @returns {Object} Usuario con información mínima
   */
  static toMinimal(usuario) {
    if (!usuario) return null;

    return {
      id: usuario.id,
      nombreUsuario: usuario.nombre_usuario,
      nombreCompleto: `${usuario.nombre} ${usuario.apellidos}`,
      email: usuario.email,
      rolNombre: usuario.rol_nombre,
      areaNombre: usuario.area_nombre,
      activo: usuario.activo,
    };
  }

  /**
   * Convierte múltiples usuarios a formato mínimo
   * @param {Array<Object>} usuarios - Array de usuarios
   * @returns {Array<Object>} Array de usuarios sanitizados mínimos
   */
  static toMinimalList(usuarios) {
    if (!Array.isArray(usuarios)) return [];
    return usuarios.map(usuario => this.toMinimal(usuario));
  }
}

module.exports = UsuarioDTO;
