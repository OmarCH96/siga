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
    database: process.env.DB_NAME || 'gestordocumental1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT, 10) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT, 10) || 2000,
  },

  // Configuración de JWT
  // NOTA: Sin fallback inseguro - JWT_SECRET es obligatorio
  jwt: {
    secret: process.env.JWT_SECRET, // OBLIGATORIO - validado en validateConfig()
    expiresIn: process.env.JWT_EXPIRES_IN || '15m', // 15 minutos recomendado
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

  // Configuración de seguridad
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
    lockTimeMinutes: parseInt(process.env.LOCK_TIME_MINUTES, 10) || 15,
  },

  // Configuración de HTTPS (producción)
  https: {
    enabled: process.env.HTTPS_ENABLED === 'true',
    certPath: process.env.SSL_CERT_PATH,
    keyPath: process.env.SSL_KEY_PATH,
  },
};

/**
 * Valida que las variables de entorno críticas estén configuradas
 * @throws {Error} Si falta alguna configuración crítica
 */
function validateConfig() {
  const errors = [];

  // Variables obligatorias
  const required = {
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET,
  };

  // Verificar variables obligatorias
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      errors.push(`Falta la variable de entorno: ${key}`);
    }
  }

  // Validar JWT_SECRET
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET debe tener al menos 32 caracteres');
    }

    // Verificar que no sea un secreto débil conocido
    const weakSecrets = [
      'secret',
      'default',
      'change_me',
      'change_in_production',
      'default_secret_change_in_production',
    ];

    if (weakSecrets.some(weak => process.env.JWT_SECRET.toLowerCase().includes(weak))) {
      errors.push('JWT_SECRET no debe contener palabras como "secret", "default" o "change_me"');
    }
  }

  // Validar configuración de producción
  if (config.env === 'production') {
    if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN.includes('localhost')) {
      errors.push('CORS_ORIGIN debe configurarse correctamente para producción (sin localhost)');
    }

    if (config.jwt.expiresIn !== '15m') {
      console.warn('⚠️  ADVERTENCIA: Se recomienda JWT_EXPIRES_IN=15m en producción');
    }

    // Advertir si HTTPS no está habilitado
    if (!config.https.enabled) {
      console.warn('⚠️  ADVERTENCIA: HTTPS no está habilitado. Se recomienda fuertemente para producción');
    }
  }

  // Si hay errores, lanzar excepción
  if (errors.length > 0) {
    throw new Error(
      `❌ Errores en configuración:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      '💡 Consulta el archivo .env.example para ver todas las variables necesarias.'
    );
  }

  // Mostrar configuración exitosa
  console.log('✓ Configuración validada correctamente');
  console.log(`  Entorno: ${config.env}`);
  console.log(`  Puerto: ${config.port}`);
  console.log(`  Base de datos: ${config.database.database}@${config.database.host}`);
  console.log(`  JWT Expiration: ${config.jwt.expiresIn}`);
  console.log(`  CORS: ${config.cors.origin}`);
}

// Validar configuración al cargar el módulo
validateConfig();

module.exports = config;
