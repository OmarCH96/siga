-- Migration: eliminar validacion anti-acaparamiento de prestamos
-- Fecha: 2026-04-22
-- Razon: el bloqueo de solicitudes simultaneas (SOLICITADO o APROBADO) genera un
--        cuello de botella operativo. Se permite ahora N solicitudes activas para
--        la misma combinacion de areas. La validacion de combinacion legitima
--        (fn_puede_solicitar_prestamo) se conserva intacta.

-- ============================================================
-- 1. sp_solicitar_prestamo_con_reserva (variante sin p_contexto)
--    Contexto del documento queda fijo como 'OFICIO'
-- ============================================================

CREATE OR REPLACE FUNCTION public.sp_solicitar_prestamo_con_reserva(
    p_area_solicitante_id   integer,
    p_area_prestamista_id   integer,
    p_usuario_solicita_id   integer,
    p_motivacion            text,
    p_tipo_documento_id     integer,
    p_asunto                character varying,
    p_contenido             text                        DEFAULT NULL::text,
    p_fecha_limite          timestamp without time zone DEFAULT NULL::timestamp without time zone,
    p_prioridad             public.prioridad_enum       DEFAULT 'MEDIA'::public.prioridad_enum,
    p_instrucciones         text                        DEFAULT NULL::text,
    p_observaciones         text                        DEFAULT NULL::text,
    OUT p_prestamo_id       integer,
    OUT p_documento_id      integer,
    OUT p_nodo_id           integer,
    OUT p_folio_reservado   character varying
) RETURNS record
LANGUAGE plpgsql
AS $$
DECLARE
    v_error          TEXT;
    v_folio_generado VARCHAR(80);
BEGIN
    -- 1. Validar la combinacion solicitante / prestamista
    v_error := public.fn_puede_solicitar_prestamo(p_area_solicitante_id, p_area_prestamista_id);
    IF v_error IS NOT NULL THEN
        RAISE EXCEPTION '%', v_error;
    END IF;

    -- 2. [Validacion anti-acaparamiento eliminada - permite multiples solicitudes activas]

    -- 3. Consumir consecutivo y generar folio del area PRESTAMISTA
    -- Se usa fn_generar_folio SIN tipo_documento_id para compartir el mismo
    -- contador 'EMISION' que sp_resolver_prestamo_numero. Ambos SPs producen
    -- folios EM-{area}-####/anio; compartir el contador evita colisiones.
    v_folio_generado := public.fn_generar_folio(
        p_area_prestamista_id,
        'EMISION',
        EXTRACT(YEAR FROM CURRENT_DATE)::SMALLINT
    );

    IF v_folio_generado IS NULL THEN
        RAISE EXCEPTION 'Error al generar folio para el area prestamista %.', p_area_prestamista_id;
    END IF;

    -- 4. Crear la solicitud de prestamo con folio ya reservado
    INSERT INTO public.prestamo_numero_oficio (
        area_solicitante_id,
        area_prestamista_id,
        usuario_solicita_id,
        estado,
        motivacion,
        folio_asignado
    )
    VALUES (
        p_area_solicitante_id,
        p_area_prestamista_id,
        p_usuario_solicita_id,
        'SOLICITADO',
        p_motivacion,
        v_folio_generado
    )
    RETURNING id INTO p_prestamo_id;

    -- 5. Crear el documento en estado PENDIENTE_PRESTAMO
    INSERT INTO public.documento (
        folio,
        tipo_documento_id,
        asunto,
        contenido,
        fecha_limite,
        prioridad,
        estado,
        usuario_creador_id,
        area_origen_id,
        observaciones,
        contexto,
        prestamo_numero_id
    )
    VALUES (
        v_folio_generado,
        p_tipo_documento_id,
        p_asunto,
        p_contenido,
        p_fecha_limite,
        p_prioridad,
        'PENDIENTE_PRESTAMO',
        p_usuario_solicita_id,
        p_area_solicitante_id,
        p_observaciones,
        'OFICIO',
        p_prestamo_id
    )
    RETURNING id INTO p_documento_id;

    -- Vincular documento al prestamo
    UPDATE public.prestamo_numero_oficio
    SET documento_id = p_documento_id
    WHERE id = p_prestamo_id;

    -- 6. Crear nodo de EMISION (activo, pero bloqueado por estado)
    INSERT INTO public.nodo_documental (
        documento_id,
        tipo_nodo,
        estado,
        nodo_padre_id,
        folio_original,
        folio_padre,
        folio_propio,
        area_id,
        usuario_responsable_id,
        instrucciones,
        observaciones,
        es_nodo_activo
    )
    VALUES (
        p_documento_id,
        'EMISION',
        'ACTIVO',
        NULL,
        v_folio_generado,
        NULL,
        v_folio_generado,
        p_area_solicitante_id,
        p_usuario_solicita_id,
        p_instrucciones,
        'Documento creado con reserva de folio. Pendiente de aprobacion del prestamo.',
        TRUE
    )
    RETURNING id INTO p_nodo_id;

    -- 7. Historial + auditoria
    INSERT INTO public.historial_documento (
        documento_id,
        accion,
        descripcion,
        usuario_id,
        area_id
    )
    VALUES (
        p_documento_id,
        'RESERVA_FOLIO',
        FORMAT(
            'Folio %s reservado via prestamo %s. Pendiente de aprobacion del area %s.',
            v_folio_generado,
            p_prestamo_id,
            (SELECT nombre FROM public.area WHERE id = p_area_prestamista_id)
        ),
        p_usuario_solicita_id,
        p_area_solicitante_id
    );

    INSERT INTO public.auditoria_sistema (
        accion,
        descripcion,
        usuario_id,
        area_id,
        detalles
    )
    VALUES (
        'PRESTAMO_CON_RESERVA',
        FORMAT(
            'Prestamo %s con folio reservado %s. Solicitante: area %s -> Prestamista: area %s',
            p_prestamo_id,
            v_folio_generado,
            p_area_solicitante_id,
            p_area_prestamista_id
        ),
        p_usuario_solicita_id,
        p_area_prestamista_id,
        p_motivacion
    );

    -- 8. Salida
    p_folio_reservado := v_folio_generado;

    RAISE NOTICE 'Prestamo % creado con folio reservado %. Documento % en PENDIENTE_PRESTAMO.',
        p_prestamo_id,
        v_folio_generado,
        p_documento_id;
END;
$$;

ALTER FUNCTION public.sp_solicitar_prestamo_con_reserva(
    integer,
    integer,
    integer,
    text,
    integer,
    character varying,
    text,
    timestamp without time zone,
    public.prioridad_enum,
    text,
    text,
    OUT integer,
    OUT integer,
    OUT integer,
    OUT character varying
) OWNER TO postgres;

COMMENT ON FUNCTION public.sp_solicitar_prestamo_con_reserva(
    integer,
    integer,
    integer,
    text,
    integer,
    character varying,
    text,
    timestamp without time zone,
    public.prioridad_enum,
    text,
    text,
    OUT integer,
    OUT integer,
    OUT integer,
    OUT character varying
) IS 'Solicita un prestamo de numero y reserva el folio consecutivo de forma inmediata. Crea el documento en estado PENDIENTE_PRESTAMO. Sin validacion de prestamos activos previos.';


-- ============================================================
-- 2. sp_solicitar_prestamo_con_reserva (variante con p_contexto)
--    Permite definir el contexto administrativo del documento
-- ============================================================

CREATE OR REPLACE FUNCTION public.sp_solicitar_prestamo_con_reserva(
    p_area_solicitante_id   integer,
    p_area_prestamista_id   integer,
    p_usuario_solicita_id   integer,
    p_motivacion            text,
    p_tipo_documento_id     integer,
    p_asunto                character varying,
    p_contenido             text                              DEFAULT NULL::text,
    p_fecha_limite          timestamp without time zone       DEFAULT NULL::timestamp without time zone,
    p_prioridad             public.prioridad_enum             DEFAULT 'MEDIA'::public.prioridad_enum,
    p_instrucciones         text                              DEFAULT NULL::text,
    p_observaciones         text                              DEFAULT NULL::text,
    p_contexto              public.contexto_documento_enum    DEFAULT 'OTRO'::public.contexto_documento_enum,
    OUT p_prestamo_id       integer,
    OUT p_documento_id      integer,
    OUT p_nodo_id           integer,
    OUT p_folio_reservado   character varying
) RETURNS record
LANGUAGE plpgsql
AS $$
DECLARE
    v_error          TEXT;
    v_folio_generado VARCHAR(80);
BEGIN
    -- 1. Validar la combinacion solicitante / prestamista
    v_error := public.fn_puede_solicitar_prestamo(p_area_solicitante_id, p_area_prestamista_id);
    IF v_error IS NOT NULL THEN
        RAISE EXCEPTION '%', v_error;
    END IF;

    -- 2. [Validacion anti-acaparamiento eliminada - permite multiples solicitudes activas]

    -- 3. Consumir consecutivo y generar folio del area PRESTAMISTA
    -- Se usa fn_generar_folio SIN tipo_documento_id para compartir el mismo
    -- contador 'EMISION' que sp_resolver_prestamo_numero. Ambos SPs producen
    -- folios EM-{area}-####/anio; compartir el contador evita colisiones.
    v_folio_generado := public.fn_generar_folio(
        p_area_prestamista_id,
        'EMISION',
        EXTRACT(YEAR FROM CURRENT_DATE)::SMALLINT
    );

    IF v_folio_generado IS NULL THEN
        RAISE EXCEPTION 'Error al generar folio para el area prestamista %.', p_area_prestamista_id;
    END IF;

    -- 4. Crear la solicitud de prestamo con folio ya reservado
    INSERT INTO public.prestamo_numero_oficio (
        area_solicitante_id,
        area_prestamista_id,
        usuario_solicita_id,
        estado,
        motivacion,
        folio_asignado
    )
    VALUES (
        p_area_solicitante_id,
        p_area_prestamista_id,
        p_usuario_solicita_id,
        'SOLICITADO',
        p_motivacion,
        v_folio_generado
    )
    RETURNING id INTO p_prestamo_id;

    -- 5. Crear el documento en estado PENDIENTE_PRESTAMO
    INSERT INTO public.documento (
        folio,
        tipo_documento_id,
        asunto,
        contenido,
        fecha_limite,
        prioridad,
        estado,
        usuario_creador_id,
        area_origen_id,
        observaciones,
        contexto,
        prestamo_numero_id
    )
    VALUES (
        v_folio_generado,
        p_tipo_documento_id,
        p_asunto,
        p_contenido,
        p_fecha_limite,
        p_prioridad,
        'PENDIENTE_PRESTAMO',
        p_usuario_solicita_id,
        p_area_solicitante_id,
        p_observaciones,
        p_contexto,
        p_prestamo_id
    )
    RETURNING id INTO p_documento_id;

    -- Vincular documento al prestamo
    UPDATE public.prestamo_numero_oficio
    SET documento_id = p_documento_id
    WHERE id = p_prestamo_id;

    -- 6. Crear nodo de EMISION (activo, pero bloqueado por estado)
    INSERT INTO public.nodo_documental (
        documento_id,
        tipo_nodo,
        estado,
        nodo_padre_id,
        folio_original,
        folio_padre,
        folio_propio,
        area_id,
        usuario_responsable_id,
        instrucciones,
        observaciones,
        es_nodo_activo
    )
    VALUES (
        p_documento_id,
        'EMISION',
        'ACTIVO',
        NULL,
        v_folio_generado,
        NULL,
        v_folio_generado,
        p_area_solicitante_id,
        p_usuario_solicita_id,
        p_instrucciones,
        'Documento creado con reserva de folio. Pendiente de aprobacion del prestamo.',
        TRUE
    )
    RETURNING id INTO p_nodo_id;

    -- 7. Historial + auditoria
    INSERT INTO public.historial_documento (
        documento_id,
        accion,
        descripcion,
        usuario_id,
        area_id
    )
    VALUES (
        p_documento_id,
        'RESERVA_FOLIO',
        FORMAT(
            'Folio %s reservado via prestamo %s. Pendiente de aprobacion del area %s.',
            v_folio_generado,
            p_prestamo_id,
            (SELECT nombre FROM public.area WHERE id = p_area_prestamista_id)
        ),
        p_usuario_solicita_id,
        p_area_solicitante_id
    );

    INSERT INTO public.auditoria_sistema (
        accion,
        descripcion,
        usuario_id,
        area_id,
        detalles
    )
    VALUES (
        'PRESTAMO_CON_RESERVA',
        FORMAT(
            'Prestamo %s con folio reservado %s. Solicitante: area %s -> Prestamista: area %s',
            p_prestamo_id,
            v_folio_generado,
            p_area_solicitante_id,
            p_area_prestamista_id
        ),
        p_usuario_solicita_id,
        p_area_prestamista_id,
        p_motivacion
    );

    -- 8. Salida
    p_folio_reservado := v_folio_generado;

    RAISE NOTICE 'Prestamo % creado con folio reservado %. Documento % en PENDIENTE_PRESTAMO.',
        p_prestamo_id,
        v_folio_generado,
        p_documento_id;
END;
$$;

ALTER FUNCTION public.sp_solicitar_prestamo_con_reserva(
    integer,
    integer,
    integer,
    text,
    integer,
    character varying,
    text,
    timestamp without time zone,
    public.prioridad_enum,
    text,
    text,
    public.contexto_documento_enum,
    OUT integer,
    OUT integer,
    OUT integer,
    OUT character varying
) OWNER TO postgres;

COMMENT ON FUNCTION public.sp_solicitar_prestamo_con_reserva(
    integer,
    integer,
    integer,
    text,
    integer,
    character varying,
    text,
    timestamp without time zone,
    public.prioridad_enum,
    text,
    text,
    public.contexto_documento_enum,
    OUT integer,
    OUT integer,
    OUT integer,
    OUT character varying
) IS 'Solicita un prestamo de numero y reserva el folio consecutivo de forma inmediata. Crea el documento en estado PENDIENTE_PRESTAMO. p_contexto permite definir el contexto administrativo real del documento. Sin validacion de prestamos activos previos.';


-- ============================================================
-- 3. sp_solicitar_prestamo_numero
--    Solicitud de prestamo sin reserva inmediata de folio
-- ============================================================

CREATE OR REPLACE FUNCTION public.sp_solicitar_prestamo_numero(
    p_area_solicitante_id integer,
    p_area_prestamista_id integer,
    p_usuario_solicita_id integer,
    p_motivacion          text,
    OUT p_prestamo_id     integer
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_error TEXT;
BEGIN
    -- 1. Validar la combinacion solicitante/prestamista
    v_error := public.fn_puede_solicitar_prestamo(p_area_solicitante_id, p_area_prestamista_id);
    IF v_error IS NOT NULL THEN
        RAISE EXCEPTION '%', v_error;
    END IF;

    -- 2. [Validacion anti-acaparamiento eliminada - permite multiples solicitudes activas]

    -- 3. Crear la solicitud
    INSERT INTO public.prestamo_numero_oficio (
        area_solicitante_id,
        area_prestamista_id,
        usuario_solicita_id,
        estado,
        motivacion
    )
    VALUES (
        p_area_solicitante_id,
        p_area_prestamista_id,
        p_usuario_solicita_id,
        'SOLICITADO',
        p_motivacion
    )
    RETURNING id INTO p_prestamo_id;

    -- 4. Auditoria
    INSERT INTO public.auditoria_sistema (
        accion,
        descripcion,
        usuario_id,
        area_id,
        detalles
    )
    VALUES (
        'PRESTAMO_SOLICITADO',
        FORMAT(
            'Solicitud de prestamo de numero. Solicitante: area %s -> Prestamista: area %s',
            p_area_solicitante_id,
            p_area_prestamista_id
        ),
        p_usuario_solicita_id,
        p_area_prestamista_id,
        p_motivacion
    );

    RAISE NOTICE 'Prestamo % creado. Area prestamista % debe aprobar.',
        p_prestamo_id,
        p_area_prestamista_id;
END;
$$;

ALTER FUNCTION public.sp_solicitar_prestamo_numero(
    integer,
    integer,
    integer,
    text,
    OUT integer
) OWNER TO postgres;

COMMENT ON FUNCTION public.sp_solicitar_prestamo_numero(
    integer,
    integer,
    integer,
    text,
    OUT integer
) IS 'Crea una solicitud de prestamo de numero de oficio en estado SOLICITADO. Valida que la combinacion sea legitima (fn_puede_solicitar_prestamo). Sin validacion de prestamos activos previos. El admin del area prestamista debe resolver con sp_resolver_prestamo_numero.';
