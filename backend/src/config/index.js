/**
 * Configuración de variables de entorno
 * Carga y valida las variables de entorno necesarias para el sistema
 */

require('dotenv').config();

const config = {
  // Configuración del servidor
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  // Configuración de base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'gestordocumental',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20, // máximo de conexiones en el pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  // Configuración de archivos
  upload: {
    directory: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
  },

  // Configuración de rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Configuración de CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  // Configuración de firma electrónica (preparado para futuro)
  signature: {
    enabled: process.env.SIGNATURE_ENABLED === 'true',
    algorithm: process.env.SIGNATURE_ALGORITHM || 'RSA-SHA256',
  },
};

/**
 * Valida que las variables de entorno críticas estén configuradas
 * @throws {Error} Si falta alguna configuración crítica
 */
function validateConfig() {
  const required = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan las siguientes variables de entorno: ${missing.join(', ')}\n` +
      'Por favor, copia .env.example a .env y configura los valores.'
    );
  }

  // Advertencia en desarrollo si se usa el secreto por defecto
  if (config.env === 'production' && config.jwt.secret === 'default_secret_change_in_production') {
    throw new Error('JWT_SECRET debe ser cambiado en producción');
  }
}

// Validar configuración al cargar el módulo
validateConfig();

module.exports = config;
