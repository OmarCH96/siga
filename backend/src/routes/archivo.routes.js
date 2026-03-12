/**
 * Rutas de Archivos
 * Define los endpoints para gestión de archivos adjuntos
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archivoController = require('../controllers/archivo.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/authorize.middleware');
const { BadRequestError } = require('../utils/errors');

// Crear directorio para uploads si no existe
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de multer para almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp + random + extensión original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    // Sanitizar nombre de archivo
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, sanitizedBasename + '-' + uniqueSuffix + ext);
  }
});

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
  // Tipos MIME permitidos
  const allowedMimeTypes = [
    'application/pdf',                                                      // PDF
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/msword',                                                   // DOC
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',   // XLSX
    'application/vnd.ms-excel',                                             // XLS
    'image/jpeg',                                                           // JPG/JPEG
    'image/png',                                                            // PNG
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Tipo de archivo no permitido. Solo PDF, DOCX, XLSX, JPG, PNG.'), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB máximo por archivo
  },
});

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * POST /api/archivos/upload
 * Subir uno o varios archivos
 * Requiere: Autenticación + Permiso CREAR_DOCUMENTO
 * Accepts: multipart/form-data
 * Field name: archivos (array)
 */
router.post(
  '/upload',
  requirePermission('CREAR_DOCUMENTO'),
  upload.array('archivos', 10), // Máximo 10 archivos a la vez
  archivoController.uploadArchivos
);

/**
 * POST /api/archivos/vincular-documento
 * Vincular archivos a un documento
 * Requiere: Autenticación + Permiso CREAR_DOCUMENTO
 * Body: { documento_id, archivos_ids: [1, 2, 3], tipo_relacion: 'ADJUNTO' }
 */
router.post(
  '/vincular-documento',
  requirePermission('CREAR_DOCUMENTO'),
  archivoController.vincularArchivosDocumento
);

/**
 * POST /api/archivos/vincular-nodo
 * Vincular archivos a un nodo
 * Requiere: Autenticación + Permiso CREAR_DOCUMENTO
 * Body: { nodo_id, archivos_ids: [1, 2, 3], tipo_relacion: 'ADJUNTO' }
 */
router.post(
  '/vincular-nodo',
  requirePermission('CREAR_DOCUMENTO'),
  archivoController.vincularArchivosNodo
);

/**
 * GET /api/archivos/documento/:documentoId
 * Obtener archivos asociados a un documento
 * Requiere: Autenticación (RLS valida permisos de lectura)
 */
router.get(
  '/documento/:documentoId',
  archivoController.obtenerArchivosPorDocumento
);

module.exports = router;
