/**
 * Script de inicialización de base de datos
 * Crea la base de datos y ejecuta los scripts SQL
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Cargar variables de entorno desde backend/.env
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

// Configuración para conectar a PostgreSQL sin especificar base de datos
const adminConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'postgres', // Conectar a la base de datos por defecto
};

const dbName = process.env.DB_NAME || 'gestor_db';

/**
 * Ejecuta un archivo SQL
 */
async function executeSQLFile(client, filePath) {
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    await client.query(sql);
    console.log(`✓ Ejecutado: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`✗ Error al ejecutar ${path.basename(filePath)}:`, error.message);
    throw error;
  }
}

/**
 * Verifica si existe la base de datos
 */
async function databaseExists(pool, dbName) {
  const result = await pool.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName]
  );
  return result.rows.length > 0;
}

/**
 * Crea la base de datos si no existe
 */
async function createDatabase(pool, dbName) {
  const exists = await databaseExists(pool, dbName);

  if (exists) {
    console.log(`⚠ La base de datos '${dbName}' ya existe`);
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      readline.question('¿Desea recrearla? (s/N): ', (answer) => {
        readline.close();
        if (answer.toLowerCase() === 's') {
          console.log(`Eliminando base de datos '${dbName}'...`);
          pool.query(`DROP DATABASE ${dbName}`)
            .then(() => {
              console.log(`Creando base de datos '${dbName}'...`);
              return pool.query(`CREATE DATABASE ${dbName}`);
            })
            .then(() => {
              console.log(`✓ Base de datos '${dbName}' recreada`);
              resolve();
            })
            .catch(error => {
              console.error('Error al recrear base de datos:', error.message);
              process.exit(1);
            });
        } else {
          console.log('Operación cancelada');
          process.exit(0);
        }
      });
    });
  } else {
    console.log(`Creando base de datos '${dbName}'...`);
    await pool.query(`CREATE DATABASE ${dbName}`);
    console.log(`✓ Base de datos '${dbName}' creada`);
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Inicialización de Base de Datos - SIGA              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Pool para operaciones administrativas
  const adminPool = new Pool(adminConfig);

  try {
    // Crear base de datos
    await createDatabase(adminPool, dbName);
    await adminPool.end();

    // Conectar a la nueva base de datos
    const dbPool = new Pool({
      ...adminConfig,
      database: dbName,
    });

    const client = await dbPool.connect();

    console.log('');
    console.log('Ejecutando scripts SQL...');
    console.log('');

    // Ejecutar schema
    const schemaPath = path.join(__dirname, '..', 'schema_database_postgresql.sql');
    await executeSQLFile(client, schemaPath);

    // Ejecutar datos de prueba
    const seedPath = path.join(__dirname, '..', 'datos_prueba_postgresql_v2.sql');
    await executeSQLFile(client, seedPath);

    client.release();
    await dbPool.end();

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   ✓ Base de datos inicializada correctamente              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Base de datos: ${dbName}`);
    console.log(`Host: ${adminConfig.host}:${adminConfig.port}`);
    console.log('');
    console.log('Puedes iniciar el servidor backend con: npm run dev');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('✗ Error durante la inicialización:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Ejecutar
main();
