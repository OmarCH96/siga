-- ============================================================
-- Migration 011: Resync consecutivo_area desde datos reales
-- Fecha: 2026-04-22
-- Razon: El contador en consecutivo_area puede desincronizarse del
--        numero de folios realmente existentes en documento o
--        prestamo_numero_oficio (restauracion parcial, data de prueba,
--        o dos rutas de codigo generando folios con el mismo prefijo
--        pero contadores distintos). Esto produce el error:
--        "duplicate key value violates unique constraint documento_folio_key"
--
-- Efecto: Garantiza que ultimo_consecutivo >= MAX folio emitido real.
--         Es idempotente y seguro: usa GREATEST() para nunca decrementar.
-- ============================================================

-- ============================================================
-- PASO 1: Resync desde documento.folio
-- El prefijo del folio (antes del primer '-') = tipo_operacion del contador.
-- Ejemplo: 'EM-SMADSOT.DPG-0008/2026' → tipo_op='EM', area='SMADSOT.DPG',
--          consecutivo=8, anio=2026
-- ============================================================
WITH folios_documentos AS (
    SELECT
        SPLIT_PART(d.folio, '-', 1)                                          AS tipo_operacion,
        SPLIT_PART(d.folio, '-', 2)                                          AS area_clave,
        CAST(SPLIT_PART(SPLIT_PART(d.folio, '-', 3), '/', 1) AS INTEGER)     AS consecutivo,
        CAST(SPLIT_PART(d.folio, '/', 2) AS SMALLINT)                        AS anio
    FROM documento d
    WHERE d.folio IS NOT NULL
        AND d.folio NOT LIKE '%-RESERVA/%'
        AND d.folio ~ '^[A-Z]{2,10}-[A-Z][A-Z0-9.]*-\d+/\d{4}$'
),
maximos AS (
    SELECT
        a.id        AS area_id,
        f.tipo_operacion,
        f.anio,
        MAX(f.consecutivo) AS max_consecutivo
    FROM folios_documentos f
    JOIN area a ON a.clave = f.area_clave
    WHERE f.tipo_operacion ~ '^[A-Z]{2,10}$'
    GROUP BY a.id, f.tipo_operacion, f.anio
)
INSERT INTO consecutivo_area (area_id, tipo_operacion, anio, ultimo_consecutivo)
SELECT area_id, tipo_operacion, anio, max_consecutivo
FROM maximos
ON CONFLICT (area_id, tipo_operacion, anio)
DO UPDATE SET
    ultimo_consecutivo  = GREATEST(consecutivo_area.ultimo_consecutivo, EXCLUDED.ultimo_consecutivo),
    fecha_actualizacion = CURRENT_TIMESTAMP;

-- ============================================================
-- PASO 2: Resync contador 'EMISION' desde prestamo_numero_oficio.folio_asignado
-- sp_resolver_prestamo llama fn_generar_folio(area, 'EMISION') sin
-- tipo_documento_id → usa fn_siguiente_consecutivo(area, 'EMISION', anio).
-- Los folios resultantes van a prestamo_numero_oficio.folio_asignado
-- y pueden colisionar con documento.folio si otro camino genera el mismo numero.
-- ============================================================
WITH folios_prestamos AS (
    SELECT
        SPLIT_PART(p.folio_asignado, '-', 2)                                 AS area_clave,
        CAST(SPLIT_PART(SPLIT_PART(p.folio_asignado, '-', 3), '/', 1) AS INTEGER) AS consecutivo,
        CAST(SPLIT_PART(p.folio_asignado, '/', 2) AS SMALLINT)               AS anio
    FROM prestamo_numero_oficio p
    WHERE p.folio_asignado IS NOT NULL
        AND p.folio_asignado NOT LIKE '%-RESERVA/%'
        AND p.folio_asignado ~ '^[A-Z]{2,10}-[A-Z][A-Z0-9.]*-\d+/\d{4}$'
),
maximos AS (
    SELECT
        a.id              AS area_id,
        'EMISION'::VARCHAR AS tipo_operacion,
        f.anio,
        MAX(f.consecutivo) AS max_consecutivo
    FROM folios_prestamos f
    JOIN area a ON a.clave = f.area_clave
    GROUP BY a.id, f.anio
)
INSERT INTO consecutivo_area (area_id, tipo_operacion, anio, ultimo_consecutivo)
SELECT area_id, tipo_operacion, anio, max_consecutivo
FROM maximos
ON CONFLICT (area_id, tipo_operacion, anio)
DO UPDATE SET
    ultimo_consecutivo  = GREATEST(consecutivo_area.ultimo_consecutivo, EXCLUDED.ultimo_consecutivo),
    fecha_actualizacion = CURRENT_TIMESTAMP;

-- ============================================================
-- DIAGNOSTICO POST-RESYNC (opcional, comentar en prod):
-- Muestra el estado final de los contadores actualizados.
-- ============================================================
-- SELECT ca.area_id, a.clave AS area_clave, ca.tipo_operacion, ca.anio, ca.ultimo_consecutivo
-- FROM consecutivo_area ca
-- JOIN area a ON a.id = ca.area_id
-- ORDER BY ca.anio DESC, ca.tipo_operacion, a.clave;
