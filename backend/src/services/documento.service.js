/**
 * Servicio de Documentos
 * Maneja la lógica de negocio para documentos y su flujo
 */

const db = require('../config/database');
const documentoRepository = require('../repositories/documento.repository');
const log = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');

class DocumentoService {
  /**
   * Configura el contexto RLS para el usuario actual
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<void>}
   */
  async configurarContextoRLS(usuarioId) {
    try {
      await db.query('SELECT fn_establecer_usuario_actual($1)', [usuarioId]);
      
      log.info('Contexto RLS configurado', { usuarioId });
    } catch (error) {
      log.error('Error al configurar contexto RLS', { error: error.message, usuarioId });
      throw error;
    }
  }

  /**
   * Obtiene la bandeja de recepción del usuario actual
   * Documentos con nodo activo en estado PENDIENTE en el área del usuario
   * @param {number} usuarioId - ID del usuario
   * @param {number} areaId - ID del área del usuario
   * @returns {Promise<Array>} Lista de documentos pendientes
   */
  async getBandejaRecepcion(usuarioId, areaId) {
    // Configurar contexto RLS antes de consultar
    await this.configurarContextoRLS(usuarioId);

    // Obtener documentos pendientes
    const documentos = await documentoRepository.getBandejaRecepcion(areaId);

    log.info('Bandeja de recepción obtenida', {
      usuarioId,
      areaId,
      cantidad: documentos.length,
    });

    return documentos;
  }

  /**
   * Obtiene el detalle completo de un documento con su cadena de custodia
   * @param {number} documentoId - ID del documento
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Object>} Documento con historial de nodos
   */
  async getDocumentoDetalle(documentoId, usuarioId) {
    // Configurar contexto RLS
    await this.configurarContextoRLS(usuarioId);

    // Obtener documento
    const documento = await documentoRepository.findById(documentoId);
    
    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    // Obtener historial de nodos (cadena de custodia)
    const historialNodos = await documentoRepository.getHistorialNodos(documentoId);

    return {
      ...documento,
      cadena_custodia: historialNodos,
    };
  }

  /**
   * Emite un nuevo documento desde el área del usuario
   * @param {Object} datosDocumento - Datos del documento a emitir
   * @param {number} usuarioId - ID del usuario emisor
   * @param {number} areaId - ID del área emisora
   * @returns {Promise<Object>} Resultado con documentoId, nodoId y folio
   */
  async emitirDocumento(datosDocumento, usuarioId, areaId) {
    // Configurar contexto RLS antes de emitir
    await this.configurarContextoRLS(usuarioId);

    // Validar que si es OFICIO, tenga prestamo_numero_id
    if (datosDocumento.contexto === 'OFICIO' && !datosDocumento.prestamo_numero_id) {
      throw new ValidationError('Los documentos de contexto OFICIO requieren un préstamo de número autorizado');
    }

    // Preparar datos asegurando que usuario y área sean los del token
    const datosEmision = {
      tipo_documento_id: datosDocumento.tipo_documento_id,
      asunto: datosDocumento.asunto,
      contenido: datosDocumento.contenido || null,
      usuario_creador_id: usuarioId,
      area_origen_id: areaId,
      fecha_limite: datosDocumento.fecha_limite || null,
      prioridad: datosDocumento.prioridad || 'MEDIA',
      instrucciones: datosDocumento.instrucciones || null,
      observaciones: datosDocumento.observaciones || null,
      contexto: datosDocumento.contexto || 'OTRO',
      prestamo_numero_id: datosDocumento.prestamo_numero_id || null,
    };

    // Llamar al repositorio para ejecutar el stored procedure
    const resultado = await documentoRepository.emitirDocumento(datosEmision);

    log.info('Documento emitido exitosamente', {
      usuarioId,
      areaId,
      documentoId: resultado.p_documento_id,
      folio: resultado.p_folio_emision,
    });

    return {
      documentoId: resultado.p_documento_id,
      nodoId: resultado.p_nodo_id,
      folio: resultado.p_folio_emision,
    };
  }
}

module.exports = new DocumentoService();
