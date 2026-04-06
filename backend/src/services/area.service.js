/**
 * Servicio de Áreas (Unidades Administrativas)
 * Contiene la lógica de negocio para gestión de áreas
 */

const areaRepository = require('../repositories/area.repository');
const auditoriaRepository = require('../repositories/auditoria.repository');
const log = require('../utils/logger');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
} = require('../utils/errors');

class AreaService {
  /**
   * Obtiene todas las áreas con filtros y paginación
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Resultado paginado
   */
  async getAllAreas(filters = {}) {
    try {
      const result = await areaRepository.findAll(filters);
      return result;
    } catch (error) {
      log.error('Error al obtener áreas', { error: error.message });
      throw error;
    }
  }

  /**
   * Obtiene todas las áreas activas (sin paginación)
   * @returns {Promise<Array>} Lista de áreas activas
   */
  async getAreasActivas() {
    try {
      const areas = await areaRepository.findAllActive();
      return areas;
    } catch (error) {
      log.error('Error al obtener áreas activas', { error: error.message });
      throw error;
    }
  }

  /**
   * Obtiene un área por su ID
   * @param {number} areaId - ID del área
   * @returns {Promise<Object>} Área encontrada
   */
  async getAreaById(areaId) {
    if (!areaId || isNaN(areaId)) {
      throw new ValidationError('ID de área inválido');
    }

    const area = await areaRepository.findById(areaId);

    if (!area) {
      throw new NotFoundError('Área no encontrada');
    }

    return area;
  }

  /**
   * Obtiene un área por su clave
   * @param {string} clave - Clave del área
   * @returns {Promise<Object>} Área encontrada
   */
  async getAreaByClave(clave) {
    if (!clave || typeof clave !== 'string') {
      throw new ValidationError('Clave de área inválida');
    }

    const area = await areaRepository.findByClave(clave);

    if (!area) {
      throw new NotFoundError('Área no encontrada');
    }

    return area;
  }

  /**
   * Obtiene el árbol jerárquico de áreas
   * @param {number} areaPadreId - ID del área padre (null para raíz)
   * @returns {Promise<Array>} Árbol de áreas
   */
  async getArbolJerarquico(areaPadreId = null) {
    try {
      const arbol = await areaRepository.findArbolJerarquico(areaPadreId);
      return arbol;
    } catch (error) {
      log.error('Error al obtener árbol jerárquico', { error: error.message });
      throw error;
    }
  }

  /**
   * Obtiene la ruta jerárquica de un área
   * @param {number} areaId - ID del área
   * @returns {Promise<Array>} Ruta jerárquica
   */
  async getRutaJerarquica(areaId) {
    if (!areaId || isNaN(areaId)) {
      throw new ValidationError('ID de área inválido');
    }

    const area = await areaRepository.findById(areaId);
    if (!area) {
      throw new NotFoundError('Área no encontrada');
    }

    const ruta = await areaRepository.findRutaJerarquica(areaId);
    return ruta;
  }

  /**
   * Obtiene las subáreas de un área
   * @param {number} areaPadreId - ID del área padre
   * @param {boolean} soloActivas - Solo áreas activas
   * @returns {Promise<Array>} Lista de subáreas
   */
  async getSubareas(areaPadreId, soloActivas = true) {
    if (!areaPadreId || isNaN(areaPadreId)) {
      throw new ValidationError('ID de área padre inválido');
    }

    const area = await areaRepository.findById(areaPadreId);
    if (!area) {
      throw new NotFoundError('Área padre no encontrada');
    }

    const subareas = await areaRepository.findByAreaPadre(areaPadreId, soloActivas);
    return subareas;
  }

  /**
   * Crea una nueva área
   * @param {Object} areaData - Datos del área
   * @param {Object} usuarioActual - Usuario que crea el área
   * @returns {Promise<Object>} Área creada
   */
  async createArea(areaData, usuarioActual) {
    // Validar campos requeridos
    this.validateRequiredFields(areaData, ['nombre', 'clave', 'tipo']);

    const { nombre, clave, tipo, areaPadreId, descripcion } = areaData;

    // Validar que el nombre no esté vacío
    if (!nombre || nombre.trim().length === 0) {
      throw new ValidationError('El nombre del área es requerido');
    }

    // Validar que la clave no esté vacía y tenga formato válido
    if (!clave || clave.trim().length === 0) {
      throw new ValidationError('La clave del área es requerida');
    }

    // Validar formato de clave (alfanumérico, guiones y guiones bajos)
    const claveRegex = /^[A-Z0-9_-]+$/;
    if (!claveRegex.test(clave)) {
      throw new ValidationError(
        'La clave debe contener solo letras mayúsculas, números, guiones y guiones bajos'
      );
    }

    // Verificar que la clave sea única
    const claveExiste = await areaRepository.existeClave(clave);
    if (claveExiste) {
      throw new ConflictError('La clave del área ya existe');
    }

    // Validar tipo de área (debe ser un ENUM válido)
    const tiposValidos = [
      'OFICIALÍA',
      'SECRETARIA',
      'SECRETARIA_PARTICULAR',
      'SUBSECRETARIA',
      'INSTITUTO',
      'DIRECCION',
      'DIRECCION_GENERAL',
      'SUBDIRECCION',
      'COORDINACION',
      'DEPARTAMENTO',
      'UNIDAD',
      'COMITE',
    ];

    if (!tiposValidos.includes(tipo)) {
      throw new ValidationError(
        `Tipo de área inválido. Tipos permitidos: ${tiposValidos.join(', ')}`
      );
    }

    // Validar área padre si se proporciona
    if (areaPadreId !== null && areaPadreId !== undefined) {
      const areaPadre = await areaRepository.findById(areaPadreId);

      if (!areaPadre) {
        throw new NotFoundError('Área padre no encontrada');
      }

      if (!areaPadre.activa) {
        throw new ValidationError('No se puede asignar un área padre inactiva');
      }

      // Validar jerarquía lógica (ejemplo: un departamento no puede tener una secretaría como padre)
      await this.validateJerarquiaValida(tipo, areaPadre.tipo);
    }

    try {
      // Crear el área
      const nuevaArea = await areaRepository.create({
        nombre: nombre.trim(),
        clave: clave.trim().toUpperCase(),
        tipo,
        areaPadreId: areaPadreId || null,
        descripcion: descripcion ? descripcion.trim() : null,
      });

      // Registrar en auditoría
      try {
        await auditoriaRepository.registrarEventoSistema({
          accion: 'AREA_CREADA',
          descripcion: `Área creada: ${nuevaArea.nombre} (${nuevaArea.clave})`,
          usuarioId: usuarioActual?.id,
          areaId: nuevaArea.id,
          detalles: {
            areaNombre: nuevaArea.nombre,
            areaClave: nuevaArea.clave,
            areaTipo: nuevaArea.tipo,
            areaPadreId: nuevaArea.area_padre_id,
          },
        });
      } catch (auditError) {
        log.error('Error al registrar auditoría de creación de área', {
          error: auditError.message,
        });
      }

      log.audit('Área creada', {
        areaId: nuevaArea.id,
        areaNombre: nuevaArea.nombre,
        areaClave: nuevaArea.clave,
        usuarioId: usuarioActual?.id,
      });

      return nuevaArea;
    } catch (error) {
      log.error('Error al crear área', {
        error: error.message,
        areaData,
      });
      throw error;
    }
  }

  /**
   * Actualiza un área existente
   * @param {number} areaId - ID del área
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} usuarioActual - Usuario que actualiza
   * @returns {Promise<Object>} Área actualizada
   */
  async updateArea(areaId, updateData, usuarioActual) {
    if (!areaId || isNaN(areaId)) {
      throw new ValidationError('ID de área inválido');
    }

    // Verificar que el área existe
    const areaActual = await areaRepository.findById(areaId);
    if (!areaActual) {
      throw new NotFoundError('Área no encontrada');
    }

    const { nombre, clave, tipo, areaPadreId, descripcion, activa } = updateData;

    // Validar nombre si se proporciona
    if (nombre !== undefined && (!nombre || nombre.trim().length === 0)) {
      throw new ValidationError('El nombre del área no puede estar vacío');
    }

    // Validar y verificar clave si se proporciona
    if (clave !== undefined) {
      if (!clave || clave.trim().length === 0) {
        throw new ValidationError('La clave del área no puede estar vacía');
      }

      const claveRegex = /^[A-Z0-9_-]+$/;
      if (!claveRegex.test(clave)) {
        throw new ValidationError(
          'La clave debe contener solo letras mayúsculas, números, guiones y guiones bajos'
        );
      }

      const claveExiste = await areaRepository.existeClave(clave, areaId);
      if (claveExiste) {
        throw new ConflictError('La clave del área ya existe');
      }
    }

    // Validar tipo si se proporciona
    if (tipo !== undefined) {
      const tiposValidos = [
        'OFICIALÍA',
        'SECRETARIA',
        'SECRETARIA_PARTICULAR',
        'SUBSECRETARIA',
        'INSTITUTO',
        'DIRECCION',
        'DIRECCION_GENERAL',
        'SUBDIRECCION',
        'COORDINACION',
        'DEPARTAMENTO',
        'UNIDAD',
        'COMITE',
      ];

      if (!tiposValidos.includes(tipo)) {
        throw new ValidationError(
          `Tipo de área inválido. Tipos permitidos: ${tiposValidos.join(', ')}`
        );
      }
    }

    // Validar área padre si se proporciona
    if (areaPadreId !== undefined && areaPadreId !== null) {
      // Prevenir circularidad: un área no puede ser su propio padre
      if (parseInt(areaPadreId) === parseInt(areaId)) {
        throw new ValidationError('Un área no puede ser su propia área padre');
      }

      const areaPadre = await areaRepository.findById(areaPadreId);

      if (!areaPadre) {
        throw new NotFoundError('Área padre no encontrada');
      }

      if (!areaPadre.activa) {
        throw new ValidationError('No se puede asignar un área padre inactiva');
      }

      // Prevenir circularidad: verificar que el área padre no sea descendiente del área actual
      const esDescendiente = await this.esAreaDescendiente(areaPadreId, areaId);
      if (esDescendiente) {
        throw new ValidationError(
          'No se puede asignar como padre un área que es descendiente del área actual (crearía un ciclo)'
        );
      }

      // Validar jerarquía si cambia el tipo o el padre
      const tipoFinal = tipo || areaActual.tipo;
      await this.validateJerarquiaValida(tipoFinal, areaPadre.tipo);
    }

    // Validar que si se desactiva, no tenga subáreas activas
    if (activa === false) {
      const tieneSubareasActivas = await areaRepository.tieneSubareasActivas(areaId);
      if (tieneSubareasActivas) {
        throw new ValidationError(
          'No se puede desactivar un área que tiene subáreas activas'
        );
      }

      // Validar que no tenga usuarios activos
      const tieneUsuarios = await areaRepository.tieneUsuarios(areaId);
      if (tieneUsuarios) {
        throw new ValidationError(
          'No se puede desactivar un área que tiene usuarios activos asignados'
        );
      }
    }

    try {
      // Actualizar el área
      const areaActualizada = await areaRepository.update(areaId, {
        nombre: nombre ? nombre.trim() : undefined,
        clave: clave ? clave.trim().toUpperCase() : undefined,
        tipo,
        areaPadreId,
        descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : undefined,
        activa,
      });

      // Registrar en auditoría
      try {
        await auditoriaRepository.registrarEventoSistema({
          accion: 'AREA_ACTUALIZADA',
          descripcion: `Área actualizada: ${areaActualizada.nombre} (${areaActualizada.clave})`,
          usuarioId: usuarioActual?.id,
          areaId: areaActualizada.id,
          detalles: {
            cambios: updateData,
            areaAnterior: areaActual,
          },
        });
      } catch (auditError) {
        log.error('Error al registrar auditoría de actualización de área', {
          error: auditError.message,
        });
      }

      log.audit('Área actualizada', {
        areaId: areaActualizada.id,
        areaNombre: areaActualizada.nombre,
        usuarioId: usuarioActual?.id,
      });

      return areaActualizada;
    } catch (error) {
      log.error('Error al actualizar área', {
        error: error.message,
        areaId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Activa o desactiva un área
   * @param {number} areaId - ID del área
   * @param {boolean} activa - Estado activo
   * @param {Object} usuarioActual - Usuario que realiza la acción
   * @returns {Promise<Object>} Área actualizada
   */
  async toggleStatusArea(areaId, activa, usuarioActual) {
    if (!areaId || isNaN(areaId)) {
      throw new ValidationError('ID de área inválido');
    }

    if (typeof activa !== 'boolean') {
      throw new ValidationError('El estado debe ser un valor booleano');
    }

    // Verificar que el área existe
    const area = await areaRepository.findById(areaId);
    if (!area) {
      throw new NotFoundError('Área no encontrada');
    }

    // Si ya está en el estado solicitado, no hacer nada
    if (area.activa === activa) {
      return area;
    }

    // Si se desactiva, validar restricciones
    if (activa === false) {
      const tieneSubareasActivas = await areaRepository.tieneSubareasActivas(areaId);
      if (tieneSubareasActivas) {
        throw new ValidationError(
          'No se puede desactivar un área que tiene subáreas activas'
        );
      }

      const tieneUsuarios = await areaRepository.tieneUsuarios(areaId);
      if (tieneUsuarios) {
        throw new ValidationError(
          'No se puede desactivar un área que tiene usuarios activos asignados'
        );
      }
    }

    try {
      const areaActualizada = await areaRepository.toggleStatus(areaId, activa);

      // Registrar en auditoría
      try {
        await auditoriaRepository.registrarEventoSistema({
          accion: activa ? 'AREA_ACTIVADA' : 'AREA_DESACTIVADA',
          descripcion: `Área ${activa ? 'activada' : 'desactivada'}: ${area.nombre} (${area.clave})`,
          usuarioId: usuarioActual?.id,
          areaId,
          detalles: {
            areaNombre: area.nombre,
            areaClave: area.clave,
            estadoAnterior: area.activa,
            estadoNuevo: activa,
          },
        });
      } catch (auditError) {
        log.error('Error al registrar auditoría de cambio de estado de área', {
          error: auditError.message,
        });
      }

      log.audit(`Área ${activa ? 'activada' : 'desactivada'}`, {
        areaId,
        areaNombre: area.nombre,
        usuarioId: usuarioActual?.id,
      });

      return areaActualizada;
    } catch (error) {
      log.error('Error al cambiar estado de área', {
        error: error.message,
        areaId,
        activa,
      });
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de áreas
   * @returns {Promise<Object>} Estadísticas
   */
  async getEstadisticas() {
    try {
      const estadisticas = await areaRepository.obtenerEstadisticas();
      const distribucion = await areaRepository.obtenerDistribucionPorTipo();

      return {
        ...estadisticas,
        distribucionPorTipo: distribucion,
      };
    } catch (error) {
      log.error('Error al obtener estadísticas de áreas', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Valida que los campos requeridos estén presentes
   * @param {Object} data - Datos a validar
   * @param {Array<string>} requiredFields - Campos requeridos
   * @private
   */
  validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter((field) => {
      return data[field] === undefined || data[field] === null || data[field] === '';
    });

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Campos requeridos faltantes: ${missingFields.join(', ')}`
      );
    }
  }

  /**
   * Valida que la jerarquía sea lógica
   * @param {string} tipoHijo - Tipo del área hija
   * @param {string} tipoPadre - Tipo del área padre
   * @private
   */
  async validateJerarquiaValida(tipoHijo, tipoPadre) {
    // Definir jerarquía válida (simplificada)
    const jerarquiaValida = {
      DEPARTAMENTO: ['SUBDIRECCION', 'COORDINACION', 'DIRECCION', 'DIRECCION_GENERAL'],
      COORDINACION: ['SUBDIRECCION', 'DIRECCION', 'DIRECCION_GENERAL', 'SUBSECRETARIA'],
      SUBDIRECCION: ['DIRECCION', 'DIRECCION_GENERAL', 'SUBSECRETARIA'],
      DIRECCION: ['SUBSECRETARIA', 'SECRETARIA'],
      DIRECCION_GENERAL: ['SUBSECRETARIA', 'SECRETARIA'],
      SUBSECRETARIA: ['SECRETARIA'],
      UNIDAD: ['DIRECCION', 'DIRECCION_GENERAL', 'SUBSECRETARIA', 'SECRETARIA'],
      COMITE: ['DIRECCION', 'DIRECCION_GENERAL', 'SUBSECRETARIA', 'SECRETARIA'],
      INSTITUTO: ['SECRETARIA'],
      SECRETARIA_PARTICULAR: ['SECRETARIA'],
    };

    const padresPermitidos = jerarquiaValida[tipoHijo];

    if (padresPermitidos && !padresPermitidos.includes(tipoPadre)) {
      throw new ValidationError(
        `Un área de tipo ${tipoHijo} no puede tener como padre un área de tipo ${tipoPadre}`
      );
    }
  }

  /**
   * Verifica si un área es descendiente de otra (prevenir circularidad)
   * @param {number} posibleDescendienteId - ID del posible descendiente
   * @param {number} ancestroId - ID del posible ancestro
   * @returns {Promise<boolean>} True si es descendiente
   * @private
   */
  async esAreaDescendiente(posibleDescendienteId, ancestroId) {
    // Obtener la ruta jerárquica del posible descendiente
    const ruta = await areaRepository.findRutaJerarquica(posibleDescendienteId);

    // Verificar si el ancestro está en la ruta
    return ruta.some((area) => area.id === parseInt(ancestroId));
  }
}

module.exports = new AreaService();
