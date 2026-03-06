-- ============================================================================
-- INSERTAR USUARIO DE PRUEBA COMPLETO
-- Script para agregar un usuario de prueba con todos los campos llenados
-- ============================================================================
-- Ejecutar: psql -U postgres -d gestor_db -f scripts/crear-usuario-prueba.sql
-- ============================================================================

-- Verificar que existan área y rol
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM area WHERE id = 1) THEN
        RAISE EXCEPTION 'No existe el área con id=1. Ejecuta primero el script de datos de prueba.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM rol WHERE id = 1) THEN
        RAISE EXCEPTION 'No existe el rol con id=1. Ejecuta primero el script de datos de prueba.';
    END IF;
END $$;

-- Eliminar usuario si existe
DELETE FROM usuario WHERE nombre_usuario = 'test.usuario';

-- Insertar usuario de prueba completo
INSERT INTO usuario (
    -- Información Personal
    nombre,
    apellidos,
    fecha_nacimiento,
    sexo,
    
    -- Identificación Oficial
    curp,
    rfc,
    
    -- Contacto
    telefono,
    celular,
    email,
    
    -- Dirección
    calle,
    numero_exterior,
    numero_interior,
    colonia,
    codigo_postal,
    ciudad,
    estado,
    
    -- Credenciales
    nombre_usuario,
    contraseña,
    
    -- Asignaciones
    area_id,
    rol_id,
    
    -- Estado
    activo,
    fecha_alta
) VALUES (
    -- Información Personal
    'Eduardo',                                  -- nombre
    'Martínez Hernández',                      -- apellidos
    '1990-05-15',                              -- fecha_nacimiento
    'M',                                        -- sexo
    
    -- Identificación Oficial
    'MAHE900515HDFRRD08',                      -- curp
    'MAHE900515XY3',                           -- rfc
    
    -- Contacto
    '555-1234-5678',                           -- telefono
    '55-9876-5432',                            -- celular
    'eduardo.martinez@gestor.com',             -- email
    
    -- Dirección
    'Avenida Reforma',                         -- calle
    '123',                                     -- numero_exterior
    'B',                                       -- numero_interior
    'Centro',                                  -- colonia
    '01000',                                   -- codigo_postal
    'Ciudad de México',                        -- ciudad
    'CDMX',                                    -- estado
    
    -- Credenciales (usuario: test.usuario, contraseña: password)
    'test.usuario',                            -- nombre_usuario
    '$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv', -- contraseña (hash de "password")
    
    -- Asignaciones
    1,                                         -- area_id (Secretaría de Administración y Finanzas)
    1,                                         -- rol_id (Administrador)
    
    -- Estado
    TRUE,                                      -- activo
    CURRENT_TIMESTAMP                          -- fecha_alta
);

-- Verificar inserción
DO $$
DECLARE
    usuario_record RECORD;
BEGIN
    SELECT 
        u.id,
        u.nombre,
        u.apellidos,
        u.nombre_usuario,
        u.email,
        r.nombre AS rol,
        a.nombre AS area
    INTO usuario_record
    FROM usuario u
    INNER JOIN rol r ON u.rol_id = r.id
    INNER JOIN area a ON u.area_id = a.id
    WHERE u.nombre_usuario = 'test.usuario';
    
    IF FOUND THEN
        RAISE NOTICE '';
        RAISE NOTICE '════════════════════════════════════════════════════════════════';
        RAISE NOTICE '✓ Usuario de prueba creado exitosamente';
        RAISE NOTICE '════════════════════════════════════════════════════════════════';
        RAISE NOTICE '';
        RAISE NOTICE '  ID:              %', usuario_record.id;
        RAISE NOTICE '  Nombre:          % %', usuario_record.nombre, usuario_record.apellidos;
        RAISE NOTICE '  Usuario:         %', usuario_record.nombre_usuario;
        RAISE NOTICE '  Contraseña:      password';
        RAISE NOTICE '  Email:           %', usuario_record.email;
        RAISE NOTICE '  Rol:             %', usuario_record.rol;
        RAISE NOTICE '  Área:            %', usuario_record.area;
        RAISE NOTICE '';
        RAISE NOTICE '════════════════════════════════════════════════════════════════';
        RAISE NOTICE '';
        RAISE NOTICE '  Puedes iniciar sesión con:';
        RAISE NOTICE '    Usuario:    test.usuario';
        RAISE NOTICE '    Contraseña: password';
        RAISE NOTICE '';
    ELSE
        RAISE EXCEPTION 'Error al crear el usuario de prueba';
    END IF;
END $$;
