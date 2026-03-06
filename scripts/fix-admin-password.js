/**
 * Script para actualizar contraseña del usuario admin
 */

const { Pool } = require('pg');
const bcrypt = require('../backend/node_modules/bcrypt');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'gestor_db',
});

async function actualizarContraseña() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        Actualizar Contraseña Usuario admin                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Generar hash de la contraseña "password"
    const hash = await bcrypt.hash('password', 10);
    
    console.log('Hash generado para "password":', hash);
    console.log('');

    // Actualizar usuario admin
    const updateQuery = 'UPDATE usuario SET contraseña = $1 WHERE nombre_usuario = $2';
    const result = await pool.query(updateQuery, [hash, 'admin']);
    
    console.log(`✓ Contraseña actualizada (${result.rowCount} fila afectada)`);
    console.log('');
    console.log('═'.repeat(70));
    console.log('CREDENCIALES DE ACCESO:');
    console.log('═'.repeat(70));
    console.log('');
    console.log('  Usuario:    admin');
    console.log('  Contraseña: password');
    console.log('');
    console.log('💡 Ahora intenta iniciar sesión nuevamente en el frontend.');
    console.log('');

  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await pool.end();
  }
}

actualizarContraseña().catch(console.error);
