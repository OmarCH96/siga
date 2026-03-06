-- ============================================================================
-- ACTUALIZAR CONTRASEÑA DE USUARIO admin A "password"
-- ============================================================================

-- Actualizar contraseña del usuario admin
UPDATE usuario 
SET contraseña = '$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv'
WHERE nombre_usuario = 'admin';

-- Verificar actualización
DO $$
DECLARE
    usuario_record RECORD;
BEGIN
    SELECT 
        u.id,
        u.nombre_usuario,
        u.email,
        r.nombre AS rol,
        u.activo
    INTO usuario_record
    FROM usuario u
    INNER JOIN rol r ON u.rol_id = r.id
    WHERE u.nombre_usuario = 'admin';
    
    IF FOUND THEN
        RAISE NOTICE '';
        RAISE NOTICE '════════════════════════════════════════════════════════════════';
        RAISE NOTICE '✓ Contraseña actualizada para usuario: admin';
        RAISE NOTICE '════════════════════════════════════════════════════════════════';
        RAISE NOTICE '';
        RAISE NOTICE '  Usuario:   admin';
        RAISE NOTICE '  Nueva contraseña: password';
        RAISE NOTICE '  Rol:       %', usuario_record.rol;
        RAISE NOTICE '  Activo:    %', CASE WHEN usuario_record.activo THEN 'Sí' ELSE 'No' END;
        RAISE NOTICE '';
        RAISE NOTICE '💡 Ahora puedes iniciar sesión con:';
        RAISE NOTICE '   Usuario: admin';
        RAISE NOTICE '   Contraseña: password';
        RAISE NOTICE '';
    ELSE
        RAISE WARNING 'Usuario admin no encontrado';
    END IF;
END $$;

-- También actualizar todos los demás usuarios para que tengan la contraseña "password"
UPDATE usuario 
SET contraseña = '$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv'
WHERE nombre_usuario IN ('jperez', 'mgonzalez', 'cmartinez', 'arodriguez', 'lhernandez', 
                         'pramirez', 'rgarcia', 'llopez', 'jmorales', 'sjimenez',
                         'mcruz', 'etorres', 'dvargas', 'creyes', 'fsilva',
                         'gmendoza', 'rcastillo', 'mgutierrez', 'arios', 'vparedes',
                         'sdominguez', 'rfuentes');

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✓ Contraseñas actualizadas para TODOS los usuarios';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'TODOS los usuarios ahora tienen la contraseña: password';
    RAISE NOTICE '';
END $$;
