-- ============================================================================
-- CREAR USUARIO TEST CON CREDENCIALES SIMPLES
-- Usuario: test | Contraseña: test
-- ============================================================================
-- Ejecutar: psql -U postgres -d gestor_db -f scripts/crear-usuario-test.sql
-- ============================================================================

-- Eliminar usuario si existe
DELETE FROM usuario WHERE nombre_usuario = 'test';

-- Insertar usuario TEST
-- Contraseña: "test" (hasheada con bcrypt)
INSERT INTO usuario (
    nombre,
    apellidos,
    email,
    nombre_usuario,
    contraseña,
    area_id,
    rol_id,
    activo,
    fecha_alta
) VALUES (
    'Usuario',
    'Test',
    'test@test.com',
    'test',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- Hash de "test"
    1,
    1,
    TRUE,
    CURRENT_TIMESTAMP
);

-- Verificar creación
DO $$
DECLARE
    usuario_record RECORD;
BEGIN
    SELECT 
        u.id,
        u.nombre_usuario,
        u.email,
        r.nombre AS rol,
        a.nombre AS area
    INTO usuario_record
    FROM usuario u
    INNER JOIN rol r ON u.rol_id = r.id
    INNER JOIN area a ON u.area_id = a.id
    WHERE u.nombre_usuario = 'test';
    
    IF FOUND THEN
        RAISE NOTICE '';
        RAISE NOTICE '════════════════════════════════════════════════════════════════';
        RAISE NOTICE '✓ Usuario TEST creado exitosamente';
        RAISE NOTICE '════════════════════════════════════════════════════════════════';
        RAISE NOTICE '';
        RAISE NOTICE '  ID:        %', usuario_record.id;
        RAISE NOTICE '  Usuario:   %', usuario_record.nombre_usuario;
        RAISE NOTICE '  Email:     %', usuario_record.email;
        RAISE NOTICE '  Rol:       %', usuario_record.rol;
        RAISE NOTICE '  Área:      %', usuario_record.area;
        RAISE NOTICE '';
        RAISE NOTICE '═══════════════════════════════════════════════════════════════';
        RAISE NOTICE 'CREDENCIALES DE ACCESO:';
        RAISE NOTICE '═══════════════════════════════════════════════════════════════';
        RAISE NOTICE '';
        RAISE NOTICE '  👤 Usuario:    test';
        RAISE NOTICE '  🔐 Contraseña: test';
        RAISE NOTICE '';
        RAISE NOTICE '💡 Escribe EXACTAMENTE: test (sin espacios, sin mayúsculas)';
        RAISE NOTICE '';
    ELSE
        RAISE EXCEPTION 'Error al crear el usuario TEST';
    END IF;
END $$;
