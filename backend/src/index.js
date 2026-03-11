/**
 * Archivo de entrada del servidor
 * Configura y arranca el servidor Express
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const database = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const areaRoutes = require('./routes/area.routes');
const rolRoutes = require('./routes/rol.routes');
const tipoDocumentoRoutes = require('./routes/tipoDocumento.routes');
const documentoRoutes = require('./routes/documento.routes');

// Crear aplicación Express
const app = express();

// ============================================================================
// MIDDLEWARES DE SEGURIDAD
// ============================================================================

// Helmet - Headers de seguridad
app.use(helmet());

// CORS - Control de acceso
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Rate limiting general
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Demasiadas peticiones desde esta IP, intente más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting específico para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de login, intente más tarde',
  skipSuccessfulRequests: true,
});

// ============================================================================
// MIDDLEWARES DE PARSEO
// ============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// RUTAS
// ============================================================================

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de la API
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/tipos-documento', tipoDocumentoRoutes);
app.use('/api/documentos', documentoRoutes);

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

// Ruta no encontrada
app.use(notFoundHandler);

// Manejador global de errores
app.use(errorHandler);

// ============================================================================
// INICIO DEL SERVIDOR
// ============================================================================

/**
 * Inicia el servidor
 */
async function startServer() {
  try {
    // Probar conexión a base de datos
    await database.testConnection();

    // Iniciar servidor
    app.listen(config.port, () => {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║   Sistema Integral de Gestión Administrativa (SIGA)       ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`✓ Servidor corriendo en puerto ${config.port}`);
      console.log(`✓ Entorno: ${config.env}`);
      console.log(`✓ Base de datos: ${config.database.database}@${config.database.host}`);
      console.log('');
      console.log(`API disponible en: http://localhost:${config.port}/api`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log('');
    });
  } catch (error) {
    console.error('✗ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  await database.closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recibido, cerrando servidor...');
  await database.closePool();
  process.exit(0);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  process.exit(1);
});

// Iniciar servidor
startServer();

module.exports = app;
