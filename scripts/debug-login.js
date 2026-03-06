/**
 * Script para interceptar y mostrar exactamente qué datos llegan al login
 * Temporal para debugging
 */

const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'gestor_db',
});

async function debugLogin(nombreUsuario) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              Debug de Login - Análisis Detallado           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    console.log('Nombre de usuario recibido:');
    console.log(`  Texto: "${nombreUsuario}"`);
    console.log(`  Longitud: ${nombreUsuario.length}`);
    console.log(`  Caracteres: ${nombreUsuario.split('').map(c => c.charCodeAt(0)).join(', ')}`);
    console.log(`  Tiene espacios al inicio: ${nombreUsuario !== nombreUsuario.trim()}`);
    console.log('');

    // Buscar usuarios similares
    const query = `
      SELECT nombre_usuario, LENGTH(nombre_usuario) as longitud
      FROM usuario
      ORDER BY nombre_usuario
    `;
    
    const result = await pool.query(query);
    
    console.log('Usuarios existentes en la base de datos:');
    console.log('═'.repeat(70));
    result.rows.forEach((row, index) => {
      const match = row.nombre_usuario.toLowerCase() === nombreUsuario.toLowerCase();
      const exactMatch = row.nombre_usuario === nombreUsuario;
      console.log(`  ${index + 1}. "${row.nombre_usuario}" (${row.longitud} chars) ${exactMatch ? '✓ MATCH EXACTO' : match ? '~ similar' : ''}`);
    });
    console.log('═'.repeat(70));
    console.log('');

    // Buscar coincidencias case-insensitive
    const searchQuery = `
      SELECT nombre_usuario
      FROM usuario
      WHERE LOWER(nombre_usuario) = LOWER($1)
    `;
    const searchResult = await pool.query(searchQuery, [nombreUsuario]);
    
    if (searchResult.rows.length > 0) {
      console.log('⚠️  ENCONTRADO con búsqueda case-insensitive:');
      console.log(`   Usuario en BD: "${searchResult.rows[0].nombre_usuario}"`);
      console.log(`   Tú escribiste: "${nombreUsuario}"`);
      console.log('   El problema puede ser mayúsculas/minúsculas o espacios.');
    } else {
      console.log('✗ NO se encontró ningún usuario similar.');
      console.log('   Verifica que estés escribiendo exactamente uno de los usuarios listados arriba.');
    }
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Leer argumento de línea de comandos
const nombreUsuario = process.argv[2];

if (!nombreUsuario) {
  console.log('\n❌ Por favor proporciona el nombre de usuario que estás intentando usar.');
  console.log('Uso: node scripts/debug-login.js <nombre_usuario>');
  console.log('Ejemplo: node scripts/debug-login.js admin\n');
  process.exit(1);
}

debugLogin(nombreUsuario).catch(console.error);
