/**
 * Script para ejecutar migración de tabla auditoria_sistema
 * Ejecutar: node scripts/ejecutar-migracion-auditoria.js
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'gestor_db',
});

async function ejecutarMigracion() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      Migración: Crear Tabla Auditoría del Sistema         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Leer archivo SQL
    const sqlPath = path.join(__dirname, 'migration-auditoria-sistema.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    // Ejecutar SQL
    await pool.query(sql);

    console.log('✓ Migración ejecutada exitosamente\n');
    console.log('Tabla auditoria_sistema creada con los siguientes campos:');
    console.log('  • id (SERIAL PRIMARY KEY)');
    console.log('  • accion (VARCHAR)');
    console.log('  • descripcion (VARCHAR)');
    console.log('  • usuario_id (INTEGER, FK)');
    console.log('  • area_id (INTEGER, FK)');
    console.log('  • fecha (TIMESTAMP)');
    console.log('  • detalles (TEXT)');
    console.log('  • ip_address (VARCHAR)');
    console.log('  • user_agent (VARCHAR)');
    console.log('\n💡 Ahora el sistema registrará eventos de login/logout correctamente.\n');

  } catch (error) {
    if (error.code === '42P07') {
      console.log('ℹ️  La tabla auditoria_sistema ya existe.');
    } else {
      console.error('✗ Error al ejecutar migración:', error.message);
    }
  } finally {
    await pool.end();
  }
}

// Ejecutar migración
ejecutarMigracion().catch(console.error);
