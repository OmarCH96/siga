-- ============================================================================
-- MIGRACIÓN: Crear tabla de auditoría del sistema
-- Para eventos de login, logout y otras acciones no relacionadas con documentos
-- ============================================================================
-- Ejecutar: psql -U postgres -d gestor_db -f scripts/migration-auditoria-sistema.sql
-- ============================================================================

-- Crear tabla de auditoría del sistema
CREATE TABLE IF NOT EXISTS auditoria_sistema (
    id SERIAL PRIMARY KEY,
    accion VARCHAR(100) NOT NULL,
    descripcion VARCHAR(1000),
    usuario_id INTEGER,
    area_id INTEGER,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    detalles TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    
    CONSTRAINT fk_auditoria_sistema_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    CONSTRAINT fk_auditoria_sistema_area FOREIGN KEY (area_id) REFERENCES area(id)
);

-- Índices para optimizar consultas
CREATE INDEX idx_auditoria_sistema_fecha ON auditoria_sistema(fecha DESC);
CREATE INDEX idx_auditoria_sistema_accion ON auditoria_sistema(accion);
CREATE INDEX idx_auditoria_sistema_usuario ON auditoria_sistema(usuario_id);
CREATE INDEX idx_auditoria_sistema_ip ON auditoria_sistema(ip_address);

-- Comentarios
COMMENT ON TABLE auditoria_sistema IS 'Auditoría de eventos del sistema (login, logout, configuración, etc.)';
COMMENT ON COLUMN auditoria_sistema.accion IS 'Tipo de acción realizada (LOGIN_EXITOSO, LOGIN_FALLIDO, LOGOUT, etc.)';
COMMENT ON COLUMN auditoria_sistema.ip_address IS 'Dirección IP desde donde se realizó la acción';
COMMENT ON COLUMN auditoria_sistema.user_agent IS 'Navegador o cliente que realizó la acción';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✓ Tabla auditoria_sistema creada exitosamente';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Esta tabla registrará eventos del sistema como:';
    RAISE NOTICE '  • LOGIN_EXITOSO / LOGIN_FALLIDO';
    RAISE NOTICE '  • LOGOUT';
    RAISE NOTICE '  • CAMBIO_CONTRASEÑA';
    RAISE NOTICE '  • CREACION_USUARIO / MODIFICACION_USUARIO';
    RAISE NOTICE '  • CONFIGURACION_SISTEMA';
    RAISE NOTICE '';
END $$;
