--
-- PostgreSQL database dump
--

-- Dumped from database version 12.20
-- Dumped by pg_dump version 16.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: estado_documento_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_documento_enum AS ENUM (
    'REGISTRADO',
    'TURNADO',
    'RECIBIDO',
    'EN_PROCESO',
    'RESPONDIDO',
    'DEVUELTO',
    'CANCELADO',
    'CERRADO'
);


ALTER TYPE public.estado_documento_enum OWNER TO postgres;

--
-- Name: prioridad_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.prioridad_enum AS ENUM (
    'BAJA',
    'MEDIA',
    'ALTA',
    'URGENTE'
);


ALTER TYPE public.prioridad_enum OWNER TO postgres;

--
-- Name: tipo_area_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_area_enum AS ENUM (
    'SECRETARIA',
    'SUBSECRETARIA',
    'DIRECCION',
    'SUBDIRECCION',
    'COORDINACION',
    'DEPARTAMENTO'
);


ALTER TYPE public.tipo_area_enum OWNER TO postgres;

--
-- Name: tipo_relacion_archivo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_relacion_archivo_enum AS ENUM (
    'ADJUNTO',
    'RESPALDO',
    'EVIDENCIA',
    'RESPUESTA',
    'OTRO'
);


ALTER TYPE public.tipo_relacion_archivo_enum OWNER TO postgres;

--
-- Name: fn_obtener_ruta_area(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_obtener_ruta_area(p_area_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_ruta TEXT := '';
    v_nombre_area VARCHAR(200);
    v_area_padre_id INTEGER;
BEGIN
    SELECT nombre, area_padre_id INTO v_nombre_area, v_area_padre_id
    FROM area WHERE id = p_area_id;
    
    v_ruta := v_nombre_area;
    
    WHILE v_area_padre_id IS NOT NULL LOOP
        SELECT nombre, area_padre_id INTO v_nombre_area, v_area_padre_id
        FROM area WHERE id = v_area_padre_id;
        
        v_ruta := v_nombre_area || ' > ' || v_ruta;
    END LOOP;
    
    RETURN v_ruta;
END;
$$;


ALTER FUNCTION public.fn_obtener_ruta_area(p_area_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_obtener_ruta_area(p_area_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_obtener_ruta_area(p_area_id integer) IS 'Obtiene la ruta jerárquica completa de un área';


--
-- Name: sp_cancelar_documento(integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_cancelar_documento(p_documento_id integer, p_usuario_cancela_id integer, p_motivo_cancelacion character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_area_id INTEGER;
BEGIN
    SELECT area_origen_id INTO v_area_id FROM documento WHERE id = p_documento_id;
    
    -- Desactivar turnos activos
    UPDATE turno_documento
    SET activo = FALSE
    WHERE documento_id = p_documento_id AND activo = TRUE;
    
    -- Actualizar estado del documento
    UPDATE documento
    SET estado = 'CANCELADO', fecha_modificacion = CURRENT_TIMESTAMP, observaciones = p_motivo_cancelacion
    WHERE id = p_documento_id;
    
    -- Registrar en historial
    INSERT INTO historial_documento (documento_id, accion, descripcion, usuario_id, area_id, detalles)
    VALUES (p_documento_id, 'CANCELADO', 'Documento cancelado', p_usuario_cancela_id, v_area_id, p_motivo_cancelacion);
    
    RAISE NOTICE 'Documento % cancelado', p_documento_id;
END;
$$;


ALTER FUNCTION public.sp_cancelar_documento(p_documento_id integer, p_usuario_cancela_id integer, p_motivo_cancelacion character varying) OWNER TO postgres;

--
-- Name: FUNCTION sp_cancelar_documento(p_documento_id integer, p_usuario_cancela_id integer, p_motivo_cancelacion character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_cancelar_documento(p_documento_id integer, p_usuario_cancela_id integer, p_motivo_cancelacion character varying) IS 'Cancela un documento con motivo especificado';


--
-- Name: sp_devolver_documento(integer, integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_devolver_documento(p_documento_id integer, p_area_destino_id integer, p_usuario_devuelve_id integer, p_motivo_devolucion character varying, OUT p_turno_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_area_actual_id INTEGER;
BEGIN
    -- Obtener área actual del documento
    SELECT area_destino_id INTO v_area_actual_id
    FROM turno_documento
    WHERE documento_id = p_documento_id AND activo = TRUE
    LIMIT 1;
    
    -- Desactivar turno actual
    UPDATE turno_documento
    SET activo = FALSE
    WHERE documento_id = p_documento_id AND activo = TRUE;
    
    -- Crear turno de devolución
    INSERT INTO turno_documento (
        documento_id, area_origen_id, area_destino_id, usuario_turna_id, observaciones
    )
    VALUES (
        p_documento_id, v_area_actual_id, p_area_destino_id, p_usuario_devuelve_id, 'DEVOLUCIÓN: ' || p_motivo_devolucion
    )
    RETURNING id INTO p_turno_id;
    
    -- Actualizar estado del documento
    UPDATE documento
    SET estado = 'DEVUELTO', fecha_modificacion = CURRENT_TIMESTAMP
    WHERE id = p_documento_id;
    
    -- Registrar en historial
    INSERT INTO historial_documento (documento_id, accion, descripcion, usuario_id, area_id, detalles)
    VALUES (
        p_documento_id, 
        'DEVUELTO', 
        'Documento devuelto',
        p_usuario_devuelve_id,
        v_area_actual_id,
        p_motivo_devolucion
    );
    
    RAISE NOTICE 'Documento devuelto con ID de turno: %', p_turno_id;
END;
$$;


ALTER FUNCTION public.sp_devolver_documento(p_documento_id integer, p_area_destino_id integer, p_usuario_devuelve_id integer, p_motivo_devolucion character varying, OUT p_turno_id integer) OWNER TO postgres;

--
-- Name: FUNCTION sp_devolver_documento(p_documento_id integer, p_area_destino_id integer, p_usuario_devuelve_id integer, p_motivo_devolucion character varying, OUT p_turno_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_devolver_documento(p_documento_id integer, p_area_destino_id integer, p_usuario_devuelve_id integer, p_motivo_devolucion character varying, OUT p_turno_id integer) IS 'Devuelve un documento con motivo especificado';


--
-- Name: sp_recibir_documento(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_recibir_documento(p_turno_id integer, p_usuario_recibe_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_documento_id INTEGER;
    v_area_destino_id INTEGER;
BEGIN
    -- Obtener información del turno
    SELECT documento_id, area_destino_id INTO v_documento_id, v_area_destino_id
    FROM turno_documento
    WHERE id = p_turno_id;
    
    -- Marcar turno como recibido
    UPDATE turno_documento
    SET recibido = TRUE, fecha_recepcion = CURRENT_TIMESTAMP
    WHERE id = p_turno_id;
    
    -- Actualizar estado del documento
    UPDATE documento
    SET estado = 'RECIBIDO', fecha_modificacion = CURRENT_TIMESTAMP
    WHERE id = v_documento_id;
    
    -- Registrar en historial
    INSERT INTO historial_documento (documento_id, accion, descripcion, usuario_id, area_id)
    VALUES (v_documento_id, 'RECIBIDO', 'Documento recibido por área destino', p_usuario_recibe_id, v_area_destino_id);
    
    RAISE NOTICE 'Documento % recibido', v_documento_id;
END;
$$;


ALTER FUNCTION public.sp_recibir_documento(p_turno_id integer, p_usuario_recibe_id integer) OWNER TO postgres;

--
-- Name: FUNCTION sp_recibir_documento(p_turno_id integer, p_usuario_recibe_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_recibir_documento(p_turno_id integer, p_usuario_recibe_id integer) IS 'Confirma la recepción de un documento turnado';


--
-- Name: sp_registrar_documento(character varying, integer, character varying, text, integer, integer, timestamp without time zone, public.prioridad_enum, boolean, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_registrar_documento(p_folio character varying, p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone DEFAULT NULL::timestamp without time zone, p_prioridad public.prioridad_enum DEFAULT 'MEDIA'::public.prioridad_enum, p_solo_conocimiento boolean DEFAULT false, p_observaciones text DEFAULT NULL::text, OUT p_documento_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Insertar documento
    INSERT INTO documento (
        folio, tipo_documento_id, asunto, contenido, fecha_limite,
        prioridad, usuario_creador_id, area_origen_id, solo_conocimiento, observaciones
    )
    VALUES (
        p_folio, p_tipo_documento_id, p_asunto, p_contenido, p_fecha_limite,
        p_prioridad, p_usuario_creador_id, p_area_origen_id, p_solo_conocimiento, p_observaciones
    )
    RETURNING id INTO p_documento_id;
    
    -- Registrar en historial
    INSERT INTO historial_documento (documento_id, accion, descripcion, usuario_id, area_id)
    VALUES (p_documento_id, 'CREADO', 'Documento registrado en el sistema', p_usuario_creador_id, p_area_origen_id);
    
    RAISE NOTICE 'Documento registrado con ID: %', p_documento_id;
END;
$$;


ALTER FUNCTION public.sp_registrar_documento(p_folio character varying, p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_solo_conocimiento boolean, p_observaciones text, OUT p_documento_id integer) OWNER TO postgres;

--
-- Name: FUNCTION sp_registrar_documento(p_folio character varying, p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_solo_conocimiento boolean, p_observaciones text, OUT p_documento_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_registrar_documento(p_folio character varying, p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_solo_conocimiento boolean, p_observaciones text, OUT p_documento_id integer) IS 'Registra un nuevo documento en el sistema';


--
-- Name: sp_turnar_documento(integer, integer, integer, character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_turnar_documento(p_documento_id integer, p_area_destino_id integer, p_usuario_turna_id integer, p_observaciones character varying DEFAULT NULL::character varying, p_instrucciones text DEFAULT NULL::text, OUT p_turno_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_area_origen_id INTEGER;
    v_estado_actual estado_documento_enum;
BEGIN
    -- Obtener área origen y estado actual
    SELECT area_origen_id, estado INTO v_area_origen_id, v_estado_actual
    FROM documento
    WHERE id = p_documento_id;
    
    -- Desactivar turnos anteriores activos
    UPDATE turno_documento
    SET activo = FALSE
    WHERE documento_id = p_documento_id AND activo = TRUE;
    
    -- Crear nuevo turno
    INSERT INTO turno_documento (
        documento_id, area_origen_id, area_destino_id, usuario_turna_id, observaciones, instrucciones
    )
    VALUES (
        p_documento_id, v_area_origen_id, p_area_destino_id, p_usuario_turna_id, p_observaciones, p_instrucciones
    )
    RETURNING id INTO p_turno_id;
    
    -- Actualizar estado del documento
    UPDATE documento
    SET estado = 'TURNADO', fecha_modificacion = CURRENT_TIMESTAMP
    WHERE id = p_documento_id;
    
    -- Registrar en historial
    INSERT INTO historial_documento (documento_id, accion, descripcion, usuario_id, area_id)
    VALUES (
        p_documento_id, 
        'TURNADO', 
        'Documento turnado a ' || (SELECT nombre FROM area WHERE id = p_area_destino_id),
        p_usuario_turna_id,
        p_area_destino_id
    );
    
    RAISE NOTICE 'Documento turnado con ID de turno: %', p_turno_id;
END;
$$;


ALTER FUNCTION public.sp_turnar_documento(p_documento_id integer, p_area_destino_id integer, p_usuario_turna_id integer, p_observaciones character varying, p_instrucciones text, OUT p_turno_id integer) OWNER TO postgres;

--
-- Name: FUNCTION sp_turnar_documento(p_documento_id integer, p_area_destino_id integer, p_usuario_turna_id integer, p_observaciones character varying, p_instrucciones text, OUT p_turno_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_turnar_documento(p_documento_id integer, p_area_destino_id integer, p_usuario_turna_id integer, p_observaciones character varying, p_instrucciones text, OUT p_turno_id integer) IS 'Turna un documento a otra área';


--
-- Name: trg_validar_jerarquia_area(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_validar_jerarquia_area() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_ciclo_count INTEGER;
BEGIN
    -- Validar que no se cree ciclo en la jerarquía
    IF NEW.area_padre_id IS NOT NULL THEN
        -- Verificar si el área padre contiene a esta área como ancestro
        WITH RECURSIVE jerarquia AS (
            SELECT id, area_padre_id FROM area WHERE id = NEW.area_padre_id
            UNION ALL
            SELECT a.id, a.area_padre_id FROM area a
            INNER JOIN jerarquia j ON a.id = j.area_padre_id
        )
        SELECT COUNT(*) INTO v_ciclo_count
        FROM jerarquia WHERE area_padre_id = NEW.id;
        
        IF v_ciclo_count > 0 THEN
            RAISE EXCEPTION 'No se puede crear un ciclo en la jerarquía de áreas';
        END IF;
    END IF;
    
    -- Actualizar fecha de modificación en UPDATE
    IF TG_OP = 'UPDATE' THEN
        NEW.fecha_modificacion := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_validar_jerarquia_area() OWNER TO postgres;

--
-- Name: FUNCTION trg_validar_jerarquia_area(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.trg_validar_jerarquia_area() IS 'Valida que no se creen ciclos en la jerarquía de áreas';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: archivo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.archivo (
    id integer NOT NULL,
    nombre_archivo character varying(255) NOT NULL,
    ruta_archivo character varying(500) NOT NULL,
    tipo_mime character varying(100),
    "tamaño" bigint NOT NULL,
    fecha_carga timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    usuario_carga_id integer NOT NULL,
    hash character varying(64),
    CONSTRAINT "chk_archivo_tamaño" CHECK (("tamaño" > 0))
);


ALTER TABLE public.archivo OWNER TO postgres;

--
-- Name: TABLE archivo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.archivo IS 'Archivos adjuntos del sistema';


--
-- Name: archivo_documento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.archivo_documento (
    documento_id integer NOT NULL,
    archivo_id integer NOT NULL,
    tipo_relacion public.tipo_relacion_archivo_enum DEFAULT 'ADJUNTO'::public.tipo_relacion_archivo_enum,
    fecha_asociacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.archivo_documento OWNER TO postgres;

--
-- Name: TABLE archivo_documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.archivo_documento IS 'Relación muchos a muchos entre Documentos y Archivos';


--
-- Name: archivo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.archivo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.archivo_id_seq OWNER TO postgres;

--
-- Name: archivo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.archivo_id_seq OWNED BY public.archivo.id;


--
-- Name: area; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.area (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    clave character varying(50) NOT NULL,
    tipo public.tipo_area_enum NOT NULL,
    area_padre_id integer,
    nivel integer DEFAULT 1 NOT NULL,
    activa boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion timestamp without time zone,
    descripcion character varying(1000),
    CONSTRAINT chk_area_area_padre_no_self CHECK ((area_padre_id <> id)),
    CONSTRAINT chk_area_nivel CHECK (((nivel >= 1) AND (nivel <= 10)))
);


ALTER TABLE public.area OWNER TO postgres;

--
-- Name: TABLE area; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.area IS 'Estructura jerárquica de áreas (Secretaría, Subsecretaría, etc.)';


--
-- Name: area_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.area_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.area_id_seq OWNER TO postgres;

--
-- Name: area_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.area_id_seq OWNED BY public.area.id;


--
-- Name: auditoria_sistema; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditoria_sistema (
    id integer NOT NULL,
    accion character varying(100) NOT NULL,
    descripcion character varying(1000),
    usuario_id integer,
    area_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    detalles text,
    ip_address character varying(45),
    user_agent character varying(500)
);


ALTER TABLE public.auditoria_sistema OWNER TO postgres;

--
-- Name: TABLE auditoria_sistema; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.auditoria_sistema IS 'Auditoría de eventos del sistema (login, logout, configuración, etc.)';


--
-- Name: COLUMN auditoria_sistema.accion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_sistema.accion IS 'Tipo de acción realizada (LOGIN_EXITOSO, LOGIN_FALLIDO, LOGOUT, etc.)';


--
-- Name: COLUMN auditoria_sistema.ip_address; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_sistema.ip_address IS 'Dirección IP desde donde se realizó la acción';


--
-- Name: COLUMN auditoria_sistema.user_agent; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_sistema.user_agent IS 'Navegador o cliente que realizó la acción';


--
-- Name: auditoria_sistema_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditoria_sistema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_sistema_id_seq OWNER TO postgres;

--
-- Name: auditoria_sistema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_sistema_id_seq OWNED BY public.auditoria_sistema.id;


--
-- Name: copia_conocimiento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.copia_conocimiento (
    id integer NOT NULL,
    documento_id integer NOT NULL,
    area_id integer NOT NULL,
    fecha_envio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura timestamp without time zone,
    leido boolean DEFAULT false,
    usuario_envia_id integer NOT NULL,
    CONSTRAINT chk_copia_conocimiento_fecha_lectura CHECK (((fecha_lectura IS NULL) OR (fecha_lectura >= fecha_envio)))
);


ALTER TABLE public.copia_conocimiento OWNER TO postgres;

--
-- Name: TABLE copia_conocimiento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.copia_conocimiento IS 'Copias de conocimiento enviadas a otras áreas';


--
-- Name: copia_conocimiento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.copia_conocimiento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.copia_conocimiento_id_seq OWNER TO postgres;

--
-- Name: copia_conocimiento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.copia_conocimiento_id_seq OWNED BY public.copia_conocimiento.id;


--
-- Name: documento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documento (
    id integer NOT NULL,
    folio character varying(50) NOT NULL,
    tipo_documento_id integer NOT NULL,
    asunto character varying(500) NOT NULL,
    contenido text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_limite timestamp without time zone,
    prioridad public.prioridad_enum DEFAULT 'MEDIA'::public.prioridad_enum NOT NULL,
    estado public.estado_documento_enum DEFAULT 'REGISTRADO'::public.estado_documento_enum NOT NULL,
    usuario_creador_id integer NOT NULL,
    area_origen_id integer NOT NULL,
    solo_conocimiento boolean DEFAULT false,
    fecha_modificacion timestamp without time zone,
    observaciones text,
    CONSTRAINT chk_documento_fecha_limite CHECK (((fecha_limite IS NULL) OR (fecha_limite >= fecha_creacion)))
);


ALTER TABLE public.documento OWNER TO postgres;

--
-- Name: TABLE documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.documento IS 'Registro de documentos del sistema';


--
-- Name: documento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documento_id_seq OWNER TO postgres;

--
-- Name: documento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documento_id_seq OWNED BY public.documento.id;


--
-- Name: historial_documento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_documento (
    id integer NOT NULL,
    documento_id integer NOT NULL,
    accion character varying(100) NOT NULL,
    descripcion character varying(1000),
    usuario_id integer,
    area_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    detalles text,
    ip_address character varying(45)
);


ALTER TABLE public.historial_documento OWNER TO postgres;

--
-- Name: TABLE historial_documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.historial_documento IS 'Auditoría completa de acciones sobre documentos';


--
-- Name: historial_documento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historial_documento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_documento_id_seq OWNER TO postgres;

--
-- Name: historial_documento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historial_documento_id_seq OWNED BY public.historial_documento.id;


--
-- Name: permiso_emision_documento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permiso_emision_documento (
    id integer NOT NULL,
    tipo_area public.tipo_area_enum NOT NULL,
    tipo_documento_id integer NOT NULL,
    puede_emitir boolean DEFAULT false,
    puede_recepcionar boolean DEFAULT true,
    observaciones character varying(500),
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    activo boolean DEFAULT true
);


ALTER TABLE public.permiso_emision_documento OWNER TO postgres;

--
-- Name: TABLE permiso_emision_documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.permiso_emision_documento IS 'Define quÃ© tipos de Ã¡reas pueden emitir y recepcionar cada tipo de documento';


--
-- Name: permiso_emision_documento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permiso_emision_documento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permiso_emision_documento_id_seq OWNER TO postgres;

--
-- Name: permiso_emision_documento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permiso_emision_documento_id_seq OWNED BY public.permiso_emision_documento.id;


--
-- Name: respuesta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.respuesta (
    id integer NOT NULL,
    documento_origen_id integer NOT NULL,
    folio_respuesta character varying(50) NOT NULL,
    contenido text NOT NULL,
    fecha_respuesta timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    usuario_responde_id integer NOT NULL,
    area_responde_id integer NOT NULL,
    cierra_tramite boolean DEFAULT false,
    documento_respuesta_id integer,
    observaciones character varying(1000)
);


ALTER TABLE public.respuesta OWNER TO postgres;

--
-- Name: TABLE respuesta; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.respuesta IS 'Respuestas a documentos';


--
-- Name: respuesta_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.respuesta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.respuesta_id_seq OWNER TO postgres;

--
-- Name: respuesta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.respuesta_id_seq OWNED BY public.respuesta.id;


--
-- Name: rol; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rol (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(500),
    permisos text,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion timestamp without time zone,
    CONSTRAINT chk_rol_nombre CHECK ((length(btrim((nombre)::text)) > 0))
);


ALTER TABLE public.rol OWNER TO postgres;

--
-- Name: TABLE rol; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.rol IS 'Define los roles del sistema con sus permisos';


--
-- Name: rol_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rol_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rol_id_seq OWNER TO postgres;

--
-- Name: rol_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rol_id_seq OWNED BY public.rol.id;


--
-- Name: tipo_documento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipo_documento (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    clave character varying(20) NOT NULL,
    descripcion character varying(500),
    plantilla text,
    requiere_respuesta boolean DEFAULT false,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tipo_documento_nombre CHECK ((length(btrim((nombre)::text)) > 0))
);


ALTER TABLE public.tipo_documento OWNER TO postgres;

--
-- Name: TABLE tipo_documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tipo_documento IS 'Catálogo de tipos de documentos (Oficio, Memorándum, Circular, etc.)';


--
-- Name: tipo_documento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipo_documento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipo_documento_id_seq OWNER TO postgres;

--
-- Name: tipo_documento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_documento_id_seq OWNED BY public.tipo_documento.id;


--
-- Name: turno_documento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.turno_documento (
    id integer NOT NULL,
    documento_id integer NOT NULL,
    area_origen_id integer NOT NULL,
    area_destino_id integer NOT NULL,
    usuario_turna_id integer NOT NULL,
    fecha_turno timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_recepcion timestamp without time zone,
    observaciones character varying(1000),
    recibido boolean DEFAULT false,
    activo boolean DEFAULT true,
    instrucciones text,
    CONSTRAINT chk_turno_documento_areas CHECK ((area_origen_id <> area_destino_id)),
    CONSTRAINT chk_turno_documento_fecha_recepcion CHECK (((fecha_recepcion IS NULL) OR (fecha_recepcion >= fecha_turno)))
);


ALTER TABLE public.turno_documento OWNER TO postgres;

--
-- Name: TABLE turno_documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.turno_documento IS 'Registro de turnos de documentos entre áreas';


--
-- Name: turno_documento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.turno_documento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.turno_documento_id_seq OWNER TO postgres;

--
-- Name: turno_documento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.turno_documento_id_seq OWNED BY public.turno_documento.id;


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    telefono character varying(20),
    celular character varying(20),
    curp character varying(18),
    rfc character varying(13),
    fecha_nacimiento date,
    sexo character varying(1),
    calle character varying(200),
    numero_exterior character varying(20),
    numero_interior character varying(20),
    colonia character varying(100),
    codigo_postal character varying(10),
    ciudad character varying(100),
    estado character varying(100),
    email character varying(150) NOT NULL,
    nombre_usuario character varying(50) NOT NULL,
    "contraseña" character varying(256) NOT NULL,
    fecha_alta timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_acceso timestamp without time zone,
    activo boolean DEFAULT true,
    area_id integer NOT NULL,
    rol_id integer NOT NULL,
    CONSTRAINT chk_usuario_email CHECK (((email)::text ~~ '%@%'::text)),
    CONSTRAINT chk_usuario_nombre CHECK ((length(btrim((nombre)::text)) > 0))
);


ALTER TABLE public.usuario OWNER TO postgres;

--
-- Name: TABLE usuario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.usuario IS 'Usuarios del sistema con sus credenciales y asignaciones';


--
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuario_id_seq OWNER TO postgres;

--
-- Name: usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuario_id_seq OWNED BY public.usuario.id;


--
-- Name: vw_documentos_completos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_documentos_completos AS
 SELECT d.id,
    d.folio,
    d.asunto,
    d.estado,
    d.prioridad,
    d.fecha_creacion,
    d.fecha_limite,
    d.solo_conocimiento,
    td.nombre AS tipo_documento,
    td.clave AS clave_documento,
    concat(u.nombre, ' ', u.apellidos) AS usuario_creador,
    u.email AS email_creador,
    ao.nombre AS area_origen,
    ao.clave AS clave_area_origen,
    ( SELECT count(*) AS count
           FROM public.turno_documento
          WHERE (turno_documento.documento_id = d.id)) AS numero_turnos,
    ( SELECT count(*) AS count
           FROM public.copia_conocimiento
          WHERE (copia_conocimiento.documento_id = d.id)) AS numero_copias_conocimiento,
    ( SELECT count(*) AS count
           FROM public.respuesta
          WHERE (respuesta.documento_origen_id = d.id)) AS numero_respuestas,
    ( SELECT count(*) AS count
           FROM public.archivo_documento
          WHERE (archivo_documento.documento_id = d.id)) AS numero_archivos
   FROM (((public.documento d
     JOIN public.tipo_documento td ON ((d.tipo_documento_id = td.id)))
     JOIN public.usuario u ON ((d.usuario_creador_id = u.id)))
     JOIN public.area ao ON ((d.area_origen_id = ao.id)));


ALTER VIEW public.vw_documentos_completos OWNER TO postgres;

--
-- Name: VIEW vw_documentos_completos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_documentos_completos IS 'Vista completa de documentos con información relacionada';


--
-- Name: vw_jerarquia_areas; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_jerarquia_areas AS
 WITH RECURSIVE areas_padre AS (
         SELECT area.id,
            area.nombre,
            area.clave,
            area.tipo,
            area.area_padre_id,
            area.nivel,
            area.activa,
            (area.nombre)::text AS ruta_completa,
            (area.clave)::text AS ruta_clave
           FROM public.area
          WHERE (area.area_padre_id IS NULL)
        UNION ALL
         SELECT a.id,
            a.nombre,
            a.clave,
            a.tipo,
            a.area_padre_id,
            a.nivel,
            a.activa,
            ((ap.ruta_completa || ' > '::text) || (a.nombre)::text) AS text,
            ((ap.ruta_clave || '/'::text) || (a.clave)::text) AS text
           FROM (public.area a
             JOIN areas_padre ap ON ((a.area_padre_id = ap.id)))
        )
 SELECT areas_padre.id,
    areas_padre.nombre,
    areas_padre.clave,
    areas_padre.tipo,
    areas_padre.area_padre_id,
    areas_padre.nivel,
    areas_padre.activa,
    areas_padre.ruta_completa,
    areas_padre.ruta_clave
   FROM areas_padre;


ALTER VIEW public.vw_jerarquia_areas OWNER TO postgres;

--
-- Name: VIEW vw_jerarquia_areas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_jerarquia_areas IS 'Vista de jerarquía completa de áreas con rutas';


--
-- Name: vw_turnos_pendientes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_turnos_pendientes AS
 SELECT t.id,
    t.documento_id,
    d.folio,
    d.asunto,
    d.prioridad,
    t.area_destino_id,
    ad.nombre AS area_destino,
    t.fecha_turno,
    (date_part('day'::text, (CURRENT_TIMESTAMP - (t.fecha_turno)::timestamp with time zone)))::integer AS dias_pendientes,
    t.observaciones,
    concat(u.nombre, ' ', u.apellidos) AS usuario_turna
   FROM (((public.turno_documento t
     JOIN public.documento d ON ((t.documento_id = d.id)))
     JOIN public.area ad ON ((t.area_destino_id = ad.id)))
     JOIN public.usuario u ON ((t.usuario_turna_id = u.id)))
  WHERE ((t.recibido = false) AND (t.activo = true));


ALTER VIEW public.vw_turnos_pendientes OWNER TO postgres;

--
-- Name: VIEW vw_turnos_pendientes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_turnos_pendientes IS 'Vista de turnos pendientes de recepción';


--
-- Name: archivo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo ALTER COLUMN id SET DEFAULT nextval('public.archivo_id_seq'::regclass);


--
-- Name: area id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.area ALTER COLUMN id SET DEFAULT nextval('public.area_id_seq'::regclass);


--
-- Name: auditoria_sistema id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_sistema ALTER COLUMN id SET DEFAULT nextval('public.auditoria_sistema_id_seq'::regclass);


--
-- Name: copia_conocimiento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.copia_conocimiento ALTER COLUMN id SET DEFAULT nextval('public.copia_conocimiento_id_seq'::regclass);


--
-- Name: documento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento ALTER COLUMN id SET DEFAULT nextval('public.documento_id_seq'::regclass);


--
-- Name: historial_documento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_documento ALTER COLUMN id SET DEFAULT nextval('public.historial_documento_id_seq'::regclass);


--
-- Name: permiso_emision_documento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permiso_emision_documento ALTER COLUMN id SET DEFAULT nextval('public.permiso_emision_documento_id_seq'::regclass);


--
-- Name: respuesta id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuesta ALTER COLUMN id SET DEFAULT nextval('public.respuesta_id_seq'::regclass);


--
-- Name: rol id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol ALTER COLUMN id SET DEFAULT nextval('public.rol_id_seq'::regclass);


--
-- Name: tipo_documento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_documento ALTER COLUMN id SET DEFAULT nextval('public.tipo_documento_id_seq'::regclass);


--
-- Name: turno_documento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turno_documento ALTER COLUMN id SET DEFAULT nextval('public.turno_documento_id_seq'::regclass);


--
-- Name: usuario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id SET DEFAULT nextval('public.usuario_id_seq'::regclass);


--
-- Data for Name: archivo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.archivo (id, nombre_archivo, ruta_archivo, tipo_mime, "tamaño", fecha_carga, usuario_carga_id, hash) FROM stdin;
1	solicitud_presupuesto_capacitacion.pdf	/documentos/2026/03/solicitud_presupuesto_capacitacion.pdf	application/pdf	2458623	2026-03-05 16:46:42.992737	6	a3d5e8f9b2c4d6e8f0a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5
2	listado_material_oficina_q2.xlsx	/documentos/2026/03/listado_material_oficina_q2.xlsx	application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	156234	2026-03-05 16:46:42.995089	7	b4e6f8a0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6
3	informe_ejecucion_feb2026.pdf	/documentos/2026/03/informe_ejecucion_feb2026.pdf	application/pdf	3854621	2026-03-05 16:46:42.995986	8	c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7
\.


--
-- Data for Name: archivo_documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.archivo_documento (documento_id, archivo_id, tipo_relacion, fecha_asociacion) FROM stdin;
1	1	ADJUNTO	2026-03-05 16:46:42.996717
2	2	ADJUNTO	2026-03-05 16:46:42.996717
5	3	RESPALDO	2026-03-05 16:46:42.996717
\.


--
-- Data for Name: area; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.area (id, nombre, clave, tipo, area_padre_id, nivel, activa, fecha_creacion, fecha_modificacion, descripcion) FROM stdin;
20	Administrador	ADMIN	DIRECCION	\N	1	t	2026-03-06 14:30:15.27068	\N	Area Administrativa Principal
21	Secretaria	SEC	SECRETARIA	20	2	t	2026-03-06 14:30:15.328979	\N	Secretaria Principal
22	Subsecretaria de Gestion Ambiental y Sustentabilidad Energetica	SSGASE	SUBSECRETARIA	21	3	t	2026-03-06 14:30:15.347146	\N	Gestion Ambiental y Sustentabilidad Energetica
23	Direccion de Seguridad Hidrica	SSGASE-DSH	DIRECCION	22	4	t	2026-03-06 14:30:15.385485	\N	Seguridad Hidrica
24	Direccion de Gestion de Cambio Climatico, Ciudades Inteligentes y Transicion Energetica	SSGASE-DGCCITE	DIRECCION	22	4	t	2026-03-06 14:30:15.402466	\N	Cambio Climatico y Transicion Energetica
25	Direccion de Gestion de Calidad del Aire	SSGASE-DGCA	DIRECCION	22	4	t	2026-03-06 14:30:15.447347	\N	Calidad del Aire
26	Direccion de Gestion de Residuos	SSGASE-DGR	DIRECCION	22	4	t	2026-03-06 14:30:15.464899	\N	Gestion de Residuos
27	Departamento de Remediacion de Cuencas	SSGASE-DSH-DRC	DEPARTAMENTO	23	5	t	2026-03-06 14:30:15.492042	\N	Remediacion de Cuencas
28	Departamento de Innovacion y Eficiencia Energetica	SSGASE-DSH-DIEE	DEPARTAMENTO	23	5	t	2026-03-06 14:30:15.519973	\N	Innovacion y Eficiencia Energetica
29	Departamento de Politica Hidrica	SSGASE-DSH-DPH	DEPARTAMENTO	23	5	t	2026-03-06 14:30:15.538746	\N	Politica Hidrica
30	Departamento de Sustentabilidad Energetica	SSGASE-DGCCITE-DSE	DEPARTAMENTO	24	5	t	2026-03-06 14:30:15.555533	\N	Sustentabilidad Energetica
31	Departamento de Cambio Climatico y Ciudades Inteligentes	SSGASE-DGCCITE-DCCCI	DEPARTAMENTO	24	5	t	2026-03-06 14:30:15.571705	\N	Cambio Climatico y Ciudades Inteligentes
32	Departamento de Monitoreo y Evaluacion de Emisiones	SSGASE-DGCA-DMEE	DEPARTAMENTO	25	5	t	2026-03-06 14:30:15.613476	\N	Monitoreo y Evaluacion de Emisiones
33	Departamento de Verificacion y Regulacion de Fuentes	SSGASE-DGCA-DVRF	DEPARTAMENTO	25	5	t	2026-03-06 14:30:15.631048	\N	Verificacion y Regulacion de Fuentes
34	Departamento de Tratamiento de Residuos Solidos	SSGASE-DGR-DTRS	DEPARTAMENTO	26	5	t	2026-03-06 14:30:15.66505	\N	Tratamiento de Residuos Solidos
35	Departamento de Residuos de Manejo Especial	SSGASE-DGR-DRME	DEPARTAMENTO	26	5	t	2026-03-06 14:30:15.681933	\N	Residuos de Manejo Especial
36	Subsecretaria para la Gestion del Territorio y Desarrollo Urbano	SSGTDU	SUBSECRETARIA	21	3	t	2026-03-06 14:30:15.711717	\N	Gestion del Territorio y Desarrollo Urbano
37	Direccion de Gestion de Recursos Naturales y Biodiversidad	SSGTDU-DGRNB	DIRECCION	36	4	t	2026-03-06 14:30:15.754189	\N	Recursos Naturales y Biodiversidad
38	Direccion de Gestion del Suelo y sus Usos	SSGTDU-DGSSU	DIRECCION	36	4	t	2026-03-06 14:30:15.772012	\N	Gestion del Suelo y sus Usos
39	Direccion de Desarrollo Urbano e Impacto Ambiental	SSGTDU-DDUIA	DIRECCION	36	4	t	2026-03-06 14:30:15.805175	\N	Desarrollo Urbano e Impacto Ambiental
40	Direccion de Gestion de Riesgos	SSGTDU-DGR	DIRECCION	36	4	t	2026-03-06 14:30:15.821207	\N	Gestion de Riesgos
41	Direccion General de Contaminacion Visual	SSGTDU-DGCV	DIRECCION	36	4	t	2026-03-06 14:30:15.864545	\N	Contaminacion Visual
42	Departamento de Restauracion y Rehabilitacion de Ecosistemas	SSGTDU-DGRNB-DRRE	DEPARTAMENTO	37	5	t	2026-03-06 14:30:15.883723	\N	Restauracion de Ecosistemas
43	Departamento de Vida Silvestre	SSGTDU-DGRNB-DVS	DEPARTAMENTO	37	5	t	2026-03-06 14:30:15.924251	\N	Vida Silvestre
44	Departamento de Ecosistemas Productivos y Biodiversidad	SSGTDU-DGRNB-DEPB	DEPARTAMENTO	37	5	t	2026-03-06 14:30:15.941607	\N	Ecosistemas Productivos
45	Departamento de Proteccion Forestal	SSGTDU-DGRNB-DPF	DEPARTAMENTO	37	5	t	2026-03-06 14:30:15.970507	\N	Proteccion Forestal
46	Departamento de Conservacion del Patrimonio	SSGTDU-DGSSU-DCP	DEPARTAMENTO	38	5	t	2026-03-06 14:30:15.989517	\N	Conservacion del Patrimonio
47	Departamento de Usos de Suelo y Reservas Territoriales	SSGTDU-DGSSU-DUSRT	DEPARTAMENTO	38	5	t	2026-03-06 14:30:16.005318	\N	Usos de Suelo y Reservas
48	Departamento de Impacto Urbano y Ambiental	SSGTDU-DDUIA-DIUA	DEPARTAMENTO	39	5	t	2026-03-06 14:30:16.032664	\N	Impacto Urbano y Ambiental
49	Departamento de Proyectos Estrategicos	SSGTDU-DDUIA-DPE	DEPARTAMENTO	39	5	t	2026-03-06 14:30:16.051257	\N	Proyectos Estrategicos
50	Departamento de Planes y Programas Municipales	SSGTDU-DDUIA-DPPM	DEPARTAMENTO	39	5	t	2026-03-06 14:30:16.068827	\N	Planes y Programas Municipales
51	Departamento de Ordenamiento Territorial	SSGTDU-DDUIA-DOT	DEPARTAMENTO	39	5	t	2026-03-06 14:30:16.086418	\N	Ordenamiento Territorial
52	Departamento de Riesgos y Atlas	SSGTDU-DGR-DRA	DEPARTAMENTO	40	5	t	2026-03-06 14:30:16.107862	\N	Riesgos y Atlas
53	Departamento de Gestion y Adaptacion ante Riesgos	SSGTDU-DGR-DGAR	DEPARTAMENTO	40	5	t	2026-03-06 14:30:16.124182	\N	Gestion y Adaptacion ante Riesgos
54	Subdireccion de Prevencion de Contaminacion Visual	SSGTDU-DGCV-SDPCV	SUBDIRECCION	41	5	t	2026-03-06 14:30:16.152607	\N	Prevencion de Contaminacion Visual
55	Subdireccion de Evaluacion y Atencion de la Contaminacion Visual	SSGTDU-DGCV-SDEACV	SUBDIRECCION	41	5	t	2026-03-06 14:30:16.170471	\N	Evaluacion y Atencion de Contaminacion Visual
56	Direccion General de Inspeccion y Vigilancia	DGIV	DIRECCION	21	3	t	2026-03-06 14:30:16.210112	\N	Inspeccion y Vigilancia
57	Departamento de Supervision	DGIV-DS	DEPARTAMENTO	56	4	t	2026-03-06 14:30:16.228753	\N	Supervision
58	Departamento de Normativa y Sanciones	DGIV-DNS	DEPARTAMENTO	56	4	t	2026-03-06 14:30:16.277206	\N	Normativa y Sanciones
59	Departamento de Denuncias Ambientales	DGIV-DDA	DEPARTAMENTO	56	4	t	2026-03-06 14:30:16.325077	\N	Denuncias Ambientales
60	Departamento de Dictamenes Tecnicos	DGIV-DDT	DEPARTAMENTO	56	4	t	2026-03-06 14:30:16.345187	\N	Dictamenes Tecnicos
61	Direccion General de Asuntos Juridicos	DGAJ	DIRECCION	21	3	t	2026-03-06 14:30:16.365601	\N	Asuntos Juridicos
62	Departamento Contencioso	DGAJ-DC	DEPARTAMENTO	61	4	t	2026-03-06 14:30:16.396137	\N	Departamento Contencioso
63	Departamento Consultivo	DGAJ-DCONS	DEPARTAMENTO	61	4	t	2026-03-06 14:30:16.412354	\N	Departamento Consultivo
64	Departamento de Enlace de Transparencia	DGAJ-DET	DEPARTAMENTO	61	4	t	2026-03-06 14:30:16.444584	\N	Enlace de Transparencia
65	Direccion de Planeacion y Geomatica	DPG	DIRECCION	21	3	t	2026-03-06 14:30:16.461877	\N	Planeacion y Geomatica
66	Departamento de Planeacion y Evaluacion	DPG-DPE	DEPARTAMENTO	65	4	t	2026-03-06 14:30:16.482079	\N	Planeacion y Evaluacion
67	Departamento de Banco de Proyectos y Gestion Concurrente	DPG-DBPGC	DEPARTAMENTO	65	4	t	2026-03-06 14:30:16.500066	\N	Banco de Proyectos
68	Departamento de Geomatica e Informacion	DPG-DGI	DEPARTAMENTO	65	4	t	2026-03-06 14:30:16.519194	\N	Geomatica e Informacion
69	Comite de Control y Desempeno Institucional	DPG-CCDI	COORDINACION	65	4	t	2026-03-06 14:30:16.537952	\N	Control y Desempeno Institucional
70	Sistema Informatico de Entrega Recepcion	DPG-SIER	COORDINACION	65	4	t	2026-03-06 14:30:16.55568	\N	Sistema Informatico
71	Unidad de Igualdad Sustantiva	DPG-UIS	COORDINACION	65	4	t	2026-03-06 14:30:16.573619	\N	Igualdad Sustantiva
72	Direccion de Administracion	DA	DIRECCION	21	3	t	2026-03-06 14:30:16.590891	\N	Administracion
73	Coordinacion de Recursos Financieros y Factor Humano	DA-CRFFH	COORDINACION	72	4	t	2026-03-06 14:30:16.607747	\N	Recursos Financieros y Factor Humano
74	Coordinacion de Recursos Materiales, Servicios Generales y Parque Vehicular	DA-CRMSGPV	COORDINACION	72	4	t	2026-03-06 14:30:16.626336	\N	Recursos Materiales y Servicios
75	Sistemas	DA-SIS	DEPARTAMENTO	72	4	t	2026-03-06 14:30:16.643895	\N	Sistemas
76	Unidad Coordinadora de Archivo	DA-UCA	COORDINACION	72	4	t	2026-03-06 14:30:16.661641	\N	Archivo
77	Comite de Etica y Prevencion de Conflictos de Interes	DA-CEPCI	COORDINACION	72	4	t	2026-03-06 14:30:16.67889	\N	Etica y Prevencion de Conflictos
78	Departamento de Recursos Financieros	DA-CRFFH-DRF	DEPARTAMENTO	73	5	t	2026-03-06 14:30:16.697055	\N	Recursos Financieros
79	Departamento de Factor Humano	DA-CRFFH-DFH	DEPARTAMENTO	73	5	t	2026-03-06 14:30:16.714119	\N	Factor Humano
80	Transparencia de Administracion	DA-CRFFH-TA	DEPARTAMENTO	73	5	t	2026-03-06 14:30:16.730307	\N	Transparencia
81	Departamento de Recursos Materiales	DA-CRMSGPV-DRM	DEPARTAMENTO	74	5	t	2026-03-06 14:30:16.747883	\N	Recursos Materiales
82	Departamento de Servicios Generales y Parque Vehicular	DA-CRMSGPV-DSGPV	DEPARTAMENTO	74	5	t	2026-03-06 14:30:16.766428	\N	Servicios Generales
83	Vehiculos	DA-CRMSGPV-VEH	DEPARTAMENTO	74	5	t	2026-03-06 14:30:16.784343	\N	Vehiculos
84	Servicios Tecnologicos	DA-CRMSGPV-ST	DEPARTAMENTO	74	5	t	2026-03-06 14:30:16.802284	\N	Servicios Tecnologicos
85	Almacen	DA-CRMSGPV-ALM	DEPARTAMENTO	74	5	t	2026-03-06 14:30:16.828025	\N	Almacen
86	Secretaria Particular	SP	COORDINACION	21	3	t	2026-03-06 14:30:16.847144	\N	Secretaria Particular
87	Departamento de Atencion Ciudadana	SP-DAC	DEPARTAMENTO	86	4	t	2026-03-06 14:30:16.866073	\N	Atencion Ciudadana
88	Instituto de Bienestar Animal	IBA	DIRECCION	21	3	t	2026-03-06 14:30:16.883804	\N	Instituto de Bienestar Animal
89	Direccion de Cultura de Bienestar Animal	IBA-DCBA	DIRECCION	88	4	t	2026-03-06 14:30:16.90177	\N	Cultura de Bienestar Animal
90	Direccion de Normatividad y Denuncias	IBA-DND	DIRECCION	88	4	t	2026-03-06 14:30:16.919365	\N	Normatividad y Denuncias
91	Direccion Medico Veterinario y Forense	IBA-DMVF	DIRECCION	88	4	t	2026-03-06 14:30:16.935572	\N	Medico Veterinario y Forense
92	Departamento de Fomento y Cultura del Bienestar Animal	IBA-DCBA-DFCBA	DEPARTAMENTO	89	5	t	2026-03-06 14:30:16.952637	\N	Fomento y Cultura
93	Departamento de Vinculacion Social y Administracion de Padrones	IBA-DCBA-DVSAP	DEPARTAMENTO	89	5	t	2026-03-06 14:30:16.970051	\N	Vinculacion Social
94	Departamento de Denuncias	IBA-DND-DD	DEPARTAMENTO	90	5	t	2026-03-06 14:30:16.988286	\N	Denuncias
95	Departamento de Normatividad y Recomendaciones	IBA-DND-DNR	DEPARTAMENTO	90	5	t	2026-03-06 14:30:17.01596	\N	Normatividad y Recomendaciones
96	Departamento de Administracion de la Proteccion Animal	IBA-DMVF-DAPA	DEPARTAMENTO	91	5	t	2026-03-06 14:30:17.035392	\N	Proteccion Animal
97	Departamento de Proyectos de Bienestar Animal	IBA-DPBA	DEPARTAMENTO	88	4	t	2026-03-06 14:30:17.054134	\N	Proyectos de Bienestar Animal
98	Departamento de Iniciativas Sociales	IBA-DIS	DEPARTAMENTO	88	4	t	2026-03-06 14:30:17.071681	\N	Iniciativas Sociales
3	Oficialia de la Secretaria	OFICIAL	COORDINACION	21	3	t	2026-03-05 16:46:42.918556	2026-03-06 14:30:17.088452	Oficialia de Partes - Recepcion y registro de todos los documentos
\.


--
-- Data for Name: auditoria_sistema; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria_sistema (id, accion, descripcion, usuario_id, area_id, fecha, detalles, ip_address, user_agent) FROM stdin;
1	LOGIN_FALLIDO	Intento de login fallido para usuario: admin	\N	\N	2026-03-06 12:57:59.031995	\N	::1	\N
2	LOGIN_EXITOSO	Login exitoso de usuario: admin	23	72	2026-03-06 13:00:41.461002	\N	::1	\N
3	LOGIN_EXITOSO	Login exitoso de usuario: admin	23	20	2026-03-06 15:34:22.335313	\N	::1	\N
4	LOGIN_FALLIDO	Intento de login fallido para usuario: jperez	\N	\N	2026-03-06 15:56:19.274316	\N	::1	\N
5	LOGIN_FALLIDO	Intento de login fallido para usuario: jperez	\N	\N	2026-03-06 15:56:54.578616	\N	::1	\N
6	LOGIN_FALLIDO	Intento de login fallido para usuario: jperez	\N	\N	2026-03-06 15:57:11.121821	\N	::1	\N
7	LOGIN_FALLIDO	Intento de login fallido para usuario: jperez	\N	\N	2026-03-06 15:57:51.75808	\N	::1	\N
8	LOGIN_EXITOSO	Login exitoso de usuario: admin	23	20	2026-03-06 15:58:01.930887	\N	::1	\N
9	LOGIN_EXITOSO	Login exitoso de usuario: arodriguez	4	39	2026-03-06 15:58:42.818354	\N	::1	\N
\.


--
-- Data for Name: copia_conocimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.copia_conocimiento (id, documento_id, area_id, fecha_envio, fecha_lectura, leido, usuario_envia_id) FROM stdin;
1	3	73	2026-03-01 16:46:42.976186	2026-03-02 16:46:42.976186	t	2
2	3	74	2026-03-01 16:46:42.976186	\N	f	2
3	3	73	2026-03-01 16:46:42.976186	2026-03-01 16:46:42.976186	t	2
4	3	73	2026-03-01 16:46:42.976186	\N	f	2
5	5	72	2026-03-02 16:46:42.979944	2026-03-03 16:46:42.979944	t	8
\.


--
-- Data for Name: documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documento (id, folio, tipo_documento_id, asunto, contenido, fecha_creacion, fecha_limite, prioridad, estado, usuario_creador_id, area_origen_id, solo_conocimiento, fecha_modificacion, observaciones) FROM stdin;
1	SAF-SSA-DRH-OFC-2026-001	1	Solicitud de ampliación presupuestal para capacitación 2026	Se solicita ampliación presupuestal por $500,000.00 para programa de capacitación del personal de nuevo ingreso...	2026-02-18 16:46:42.949784	2026-03-10 16:46:42.949784	ALTA	TURNADO	6	73	f	2026-03-06 14:56:58.205556	\N
2	SAF-SSA-DRM-MEM-2026-045	2	Requerimiento de material de oficina	Se requiere el siguiente material de oficina para el segundo trimestre del año...	2026-02-23 16:46:42.954716	2026-03-15 16:46:42.954716	MEDIA	RECIBIDO	7	74	f	2026-03-06 14:56:58.205556	\N
3	SAF-CIR-2026-003	3	Actualización de políticas de seguridad informática	Se notifica a todas las áreas la actualización de las políticas de seguridad informática...	2026-02-28 16:46:42.955774	\N	MEDIA	EN_PROCESO	2	72	t	2026-03-06 14:56:58.205556	\N
4	SAF-SSA-DRM-SOL-2026-089	4	Solicitud de mantenimiento preventivo de vehículos	Se requiere el servicio de mantenimiento preventivo para 5 vehículos oficiales...	2026-02-25 16:46:42.956658	2026-03-20 16:46:42.956658	MEDIA	TURNADO	7	74	f	2026-03-06 14:56:58.205556	\N
5	SAF-SSF-DPRE-INF-2026-012	5	Informe de ejecución presupuestal - Febrero 2026	Se presenta el informe de ejecución presupuestal correspondiente al mes de febrero 2026...	2026-03-02 16:46:42.957566	\N	BAJA	RESPONDIDO	8	73	f	2026-03-06 14:56:58.205556	\N
6	SAF-SSA-DRM-DIC-2026-007	6	Dictamen de viabilidad para compra de equipo de cómputo	Se emite dictamen de viabilidad para la adquisición de 50 equipos de cómputo...	2026-02-21 16:46:42.958442	2026-03-08 16:46:42.958442	ALTA	DEVUELTO	7	74	f	2026-03-06 14:56:58.205556	\N
7	SAF-ACU-2026-005	7	Acuerdo de asignación de recursos adicionales	Acuerdo que establece la asignación de recursos adicionales para proyectos prioritarios...	2026-02-13 16:46:42.959238	2026-02-28 16:46:42.959238	URGENTE	CANCELADO	5	73	f	2026-03-06 14:56:58.205556	\N
8	SAF-SSA-DRH-NOT-2026-018	8	Notificación de cambio de horario laboral	Se notifica a todo el personal el cambio de horario laboral por el periodo vacacional...	2026-03-03 16:46:42.959951	2026-03-25 16:46:42.959951	BAJA	REGISTRADO	6	73	f	2026-03-06 14:56:58.205556	\N
\.


--
-- Data for Name: historial_documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historial_documento (id, documento_id, accion, descripcion, usuario_id, area_id, fecha, detalles, ip_address) FROM stdin;
7	3	EN_PROCESO	En proceso de distribución	2	72	2026-03-01 16:46:43.013253	\N	\N
6	3	CREADO	Circular creada	2	72	2026-02-28 16:46:43.013253	\N	\N
15	7	CANCELADO	Cancelado por duplicidad con documento SAF-ACU-2026-003	5	73	2026-02-15 16:46:43.016998	\N	\N
14	7	CREADO	Acuerdo creado	5	73	2026-02-13 16:46:43.016998	\N	\N
11	5	RESPONDIDO	Informe revisado y aprobado	5	73	2026-03-03 16:46:43.014988	\N	\N
16	8	CREADO	Notificación registrada	6	73	2026-03-03 16:46:43.017898	\N	\N
2	1	TURNADO	Turnado a Dirección de Presupuesto	6	73	2026-02-19 16:46:43.00857	\N	\N
1	1	CREADO	Documento registrado en el sistema	6	73	2026-02-18 16:46:43.00857	\N	\N
12	6	CREADO	Dictamen elaborado	7	74	2026-02-21 16:46:43.015993	\N	\N
9	4	TURNADO	Turnado a Coordinación de Servicios Generales	7	74	2026-02-26 16:46:43.014198	\N	\N
8	4	CREADO	Solicitud registrada	7	74	2026-02-25 16:46:43.014198	\N	\N
4	2	TURNADO	Turnado a Coordinación de Adquisiciones	7	74	2026-02-23 16:46:43.012139	\N	\N
3	2	CREADO	Documento registrado en el sistema	7	74	2026-02-23 16:46:43.012139	\N	\N
10	5	CREADO	Informe generado	8	73	2026-03-02 16:46:43.014988	\N	\N
13	6	DEVUELTO	Devuelto por falta de documentación soporte	13	74	2026-02-23 16:46:43.015993	\N	\N
5	2	RECIBIDO	Recibido en Coordinación de Adquisiciones	13	74	2026-02-24 16:46:43.012139	\N	\N
\.


--
-- Data for Name: permiso_emision_documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permiso_emision_documento (id, tipo_area, tipo_documento_id, puede_emitir, puede_recepcionar, observaciones, fecha_creacion, activo) FROM stdin;
1	COORDINACION	1	f	t	\N	2026-03-06 14:57:40.350137	t
2	COORDINACION	2	f	t	\N	2026-03-06 14:57:40.350137	t
3	COORDINACION	3	f	t	\N	2026-03-06 14:57:40.350137	t
4	COORDINACION	11	f	t	\N	2026-03-06 14:57:40.350137	t
5	COORDINACION	12	f	t	\N	2026-03-06 14:57:40.350137	t
6	COORDINACION	13	f	t	\N	2026-03-06 14:57:40.350137	t
7	COORDINACION	14	f	t	\N	2026-03-06 14:57:40.350137	t
8	COORDINACION	15	f	t	\N	2026-03-06 14:57:40.350137	t
9	COORDINACION	16	f	t	\N	2026-03-06 14:57:40.350137	t
10	SECRETARIA	1	t	t	\N	2026-03-06 14:57:40.354859	t
11	SECRETARIA	2	t	t	\N	2026-03-06 14:57:40.354859	t
12	SECRETARIA	3	t	t	\N	2026-03-06 14:57:40.354859	t
13	SECRETARIA	11	t	t	\N	2026-03-06 14:57:40.354859	t
14	SECRETARIA	12	t	t	\N	2026-03-06 14:57:40.354859	t
15	SECRETARIA	13	t	t	\N	2026-03-06 14:57:40.354859	t
16	SUBSECRETARIA	1	t	t	\N	2026-03-06 14:57:40.355868	t
17	SUBSECRETARIA	2	t	t	\N	2026-03-06 14:57:40.355868	t
18	SUBSECRETARIA	3	t	t	\N	2026-03-06 14:57:40.355868	t
19	SUBSECRETARIA	11	t	t	\N	2026-03-06 14:57:40.355868	t
20	SUBSECRETARIA	12	t	t	\N	2026-03-06 14:57:40.355868	t
21	DIRECCION	1	t	t	\N	2026-03-06 14:57:40.357131	t
22	DIRECCION	2	t	t	\N	2026-03-06 14:57:40.357131	t
23	DIRECCION	3	t	t	\N	2026-03-06 14:57:40.357131	t
24	DIRECCION	11	t	t	\N	2026-03-06 14:57:40.357131	t
25	SUBDIRECCION	2	t	t	\N	2026-03-06 14:57:40.357957	t
26	SUBDIRECCION	11	t	t	\N	2026-03-06 14:57:40.357957	t
27	DEPARTAMENTO	2	t	t	\N	2026-03-06 14:57:40.358813	t
28	DEPARTAMENTO	11	t	t	\N	2026-03-06 14:57:40.358813	t
29	SECRETARIA	14	f	t	\N	2026-03-06 14:57:40.368421	t
30	SECRETARIA	15	f	t	\N	2026-03-06 14:57:40.368421	t
31	SECRETARIA	16	f	t	\N	2026-03-06 14:57:40.368421	t
32	SUBSECRETARIA	13	f	t	\N	2026-03-06 14:57:40.376076	t
33	SUBSECRETARIA	14	f	t	\N	2026-03-06 14:57:40.376076	t
34	SUBSECRETARIA	15	f	t	\N	2026-03-06 14:57:40.376076	t
35	SUBSECRETARIA	16	f	t	\N	2026-03-06 14:57:40.376076	t
36	DIRECCION	12	f	t	\N	2026-03-06 14:57:40.377427	t
37	DIRECCION	13	f	t	\N	2026-03-06 14:57:40.377427	t
38	DIRECCION	14	f	t	\N	2026-03-06 14:57:40.377427	t
39	DIRECCION	15	f	t	\N	2026-03-06 14:57:40.377427	t
40	DIRECCION	16	f	t	\N	2026-03-06 14:57:40.377427	t
\.


--
-- Data for Name: respuesta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.respuesta (id, documento_origen_id, folio_respuesta, contenido, fecha_respuesta, usuario_responde_id, area_responde_id, cierra_tramite, documento_respuesta_id, observaciones) FROM stdin;
1	5	SAF-SSF-RESP-2026-001	Se toma nota del informe y se aprueban las recomendaciones presupuestales presentadas.	2026-03-03 16:46:42.985059	5	73	t	\N	Informe recibido y aprobado por Subsecretaría de Finanzas
\.


--
-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rol (id, nombre, descripcion, permisos, activo, fecha_creacion, fecha_modificacion) FROM stdin;
1	Administrador	Acceso total al sistema	*	t	2026-03-05 16:46:42.912356	\N
2	Secretario	Titular de Secretaría	GESTIONAR_SECRETARIA,CREAR_DOCUMENTO,TURNAR,VER_TODO,CANCELAR,REPORTES	t	2026-03-05 16:46:42.912356	\N
3	Subsecretario	Titular de Subsecretaría	GESTIONAR_SUBSECRETARIA,CREAR_DOCUMENTO,TURNAR,VER_AREA,REPORTES	t	2026-03-05 16:46:42.912356	\N
4	Director	Director de Área	GESTIONAR_DIRECCION,CREAR_DOCUMENTO,TURNAR,RESPONDER,VER_AREA	t	2026-03-05 16:46:42.912356	\N
5	Subdirector	Subdirector de Área	GESTIONAR_SUBDIRECCION,CREAR_DOCUMENTO,TURNAR,RESPONDER,VER_AREA	t	2026-03-05 16:46:42.912356	\N
6	Coordinador	Coordinador de Área	CREAR_DOCUMENTO,TURNAR,RESPONDER,VER_AREA	t	2026-03-05 16:46:42.912356	\N
7	Jefe de Departamento	Jefe de Departamento	CREAR_DOCUMENTO,RESPONDER,VER_DEPARTAMENTO	t	2026-03-05 16:46:42.912356	\N
8	Analista	Analista operativo	CREAR_DOCUMENTO,VER_ASIGNADOS	t	2026-03-05 16:46:42.912356	\N
9	Oficialía de Partes	Recepción y registro de documentos	REGISTRAR,TURNAR	t	2026-03-05 16:46:42.912356	\N
10	Consulta	Usuario de solo consulta	VER_PUBLICOS	t	2026-03-05 16:46:42.912356	\N
\.


--
-- Data for Name: tipo_documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipo_documento (id, nombre, clave, descripcion, plantilla, requiere_respuesta, activo, fecha_creacion) FROM stdin;
4	Solicitud	SOL	Solicitud de servicios o recursos	\N	t	t	2026-03-05 16:46:42.932212
5	Informe	INF	Informe de actividades	\N	f	t	2026-03-05 16:46:42.932212
6	Dictamen	DIC	Dictamen técnico o legal	\N	f	t	2026-03-05 16:46:42.932212
7	Acuerdo	ACU	Acuerdo oficial	\N	f	t	2026-03-05 16:46:42.932212
8	Notificación	NOT	Notificación oficial	\N	f	t	2026-03-05 16:46:42.932212
9	Convocatoria	CONV	Convocatoria a reunión o evento	\N	f	t	2026-03-05 16:46:42.932212
10	Constancia	CONST	Constancia o certificación	\N	f	t	2026-03-05 16:46:42.932212
1	Oficio	EO	Documento oficial de comunicacion institucional	\N	t	t	2026-03-05 16:46:42.932212
2	Memorándum	EM	Comunicado interno entre areas	\N	t	t	2026-03-05 16:46:42.932212
3	Circular	EC	Comunicado general a multiples areas	\N	f	t	2026-03-05 16:46:42.932212
11	Tarjeta Informativa	ET	Reporte breve de informacion relevante	\N	f	t	2026-03-06 14:16:39.304677
12	Memorando Circular	MC	Memorando dirigido a multiples destinatarios	\N	f	t	2026-03-06 14:16:39.310144
13	Invitacion	INV	Invitacion a evento o reunion	\N	f	t	2026-03-06 14:16:39.310895
14	Audiencia Martes Ciudadano	AMC	Solicitud de audiencia publica	\N	t	t	2026-03-06 14:16:39.311669
15	Escritos	ESC	Documentos generales y escritos varios	\N	t	t	2026-03-06 14:16:39.313299
16	Oficio Circular	OC	Oficio dirigido a multiples destinatarios	\N	f	t	2026-03-06 14:16:39.322648
\.


--
-- Data for Name: turno_documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.turno_documento (id, documento_id, area_origen_id, area_destino_id, usuario_turna_id, fecha_turno, fecha_recepcion, observaciones, recibido, activo, instrucciones) FROM stdin;
1	1	23	50	6	2026-02-19 16:46:42.964812	\N	Se turna para revisión presupuestal	f	t	Favor de revisar viabilidad y dar respuesta
2	2	25	51	7	2026-02-23 16:46:42.969311	2026-02-24 16:46:42.969311	Para cotización y adquisición	t	f	Favor de cotizar con al menos tres proveedores
3	4	27	49	7	2026-02-26 16:46:42.970414	\N	Para gestión de mantenimiento vehicular	f	t	\N
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario (id, nombre, apellidos, telefono, celular, curp, rfc, fecha_nacimiento, sexo, calle, numero_exterior, numero_interior, colonia, codigo_postal, ciudad, estado, email, nombre_usuario, "contraseña", fecha_alta, fecha_ultimo_acceso, activo, area_id, rol_id) FROM stdin;
5	Luis	Hernández Torres	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	luis.hernandez@gobierno.mx	lhernandez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	38	3
6	Patricia	Ramírez Flores	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	patricia.ramirez@gobierno.mx	pramirez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	37	4
7	Roberto	García Mendoza	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roberto.garcia@gobierno.mx	rgarcia	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	36	4
8	Laura	López Castro	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	laura.lopez@gobierno.mx	llopez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	35	4
9	Jorge	Morales Vega	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	jorge.morales@gobierno.mx	jmorales	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	34	4
10	Sandra	Jiménez Ortiz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	sandra.jimenez@gobierno.mx	sjimenez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	33	4
11	Miguel	Cruz Herrera	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	miguel.cruz@gobierno.mx	mcruz	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	32	5
12	Elena	Torres Medina	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	elena.torres@gobierno.mx	etorres	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	31	5
13	David	Vargas Luna	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	david.vargas@gobierno.mx	dvargas	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	30	6
19	Alejandro	Ríos Delgado	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	alejandro.rios@gobierno.mx	arios	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	24	7
20	Verónica	Paredes Montes	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	veronica.paredes@gobierno.mx	vparedes	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	23	8
21	Sergio	Domínguez León	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	sergio.dominguez@gobierno.mx	sdominguez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	22	8
22	Rosa	Fuentes Miranda	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	rosa.fuentes@gobierno.mx	rfuentes	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	21	9
1	Juan	Pérez García	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	juan.perez@gobierno.mx	jperez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	42	1
2	María	González López	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	maria.gonzalez@gobierno.mx	mgonzalez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	41	2
3	Carlos	Martínez Ruiz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	carlos.martinez@gobierno.mx	cmartinez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	40	2
14	Carmen	Reyes Aguilar	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	carmen.reyes@gobierno.mx	creyes	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	29	6
15	Fernando	Silva Campos	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	fernando.silva@gobierno.mx	fsilva	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	28	6
16	Gabriela	Mendoza Ramos	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	gabriela.mendoza@gobierno.mx	gmendoza	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	27	7
17	Ricardo	Castillo Rojas	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ricardo.castillo@gobierno.mx	rcastillo	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	26	7
18	Mónica	Gutiérrez Navarro	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	monica.gutierrez@gobierno.mx	mgutierrez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	25	7
23	Admin	Sistema	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin@gestor.com	admin	$2b$10$2XiVshszllg3Jk/vc.XrxuoBdK/dfdXxeDQ1nyJJRSB2DR.y6f7XW	2026-03-06 10:51:58.047019	2026-03-06 15:58:01.927256	t	20	1
4	Ana	Rodríguez Sánchez	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ana.rodriguez@gobierno.mx	arodriguez	$2b$10$2XiVshszllg3Jk/vc.XrxuoBdK/dfdXxeDQ1nyJJRSB2DR.y6f7XW	2026-03-05 16:46:42.940191	2026-03-06 15:58:42.815185	t	39	3
\.


--
-- Name: archivo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.archivo_id_seq', 3, true);


--
-- Name: area_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.area_id_seq', 99, true);


--
-- Name: auditoria_sistema_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_sistema_id_seq', 9, true);


--
-- Name: copia_conocimiento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.copia_conocimiento_id_seq', 5, true);


--
-- Name: documento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documento_id_seq', 8, true);


--
-- Name: historial_documento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historial_documento_id_seq', 20, true);


--
-- Name: permiso_emision_documento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permiso_emision_documento_id_seq', 40, true);


--
-- Name: respuesta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.respuesta_id_seq', 1, true);


--
-- Name: rol_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rol_id_seq', 10, true);


--
-- Name: tipo_documento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_documento_id_seq', 37, true);


--
-- Name: turno_documento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.turno_documento_id_seq', 3, true);


--
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuario_id_seq', 23, true);


--
-- Name: archivo_documento archivo_documento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo_documento
    ADD CONSTRAINT archivo_documento_pkey PRIMARY KEY (documento_id, archivo_id);


--
-- Name: archivo archivo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo
    ADD CONSTRAINT archivo_pkey PRIMARY KEY (id);


--
-- Name: area area_clave_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.area
    ADD CONSTRAINT area_clave_key UNIQUE (clave);


--
-- Name: area area_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.area
    ADD CONSTRAINT area_pkey PRIMARY KEY (id);


--
-- Name: auditoria_sistema auditoria_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_sistema
    ADD CONSTRAINT auditoria_sistema_pkey PRIMARY KEY (id);


--
-- Name: copia_conocimiento copia_conocimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.copia_conocimiento
    ADD CONSTRAINT copia_conocimiento_pkey PRIMARY KEY (id);


--
-- Name: documento documento_folio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT documento_folio_key UNIQUE (folio);


--
-- Name: documento documento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT documento_pkey PRIMARY KEY (id);


--
-- Name: historial_documento historial_documento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_documento
    ADD CONSTRAINT historial_documento_pkey PRIMARY KEY (id);


--
-- Name: permiso_emision_documento permiso_emision_documento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permiso_emision_documento
    ADD CONSTRAINT permiso_emision_documento_pkey PRIMARY KEY (id);


--
-- Name: respuesta respuesta_folio_respuesta_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuesta
    ADD CONSTRAINT respuesta_folio_respuesta_key UNIQUE (folio_respuesta);


--
-- Name: respuesta respuesta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuesta
    ADD CONSTRAINT respuesta_pkey PRIMARY KEY (id);


--
-- Name: rol rol_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_nombre_key UNIQUE (nombre);


--
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (id);


--
-- Name: tipo_documento tipo_documento_clave_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_documento
    ADD CONSTRAINT tipo_documento_clave_key UNIQUE (clave);


--
-- Name: tipo_documento tipo_documento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_documento
    ADD CONSTRAINT tipo_documento_pkey PRIMARY KEY (id);


--
-- Name: turno_documento turno_documento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turno_documento
    ADD CONSTRAINT turno_documento_pkey PRIMARY KEY (id);


--
-- Name: permiso_emision_documento uq_permiso_emision; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permiso_emision_documento
    ADD CONSTRAINT uq_permiso_emision UNIQUE (tipo_area, tipo_documento_id);


--
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- Name: usuario usuario_nombre_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_nombre_usuario_key UNIQUE (nombre_usuario);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- Name: area_clave_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX area_clave_unique ON public.area USING btree (clave) WHERE (activa = true);


--
-- Name: idx_archivo_documento_archivo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_archivo_documento_archivo ON public.archivo_documento USING btree (archivo_id);


--
-- Name: idx_archivo_documento_tipo_relacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_archivo_documento_tipo_relacion ON public.archivo_documento USING btree (tipo_relacion);


--
-- Name: idx_archivo_fecha_carga; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_archivo_fecha_carga ON public.archivo USING btree (fecha_carga DESC);


--
-- Name: idx_archivo_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_archivo_hash ON public.archivo USING btree (hash);


--
-- Name: idx_archivo_usuario_carga; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_archivo_usuario_carga ON public.archivo USING btree (usuario_carga_id);


--
-- Name: idx_area_activa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_area_activa ON public.area USING btree (activa);


--
-- Name: idx_area_area_padre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_area_area_padre ON public.area USING btree (area_padre_id);


--
-- Name: idx_area_clave; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_area_clave ON public.area USING btree (clave);


--
-- Name: idx_area_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_area_tipo ON public.area USING btree (tipo);


--
-- Name: idx_auditoria_sistema_accion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_sistema_accion ON public.auditoria_sistema USING btree (accion);


--
-- Name: idx_auditoria_sistema_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_sistema_fecha ON public.auditoria_sistema USING btree (fecha DESC);


--
-- Name: idx_auditoria_sistema_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_sistema_ip ON public.auditoria_sistema USING btree (ip_address);


--
-- Name: idx_auditoria_sistema_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_sistema_usuario ON public.auditoria_sistema USING btree (usuario_id);


--
-- Name: idx_copia_conocimiento_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_copia_conocimiento_area ON public.copia_conocimiento USING btree (area_id);


--
-- Name: idx_copia_conocimiento_area_leido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_copia_conocimiento_area_leido ON public.copia_conocimiento USING btree (area_id, leido);


--
-- Name: idx_copia_conocimiento_documento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_copia_conocimiento_documento ON public.copia_conocimiento USING btree (documento_id);


--
-- Name: idx_copia_conocimiento_leido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_copia_conocimiento_leido ON public.copia_conocimiento USING btree (leido);


--
-- Name: idx_documento_area_origen; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documento_area_origen ON public.documento USING btree (area_origen_id);


--
-- Name: idx_documento_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documento_estado ON public.documento USING btree (estado);


--
-- Name: idx_documento_fecha_creacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documento_fecha_creacion ON public.documento USING btree (fecha_creacion DESC);


--
-- Name: idx_documento_fecha_limite; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documento_fecha_limite ON public.documento USING btree (fecha_limite) WHERE (fecha_limite IS NOT NULL);


--
-- Name: idx_documento_folio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documento_folio ON public.documento USING btree (folio);


--
-- Name: idx_documento_prioridad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documento_prioridad ON public.documento USING btree (prioridad);


--
-- Name: idx_documento_tipo_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documento_tipo_estado ON public.documento USING btree (tipo_documento_id, estado);


--
-- Name: idx_documento_usuario_creador; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documento_usuario_creador ON public.documento USING btree (usuario_creador_id);


--
-- Name: idx_historial_documento_accion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_documento_accion ON public.historial_documento USING btree (accion);


--
-- Name: idx_historial_documento_documento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_documento_documento ON public.historial_documento USING btree (documento_id);


--
-- Name: idx_historial_documento_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_documento_fecha ON public.historial_documento USING btree (fecha DESC);


--
-- Name: idx_historial_documento_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_documento_usuario ON public.historial_documento USING btree (usuario_id);


--
-- Name: idx_permiso_emision_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permiso_emision_activo ON public.permiso_emision_documento USING btree (activo);


--
-- Name: idx_permiso_emision_tipo_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permiso_emision_tipo_area ON public.permiso_emision_documento USING btree (tipo_area);


--
-- Name: idx_permiso_emision_tipo_documento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permiso_emision_tipo_documento ON public.permiso_emision_documento USING btree (tipo_documento_id);


--
-- Name: idx_respuesta_area_responde; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_respuesta_area_responde ON public.respuesta USING btree (area_responde_id);


--
-- Name: idx_respuesta_documento_origen; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_respuesta_documento_origen ON public.respuesta USING btree (documento_origen_id);


--
-- Name: idx_respuesta_folio_respuesta; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_respuesta_folio_respuesta ON public.respuesta USING btree (folio_respuesta);


--
-- Name: idx_respuesta_usuario_responde; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_respuesta_usuario_responde ON public.respuesta USING btree (usuario_responde_id);


--
-- Name: idx_rol_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rol_activo ON public.rol USING btree (activo);


--
-- Name: idx_tipo_documento_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tipo_documento_activo ON public.tipo_documento USING btree (activo);


--
-- Name: idx_tipo_documento_clave; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tipo_documento_clave ON public.tipo_documento USING btree (clave);


--
-- Name: idx_turno_documento_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_turno_documento_activo ON public.turno_documento USING btree (activo);


--
-- Name: idx_turno_documento_area_destino; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_turno_documento_area_destino ON public.turno_documento USING btree (area_destino_id);


--
-- Name: idx_turno_documento_documento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_turno_documento_documento ON public.turno_documento USING btree (documento_id);


--
-- Name: idx_turno_documento_fecha_turno; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_turno_documento_fecha_turno ON public.turno_documento USING btree (fecha_turno DESC);


--
-- Name: idx_turno_documento_recibido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_turno_documento_recibido ON public.turno_documento USING btree (recibido);


--
-- Name: idx_usuario_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_activo ON public.usuario USING btree (activo);


--
-- Name: idx_usuario_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_area ON public.usuario USING btree (area_id);


--
-- Name: idx_usuario_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_email ON public.usuario USING btree (email);


--
-- Name: idx_usuario_nombre_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_nombre_usuario ON public.usuario USING btree (nombre_usuario);


--
-- Name: idx_usuario_rol; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_rol ON public.usuario USING btree (rol_id);


--
-- Name: area trg_validar_jerarquia_area_before; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validar_jerarquia_area_before BEFORE INSERT OR UPDATE ON public.area FOR EACH ROW EXECUTE FUNCTION public.trg_validar_jerarquia_area();


--
-- Name: archivo_documento fk_archivo_documento_archivo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo_documento
    ADD CONSTRAINT fk_archivo_documento_archivo FOREIGN KEY (archivo_id) REFERENCES public.archivo(id);


--
-- Name: archivo_documento fk_archivo_documento_documento; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo_documento
    ADD CONSTRAINT fk_archivo_documento_documento FOREIGN KEY (documento_id) REFERENCES public.documento(id) ON DELETE CASCADE;


--
-- Name: archivo fk_archivo_usuario_carga; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo
    ADD CONSTRAINT fk_archivo_usuario_carga FOREIGN KEY (usuario_carga_id) REFERENCES public.usuario(id);


--
-- Name: area fk_area_area_padre; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.area
    ADD CONSTRAINT fk_area_area_padre FOREIGN KEY (area_padre_id) REFERENCES public.area(id);


--
-- Name: auditoria_sistema fk_auditoria_sistema_area; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_sistema
    ADD CONSTRAINT fk_auditoria_sistema_area FOREIGN KEY (area_id) REFERENCES public.area(id);


--
-- Name: auditoria_sistema fk_auditoria_sistema_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_sistema
    ADD CONSTRAINT fk_auditoria_sistema_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- Name: copia_conocimiento fk_copia_conocimiento_area; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.copia_conocimiento
    ADD CONSTRAINT fk_copia_conocimiento_area FOREIGN KEY (area_id) REFERENCES public.area(id);


--
-- Name: copia_conocimiento fk_copia_conocimiento_documento; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.copia_conocimiento
    ADD CONSTRAINT fk_copia_conocimiento_documento FOREIGN KEY (documento_id) REFERENCES public.documento(id);


--
-- Name: copia_conocimiento fk_copia_conocimiento_usuario_envia; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.copia_conocimiento
    ADD CONSTRAINT fk_copia_conocimiento_usuario_envia FOREIGN KEY (usuario_envia_id) REFERENCES public.usuario(id);


--
-- Name: documento fk_documento_area_origen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT fk_documento_area_origen FOREIGN KEY (area_origen_id) REFERENCES public.area(id);


--
-- Name: documento fk_documento_tipo_documento; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT fk_documento_tipo_documento FOREIGN KEY (tipo_documento_id) REFERENCES public.tipo_documento(id);


--
-- Name: documento fk_documento_usuario_creador; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT fk_documento_usuario_creador FOREIGN KEY (usuario_creador_id) REFERENCES public.usuario(id);


--
-- Name: historial_documento fk_historial_documento_area; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_documento
    ADD CONSTRAINT fk_historial_documento_area FOREIGN KEY (area_id) REFERENCES public.area(id);


--
-- Name: historial_documento fk_historial_documento_documento; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_documento
    ADD CONSTRAINT fk_historial_documento_documento FOREIGN KEY (documento_id) REFERENCES public.documento(id);


--
-- Name: historial_documento fk_historial_documento_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_documento
    ADD CONSTRAINT fk_historial_documento_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- Name: permiso_emision_documento fk_permiso_emision_tipo_documento; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permiso_emision_documento
    ADD CONSTRAINT fk_permiso_emision_tipo_documento FOREIGN KEY (tipo_documento_id) REFERENCES public.tipo_documento(id);


--
-- Name: respuesta fk_respuesta_area_responde; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuesta
    ADD CONSTRAINT fk_respuesta_area_responde FOREIGN KEY (area_responde_id) REFERENCES public.area(id);


--
-- Name: respuesta fk_respuesta_documento_origen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuesta
    ADD CONSTRAINT fk_respuesta_documento_origen FOREIGN KEY (documento_origen_id) REFERENCES public.documento(id);


--
-- Name: respuesta fk_respuesta_documento_respuesta; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuesta
    ADD CONSTRAINT fk_respuesta_documento_respuesta FOREIGN KEY (documento_respuesta_id) REFERENCES public.documento(id);


--
-- Name: respuesta fk_respuesta_usuario_responde; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuesta
    ADD CONSTRAINT fk_respuesta_usuario_responde FOREIGN KEY (usuario_responde_id) REFERENCES public.usuario(id);


--
-- Name: turno_documento fk_turno_documento_area_destino; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turno_documento
    ADD CONSTRAINT fk_turno_documento_area_destino FOREIGN KEY (area_destino_id) REFERENCES public.area(id);


--
-- Name: turno_documento fk_turno_documento_area_origen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turno_documento
    ADD CONSTRAINT fk_turno_documento_area_origen FOREIGN KEY (area_origen_id) REFERENCES public.area(id);


--
-- Name: turno_documento fk_turno_documento_documento; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turno_documento
    ADD CONSTRAINT fk_turno_documento_documento FOREIGN KEY (documento_id) REFERENCES public.documento(id);


--
-- Name: turno_documento fk_turno_documento_usuario_turna; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turno_documento
    ADD CONSTRAINT fk_turno_documento_usuario_turna FOREIGN KEY (usuario_turna_id) REFERENCES public.usuario(id);


--
-- Name: usuario fk_usuario_area; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT fk_usuario_area FOREIGN KEY (area_id) REFERENCES public.area(id);


--
-- Name: usuario fk_usuario_rol; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES public.rol(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

