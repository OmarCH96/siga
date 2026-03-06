/**
 * Script para verificar usuarios en la base de datos
 * Ejecutar: node scripts/verificar-usuarios.js
 */

const { Pool } = require('pg');
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

async function verificarUsuarios() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       Verificación de Usuarios en Base de Datos           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✓ Conexión a base de datos exitosa\n');

    // Obtener usuarios
    const query = `
      SELECT 
        u.id,
        u.nombre_usuario,
        u.nombre,
        u.apellidos,
        u.email,
        u.activo,
        r.nombre AS rol,
        a.nombre AS area
      FROM usuario u
      INNER JOIN rol r ON u.rol_id = r.id
      INNER JOIN area a ON u.area_id = a.id
      ORDER BY u.id
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos');
      console.log('\nEjecuta el script de datos de prueba:');
      console.log('  psql -U postgres -d gestor_db -f datos_prueba_postgresql_v2.sql\n');
      return;
    }

    console.log(`Total de usuarios: ${result.rows.length}\n`);
    console.log('═'.repeat(120));
    console.log(
      'ID'.padEnd(5) +
      'Usuario'.padEnd(20) +
      'Nombre Completo'.padEnd(35) +
      'Email'.padEnd(30) +
      'Rol'.padEnd(20) +
      'Activo'
    );
    console.log('═'.repeat(120));

    result.rows.forEach(user => {
      const nombreCompleto = `${user.nombre} ${user.apellidos}`;
      const activo = user.activo ? '✓ Sí' : '✗ No';
      
      console.log(
        String(user.id).padEnd(5) +
        user.nombre_usuario.padEnd(20) +
        nombreCompleto.padEnd(35) +
        user.email.padEnd(30) +
        user.rol.padEnd(20) +
        activo
      );
    });

    console.log('═'.repeat(120));
    console.log('\n📝 Para iniciar sesión, usa uno de los nombres de usuario mostrados arriba');
    console.log('💡 Contraseña por defecto: password\n');

    // Mostrar usuarios activos para login rápido
    const usuariosActivos = result.rows.filter(u => u.activo);
    
    if (usuariosActivos.length > 0) {
      console.log('Usuarios activos disponibles para login:');
      usuariosActivos.forEach(user => {
        console.log(`  • Usuario: ${user.nombre_usuario} | Rol: ${user.rol} | Contraseña: password`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('✗ Error al verificar usuarios:', error.message);
    
    if (error.code === '42P01') {
      console.log('\n⚠️  La tabla "usuario" no existe.');
      console.log('Ejecuta primero el script de esquema:');
      console.log('  psql -U postgres -d gestor_db -f schema_database_postgresql.sql\n');
    } else if (error.code === '3D000') {
      console.log('\n⚠️  La base de datos no existe.');
      console.log('Ejecuta: node scripts/init-db.js\n');
    }
  } finally {
    await pool.end();
  }
}

// Ejecutar script
verificarUsuarios().catch(console.error);
