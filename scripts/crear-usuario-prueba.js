/**
 * Script para crear un usuario de prueba completo
 * Ejecutar: node scripts/crear-usuario-prueba.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
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

async function crearUsuarioPrueba() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      Creación de Usuario de Prueba Completo               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar que existan área y rol
    const areaResult = await client.query('SELECT id FROM area WHERE id = 1');
    if (areaResult.rows.length === 0) {
      throw new Error('No existe el área con id=1. Ejecuta primero el script de datos de prueba.');
    }

    const rolResult = await client.query('SELECT id FROM rol WHERE id = 1');
    if (rolResult.rows.length === 0) {
      throw new Error('No existe el rol con id=1. Ejecuta primero el script de datos de prueba.');
    }

    // Eliminar usuario si existe
    await client.query('DELETE FROM usuario WHERE nombre_usuario = $1', ['test.usuario']);

    // Generar hash de contraseña
    const contraseñaHash = await bcrypt.hash('password', 10);

    // Insertar usuario completo
    const query = `
      INSERT INTO usuario (
        nombre, apellidos, fecha_nacimiento, sexo,
        curp, rfc,
        telefono, celular, email,
        calle, numero_exterior, numero_interior, colonia, codigo_postal, ciudad, estado,
        nombre_usuario, contraseña,
        area_id, rol_id,
        activo, fecha_alta
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6,
        $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16,
        $17, $18,
        $19, $20,
        $21, CURRENT_TIMESTAMP
      ) RETURNING id
    `;

    const values = [
      // Información Personal
      'Eduardo',                               // nombre
      'Martínez Hernández',                   // apellidos
      '1990-05-15',                           // fecha_nacimiento
      'M',                                     // sexo
      
      // Identificación Oficial
      'MAHE900515HDFRRD08',                   // curp
      'MAHE900515XY3',                        // rfc
      
      // Contacto
      '555-1234-5678',                        // telefono
      '55-9876-5432',                         // celular
      'eduardo.martinez@gestor.com',          // email
      
      // Dirección
      'Avenida Reforma',                      // calle
      '123',                                  // numero_exterior
      'B',                                    // numero_interior
      'Centro',                               // colonia
      '01000',                                // codigo_postal
      'Ciudad de México',                     // ciudad
      'CDMX',                                 // estado
      
      // Credenciales
      'test.usuario',                         // nombre_usuario
      contraseñaHash,                         // contraseña (hash)
      
      // Asignaciones
      1,                                      // area_id
      1,                                      // rol_id
      
      // Estado
      true,                                   // activo
    ];

    const result = await client.query(query, values);
    const usuarioId = result.rows[0].id;

    await client.query('COMMIT');

    // Obtener información completa del usuario creado
    const usuarioQuery = `
      SELECT 
        u.id,
        u.nombre,
        u.apellidos,
        u.nombre_usuario,
        u.email,
        u.telefono,
        u.celular,
        u.curp,
        u.rfc,
        u.fecha_nacimiento,
        u.sexo,
        u.calle,
        u.numero_exterior,
        u.numero_interior,
        u.colonia,
        u.codigo_postal,
        u.ciudad,
        u.estado,
        u.activo,
        r.nombre AS rol_nombre,
        a.nombre AS area_nombre,
        a.clave AS area_clave
      FROM usuario u
      INNER JOIN rol r ON u.rol_id = r.id
      INNER JOIN area a ON u.area_id = a.id
      WHERE u.id = $1
    `;

    const usuarioResult = await client.query(usuarioQuery, [usuarioId]);
    const usuario = usuarioResult.rows[0];

    // Mostrar información del usuario
    console.log('✓ Usuario de prueba creado exitosamente\n');
    console.log('═'.repeat(70));
    console.log('INFORMACIÓN DEL USUARIO');
    console.log('═'.repeat(70));
    console.log('');
    console.log('📋 DATOS PERSONALES:');
    console.log(`   ID:               ${usuario.id}`);
    console.log(`   Nombre:           ${usuario.nombre} ${usuario.apellidos}`);
    console.log(`   Fecha Nacimiento: ${usuario.fecha_nacimiento}`);
    console.log(`   Sexo:             ${usuario.sexo}`);
    console.log(`   CURP:             ${usuario.curp}`);
    console.log(`   RFC:              ${usuario.rfc}`);
    console.log('');
    console.log('📞 CONTACTO:');
    console.log(`   Email:            ${usuario.email}`);
    console.log(`   Teléfono:         ${usuario.telefono}`);
    console.log(`   Celular:          ${usuario.celular}`);
    console.log('');
    console.log('🏠 DIRECCIÓN:');
    console.log(`   Calle:            ${usuario.calle}`);
    console.log(`   Número Ext/Int:   ${usuario.numero_exterior} / ${usuario.numero_interior}`);
    console.log(`   Colonia:          ${usuario.colonia}`);
    console.log(`   Código Postal:    ${usuario.codigo_postal}`);
    console.log(`   Ciudad/Estado:    ${usuario.ciudad}, ${usuario.estado}`);
    console.log('');
    console.log('🔐 CREDENCIALES:');
    console.log(`   Usuario:          ${usuario.nombre_usuario}`);
    console.log(`   Contraseña:       password`);
    console.log('');
    console.log('🏢 ASIGNACIÓN:');
    console.log(`   Área:             ${usuario.area_nombre} (${usuario.area_clave})`);
    console.log(`   Rol:              ${usuario.rol_nombre}`);
    console.log(`   Estado:           ${usuario.activo ? 'Activo ✓' : 'Inactivo ✗'}`);
    console.log('');
    console.log('═'.repeat(70));
    console.log('');
    console.log('💡 Para iniciar sesión usa:');
    console.log('   Usuario:    test.usuario');
    console.log('   Contraseña: password');
    console.log('');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Error al crear usuario de prueba:', error.message);
    
    if (error.code === '23505') {
      console.log('\n⚠️  El usuario "test.usuario" ya existe.');
      console.log('   Si deseas recrearlo, elimínalo primero o modifica el nombre de usuario en el script.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar script
crearUsuarioPrueba().catch(console.error);
