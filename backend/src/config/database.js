/**
 * Pool de conexiones a PostgreSQL
 * Gestiona las conexiones a la base de datos de forma eficiente
 */

const { Pool } = require('pg');
const config = require('./index');

// Crear pool de conexiones
const pool = new Pool(config.database);

// Manejar errores del pool
pool.on('error', (err, client) => {
  console.error('Error inesperado en cliente de base de datos:', err);
  process.exit(-1);
});

/**
 * Ejecuta una consulta SQL
 * @param {string} text - Query SQL
 * @param {Array} params - Parámetros de la query
 * @returns {Promise<Object>} Resultado de la consulta
 */
async function query(text, params) {
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log en desarrollo
    if (config.env === 'development') {
      console.log('Consulta ejecutada:', {
        text,
        duration: `${duration}ms`,
        rows: res.rowCount,
      });
    }
    
    return res;
  } catch (error) {
    console.error('Error en consulta SQL:', {
      text,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Obtiene un cliente del pool para transacciones
 * @returns {Promise<Object>} Cliente de PostgreSQL
 */
async function getClient() {
  const client = await pool.connect();
  
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Wrapper para liberar automáticamente en caso de error
  client.query = (...args) => {
    return query(...args).catch(err => {
      client.release();
      throw err;
    });
  };
  
  return client;
}

/**
 * Verifica la conexión a la base de datos
 * @returns {Promise<boolean>} true si la conexión es exitosa
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() as now');
    console.log('✓ Conexión a base de datos exitosa:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('✗ Error al conectar con la base de datos:', error.message);
    throw error;
  }
}

/**
 * Cierra el pool de conexiones
 */
async function closePool() {
  await pool.end();
  console.log('Pool de conexiones cerrado');
}

module.exports = {
  query,
  getClient,
  testConnection,
  closePool,
  pool,
};
