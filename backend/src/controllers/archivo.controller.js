/**
 * Controlador de Archivos
 * Maneja la carga y gestión de archivos adjuntos
 */

const archivoRepository = require('../repositories/archivo.repository');
const { asyncHandler } = require('../middlewares/error.middleware');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const log = require('../utils/logger');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

/**
 * Subir uno o varios archivos
 * POST /api/archivos/upload
 * 
 * Carga archivos al servidor y registra en la base de datos
 * Usa multer middleware para procesar los archivos
 */
const uploadArchivos = asyncHandler(async (req, res) => {
  const usuario = {
    id: req.user.id,
    area_id: req.user.areaId,
  };

  // Verificar que se hayan subido archivos
  if (!req.files || req.files.length === 0) {
    throw new BadRequestError('No se han proporcionado archivos');
  }

  log.info('Subiendo archivos', {
    usuarioId: usuario.id,
    cantidadArchivos: req.files.length,
  });

  const archivosInsertados = [];

  // Procesar cada archivo
  for (const file of req.files) {
    try {
      // Calcular hash SHA-256 del archivo
      const fileBuffer = await fs.readFile(file.path);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Preparar datos para insertar
      const datosArchivo = {
        nombre_archivo: file.originalname,
        ruta_archivo: file.path,
        tipo_mime: file.mimetype,
        tamaño: file.size,
        usuario_carga_id: usuario.id,
        hash: hash,
      };

      // Insertar en BD
      const archivoInsertado = await archivoRepository.insertarArchivo(datosArchivo);
      archivosInsertados.push(archivoInsertado);

      log.info('Archivo procesado exitosamente', {
        archivoId: archivoInsertado.id,
        nombre: archivoInsertado.nombre_archivo,
        tamaño: archivoInsertado.tamaño,
      });
    } catch (error) {
      log.error('Error al procesar archivo', {
        error: error.message,
        archivo: file.originalname,
      });
      // Continuar con los demás archivos aunque uno falle
    }
  }

  if (archivosInsertados.length === 0) {
    throw new BadRequestError('No se pudo procesar ningún archivo');
  }

  res.status(201).json({
    success: true,
    data: archivosInsertados,
    message: `${archivosInsertados.length} archivo(s) subido(s) exitosamente`,
  });
});

/**
 * Vincular archivos a un documento
 * POST /api/archivos/vincular-documento
 * 
 * Vincula archivos previamente subidos con un documento
 * Body: { documento_id, archivos_ids: [1, 2, 3], tipo_relacion: 'ADJUNTO' }
 */
const vincularArchivosDocumento = asyncHandler(async (req, res) => {
  const { documento_id, archivos_ids, tipo_relacion = 'ADJUNTO' } = req.body;

  // Validaciones
  if (!documento_id || !archivos_ids || !Array.isArray(archivos_ids) || archivos_ids.length === 0) {
    throw new BadRequestError('Se requiere documento_id y archivos_ids (array)');
  }

  log.info('Vinculando archivos a documento', {
    documentoId: documento_id,
    cantidadArchivos: archivos_ids.length,
    tipoRelacion: tipo_relacion,
  });

  // Vincular cada archivo
  for (const archivoId of archivos_ids) {
    try {
      await archivoRepository.vincularArchivoDocumento(
        documento_id,
        archivoId,
        tipo_relacion
      );
    } catch (error) {
      log.error('Error al vincular archivo a documento', {
        error: error.message,
        documentoId: documento_id,
        archivoId,
      });
      // Continuar con los demás archivos
    }
  }

  res.status(200).json({
    success: true,
    message: `Archivos vinculados al documento ${documento_id}`,
  });
});

/**
 * Vincular archivos a un nodo
 * POST /api/archivos/vincular-nodo
 * 
 * Vincula archivos previamente subidos con un nodo
 * Body: { nodo_id, archivos_ids: [1, 2, 3], tipo_relacion: 'ADJUNTO' }
 */
const vincularArchivosNodo = asyncHandler(async (req, res) => {
  const { nodo_id, archivos_ids, tipo_relacion = 'ADJUNTO' } = req.body;

  // Validaciones
  if (!nodo_id || !archivos_ids || !Array.isArray(archivos_ids) || archivos_ids.length === 0) {
    throw new BadRequestError('Se requiere nodo_id y archivos_ids (array)');
  }

  log.info('Vinculando archivos a nodo', {
    nodoId: nodo_id,
    cantidadArchivos: archivos_ids.length,
    tipoRelacion: tipo_relacion,
  });

  // Vincular cada archivo
  for (const archivoId of archivos_ids) {
    try {
      await archivoRepository.vincularArchivoNodo(nodo_id, archivoId, tipo_relacion);
    } catch (error) {
      log.error('Error al vincular archivo a nodo', {
        error: error.message,
        nodoId: nodo_id,
        archivoId,
      });
      // Continuar con los demás archivos
    }
  }

  res.status(200).json({
    success: true,
    message: `Archivos vinculados al nodo ${nodo_id}`,
  });
});

/**
 * Obtener archivos de un documento
 * GET /api/archivos/documento/:documentoId
 */
const obtenerArchivosPorDocumento = asyncHandler(async (req, res) => {
  const documentoId = parseInt(req.params.documentoId, 10);

  if (isNaN(documentoId)) {
    throw new BadRequestError('ID de documento inválido');
  }

  const archivos = await archivoRepository.obtenerArchivosPorDocumento(documentoId);

  res.status(200).json({
    success: true,
    data: archivos,
  });
});

module.exports = {
  uploadArchivos,
  vincularArchivosDocumento,
  vincularArchivosNodo,
  obtenerArchivosPorDocumento,
};
