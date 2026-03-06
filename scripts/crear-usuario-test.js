/**
 * Script para crear usuario TEST con credenciales simples
 * Usuario: test | Contraseña: test
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'gestor_db',
});

async function crearUsuarioTest() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           Crear Usuario TEST (Credenciales Simples)       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Eliminar usuario si existe
    await client.query('DELETE FROM usuario WHERE nombre_usuario = $1', ['test']);

    // Hash de contraseña "test"
    const contraseñaHash = await bcrypt.hash('test', 10);

    // Insertar usuario
    const query = `
      INSERT INTO usuario (
        nombre, apellidos, email, nombre_usuario, contraseña,
        area_id, rol_id, activo
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING id, nombre_usuario, email
    `;

    const values = [
      'Usuario',              // nombre
      'Test',                 // apellidos
      'test@test.com',        // email
      'test',                 // nombre_usuario
      contraseñaHash,         // contraseña
      1,                      // area_id
      1,                      // rol_id (Administrador)
      true,                   // activo
    ];

    const result = await client.query(query, values);
    await client.query('COMMIT');

    const usuario = result.rows[0];

    console.log('✓ Usuario TEST creado exitosamente\n');
    console.log('═'.repeat(70));
    console.log('CREDENCIALES DE ACCESO:');
    console.log('═'.repeat(70));
    console.log('');
    console.log('  👤 Usuario:    test');
    console.log('  🔐 Contraseña: test');
    console.log('');
    console.log('═'.repeat(70));
    console.log('');
    console.log('💡 Intenta iniciar sesión con estas credenciales EXACTAS:');
    console.log('   • Escribe: test (sin espacios, sin mayúsculas)');
    console.log('   • Contraseña: test (sin espacios, sin mayúsculas)');
    console.log('');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

crearUsuarioTest().catch(console.error);
