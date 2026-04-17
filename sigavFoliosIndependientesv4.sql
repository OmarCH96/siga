--
-- PostgreSQL database dump
--

\restrict Tc2qf5fgOJQP3JOqAHJqJEKg0KMCTVYz4502enQlD0GmUvLbuUkspRdRsBr9eEg

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

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
-- Name: contexto_documento_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contexto_documento_enum AS ENUM (
    'OFICIO',
    'MEMORANDUM',
    'CIRCULAR',
    'COMUNICADO_INT',
    'INFORME',
    'EXPEDIENTE',
    'OTRO'
);


ALTER TYPE public.contexto_documento_enum OWNER TO postgres;

--
-- Name: TYPE contexto_documento_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.contexto_documento_enum IS 'Contexto administrativo del documento. OFICIO requiere préstamo de número. MEMORANDUM/CIRCULAR/COMUNICADO_INT pueden cruzar ramas con copia a Subsecretaría.';


--
-- Name: estado_documento_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_documento_enum AS ENUM (
    'REGISTRADO',
    'TURNADO',
    'RECIBIDO',
    'EN_PROCESO',
    'RESPONDIDO',
    'DESPACHADO',
    'DEVUELTO',
    'CANCELADO',
    'CERRADO'
);


ALTER TYPE public.estado_documento_enum OWNER TO postgres;

--
-- Name: TYPE estado_documento_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.estado_documento_enum IS 'Estados del documento: REGISTRADO → TURNADO → RECIBIDO → EN_PROCESO → RESPONDIDO → DESPACHADO → CERRADO | DEVUELTO | CANCELADO';


--
-- Name: estado_nodo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_nodo_enum AS ENUM (
    'PENDIENTE',
    'ACTIVO',
    'CERRADO',
    'RETORNADO',
    'CANCELADO'
);


ALTER TYPE public.estado_nodo_enum OWNER TO postgres;

--
-- Name: TYPE estado_nodo_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.estado_nodo_enum IS 'Estado del nodo documental individual dentro de su área';


--
-- Name: estado_prestamo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_prestamo_enum AS ENUM (
    'SOLICITADO',
    'APROBADO',
    'RECHAZADO',
    'UTILIZADO',
    'VENCIDO',
    'EN_REVISION',
    'APROBADO_POSTERIOR',
    'RECHAZADO_POSTERIOR',
    'APROBADO_AUTOMATICO'
);


ALTER TYPE public.estado_prestamo_enum OWNER TO postgres;

--
-- Name: TYPE estado_prestamo_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.estado_prestamo_enum IS 'Estados del prestamo de numero de oficio:







FLUJO TRADICIONAL (aprobacion previa):



  SOLICITADO -> APROBADO -> UTILIZADO | RECHAZADO | VENCIDO







FLUJO CON REVISION DIFERIDA (aprobacion posterior):



  SOLICITADO -> EN_REVISION -> APROBADO_POSTERIOR | RECHAZADO_POSTERIOR | APROBADO_AUTOMATICO







Descripcion detallada:



- SOLICITADO: Solicitud inicial creada por el area descendiente



- APROBADO: Prestamo aprobado previo a emision (flujo tradicional)



- EN_REVISION: Documento emitido inmediatamente, esperando revision del area prestamista



- APROBADO_POSTERIOR: Aprobado despues de la emision del documento (valida retroactivamente)



- RECHAZADO_POSTERIOR: Rechazado despues de emision (invalida el documento emitido)



- APROBADO_AUTOMATICO: Aprobado automaticamente por vencimiento del plazo sin respuesta



- UTILIZADO: Prestamo utilizado en flujo tradicional despues de aprobacion previa



- RECHAZADO: Rechazado antes de emision (flujo tradicional, bloquea emision)



- VENCIDO: Prestamo aprobado pero no utilizado dentro del tiempo limite';


--
-- Name: metodo_despacho_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.metodo_despacho_enum AS ENUM (
    'FISICO',
    'EMAIL',
    'PLATAFORMA',
    'ESTAFETA',
    'OTRO'
);


ALTER TYPE public.metodo_despacho_enum OWNER TO postgres;

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
    'OFICIALÍA',
    'SECRETARIA',
    'SECRETARIA_PARTICULAR',
    'SUBSECRETARIA',
    'INSTITUTO',
    'DIRECCION',
    'DIRECCION_GENERAL',
    'SUBDIRECCION',
    'COORDINACION',
    'DEPARTAMENTO',
    'UNIDAD',
    'COMITE'
);


ALTER TYPE public.tipo_area_enum OWNER TO postgres;

--
-- Name: TYPE tipo_area_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.tipo_area_enum IS 'Tipos estructurales de area. Orden conceptual de jerarquia:











OFICIALIA (solo entrada externa) > SECRETARIA > SECRETARIA_PARTICULAR / SUBSECRETARIA / INSTITUTO >











DIRECCION_GENERAL > DIRECCION > COORDINACION / SUBDIRECCION > DEPARTAMENTO / UNIDAD / COMITE';


--
-- Name: tipo_entidad_externa_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_entidad_externa_enum AS ENUM (
    'CIUDADANO',
    'EMPRESA',
    'MUNICIPIO',
    'ESTADO',
    'DEPENDENCIA_FED',
    'ORGANISMO',
    'ONG',
    'OTRO'
);


ALTER TYPE public.tipo_entidad_externa_enum OWNER TO postgres;

--
-- Name: TYPE tipo_entidad_externa_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.tipo_entidad_externa_enum IS 'Clasifica el tipo de persona u organización externa que origina o recibe un documento.';


--
-- Name: tipo_nodo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_nodo_enum AS ENUM (
    'EMISION',
    'RECEPCION',
    'RETORNO',
    'DEVOLUCION',
    'DESPACHO_EXTERNO',
    'COPIA'
);


ALTER TYPE public.tipo_nodo_enum OWNER TO postgres;

--
-- Name: TYPE tipo_nodo_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.tipo_nodo_enum IS 'EMISION: nodo raíz | RECEPCION: área recibe del área anterior | DEVOLUCION: regresa un nivel | RETORNO: sinónimo correcto de RETURNO (deprecado) | DESPACHO_EXTERNO: Oficialía despacha al exterior | COPIA: copia de conocimiento';


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
-- Name: fn_es_ancestro(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_es_ancestro(p_ancestro_id integer, p_descendiente_id integer) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$





BEGIN





    RETURN EXISTS (





        WITH RECURSIVE ascendencia AS (





            SELECT area_padre_id AS padre





            FROM public.area





            WHERE id = p_descendiente_id





            UNION ALL





            SELECT a.area_padre_id





            FROM public.area a





            INNER JOIN ascendencia anc ON a.id = anc.padre





        )





        SELECT 1 FROM ascendencia WHERE padre = p_ancestro_id





    );





END;





$$;


ALTER FUNCTION public.fn_es_ancestro(p_ancestro_id integer, p_descendiente_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_es_ancestro(p_ancestro_id integer, p_descendiente_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_es_ancestro(p_ancestro_id integer, p_descendiente_id integer) IS 'Devuelve TRUE si p_ancestro_id es antepasado (padre, abuelo, etc.) de p_descendiente_id en la tabla area.';


--
-- Name: fn_es_hijo_directo_secretaria(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_es_hijo_directo_secretaria(p_area_id integer) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$





    SELECT public.fn_padre_directo_tipo(p_area_id) = 'SECRETARIA';





$$;


ALTER FUNCTION public.fn_es_hijo_directo_secretaria(p_area_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_es_hijo_directo_secretaria(p_area_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_es_hijo_directo_secretaria(p_area_id integer) IS 'TRUE si el área depende directamente (padre inmediato) de la Secretaría.';


--
-- Name: fn_establecer_usuario_actual(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_establecer_usuario_actual(p_usuario_id integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$





DECLARE





  v_rol_id INTEGER;





  v_area_id INTEGER;





  v_permisos TEXT;





BEGIN





  -- Obtener informaciÃ³n del usuario





  SELECT rol_id, area_id INTO v_rol_id, v_area_id





  FROM usuario





  WHERE id = p_usuario_id AND activo = true;





  





  -- Si el usuario no existe o estÃ¡ inactivo, lanzar error





  IF NOT FOUND THEN





    RAISE EXCEPTION 'Usuario % no existe o estÃ¡ inactivo', p_usuario_id;





  END IF;





  





  -- Obtener permisos del rol





  SELECT permisos INTO v_permisos





  FROM rol





  WHERE id = v_rol_id;





  





  -- Establecer variables de sesiÃ³n





  PERFORM set_config('app.usuario_id', p_usuario_id::TEXT, false);





  PERFORM set_config('app.rol_id', v_rol_id::TEXT, false);





  PERFORM set_config('app.area_id', v_area_id::TEXT, false);





  PERFORM set_config('app.permisos', v_permisos, false);





  





  -- Log para debugging (comentar en producciÃ³n si causa overhead)





  RAISE DEBUG 'Usuario establecido: id=%, rol=%, area=%', p_usuario_id, v_rol_id, v_area_id;





END;





$$;


ALTER FUNCTION public.fn_establecer_usuario_actual(p_usuario_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_establecer_usuario_actual(p_usuario_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_establecer_usuario_actual(p_usuario_id integer) IS 'Establece el contexto del usuario actual para polÃ­ticas RLS. 





Debe ser llamada por la aplicaciÃ³n al inicio de cada request autenticado.';


--
-- Name: fn_folio(integer, character varying, smallint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_folio(p_area integer, p_tipo character varying, p_anio smallint DEFAULT (EXTRACT(year FROM CURRENT_DATE))::smallint) RETURNS character varying
    LANGUAGE plpgsql
    AS $$





BEGIN





    RETURN fn_generar_folio(p_area, p_tipo, p_anio);





END;





$$;


ALTER FUNCTION public.fn_folio(p_area integer, p_tipo character varying, p_anio smallint) OWNER TO postgres;

--
-- Name: FUNCTION fn_folio(p_area integer, p_tipo character varying, p_anio smallint); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_folio(p_area integer, p_tipo character varying, p_anio smallint) IS 'Alias corto de fn_generar_folio(). Genera folio oficial para un área. Ej: EM-SMADSOT.DA-0001/2026';


--
-- Name: fn_folio(integer, character varying, smallint, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_folio(p_area integer, p_tipo character varying, p_anio smallint DEFAULT (EXTRACT(year FROM CURRENT_DATE))::smallint, p_tipo_documento_id integer DEFAULT NULL::integer) RETURNS character varying
    LANGUAGE plpgsql
    AS $$ BEGIN RETURN fn_generar_folio(p_area, p_tipo, p_anio, p_tipo_documento_id); END; $$;


ALTER FUNCTION public.fn_folio(p_area integer, p_tipo character varying, p_anio smallint, p_tipo_documento_id integer) OWNER TO postgres;

--
-- Name: fn_generar_folio(integer, character varying, smallint, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_generar_folio(p_area_id integer, p_tipo_operacion character varying, p_anio smallint DEFAULT (EXTRACT(year FROM CURRENT_DATE))::smallint, p_tipo_documento_id integer DEFAULT NULL::integer) RETURNS character varying
    LANGUAGE plpgsql
    AS $$



DECLARE



    v_prefijo_op VARCHAR(5); v_clave_area VARCHAR(50); v_consecutivo INTEGER; v_clave_tipo_doc VARCHAR(5);



BEGIN



    IF p_tipo_operacion = 'EMISION' AND p_tipo_documento_id IS NOT NULL THEN



        SELECT clave INTO v_clave_tipo_doc FROM tipo_documento WHERE id = p_tipo_documento_id AND activo = TRUE;



        IF v_clave_tipo_doc IS NULL THEN RAISE EXCEPTION 'Tipo de documento no encontrado'; END IF;



        v_prefijo_op := v_clave_tipo_doc;



        v_consecutivo := public.fn_siguiente_consecutivo(p_area_id, v_clave_tipo_doc, p_anio);



    ELSE



        v_prefijo_op := CASE p_tipo_operacion WHEN 'EMISION' THEN 'EM' WHEN 'RECEPCION' THEN 'RE' ELSE UPPER(LEFT(p_tipo_operacion, 2)) END;



        v_consecutivo := public.fn_siguiente_consecutivo(p_area_id, p_tipo_operacion, p_anio);



    END IF;



    SELECT clave INTO v_clave_area FROM area WHERE id = p_area_id;



    IF v_clave_area IS NULL THEN RAISE EXCEPTION 'Area no encontrada'; END IF;



    RETURN FORMAT('%s-SMADSOT.%s-%s/%s', v_prefijo_op, v_clave_area, LPAD(v_consecutivo::TEXT, 4, '0'), p_anio);



END;



$$;


ALTER FUNCTION public.fn_generar_folio(p_area_id integer, p_tipo_operacion character varying, p_anio smallint, p_tipo_documento_id integer) OWNER TO postgres;

--
-- Name: fn_limpiar_tokens_expirados(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_limpiar_tokens_expirados() RETURNS integer
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_tokens_eliminados INTEGER;





BEGIN





    -- Eliminar tokens expirados hace más de 30 días





    DELETE FROM refresh_tokens 





    WHERE fecha_expiracion < NOW() - INTERVAL '30 days';





    





    GET DIAGNOSTICS v_tokens_eliminados = ROW_COUNT;





    





    RETURN v_tokens_eliminados;





END;





$$;


ALTER FUNCTION public.fn_limpiar_tokens_expirados() OWNER TO postgres;

--
-- Name: FUNCTION fn_limpiar_tokens_expirados(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_limpiar_tokens_expirados() IS 'Elimina tokens de refresco expirados hace más de 30 días.





Devuelve el número de tokens eliminados.';


--
-- Name: fn_limpiar_tokens_revocados_antiguos(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_limpiar_tokens_revocados_antiguos() RETURNS integer
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_tokens_eliminados INTEGER;





BEGIN





    DELETE FROM refresh_tokens 





    WHERE revocado = TRUE 





      AND fecha_revocacion < NOW() - INTERVAL '90 days';





    





    GET DIAGNOSTICS v_tokens_eliminados = ROW_COUNT;





    





    RETURN v_tokens_eliminados;





END;





$$;


ALTER FUNCTION public.fn_limpiar_tokens_revocados_antiguos() OWNER TO postgres;

--
-- Name: FUNCTION fn_limpiar_tokens_revocados_antiguos(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_limpiar_tokens_revocados_antiguos() IS 'Elimina tokens revocados hace más de 90 días.





Devuelve el número de tokens eliminados.';


--
-- Name: fn_marcar_prestamos_revision_vencidos(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_marcar_prestamos_revision_vencidos() RETURNS integer
    LANGUAGE plpgsql
    AS $$



DECLARE



    v_count INTEGER := 0;



    v_prestamo RECORD;



BEGIN



    -- Buscar prestamos en estado EN_REVISION vencidos



    FOR v_prestamo IN



        SELECT 



            p.id,



            p.documento_id,



            p.folio_asignado,



            p.area_prestamista_id



        FROM prestamo_numero_oficio p



        WHERE p.estado = 'EN_REVISION'



        AND p.fecha_limite_revision < CURRENT_TIMESTAMP



        ORDER BY p.fecha_limite_revision ASC



    LOOP



        -- Actualizar prestamo a APROBADO_AUTOMATICO



        UPDATE prestamo_numero_oficio



        SET estado = 'APROBADO_AUTOMATICO',



            usuario_resuelve_id = NULL, -- NULL indica aprobacion automatica del sistema



            fecha_resolucion = CURRENT_TIMESTAMP



        WHERE id = v_prestamo.id;







        -- Registrar en historial del documento



        INSERT INTO historial_documento (



            documento_id,



            accion,



            usuario_id,



            area_id,



            observaciones



        ) VALUES (



            v_prestamo.documento_id,



            'APROBACION_AUTOMATICA',



            NULL, -- Sistema



            v_prestamo.area_prestamista_id,



            'Prestamo aprobado automaticamente por vencimiento del plazo de revision. Documento validado.'



        );







        v_count := v_count + 1;







        RAISE DEBUG 'Prestamo % aprobado automaticamente', v_prestamo.id;



    END LOOP;







    IF v_count > 0 THEN



        RAISE NOTICE 'Prestamos aprobados automaticamente por vencimiento: %', v_count;



    END IF;







    RETURN v_count;



END;



$$;


ALTER FUNCTION public.fn_marcar_prestamos_revision_vencidos() OWNER TO postgres;

--
-- Name: FUNCTION fn_marcar_prestamos_revision_vencidos(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_marcar_prestamos_revision_vencidos() IS 'Job automatico que aprueba prestamos en estado EN_REVISION cuando vence 



el plazo de revision (fecha_limite_revision < NOW). 







El area prestamista tiene un plazo configurable (default: 5 dias) para 



revisar y aprobar/rechazar. Si el plazo vence sin respuesta, el prestamo 



se aprueba automaticamente con estado APROBADO_AUTOMATICO.







Debe ejecutarse diariamente via pg_cron:



  SELECT cron.schedule(



    ''aprobar-prestamos-revision-vencidos'',



    ''0 2 * * *'',



    ''SELECT fn_marcar_prestamos_revision_vencidos();''



  );







Retorna: Cantidad de prestamos aprobados automaticamente.';


--
-- Name: fn_marcar_prestamos_vencidos(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_marcar_prestamos_vencidos() RETURNS integer
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_prestamos_actualizados INTEGER;





BEGIN





    UPDATE public.prestamo_numero_oficio





    SET estado = 'VENCIDO'





    WHERE estado = 'APROBADO'





      AND fecha_vencimiento < CURRENT_TIMESTAMP;





    





    GET DIAGNOSTICS v_prestamos_actualizados = ROW_COUNT;





    





    RAISE NOTICE 'Préstamos marcados como VENCIDO: %', v_prestamos_actualizados;





    





    RETURN v_prestamos_actualizados;





END;





$$;


ALTER FUNCTION public.fn_marcar_prestamos_vencidos() OWNER TO postgres;

--
-- Name: FUNCTION fn_marcar_prestamos_vencidos(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_marcar_prestamos_vencidos() IS 'Marca como VENCIDO los préstamos aprobados cuya fecha de vencimiento ha pasado. Ejecutar diariamente.';


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
-- Name: fn_padre_directo_tipo(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_padre_directo_tipo(p_area_id integer) RETURNS public.tipo_area_enum
    LANGUAGE sql STABLE
    AS $$





    SELECT a_padre.tipo





    FROM public.area a_hijo





    JOIN public.area a_padre ON a_padre.id = a_hijo.area_padre_id





    WHERE a_hijo.id = p_area_id;





$$;


ALTER FUNCTION public.fn_padre_directo_tipo(p_area_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_padre_directo_tipo(p_area_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_padre_directo_tipo(p_area_id integer) IS 'Devuelve el tipo del área padre inmediato. NULL si el área no tiene padre.';


--
-- Name: fn_pertenece_a_area_o_descendientes(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_pertenece_a_area_o_descendientes(p_area_id integer) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$





DECLARE





  v_area_id INTEGER;





BEGIN





  -- Obtener Ã¡rea del usuario actual





  v_area_id := current_setting('app.area_id', true)::INTEGER;





  





  IF v_area_id IS NULL THEN





    RETURN false;





  END IF;





  





  -- Verificar si el Ã¡rea del usuario es la misma o ancestro del Ã¡rea especificada





  RETURN EXISTS (





    WITH RECURSIVE jerarquia AS (





      -- Caso base: Ã¡rea especificada





      SELECT id, area_padre_id





      FROM area





      WHERE id = p_area_id





      





      UNION ALL





      





      -- Recursivo: subir por la jerarquÃ­a





      SELECT a.id, a.area_padre_id





      FROM area a





      INNER JOIN jerarquia j ON a.id = j.area_padre_id





    )





    SELECT 1 FROM jerarquia WHERE id = v_area_id





  );





END;





$$;


ALTER FUNCTION public.fn_pertenece_a_area_o_descendientes(p_area_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_pertenece_a_area_o_descendientes(p_area_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_pertenece_a_area_o_descendientes(p_area_id integer) IS 'Verifica si el usuario actual pertenece al Ã¡rea especificada o a un Ã¡rea superior en la jerarquÃ­a.';


--
-- Name: fn_puede_aprobar_prestamo(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_puede_aprobar_prestamo(p_usuario_id integer, p_prestamo_id integer) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$

DECLARE

    v_area_usuario INTEGER;

    v_area_prestamista INTEGER;

    v_permisos TEXT;

    v_nombre_rol TEXT;

BEGIN

    -- Obtener el área del usuario y sus permisos

    SELECT u.area_id, r.permisos, r.nombre

    INTO v_area_usuario, v_permisos, v_nombre_rol

    FROM public.usuario u

    INNER JOIN public.rol r ON u.rol_id = r.id

    WHERE u.id = p_usuario_id AND u.activo = TRUE;



    IF NOT FOUND THEN

        RETURN FALSE;

    END IF;



    -- Obtener el área prestamista del préstamo

    SELECT area_prestamista_id

    INTO v_area_prestamista

    FROM public.prestamo_numero_oficio

    WHERE id = p_prestamo_id;



    IF NOT FOUND THEN

        RETURN FALSE;

    END IF;



    -- Validar que el usuario pertenezca al área prestamista

    IF v_area_usuario <> v_area_prestamista THEN

        RETURN FALSE;

    END IF;



    -- Validar permisos:

    -- 1. Administrador tiene acceso total (*)

    -- 2. Roles específicos autorizados: Secretario, Subsecretario, Director, Enlace Administrativo

    -- 3. O tener explícitamente el permiso APROBAR_PRESTAMO

    IF v_permisos = '*' THEN

        RETURN TRUE;

    END IF;



    IF v_nombre_rol IN ('Secretario', 'Subsecretario', 'Director', 'Enlace Administrativo') THEN

        RETURN TRUE;

    END IF;



    IF v_permisos LIKE '%APROBAR_PRESTAMO%' THEN

        RETURN TRUE;

    END IF;



    RETURN FALSE;

END;

$$;


ALTER FUNCTION public.fn_puede_aprobar_prestamo(p_usuario_id integer, p_prestamo_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_puede_aprobar_prestamo(p_usuario_id integer, p_prestamo_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_puede_aprobar_prestamo(p_usuario_id integer, p_prestamo_id integer) IS 'Valida si un usuario puede aprobar un préstamo de número de oficio. El usuario debe pertenecer al área prestamista y tener el permiso APROBAR_PRESTAMO, o ser Administrador, Secretario, Subsecretario, Director, o Enlace Administrativo del área prestamista.';


--
-- Name: fn_puede_solicitar_prestamo(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_puede_solicitar_prestamo(p_area_solicitante_id integer, p_area_prestamista_id integer) RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$





DECLARE





    v_nombre_sol    VARCHAR(200);





    v_nombre_prest  VARCHAR(200);





    v_tipo_prest    public.tipo_area_enum;





    v_tipos_prestamista CONSTANT public.tipo_area_enum[] :=





        ARRAY['SECRETARIA','SUBSECRETARIA','INSTITUTO','DIRECCION_GENERAL','DIRECCION']::public.tipo_area_enum[];





BEGIN





    -- La propia área siempre puede (genera su propio número)





    IF p_area_solicitante_id = p_area_prestamista_id THEN





        RETURN NULL;





    END IF;











    SELECT nombre INTO v_nombre_sol   FROM public.area WHERE id = p_area_solicitante_id;





    SELECT nombre, tipo INTO v_nombre_prest, v_tipo_prest





    FROM public.area WHERE id = p_area_prestamista_id AND activa = TRUE;











    IF NOT FOUND THEN





        RETURN FORMAT('El área prestamista %s no existe o está inactiva.', p_area_prestamista_id);





    END IF;











    -- El prestamista debe ser de un tipo que puede prestar números





    IF v_tipo_prest <> ALL(v_tipos_prestamista) THEN





        RETURN FORMAT(





            '"%s" no puede prestar números: su tipo (%s) no está autorizado para ello. '





            'Solo pueden prestar: Secretaría, Subsecretaría, Instituto, Dirección General, Dirección.',





            v_nombre_prest, v_tipo_prest





        );





    END IF;











    -- El prestamista debe ser ancestro del solicitante





    IF NOT public.fn_es_ancestro(p_area_prestamista_id, p_area_solicitante_id) THEN





        RETURN FORMAT(





            '"%s" no puede solicitar un número a "%s": '





            'el área prestamista no es ancestro del área solicitante. '





            'Solo puede pedirse a la propia área, su Subsecretaría o la Secretaría.',





            v_nombre_sol, v_nombre_prest





        );





    END IF;











    RETURN NULL; -- válido





END;





$$;


ALTER FUNCTION public.fn_puede_solicitar_prestamo(p_area_solicitante_id integer, p_area_prestamista_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_puede_solicitar_prestamo(p_area_solicitante_id integer, p_area_prestamista_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_puede_solicitar_prestamo(p_area_solicitante_id integer, p_area_prestamista_id integer) IS 'Valida si el área solicitante puede pedir un número al prestamista. El prestamista debe ser la propia área o un ancestro de tipo autorizado (SECRETARIA, SUBSECRETARIA, INSTITUTO, DIRECCION_GENERAL, DIRECCION).';


--
-- Name: fn_rel(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_rel(p_origen integer, p_destino integer) RETURNS character varying
    LANGUAGE plpgsql STABLE
    AS $$





BEGIN





    RETURN fn_relacion_jerarquica(p_origen, p_destino);





END;





$$;


ALTER FUNCTION public.fn_rel(p_origen integer, p_destino integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_rel(p_origen integer, p_destino integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_rel(p_origen integer, p_destino integer) IS 'Alias corto de fn_relacion_jerarquica(). Devuelve: MISMO_NIVEL, ASCENDENTE, DESCENDENTE, SIN_RELACION.';


--
-- Name: fn_relacion_jerarquica(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_relacion_jerarquica(p_area_origen_id integer, p_area_destino_id integer) RETURNS character varying
    LANGUAGE plpgsql STABLE
    AS $$





DECLARE





    v_padre_origen  INTEGER;





    v_padre_destino INTEGER;





BEGIN





    IF p_area_origen_id = p_area_destino_id THEN





        RETURN 'MISMO';





    END IF;











    -- ¿El destino es descendiente del origen?





    IF public.fn_es_ancestro(p_area_origen_id, p_area_destino_id) THEN





        RETURN 'DESCENDENTE';





    END IF;











    -- ¿El destino es ancestro del origen?





    IF public.fn_es_ancestro(p_area_destino_id, p_area_origen_id) THEN





        RETURN 'ASCENDENTE';





    END IF;











    -- ¿Comparten padre inmediato? → Lateral





    SELECT area_padre_id INTO v_padre_origen  FROM public.area WHERE id = p_area_origen_id;





    SELECT area_padre_id INTO v_padre_destino FROM public.area WHERE id = p_area_destino_id;











    IF v_padre_origen IS NOT NULL





       AND v_padre_destino IS NOT NULL





       AND v_padre_origen = v_padre_destino THEN





        RETURN 'LATERAL';





    END IF;











    -- En cualquier otro caso: cruce de ramas





    RETURN 'CRUCE';





END;





$$;


ALTER FUNCTION public.fn_relacion_jerarquica(p_area_origen_id integer, p_area_destino_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_relacion_jerarquica(p_area_origen_id integer, p_area_destino_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_relacion_jerarquica(p_area_origen_id integer, p_area_destino_id integer) IS 'Clasifica la relación posicional entre dos áreas: DESCENDENTE, ASCENDENTE, LATERAL, CRUCE o MISMO.';


--
-- Name: fn_ruta_folio(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_ruta_folio(p_nodo_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_nodo_actual_id    INTEGER := p_nodo_id;





    v_folio             VARCHAR(80);





    v_padre_id          INTEGER;





    v_folios            TEXT[] := ARRAY[]::TEXT[];





BEGIN





    LOOP





        SELECT folio_propio, nodo_padre_id





        INTO v_folio, v_padre_id





        FROM public.nodo_documental





        WHERE id = v_nodo_actual_id;











        EXIT WHEN NOT FOUND;











        -- Solo incluir folios con valor real





        IF v_folio <> '' THEN





            v_folios := ARRAY[v_folio] || v_folios;





        END IF;











        EXIT WHEN v_padre_id IS NULL;





        v_nodo_actual_id := v_padre_id;





    END LOOP;











    RETURN ARRAY_TO_STRING(v_folios, ' → ');





END;





$$;


ALTER FUNCTION public.fn_ruta_folio(p_nodo_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_ruta_folio(p_nodo_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_ruta_folio(p_nodo_id integer) IS 'Reconstruye la cadena de folios desde el origen hasta el nodo indicado. Ejemplo: EM-SMADSOT.DA-CRFFH-0001/2026 → RE-SMADSOT.DA-0001/2026';


--
-- Name: fn_siguiente_consecutivo(integer, character varying, smallint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_siguiente_consecutivo(p_area_id integer, p_tipo_operacion character varying, p_anio smallint DEFAULT (EXTRACT(year FROM CURRENT_DATE))::smallint) RETURNS integer
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_siguiente INTEGER;





BEGIN





    -- Insertar registro si no existe (primer folio del año/área/tipo)





    INSERT INTO public.consecutivo_area (area_id, tipo_operacion, anio, ultimo_consecutivo)





    VALUES (p_area_id, p_tipo_operacion, p_anio, 0)





    ON CONFLICT (area_id, tipo_operacion, anio) DO NOTHING;











    -- Incrementar con bloqueo de fila (el FOR UPDATE implícito del UPDATE)





    UPDATE public.consecutivo_area





    SET





        ultimo_consecutivo  = ultimo_consecutivo + 1,





        fecha_actualizacion = CURRENT_TIMESTAMP





    WHERE





        area_id        = p_area_id





        AND tipo_operacion = p_tipo_operacion





        AND anio           = p_anio





    RETURNING ultimo_consecutivo INTO v_siguiente;











    RETURN v_siguiente;





END;





$$;


ALTER FUNCTION public.fn_siguiente_consecutivo(p_area_id integer, p_tipo_operacion character varying, p_anio smallint) OWNER TO postgres;

--
-- Name: FUNCTION fn_siguiente_consecutivo(p_area_id integer, p_tipo_operacion character varying, p_anio smallint); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_siguiente_consecutivo(p_area_id integer, p_tipo_operacion character varying, p_anio smallint) IS 'Devuelve el siguiente número de folio para un área/operación/año. Thread-safe: usa UPDATE con lock de fila para evitar duplicados.';


--
-- Name: fn_subsecretaria_de(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_subsecretaria_de(p_area_id integer) RETURNS integer
    LANGUAGE plpgsql STABLE
    AS $$





DECLARE





    v_actual_id   INTEGER;





    v_padre_id    INTEGER;





    v_tipo        public.tipo_area_enum;





BEGIN





    v_actual_id := p_area_id;











    LOOP





        SELECT area_padre_id, tipo





        INTO v_padre_id, v_tipo





        FROM public.area





        WHERE id = v_actual_id;











        EXIT WHEN NOT FOUND OR v_padre_id IS NULL;











        -- El padre inmediato es Subsecretaría/Instituto → retornar ese padre





        SELECT tipo INTO v_tipo FROM public.area WHERE id = v_padre_id;





        IF v_tipo IN ('SUBSECRETARIA', 'INSTITUTO') THEN





            RETURN v_padre_id;





        END IF;











        -- Ya llegamos a la Secretaría o por encima → no hay Subsecretaría en la cadena





        IF v_tipo IN ('SECRETARIA', 'OFICIALÍA') THEN





            RETURN NULL;





        END IF;











        v_actual_id := v_padre_id;





    END LOOP;











    RETURN NULL;





END;





$$;


ALTER FUNCTION public.fn_subsecretaria_de(p_area_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_subsecretaria_de(p_area_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_subsecretaria_de(p_area_id integer) IS 'Devuelve el id de la Subsecretaría (o Instituto) que es ancestro del área dada. NULL si el área cuelga directamente de la Secretaría sin pasar por Subsecretaría.';


--
-- Name: fn_tiene_permiso(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_tiene_permiso(p_permiso text) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$





DECLARE





  v_permisos TEXT;





BEGIN





  -- Obtener permisos del contexto





  v_permisos := current_setting('app.permisos', true);





  





  -- Si es NULL (request no autenticado), denegar





  IF v_permisos IS NULL THEN





    RETURN false;





  END IF;





  





  -- Si tiene '*', es admin con todos los permisos





  IF v_permisos = '*' THEN





    RETURN true;





  END IF;





  





  -- Verificar si el permiso estÃ¡ en la lista (formato: PERM1,PERM2,PERM3)





  RETURN ',' || v_permisos || ',' LIKE '%,' || p_permiso || ',%';





END;





$$;


ALTER FUNCTION public.fn_tiene_permiso(p_permiso text) OWNER TO postgres;

--
-- Name: FUNCTION fn_tiene_permiso(p_permiso text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_tiene_permiso(p_permiso text) IS 'Verifica si el usuario actual tiene un permiso especÃ­fico.





Retorna true si tiene el permiso o es administrador (*).';


--
-- Name: fn_validar(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_validar(p_origen integer, p_destino integer) RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$





BEGIN





    RETURN fn_validar_turno(p_origen, p_destino);





END;





$$;


ALTER FUNCTION public.fn_validar(p_origen integer, p_destino integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_validar(p_origen integer, p_destino integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_validar(p_origen integer, p_destino integer) IS 'Alias corto de fn_validar_turno(). Valida si un turno de área_origen a área_destino está permitido.';


--
-- Name: fn_validar_turno(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_validar_turno(p_area_origen_id integer, p_area_destino_id integer) RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$





DECLARE





    v_tipo_origen         public.tipo_area_enum;





    v_tipo_destino        public.tipo_area_enum;





    v_nombre_origen       VARCHAR(200);





    v_nombre_destino      VARCHAR(200);





    v_relacion            VARCHAR(20);





    v_regla_existe        BOOLEAN;





    v_excepcion_existe    BOOLEAN;





BEGIN





    -- 0. Misma área





    IF p_area_origen_id = p_area_destino_id THEN





        RETURN 'No se puede turnar un documento a la misma área.';





    END IF;











    -- Obtener datos de ambas áreas





    SELECT tipo, nombre INTO v_tipo_origen, v_nombre_origen





    FROM public.area WHERE id = p_area_origen_id AND activa = TRUE;











    IF NOT FOUND THEN





        RETURN FORMAT('Área origen %s no existe o está inactiva.', p_area_origen_id);





    END IF;











    SELECT tipo, nombre INTO v_tipo_destino, v_nombre_destino





    FROM public.area WHERE id = p_area_destino_id AND activa = TRUE;











    IF NOT FOUND THEN





        RETURN FORMAT('Área destino %s no existe o está inactiva.', p_area_destino_id);





    END IF;











    -- COMITÉ nunca puede originar ni recibir turnos operativos





    IF v_tipo_origen = 'COMITE' THEN





        RETURN FORMAT('Los COMITÉS (%s) no pueden turnar documentos operativos.', v_nombre_origen);





    END IF;





    IF v_tipo_destino = 'COMITE' THEN





        RETURN FORMAT('Los COMITÉS (%s) no pueden recibir documentos por turno operativo.', v_nombre_destino);





    END IF;











    -- a) EXCEPCIÓN EXPLÍCITA ÁREA-ÁREA (mayor prioridad)





    SELECT EXISTS (





        SELECT 1 FROM public.excepcion_turno_area





        WHERE activa = TRUE





          AND (





              (area_origen_id = p_area_origen_id AND area_destino_id = p_area_destino_id)





              OR





              (bidireccional = TRUE AND area_origen_id = p_area_destino_id AND area_destino_id = p_area_origen_id)





          )





    ) INTO v_excepcion_existe;











    IF v_excepcion_existe THEN





        RETURN NULL; -- Permitido por excepción explícita





    END IF;











    -- b) REGLA POR TIPO + condición posicional





    v_relacion := public.fn_relacion_jerarquica(p_area_origen_id, p_area_destino_id);











    SELECT EXISTS (





        SELECT 1 FROM public.regla_turno





        WHERE activa         = TRUE





          AND tipo_origen    = v_tipo_origen





          AND tipo_destino   = v_tipo_destino





          AND (condicion_relacion = v_relacion OR condicion_relacion = 'CUALQUIERA')





    ) INTO v_regla_existe;











    IF v_regla_existe THEN





        RETURN NULL; -- Permitido por regla





    END IF;











    -- c) DENEGADO — construir mensaje detallado





    RETURN FORMAT(





        'TURNO NO PERMITIDO: "%s" (%s) → "%s" (%s). '





        'Relación jerárquica: %s. '





        'No existe una regla activa que autorice esta combinación. '





        'Contacte al administrador del sistema para configurarla.',





        v_nombre_origen, v_tipo_origen,





        v_nombre_destino, v_tipo_destino,





        v_relacion





    );





END;





$$;


ALTER FUNCTION public.fn_validar_turno(p_area_origen_id integer, p_area_destino_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_validar_turno(p_area_origen_id integer, p_area_destino_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_validar_turno(p_area_origen_id integer, p_area_destino_id integer) IS 'Valida si es permitido turnar un documento de un área a otra. Devuelve NULL si es válido o un mensaje de error. Evalúa: 1) excepciones explícitas área-área, 2) reglas por tipo+relación, 3) deniega por defecto.';


--
-- Name: fn_verificar_integridad_sistema(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_verificar_integridad_sistema() RETURNS TABLE(check_name text, status text, detalles text)
    LANGUAGE plpgsql
    AS $$





BEGIN





    -- Check 1: Documentos sin nodo activo





    RETURN QUERY





    SELECT 





        'Documentos sin nodo activo'::TEXT,





        CASE 





            WHEN COUNT(*) = 0 THEN '✅ OK'





            ELSE '⚠️ ERROR'





        END::TEXT,





        FORMAT('%s documentos sin nodo activo', COUNT(*))::TEXT





    FROM public.documento d





    LEFT JOIN public.nodo_documental n ON d.id = n.documento_id AND n.es_nodo_activo = TRUE





    WHERE n.id IS NULL





      AND d.estado NOT IN ('CANCELADO', 'CERRADO', 'DESPACHADO');





    





    -- Check 2: Documentos con múltiples nodos activos





    RETURN QUERY





    SELECT 





        'Documentos con múltiples nodos activos'::TEXT,





        CASE 





            WHEN COUNT(*) = 0 THEN '✅ OK'





            ELSE '⚠️ ERROR'





        END::TEXT,





        FORMAT('%s documentos con múltiples nodos activos', COUNT(*))::TEXT





    FROM (





        SELECT documento_id, COUNT(*) AS cnt





        FROM public.nodo_documental





        WHERE es_nodo_activo = TRUE





        GROUP BY documento_id





        HAVING COUNT(*) > 1





    ) subq;





    





    -- Check 3: Nodos huérfanos (sin documento)





    RETURN QUERY





    SELECT 





        'Nodos huérfanos'::TEXT,





        CASE 





            WHEN COUNT(*) = 0 THEN '✅ OK'





            ELSE '⚠️ WARNING'





        END::TEXT,





        FORMAT('%s nodos sin documento válido', COUNT(*))::TEXT





    FROM public.nodo_documental n





    LEFT JOIN public.documento d ON n.documento_id = d.id





    WHERE d.id IS NULL;





    





    -- Check 4: Oficios sin préstamo





    RETURN QUERY





    SELECT 





        'Oficios sin préstamo'::TEXT,





        CASE 





            WHEN COUNT(*) = 0 THEN '✅ OK'





            ELSE '⚠️ ERROR'





        END::TEXT,





        FORMAT('%s oficios sin prestamo_numero_id', COUNT(*))::TEXT





    FROM public.documento





    WHERE contexto = 'OFICIO' AND prestamo_numero_id IS NULL;





    





    -- Check 5: Préstamos aprobados sin folio





    RETURN QUERY





    SELECT 





        'Préstamos aprobados sin folio'::TEXT,





        CASE 





            WHEN COUNT(*) = 0 THEN '✅ OK'





            ELSE '⚠️ ERROR'





        END::TEXT,





        FORMAT('%s préstamos aprobados sin folio_asignado', COUNT(*))::TEXT





    FROM public.prestamo_numero_oficio





    WHERE estado = 'APROBADO' AND folio_asignado IS NULL;





    





    -- Check 6: Préstamos vencidos no marcados





    RETURN QUERY





    SELECT 





        'Préstamos vencidos sin marcar'::TEXT,





        CASE 





            WHEN COUNT(*) = 0 THEN '✅ OK'





            ELSE '⚠️ WARNING'





        END::TEXT,





        FORMAT('%s préstamos vencidos en estado APROBADO', COUNT(*))::TEXT





    FROM public.prestamo_numero_oficio





    WHERE estado = 'APROBADO' 





      AND fecha_vencimiento < CURRENT_TIMESTAMP;





    





    -- Check 7: Áreas sin jerarquía correcta





    RETURN QUERY





    SELECT 





        'Áreas con ciclos'::TEXT,





        '✅ OK (Trigger previene ciclos)'::TEXT,





        'Validado por trg_validar_jerarquia_area'::TEXT;





    





END;





$$;


ALTER FUNCTION public.fn_verificar_integridad_sistema() OWNER TO postgres;

--
-- Name: FUNCTION fn_verificar_integridad_sistema(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_verificar_integridad_sistema() IS 'Verifica la integridad referencial y lógica del sistema. Ejecutar periódicamente para diagnóstico.';


--
-- Name: sp_cancelar_documento(integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_cancelar_documento(p_documento_id integer, p_usuario_cancela_id integer, p_motivo_cancelacion character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_area_id INTEGER;





BEGIN





    -- Cerrar nodo activo si existe





    UPDATE public.nodo_documental





    SET





        estado         = 'CANCELADO',





        es_nodo_activo = FALSE,





        fecha_cierre   = CURRENT_TIMESTAMP,





        observaciones  = COALESCE(observaciones || ' | ', '')





                         || 'CANCELADO: ' || p_motivo_cancelacion





    WHERE documento_id = p_documento_id AND es_nodo_activo = TRUE





    RETURNING area_id INTO v_area_id;











    -- Fallback para documentos sin nodo (registros legacy)





    IF v_area_id IS NULL THEN





        SELECT area_origen_id INTO v_area_id





        FROM public.documento WHERE id = p_documento_id;





    END IF;











    -- Cerrar todos los turnos legacy





    UPDATE public.turno_documento





    SET activo = FALSE





    WHERE documento_id = p_documento_id AND activo = TRUE;











    -- Actualizar estado





    UPDATE public.documento





    SET estado = 'CANCELADO',





        fecha_modificacion = CURRENT_TIMESTAMP,





        observaciones = p_motivo_cancelacion





    WHERE id = p_documento_id;











    -- Historial





    INSERT INTO public.historial_documento (documento_id, accion, descripcion, usuario_id, area_id, detalles)





    VALUES (p_documento_id, 'CANCELADO', 'Documento cancelado',





            p_usuario_cancela_id, v_area_id, p_motivo_cancelacion);











    RAISE NOTICE 'Documento % cancelado.', p_documento_id;





END;





$$;


ALTER FUNCTION public.sp_cancelar_documento(p_documento_id integer, p_usuario_cancela_id integer, p_motivo_cancelacion character varying) OWNER TO postgres;

--
-- Name: FUNCTION sp_cancelar_documento(p_documento_id integer, p_usuario_cancela_id integer, p_motivo_cancelacion character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_cancelar_documento(p_documento_id integer, p_usuario_cancela_id integer, p_motivo_cancelacion character varying) IS 'Cancela un documento con motivo especificado';


--
-- Name: sp_cerrar_documento(integer, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_cerrar_documento(p_documento_id integer, p_usuario_cierra_id integer, p_observaciones text DEFAULT 'Cierre del trámite'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_nodo_activo_id    INTEGER;





    v_area_activa_id    INTEGER;





BEGIN





    SELECT id, area_id INTO v_nodo_activo_id, v_area_activa_id





    FROM public.nodo_documental





    WHERE documento_id = p_documento_id AND es_nodo_activo = TRUE;











    IF v_nodo_activo_id IS NOT NULL THEN





        UPDATE public.nodo_documental





        SET





            estado         = 'CERRADO',





            es_nodo_activo = FALSE,





            fecha_cierre   = CURRENT_TIMESTAMP,





            observaciones  = COALESCE(observaciones || ' | ', '') || p_observaciones





        WHERE id = v_nodo_activo_id;





    END IF;











    UPDATE public.documento





    SET estado = 'CERRADO', fecha_modificacion = CURRENT_TIMESTAMP





    WHERE id = p_documento_id;











    INSERT INTO public.historial_documento (documento_id, accion, descripcion, usuario_id, area_id)





    VALUES (p_documento_id, 'CERRADO', p_observaciones,





            p_usuario_cierra_id, v_area_activa_id);











    RAISE NOTICE 'Documento % cerrado.', p_documento_id;





END;





$$;


ALTER FUNCTION public.sp_cerrar_documento(p_documento_id integer, p_usuario_cierra_id integer, p_observaciones text) OWNER TO postgres;

--
-- Name: FUNCTION sp_cerrar_documento(p_documento_id integer, p_usuario_cierra_id integer, p_observaciones text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_cerrar_documento(p_documento_id integer, p_usuario_cierra_id integer, p_observaciones text) IS 'Cierra definitivamente el trámite. Marca el nodo activo y el documento como CERRADO.';


--
-- Name: sp_despachar_externo(integer, integer, integer, public.metodo_despacho_enum, character varying, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_despachar_externo(p_documento_id integer, p_usuario_despacha_id integer, p_entidad_externa_id integer, p_metodo public.metodo_despacho_enum DEFAULT 'FISICO'::public.metodo_despacho_enum, p_numero_guia character varying DEFAULT NULL::character varying, p_archivo_acuse_id integer DEFAULT NULL::integer, p_observaciones text DEFAULT NULL::text, OUT p_despacho_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_nodo_activo_id INTEGER;





    v_area_actual_id INTEGER;





    v_estado_doc estado_documento_enum;





    v_folio_doc VARCHAR(80);





BEGIN





    -- 1. Obtener nodo activo





    SELECT nd.id, nd.area_id





    INTO v_nodo_activo_id, v_area_actual_id





    FROM public.nodo_documental nd





    WHERE nd.documento_id = p_documento_id





      AND nd.es_nodo_activo = TRUE;





    





    IF v_nodo_activo_id IS NULL THEN





        RAISE EXCEPTION 'El documento % no tiene nodo activo', p_documento_id;





    END IF;





    





    -- 2. Validar estado del documento





    SELECT estado, folio





    INTO v_estado_doc, v_folio_doc





    FROM public.documento





    WHERE id = p_documento_id;





    





    IF v_estado_doc IN ('CANCELADO', 'CERRADO', 'DESPACHADO') THEN





        RAISE EXCEPTION 'No se puede despachar: el documento % está en estado %',





            p_documento_id, v_estado_doc;





    END IF;





    





    -- NOTA: YA NO validamos que el área sea OFICIALÍA





    -- Cualquier área puede despachar directamente al exterior





    





    -- 3. Registrar el despacho





    INSERT INTO public.despacho_externo (





        documento_id,





        nodo_id,





        entidad_externa_id,





        fecha_despacho,





        metodo,





        numero_guia,





        archivo_acuse_id,





        usuario_despacha_id,





        observaciones,





        acuse_recibido





    )





    VALUES (





        p_documento_id,





        v_nodo_activo_id,





        p_entidad_externa_id,





        CURRENT_TIMESTAMP,





        p_metodo,





        p_numero_guia,





        p_archivo_acuse_id,





        p_usuario_despacha_id,





        p_observaciones,





        FALSE





    )





    RETURNING id INTO p_despacho_id;





    





    -- 4. Actualizar estado del documento





    UPDATE public.documento





    SET estado = 'DESPACHADO',





        entidad_externa_destino_id = p_entidad_externa_id,





        fecha_modificacion = CURRENT_TIMESTAMP





    WHERE id = p_documento_id;





    





    -- 5. Cerrar el nodo activo





    UPDATE public.nodo_documental





    SET estado = 'CERRADO',





        es_nodo_activo = FALSE,





        fecha_cierre = CURRENT_TIMESTAMP,





        observaciones = COALESCE(observaciones || ' | ', '')





                        || FORMAT('Despachado a entidad externa %s', p_entidad_externa_id)





    WHERE id = v_nodo_activo_id;





    





    -- 6. Historial





    INSERT INTO public.historial_documento (





        documento_id, accion, descripcion, usuario_id, area_id





    )





    VALUES (





        p_documento_id,





        'DESPACHO_EXTERNO',





        FORMAT('Documento despachado a entidad externa %s. Método: %s. Guía: %s',





               p_entidad_externa_id, p_metodo, COALESCE(p_numero_guia, 'N/A')),





        p_usuario_despacha_id,





        v_area_actual_id





    );





    





    RAISE NOTICE 'Documento % despachado desde área % hacia entidad externa %',





        p_documento_id, v_area_actual_id, p_entidad_externa_id;





END;





$$;


ALTER FUNCTION public.sp_despachar_externo(p_documento_id integer, p_usuario_despacha_id integer, p_entidad_externa_id integer, p_metodo public.metodo_despacho_enum, p_numero_guia character varying, p_archivo_acuse_id integer, p_observaciones text, OUT p_despacho_id integer) OWNER TO postgres;

--
-- Name: FUNCTION sp_despachar_externo(p_documento_id integer, p_usuario_despacha_id integer, p_entidad_externa_id integer, p_metodo public.metodo_despacho_enum, p_numero_guia character varying, p_archivo_acuse_id integer, p_observaciones text, OUT p_despacho_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_despachar_externo(p_documento_id integer, p_usuario_despacha_id integer, p_entidad_externa_id integer, p_metodo public.metodo_despacho_enum, p_numero_guia character varying, p_archivo_acuse_id integer, p_observaciones text, OUT p_despacho_id integer) IS 'V5 (CORREGIDO): Registra el despacho físico o digital de un documento hacia una entidad externa. 





PUEDE ejecutarse desde CUALQUIER área, NO solo Oficialía. 





El documento sale directamente del área emisora hacia la entidad externa.





La Oficialía de la dependencia emisora solo maneja documentos ENTRANTES, no salientes.';


--
-- Name: sp_devolver_documento(integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_devolver_documento(p_documento_id integer, p_usuario_devuelve_id integer, p_motivo character varying, OUT p_nodo_devolucion_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_nodo_activo_id        INTEGER;





    v_nodo_padre_id         INTEGER;





    v_area_padre_id         INTEGER;





    v_folio_original        VARCHAR(80);





    v_folio_propio_actual   VARCHAR(80);





BEGIN





    -- 1. Obtener nodo activo





    SELECT id, nodo_padre_id, folio_original, folio_propio





    INTO v_nodo_activo_id, v_nodo_padre_id, v_folio_original, v_folio_propio_actual





    FROM public.nodo_documental





    WHERE documento_id = p_documento_id AND es_nodo_activo = TRUE;











    IF NOT FOUND THEN





        RAISE EXCEPTION 'Sin nodo activo para el documento %.', p_documento_id;





    END IF;











    IF v_nodo_padre_id IS NULL THEN





        RAISE EXCEPTION





            'No se puede devolver el nodo de emisión original. '





            'El documento % no tiene nodo previo al que regresar.', p_documento_id;





    END IF;











    -- 2. Obtener área del nodo padre





    SELECT area_id INTO v_area_padre_id





    FROM public.nodo_documental





    WHERE id = v_nodo_padre_id;











    -- 3. Cerrar el nodo activo





    UPDATE public.nodo_documental





    SET





        estado         = 'RETORNADO',





        es_nodo_activo = FALSE,





        fecha_cierre   = CURRENT_TIMESTAMP,





        observaciones  = COALESCE(observaciones || ' | ', '')





                         || 'DEVUELTO: ' || p_motivo





    WHERE id = v_nodo_activo_id;











    -- 4. Crear nodo DEVOLUCION hacia el padre





    INSERT INTO public.nodo_documental (





        documento_id, tipo_nodo, estado,





        nodo_padre_id,





        folio_original, folio_padre, folio_propio,





        area_id, usuario_responsable_id,





        instrucciones,





        es_nodo_activo





    )





    VALUES (





        p_documento_id, 'DEVOLUCION', 'PENDIENTE',





        v_nodo_activo_id,





        v_folio_original,





        v_folio_propio_actual,





        '',                    -- asignado al confirmar recepción de la devolución





        v_area_padre_id,





        p_usuario_devuelve_id,





        'DEVOLUCIÓN: ' || p_motivo,





        TRUE





    )





    RETURNING id INTO p_nodo_devolucion_id;











    -- 5. Actualizar estado documento





    UPDATE public.documento





    SET estado = 'DEVUELTO', fecha_modificacion = CURRENT_TIMESTAMP





    WHERE id = p_documento_id;











    -- 6. Historial





    INSERT INTO public.historial_documento (documento_id, accion, descripcion, usuario_id, area_id)





    VALUES (





        p_documento_id, 'DEVUELTO',





        FORMAT('Devuelto a área %s. Motivo: %s', v_area_padre_id, p_motivo),





        p_usuario_devuelve_id, v_area_padre_id





    );











    RAISE NOTICE 'Documento % devuelto. Nodo devolución: %',





        p_documento_id, p_nodo_devolucion_id;





END;





$$;


ALTER FUNCTION public.sp_devolver_documento(p_documento_id integer, p_usuario_devuelve_id integer, p_motivo character varying, OUT p_nodo_devolucion_id integer) OWNER TO postgres;

--
-- Name: FUNCTION sp_devolver_documento(p_documento_id integer, p_usuario_devuelve_id integer, p_motivo character varying, OUT p_nodo_devolucion_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_devolver_documento(p_documento_id integer, p_usuario_devuelve_id integer, p_motivo character varying, OUT p_nodo_devolucion_id integer) IS 'Devuelve el documento al área del nodo padre inmediato. No regresa al emisor original necesariamente.';


--
-- Name: sp_emitir_documento(integer, character varying, text, integer, integer, timestamp without time zone, public.prioridad_enum, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_emitir_documento(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone DEFAULT NULL::timestamp without time zone, p_prioridad public.prioridad_enum DEFAULT 'MEDIA'::public.prioridad_enum, p_instrucciones text DEFAULT NULL::text, p_observaciones text DEFAULT NULL::text, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) RETURNS record
    LANGUAGE plpgsql
    AS $$



BEGIN



    p_folio_emision := public.fn_generar_folio(p_area_origen_id, 'EMISION', EXTRACT(YEAR FROM CURRENT_DATE)::SMALLINT, p_tipo_documento_id);



    INSERT INTO documento (folio, tipo_documento_id, asunto, contenido, usuario_creador_id, area_origen_id, estado, prioridad, fecha_limite)



    VALUES (p_folio_emision, p_tipo_documento_id, p_asunto, p_contenido, p_usuario_creador_id, p_area_origen_id, 'REGISTRADO', p_prioridad, p_fecha_limite)



    RETURNING id INTO p_documento_id;



    INSERT INTO nodo_documental (documento_id, tipo_nodo, estado, area_id, usuario_responsable_id, folio_original, folio_propio, es_nodo_activo, instrucciones, observaciones)



    VALUES (p_documento_id, 'EMISION', 'ACTIVO', p_area_origen_id, p_usuario_creador_id, p_folio_emision, p_folio_emision, TRUE, p_instrucciones, p_observaciones)



    RETURNING id INTO p_nodo_id;



END; $$;


ALTER FUNCTION public.sp_emitir_documento(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, p_observaciones text, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) OWNER TO postgres;

--
-- Name: FUNCTION sp_emitir_documento(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, p_observaciones text, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_emitir_documento(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, p_observaciones text, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) IS 'Registra un nuevo documento y crea el nodo EMISION. El folio se genera automáticamente con fn_generar_folio.';


--
-- Name: sp_emitir_documento(integer, character varying, text, integer, integer, timestamp without time zone, public.prioridad_enum, text, text, public.contexto_documento_enum, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_emitir_documento(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone DEFAULT NULL::timestamp without time zone, p_prioridad public.prioridad_enum DEFAULT 'MEDIA'::public.prioridad_enum, p_instrucciones text DEFAULT NULL::text, p_observaciones text DEFAULT NULL::text, p_contexto public.contexto_documento_enum DEFAULT 'OTRO'::public.contexto_documento_enum, p_prestamo_numero_id integer DEFAULT NULL::integer, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) RETURNS record
    LANGUAGE plpgsql
    AS $$



DECLARE v_prestamo_folio VARCHAR(80);



BEGIN



    IF p_contexto = 'OFICIO' THEN



        IF p_prestamo_numero_id IS NULL THEN RAISE EXCEPTION 'Contexto OFICIO requiere prestamo'; END IF;



        SELECT folio_asignado INTO v_prestamo_folio FROM prestamo_numero_oficio WHERE id = p_prestamo_numero_id AND estado = 'APROBADO';



        IF v_prestamo_folio IS NULL THEN RAISE EXCEPTION 'Prestamo no encontrado'; END IF;



        UPDATE prestamo_numero_oficio SET estado = 'UTILIZADO' WHERE id = p_prestamo_numero_id;



        p_folio_emision := v_prestamo_folio;



    ELSE



        p_folio_emision := public.fn_generar_folio(p_area_origen_id, 'EMISION', EXTRACT(YEAR FROM CURRENT_DATE)::SMALLINT, p_tipo_documento_id);



    END IF;



    INSERT INTO documento (folio, tipo_documento_id, asunto, contenido, usuario_creador_id, area_origen_id, estado, prioridad, fecha_limite, contexto, prestamo_numero_id)



    VALUES (p_folio_emision, p_tipo_documento_id, p_asunto, p_contenido, p_usuario_creador_id, p_area_origen_id, 'REGISTRADO', p_prioridad, p_fecha_limite, p_contexto, p_prestamo_numero_id)



    RETURNING id INTO p_documento_id;



    IF p_prestamo_numero_id IS NOT NULL THEN UPDATE prestamo_numero_oficio SET documento_id = p_documento_id WHERE id = p_prestamo_numero_id; END IF;



    INSERT INTO nodo_documental (documento_id, tipo_nodo, estado, area_id, usuario_responsable_id, folio_original, folio_propio, es_nodo_activo, instrucciones, observaciones)



    VALUES (p_documento_id, 'EMISION', 'ACTIVO', p_area_origen_id, p_usuario_creador_id, p_folio_emision, p_folio_emision, TRUE, p_instrucciones, p_observaciones)



    RETURNING id INTO p_nodo_id;



END; $$;


ALTER FUNCTION public.sp_emitir_documento(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, p_observaciones text, p_contexto public.contexto_documento_enum, p_prestamo_numero_id integer, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) OWNER TO postgres;

--
-- Name: sp_emitir_documento_con_revision_diferida(integer, character varying, text, integer, integer, timestamp without time zone, public.prioridad_enum, text, text, public.contexto_documento_enum, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_emitir_documento_con_revision_diferida(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone DEFAULT NULL::timestamp without time zone, p_prioridad public.prioridad_enum DEFAULT 'MEDIA'::public.prioridad_enum, p_instrucciones text DEFAULT NULL::text, p_observaciones text DEFAULT NULL::text, p_contexto public.contexto_documento_enum DEFAULT 'OFICIO'::public.contexto_documento_enum, p_prestamo_numero_id integer DEFAULT NULL::integer, p_dias_revision integer DEFAULT 5, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) RETURNS record
    LANGUAGE plpgsql
    AS $$



DECLARE



    v_prestamo_estado estado_prestamo_enum;



    v_area_prestamista_id INTEGER;



    v_folio_generado VARCHAR(80);



    v_fecha_limite_revision TIMESTAMP;



BEGIN



    -- Validar que el prestamo exista y este en estado SOLICITADO



    SELECT estado, area_prestamista_id



    INTO v_prestamo_estado, v_area_prestamista_id



    FROM prestamo_numero_oficio



    WHERE id = p_prestamo_numero_id;







    IF NOT FOUND THEN



        RAISE EXCEPTION 'El prestamo con ID % no existe', p_prestamo_numero_id;



    END IF;







    IF v_prestamo_estado <> 'SOLICITADO' THEN



        RAISE EXCEPTION 'El prestamo % debe estar en estado SOLICITADO para emision diferida. Estado actual: %',



            p_prestamo_numero_id, v_prestamo_estado;



    END IF;







    -- Generar folio del AREA PRESTAMISTA (no del area emisora)



    v_folio_generado := fn_generar_folio(v_area_prestamista_id, 'EM', EXTRACT(YEAR FROM CURRENT_DATE)::SMALLINT);







    IF v_folio_generado IS NULL THEN



        RAISE EXCEPTION 'Error al generar folio para area prestamista %', v_area_prestamista_id;



    END IF;







    -- Calcular fecha limite de revision (5 dias habiles por defecto)



    v_fecha_limite_revision := CURRENT_TIMESTAMP + (p_dias_revision || ' days')::INTERVAL;







    -- Actualizar prestamo a estado EN_REVISION



    UPDATE prestamo_numero_oficio



    SET estado = 'EN_REVISION',



        folio_asignado = v_folio_generado,



        fecha_limite_revision = v_fecha_limite_revision,



        dias_revision = p_dias_revision



    WHERE id = p_prestamo_numero_id;







    -- Crear el documento con el folio generado



    INSERT INTO documento (



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



    ) VALUES (



        v_folio_generado,



        p_tipo_documento_id,



        p_asunto,



        p_contenido,



        p_fecha_limite,



        p_prioridad,



        'REGISTRADO',



        p_usuario_creador_id,



        p_area_origen_id,



        p_observaciones,



        p_contexto,



        p_prestamo_numero_id



    )



    RETURNING id INTO p_documento_id;







    -- Vincular documento con prestamo



    UPDATE prestamo_numero_oficio



    SET documento_id = p_documento_id



    WHERE id = p_prestamo_numero_id;







    -- Crear nodo EMISION



    INSERT INTO nodo_documental (



        documento_id,



        area_id,



        usuario_responsable_id,



        tipo_nodo,



        estado_nodo,



        instrucciones,



        observaciones



    ) VALUES (



        p_documento_id,



        p_area_origen_id,



        p_usuario_creador_id,



        'EMISION',



        'ACTIVO',



        p_instrucciones,



        'Emitido con revision diferida. Limite de revision: ' || v_fecha_limite_revision::TEXT



    )



    RETURNING id INTO p_nodo_id;







    -- Registrar en historial



    INSERT INTO historial_documento (



        documento_id,



        accion,



        usuario_id,



        area_id,



        observaciones



    ) VALUES (



        p_documento_id,



        'EMISION_DIFERIDA',



        p_usuario_creador_id,



        p_area_origen_id,



        'Documento emitido con revision diferida. Prestamo: ' || p_prestamo_numero_id || 



        '. Limite revision: ' || v_fecha_limite_revision::TEXT



    );







    -- Asignar valores de salida



    p_folio_emision := v_folio_generado;







    RAISE NOTICE 'Documento % emitido con exito. Folio: %. En revision hasta: %', 



        p_documento_id, v_folio_generado, v_fecha_limite_revision;



END;



$$;


ALTER FUNCTION public.sp_emitir_documento_con_revision_diferida(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, p_observaciones text, p_contexto public.contexto_documento_enum, p_prestamo_numero_id integer, p_dias_revision integer, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) OWNER TO postgres;

--
-- Name: FUNCTION sp_emitir_documento_con_revision_diferida(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, p_observaciones text, p_contexto public.contexto_documento_enum, p_prestamo_numero_id integer, p_dias_revision integer, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_emitir_documento_con_revision_diferida(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, p_observaciones text, p_contexto public.contexto_documento_enum, p_prestamo_numero_id integer, p_dias_revision integer, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) IS 'Emite un documento OFICIO inmediatamente sin esperar aprobacion previa del prestamo.



El documento se crea con folio del area prestamista y queda en estado EN_REVISION



por un periodo configurable (default: 5 dias). El area prestamista debe aprobar



o rechazar dentro de ese plazo. Si vence sin respuesta, se aprueba automaticamente.







Diferencias con sp_emitir_documento() tradicional:



- Estado prestamo requerido: SOLICITADO (vs APROBADO)



- Estado prestamo posterior: EN_REVISION (vs UTILIZADO)



- Genera folio inmediatamente (vs esperar aprobacion)



- No bloquea operacion del area emisora';


--
-- Name: sp_emitir_documento_v5(integer, character varying, text, integer, integer, timestamp without time zone, public.prioridad_enum, text, text, public.contexto_documento_enum, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_emitir_documento_v5(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone DEFAULT NULL::timestamp without time zone, p_prioridad public.prioridad_enum DEFAULT 'MEDIA'::public.prioridad_enum, p_instrucciones text DEFAULT NULL::text, p_observaciones text DEFAULT NULL::text, p_contexto public.contexto_documento_enum DEFAULT 'OTRO'::public.contexto_documento_enum, p_prestamo_numero_id integer DEFAULT NULL::integer, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) RETURNS record
    LANGUAGE plpgsql
    AS $$



DECLARE



    v_folio_generado VARCHAR(80);



    v_prestamo_estado estado_prestamo_enum;



    v_area_secretaria_id INTEGER;



BEGIN



    -- Validar pr‚stamo si es OFICIO



    IF p_contexto = 'OFICIO' THEN



        IF p_prestamo_numero_id IS NULL THEN



            RAISE EXCEPTION 'Un documento con contexto OFICIO requiere prestamo_numero_id';



        END IF;



        



        -- Validar que el pr‚stamo est‚ APROBADO



        SELECT estado INTO v_prestamo_estado



        FROM public.prestamo_numero_oficio



        WHERE id = p_prestamo_numero_id;



        



        IF v_prestamo_estado IS NULL THEN



            RAISE EXCEPTION 'El pr‚stamo % no existe', p_prestamo_numero_id;



        END IF;



        



        IF v_prestamo_estado <> 'APROBADO' THEN



            RAISE EXCEPTION 'El pr‚stamo % debe estar en estado APROBADO (estado actual: %)',



                p_prestamo_numero_id, v_prestamo_estado;



        END IF;



        



        -- Usar el folio del pr‚stamo



        SELECT folio_asignado INTO v_folio_generado



        FROM public.prestamo_numero_oficio



        WHERE id = p_prestamo_numero_id;



        



        -- Marcar pr‚stamo como UTILIZADO



        UPDATE public.prestamo_numero_oficio



        SET estado = 'UTILIZADO',



            fecha_resolucion = CURRENT_TIMESTAMP



        WHERE id = p_prestamo_numero_id;



        



    ELSE



        -- Generar folio normal



        v_folio_generado := public.fn_generar_folio(p_area_origen_id, 'EMISION');



    END IF;



    



    -- Crear el documento



    INSERT INTO public.documento (



        folio, tipo_documento_id, asunto, contenido,



        fecha_limite, prioridad, estado,



        usuario_creador_id, area_origen_id, solo_conocimiento,



        observaciones, contexto, prestamo_numero_id



    )



    VALUES (



        v_folio_generado, p_tipo_documento_id, p_asunto, p_contenido,



        p_fecha_limite, p_prioridad, 'REGISTRADO',



        p_usuario_creador_id, p_area_origen_id, false,



        p_observaciones, p_contexto, p_prestamo_numero_id



    )



    RETURNING id INTO p_documento_id;



    



    -- ----------------------------------------------------



    -- AQUI ESTµ LA CORRECCIàN: 'ACTIVO' EN LUGAR DE 'RECIBIDO'



    -- ----------------------------------------------------



    INSERT INTO public.nodo_documental (



        documento_id, tipo_nodo, estado, nodo_padre_id,



        folio_original, folio_padre, folio_propio,



        area_id, usuario_responsable_id,



        instrucciones, observaciones, es_nodo_activo



    )



    VALUES (



        p_documento_id, 'EMISION', 'ACTIVO', NULL,



        v_folio_generado, NULL, v_folio_generado,



        p_area_origen_id, p_usuario_creador_id,



        p_instrucciones, p_observaciones, TRUE



    )



    RETURNING id INTO p_nodo_id;



    



    -- Copia autom tica a Secretar¡a (si no es la Secretar¡a misma)



    SELECT id INTO v_area_secretaria_id



    FROM public.area



    WHERE tipo = 'SECRETARIA' AND activa = TRUE



    LIMIT 1;



    



    IF v_area_secretaria_id IS NOT NULL AND p_area_origen_id <> v_area_secretaria_id THEN



        INSERT INTO public.copia_conocimiento (



            documento_id, area_id, usuario_envia_id



        )



        VALUES (



            p_documento_id, v_area_secretaria_id, p_usuario_creador_id



        )



        ON CONFLICT DO NOTHING;



        



        -- Registrar en historial



        INSERT INTO public.historial_documento (



            documento_id, accion, descripcion, usuario_id, area_id



        )



        VALUES (



            p_documento_id, 'COPIA_CONOCIMIENTO_AUTO',



            'Copia enviada autom ticamente a Secretar¡a (regla institucional)',



            p_usuario_creador_id, v_area_secretaria_id



        );



    END IF;



    



    -- Historial



    INSERT INTO public.historial_documento (



        documento_id, accion, descripcion, usuario_id, area_id



    )



    VALUES (



        p_documento_id, 'EMITIDO',



        FORMAT('Documento emitido. Folio: %s. Contexto: %s', v_folio_generado, p_contexto),



        p_usuario_creador_id, p_area_origen_id



    );



    



    p_folio_emision := v_folio_generado;



    



    RAISE NOTICE 'Documento % emitido con folio % (contexto: %)', 



        p_documento_id, v_folio_generado, p_contexto;



END;



$$;


ALTER FUNCTION public.sp_emitir_documento_v5(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, p_observaciones text, p_contexto public.contexto_documento_enum, p_prestamo_numero_id integer, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) OWNER TO postgres;

--
-- Name: FUNCTION sp_emitir_documento_v5(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, p_observaciones text, p_contexto public.contexto_documento_enum, p_prestamo_numero_id integer, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_emitir_documento_v5(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, p_observaciones text, p_contexto public.contexto_documento_enum, p_prestamo_numero_id integer, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) IS 'V5: Validación de préstamo APROBADO + copia automática a Secretaría en toda emisión';


--
-- Name: sp_recibir_documento(integer, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_recibir_documento(p_nodo_id integer, p_usuario_recibe_id integer, p_observaciones text DEFAULT NULL::text, OUT p_folio_asignado character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_documento_id      INTEGER;





    v_area_id           INTEGER;





    v_estado_actual     public.estado_nodo_enum;





BEGIN





    -- 1. Obtener datos del nodo





    SELECT documento_id, area_id, estado





    INTO v_documento_id, v_area_id, v_estado_actual





    FROM public.nodo_documental





    WHERE id = p_nodo_id;











    IF NOT FOUND THEN





        RAISE EXCEPTION 'Nodo % no encontrado.', p_nodo_id;





    END IF;











    IF v_estado_actual <> 'PENDIENTE' THEN





        RAISE EXCEPTION





            'El nodo % no puede confirmarse: estado actual = %. '





            'Solo nodos PENDIENTE pueden confirmarse.',





            p_nodo_id, v_estado_actual;





    END IF;











    -- 2. Generar folio propio para esta área





    p_folio_asignado := public.fn_generar_folio(v_area_id, 'RECEPCION');











    -- 3. Activar el nodo con su nuevo folio





    UPDATE public.nodo_documental





    SET





        estado                 = 'ACTIVO',





        folio_propio           = p_folio_asignado,





        usuario_recibe_id      = p_usuario_recibe_id,





        usuario_responsable_id = p_usuario_recibe_id,





        fecha_recepcion        = CURRENT_TIMESTAMP,





        observaciones          = TRIM(





                                   COALESCE(observaciones || ' | ', '')





                                   || COALESCE(p_observaciones, '')





                                 )





    WHERE id = p_nodo_id;











    -- 4. Actualizar estado del documento





    UPDATE public.documento





    SET estado = 'RECIBIDO', fecha_modificacion = CURRENT_TIMESTAMP





    WHERE id = v_documento_id;











    -- 5. Historial





    INSERT INTO public.historial_documento (documento_id, accion, descripcion, usuario_id, area_id)





    VALUES (





        v_documento_id, 'RECIBIDO',





        FORMAT('Recibido. Folio asignado: %s. Usuario: %s',





               p_folio_asignado, p_usuario_recibe_id),





        p_usuario_recibe_id, v_area_id





    );











    RAISE NOTICE 'Nodo % confirmado. Folio: %', p_nodo_id, p_folio_asignado;





END;





$$;


ALTER FUNCTION public.sp_recibir_documento(p_nodo_id integer, p_usuario_recibe_id integer, p_observaciones text, OUT p_folio_asignado character varying) OWNER TO postgres;

--
-- Name: FUNCTION sp_recibir_documento(p_nodo_id integer, p_usuario_recibe_id integer, p_observaciones text, OUT p_folio_asignado character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_recibir_documento(p_nodo_id integer, p_usuario_recibe_id integer, p_observaciones text, OUT p_folio_asignado character varying) IS 'Confirma la recepción del documento en el área destino. Genera el folio propio del área y activa el nodo.';


--
-- Name: sp_registrar_documento(character varying, integer, character varying, text, integer, integer, timestamp without time zone, public.prioridad_enum, boolean, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_registrar_documento(p_folio character varying, p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone DEFAULT NULL::timestamp without time zone, p_prioridad public.prioridad_enum DEFAULT 'MEDIA'::public.prioridad_enum, p_solo_conocimiento boolean DEFAULT false, p_observaciones text DEFAULT NULL::text, OUT p_documento_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_nodo_id       INTEGER;





    v_folio_nuevo   VARCHAR(80);





BEGIN





    -- Delegar al nuevo SP (el parámetro p_folio es ignorado; el folio se genera)





    SELECT doc_id, nodo_id, folio





    INTO p_documento_id, v_nodo_id, v_folio_nuevo





    FROM public.sp_emitir_documento(





        p_tipo_documento_id,





        p_asunto,





        p_contenido,





        p_usuario_creador_id,





        p_area_origen_id,





        p_fecha_limite,





        p_prioridad,





        NULL,           -- instrucciones





        p_observaciones





    ) AS t(doc_id, nodo_id, folio);











    RAISE NOTICE '[COMPATIBILIDAD] sp_registrar_documento → sp_emitir_documento. '





                 'Folio generado: %. El parámetro p_folio fue ignorado.', v_folio_nuevo;





END;





$$;


ALTER FUNCTION public.sp_registrar_documento(p_folio character varying, p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_solo_conocimiento boolean, p_observaciones text, OUT p_documento_id integer) OWNER TO postgres;

--
-- Name: FUNCTION sp_registrar_documento(p_folio character varying, p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_solo_conocimiento boolean, p_observaciones text, OUT p_documento_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_registrar_documento(p_folio character varying, p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_usuario_creador_id integer, p_area_origen_id integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_solo_conocimiento boolean, p_observaciones text, OUT p_documento_id integer) IS 'WRAPPER DE COMPATIBILIDAD. Delega a sp_emitir_documento. El parámetro p_folio es ignorado; el folio se genera automáticamente. Para nuevos desarrollos, usar sp_emitir_documento directamente.';


--
-- Name: sp_registrar_entrada_externa(integer, character varying, text, integer, character varying, integer, integer, timestamp without time zone, public.prioridad_enum, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_registrar_entrada_externa(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_entidad_externa_origen_id integer, p_numero_oficio_externo character varying, p_usuario_registra_id integer, "p_area_oficialía_id" integer, p_fecha_limite timestamp without time zone DEFAULT NULL::timestamp without time zone, p_prioridad public.prioridad_enum DEFAULT 'MEDIA'::public.prioridad_enum, p_instrucciones text DEFAULT NULL::text, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) RETURNS record
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_tipo_area public.tipo_area_enum;





BEGIN





    -- Validar que el área sea OFICIALÍA





    SELECT tipo INTO v_tipo_area





    FROM public.area WHERE id = p_area_oficialía_id AND activa = TRUE;











    IF v_tipo_area <> 'OFICIALÍA' THEN





        RAISE EXCEPTION





            'El área % no es de tipo OFICIALÍA. '





            'Las entradas externas solo pueden registrarse desde la OFICIALÍA.',





            p_area_oficialía_id;





    END IF;











    -- Delegar la creación del documento a sp_emitir_documento





    SELECT doc_id, nodo_id, folio





    INTO p_documento_id, p_nodo_id, p_folio_emision





    FROM public.sp_emitir_documento(





        p_tipo_documento_id,





        p_asunto,





        p_contenido,





        p_usuario_registra_id,





        p_area_oficialía_id,





        p_fecha_limite,





        p_prioridad,





        p_instrucciones,





        NULL  -- observaciones





    ) AS t(doc_id, nodo_id, folio);











    -- Marcar el documento como externo con datos del remitente externo





    UPDATE public.documento





    SET





        entidad_externa_origen_id = p_entidad_externa_origen_id,





        numero_oficio_externo     = p_numero_oficio_externo,





        es_externo                = TRUE





    WHERE id = p_documento_id;











    -- Historial adicional





    INSERT INTO public.historial_documento (documento_id, accion, descripcion, usuario_id, area_id)





    VALUES (





        p_documento_id, 'ENTRADA_EXTERNA',





        FORMAT('Documento externo registrado. Remitente: entidad %s. Oficio externo: %s',





               p_entidad_externa_origen_id, COALESCE(p_numero_oficio_externo, 'S/N')),





        p_usuario_registra_id, p_area_oficialía_id





    );











    RAISE NOTICE 'Entrada externa registrada — Folio SIGA: % | Doc: %',





        p_folio_emision, p_documento_id;





END;





$$;


ALTER FUNCTION public.sp_registrar_entrada_externa(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_entidad_externa_origen_id integer, p_numero_oficio_externo character varying, p_usuario_registra_id integer, "p_area_oficialía_id" integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) OWNER TO postgres;

--
-- Name: FUNCTION sp_registrar_entrada_externa(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_entidad_externa_origen_id integer, p_numero_oficio_externo character varying, p_usuario_registra_id integer, "p_area_oficialía_id" integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_registrar_entrada_externa(p_tipo_documento_id integer, p_asunto character varying, p_contenido text, p_entidad_externa_origen_id integer, p_numero_oficio_externo character varying, p_usuario_registra_id integer, "p_area_oficialía_id" integer, p_fecha_limite timestamp without time zone, p_prioridad public.prioridad_enum, p_instrucciones text, OUT p_documento_id integer, OUT p_nodo_id integer, OUT p_folio_emision character varying) IS 'Registra un documento que llega desde el exterior. Crea el documento en OFICIALÍA y lo deja listo para turnarse internamente. Captura el remitente externo y su número de oficio original.';


--
-- Name: sp_resolver_prestamo_numero(integer, integer, boolean, text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_resolver_prestamo_numero(p_prestamo_id integer, p_usuario_resuelve_id integer, p_aprobar boolean, p_motivo text DEFAULT NULL::text, p_dias_vencimiento integer DEFAULT 5, OUT p_folio_asignado character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_estado_actual    public.estado_prestamo_enum;





    v_area_prest_id    INTEGER;





    v_area_sol_id      INTEGER;





    v_usuario_sol_id   INTEGER;





BEGIN





    -- 1. Obtener el préstamo





    SELECT estado, area_prestamista_id, area_solicitante_id, usuario_solicita_id





    INTO v_estado_actual, v_area_prest_id, v_area_sol_id, v_usuario_sol_id





    FROM public.prestamo_numero_oficio





    WHERE id = p_prestamo_id;











    IF NOT FOUND THEN





        RAISE EXCEPTION 'Préstamo % no encontrado.', p_prestamo_id;





    END IF;











    -- 1.1 Validar que el usuario tiene permisos para aprobar este préstamo





    IF NOT public.fn_puede_aprobar_prestamo(p_usuario_resuelve_id, p_prestamo_id) THEN





        RAISE EXCEPTION 'El usuario % no tiene permisos para aprobar/rechazar el préstamo %. ' ||





                        'Debe pertenecer al área prestamista y tener el rol de Enlace Administrativo, ' ||





                        'Director, Subsecretario, Secretario o Administrador.',





                        p_usuario_resuelve_id, p_prestamo_id;





    END IF;











    IF v_estado_actual <> 'SOLICITADO' THEN





        RAISE EXCEPTION





            'El préstamo % no puede resolverse: estado actual = %. '





            'Solo los préstamos SOLICITADOS pueden aprobarse o rechazarse.',





            p_prestamo_id, v_estado_actual;





    END IF;











    IF p_aprobar THEN





        -- 2a. APROBAR — generar el folio del área prestamista





        p_folio_asignado := public.fn_generar_folio(v_area_prest_id, 'EMISION');











        UPDATE public.prestamo_numero_oficio





        SET





            estado              = 'APROBADO',





            usuario_resuelve_id = p_usuario_resuelve_id,





            fecha_resolucion    = CURRENT_TIMESTAMP,





            folio_asignado      = p_folio_asignado,





            fecha_vencimiento   = CURRENT_TIMESTAMP + (p_dias_vencimiento || ' days')::INTERVAL,





            motivo_rechazo      = NULL





        WHERE id = p_prestamo_id;











        INSERT INTO public.auditoria_sistema (accion, descripcion, usuario_id, area_id, detalles)





        VALUES (





            'PRESTAMO_APROBADO',





            FORMAT('Préstamo %s aprobado. Folio asignado: %s. Vence en %s días.',





                   p_prestamo_id, p_folio_asignado, p_dias_vencimiento),





            p_usuario_resuelve_id, v_area_prest_id,





            COALESCE(p_motivo, 'Aprobado sin nota adicional')





        );











        RAISE NOTICE 'Préstamo % APROBADO. Folio: %. Válido hasta % días.',





            p_prestamo_id, p_folio_asignado, p_dias_vencimiento;











    ELSE





        -- 2b. RECHAZAR





        IF p_motivo IS NULL OR length(trim(p_motivo)) = 0 THEN





            RAISE EXCEPTION 'Debe indicar el motivo del rechazo.';





        END IF;











        p_folio_asignado := NULL;











        UPDATE public.prestamo_numero_oficio





        SET





            estado              = 'RECHAZADO',





            usuario_resuelve_id = p_usuario_resuelve_id,





            fecha_resolucion    = CURRENT_TIMESTAMP,





            motivo_rechazo      = p_motivo





        WHERE id = p_prestamo_id;











        INSERT INTO public.auditoria_sistema (accion, descripcion, usuario_id, area_id, detalles)





        VALUES (





            'PRESTAMO_RECHAZADO',





            FORMAT('Préstamo %s rechazado por usuario %s en área %s.',





                   p_prestamo_id, p_usuario_resuelve_id, v_area_prest_id),





            p_usuario_resuelve_id, v_area_prest_id,





            p_motivo





        );











        RAISE NOTICE 'Préstamo % RECHAZADO. Motivo: %', p_prestamo_id, p_motivo;





    END IF;





END;





$$;


ALTER FUNCTION public.sp_resolver_prestamo_numero(p_prestamo_id integer, p_usuario_resuelve_id integer, p_aprobar boolean, p_motivo text, p_dias_vencimiento integer, OUT p_folio_asignado character varying) OWNER TO postgres;

--
-- Name: FUNCTION sp_resolver_prestamo_numero(p_prestamo_id integer, p_usuario_resuelve_id integer, p_aprobar boolean, p_motivo text, p_dias_vencimiento integer, OUT p_folio_asignado character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_resolver_prestamo_numero(p_prestamo_id integer, p_usuario_resuelve_id integer, p_aprobar boolean, p_motivo text, p_dias_vencimiento integer, OUT p_folio_asignado character varying) IS 'Aprueba o rechaza una solicitud de préstamo de número de oficio. Al APROBAR genera el folio del área prestamista (fn_generar_folio) y establece la fecha de vencimiento. Al RECHAZAR exige motivo. Solo resuelve préstamos en estado SOLICITADO.';


--
-- Name: sp_revisar_prestamo_posterior(integer, integer, boolean, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_revisar_prestamo_posterior(p_prestamo_id integer, p_usuario_resuelve_id integer, p_aprobar boolean, p_motivo text DEFAULT NULL::text) RETURNS TABLE(prestamo_id integer, documento_id integer, folio character varying, estado_nuevo public.estado_prestamo_enum, documento_invalidado boolean)
    LANGUAGE plpgsql
    AS $$



DECLARE



    v_documento_id INTEGER;



    v_folio VARCHAR(80);



    v_area_emisora_id INTEGER;



    v_area_prestamista_id INTEGER;



    v_estado_actual estado_prestamo_enum;



    v_nodo_activo_id INTEGER;



BEGIN



    -- Obtener informacion del prestamo



    SELECT 



        p.documento_id, 



        p.folio_asignado,



        p.area_solicitante_id,



        p.area_prestamista_id,



        p.estado



    INTO 



        v_documento_id, 



        v_folio,



        v_area_emisora_id,



        v_area_prestamista_id,



        v_estado_actual



    FROM prestamo_numero_oficio p



    WHERE p.id = p_prestamo_id;







    IF NOT FOUND THEN



        RAISE EXCEPTION 'El prestamo con ID % no existe', p_prestamo_id;



    END IF;







    -- Validar que el prestamo este en estado EN_REVISION



    IF v_estado_actual <> 'EN_REVISION' THEN



        RAISE EXCEPTION 'El prestamo % debe estar en estado EN_REVISION para ser revisado. Estado actual: %',



            p_prestamo_id, v_estado_actual;



    END IF;







    -- Validar que exista un documento asociado



    IF v_documento_id IS NULL THEN



        RAISE EXCEPTION 'El prestamo % no tiene un documento asociado', p_prestamo_id;



    END IF;







    -- CASO 1: APROBACION



    IF p_aprobar THEN



        -- Actualizar prestamo a APROBADO_POSTERIOR



        UPDATE prestamo_numero_oficio



        SET estado = 'APROBADO_POSTERIOR',



            usuario_resuelve_id = p_usuario_resuelve_id,



            fecha_resolucion = CURRENT_TIMESTAMP



        WHERE id = p_prestamo_id;







        -- Registrar en historial del documento



        INSERT INTO historial_documento (



            documento_id,



            accion,



            usuario_id,



            area_id,



            observaciones



        ) VALUES (



            v_documento_id,



            'APROBACION_POSTERIOR',



            p_usuario_resuelve_id,



            v_area_prestamista_id,



            'Prestamo aprobado posteriormente. Documento validado retroactivamente.'



        );







        RAISE NOTICE 'Prestamo % aprobado posteriormente. Documento % validado.', 



            p_prestamo_id, v_documento_id;







        RETURN QUERY



        SELECT 



            p_prestamo_id,



            v_documento_id,



            v_folio,



            'APROBADO_POSTERIOR'::estado_prestamo_enum,



            FALSE;







    -- CASO 2: RECHAZO



    ELSE



        -- Validar que se proporcione motivo del rechazo



        IF p_motivo IS NULL OR length(trim(p_motivo)) = 0 THEN



            RAISE EXCEPTION 'El rechazo de un prestamo requiere un motivo valido';



        END IF;







        -- Actualizar prestamo a RECHAZADO_POSTERIOR



        UPDATE prestamo_numero_oficio



        SET estado = 'RECHAZADO_POSTERIOR',



            usuario_resuelve_id = p_usuario_resuelve_id,



            fecha_resolucion = CURRENT_TIMESTAMP,



            motivo_rechazo = p_motivo,



            documento_invalidado = TRUE,



            fecha_invalidacion = CURRENT_TIMESTAMP,



            motivo_invalidacion = p_motivo



        WHERE id = p_prestamo_id;







        -- Marcar documento como invalidado



        UPDATE documento



        SET documento_invalidado = TRUE,



            estado = 'CANCELADO',



            fecha_invalidacion = CURRENT_TIMESTAMP,



            motivo_invalidacion = p_motivo



        WHERE id = v_documento_id;







        -- Registrar en tabla de invalidacion para auditoria



        INSERT INTO invalidacion_documento (



            documento_id,



            prestamo_numero_id,



            usuario_invalida_id,



            fecha_invalidacion,



            motivo,



            folio_original,



            area_emisora_id,



            area_prestamista_id



        ) VALUES (



            v_documento_id,



            p_prestamo_id,



            p_usuario_resuelve_id,



            CURRENT_TIMESTAMP,



            p_motivo,



            v_folio,



            v_area_emisora_id,



            v_area_prestamista_id



        );







        -- Cerrar nodo activo del documento



        SELECT id INTO v_nodo_activo_id



        FROM nodo_documental



        WHERE documento_id = v_documento_id 



        AND estado_nodo = 'ACTIVO'



        ORDER BY fecha_creacion DESC



        LIMIT 1;







        IF v_nodo_activo_id IS NOT NULL THEN



            UPDATE nodo_documental



            SET estado_nodo = 'CERRADO',



                observaciones = COALESCE(observaciones, '') || 



                    ' | INVALIDADO: ' || p_motivo



            WHERE id = v_nodo_activo_id;



        END IF;







        -- Registrar en historial del documento



        INSERT INTO historial_documento (



            documento_id,



            accion,



            usuario_id,



            area_id,



            observaciones



        ) VALUES (



            v_documento_id,



            'RECHAZO_POSTERIOR',



            p_usuario_resuelve_id,



            v_area_prestamista_id,



            'Prestamo rechazado posteriormente. Documento invalidado. Motivo: ' || p_motivo



        );







        RAISE NOTICE 'Prestamo % rechazado. Documento % invalidado. Motivo: %', 



            p_prestamo_id, v_documento_id, p_motivo;







        RETURN QUERY



        SELECT 



            p_prestamo_id,



            v_documento_id,



            v_folio,



            'RECHAZADO_POSTERIOR'::estado_prestamo_enum,



            TRUE;



    END IF;



END;



$$;


ALTER FUNCTION public.sp_revisar_prestamo_posterior(p_prestamo_id integer, p_usuario_resuelve_id integer, p_aprobar boolean, p_motivo text) OWNER TO postgres;

--
-- Name: FUNCTION sp_revisar_prestamo_posterior(p_prestamo_id integer, p_usuario_resuelve_id integer, p_aprobar boolean, p_motivo text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_revisar_prestamo_posterior(p_prestamo_id integer, p_usuario_resuelve_id integer, p_aprobar boolean, p_motivo text) IS 'Permite al area prestamista aprobar o rechazar un prestamo despues de que



el documento ya fue emitido con revision diferida.







APROBACION:



- Cambia estado a APROBADO_POSTERIOR



- Valida el documento retroactivamente



- Registra en historial







RECHAZO:



- Cambia estado a RECHAZADO_POSTERIOR



- Marca documento como invalidado



- Cambia estado documento a CANCELADO



- Registra en tabla invalidacion_documento para auditoria



- Cierra el nodo activo del documento



- Requiere motivo obligatorio







El documento invalidado NO se elimina, permanece en el sistema 



para trazabilidad completa y auditorias.';


--
-- Name: sp_solicitar_prestamo_numero(integer, integer, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_solicitar_prestamo_numero(p_area_solicitante_id integer, p_area_prestamista_id integer, p_usuario_solicita_id integer, p_motivacion text, OUT p_prestamo_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_error TEXT;





BEGIN





    -- 1. Validar la combinación solicitante/prestamista





    v_error := public.fn_puede_solicitar_prestamo(p_area_solicitante_id, p_area_prestamista_id);





    IF v_error IS NOT NULL THEN





        RAISE EXCEPTION '%', v_error;





    END IF;











    -- 2. Verificar que no haya ya un préstamo SOLICITADO o APROBADO pendiente





    --    para la misma combinación (evitar duplicados activos)





    IF EXISTS (





        SELECT 1 FROM public.prestamo_numero_oficio





        WHERE area_solicitante_id = p_area_solicitante_id





          AND area_prestamista_id = p_area_prestamista_id





          AND estado IN ('SOLICITADO', 'APROBADO')





    ) THEN





        RAISE EXCEPTION





            'Ya existe una solicitud de préstamo activa (SOLICITADO o APROBADO) '





            'para esta combinación de áreas. Espere a que se resuelva o use el folio ya aprobado.';





    END IF;











    -- 3. Crear la solicitud





    INSERT INTO public.prestamo_numero_oficio (





        area_solicitante_id, area_prestamista_id,





        usuario_solicita_id,





        estado, motivacion





    )





    VALUES (





        p_area_solicitante_id, p_area_prestamista_id,





        p_usuario_solicita_id,





        'SOLICITADO', p_motivacion





    )





    RETURNING id INTO p_prestamo_id;











    -- 4. Historial (reutiliza auditoria_sistema como canal)





    INSERT INTO public.auditoria_sistema (accion, descripcion, usuario_id, area_id, detalles)





    VALUES (





        'PRESTAMO_SOLICITADO',





        FORMAT('Solicitud de préstamo de número. Solicitante: área %s → Prestamista: área %s',





               p_area_solicitante_id, p_area_prestamista_id),





        p_usuario_solicita_id,





        p_area_prestamista_id,  -- el "afectado" es el prestamista (quien debe revisar)





        p_motivacion





    );











    RAISE NOTICE 'Préstamo % creado. Área prestamista % debe aprobar.',





        p_prestamo_id, p_area_prestamista_id;





END;





$$;


ALTER FUNCTION public.sp_solicitar_prestamo_numero(p_area_solicitante_id integer, p_area_prestamista_id integer, p_usuario_solicita_id integer, p_motivacion text, OUT p_prestamo_id integer) OWNER TO postgres;

--
-- Name: FUNCTION sp_solicitar_prestamo_numero(p_area_solicitante_id integer, p_area_prestamista_id integer, p_usuario_solicita_id integer, p_motivacion text, OUT p_prestamo_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_solicitar_prestamo_numero(p_area_solicitante_id integer, p_area_prestamista_id integer, p_usuario_solicita_id integer, p_motivacion text, OUT p_prestamo_id integer) IS 'Crea una solicitud de préstamo de número de oficio en estado SOLICITADO. Valida que la combinación sea legítima (fn_puede_solicitar_prestamo). El admin del área prestamista debe resolver con sp_resolver_prestamo_numero.';


--
-- Name: sp_turnar_documento(integer, integer, integer, character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_turnar_documento(p_documento_id integer, p_area_destino_id integer, p_usuario_turna_id integer, p_observaciones character varying DEFAULT NULL::character varying, p_instrucciones text DEFAULT NULL::text, OUT p_nodo_nuevo_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_nodo_activo_id        INTEGER;





    v_folio_propio_actual   VARCHAR(80);





    v_folio_original        VARCHAR(80);





    v_estado_doc            public.estado_documento_enum;





    v_area_origen_id        INTEGER;   -- área del nodo activo actual





    v_error_validacion      TEXT;





BEGIN





    -- 1. Obtener nodo activo del documento





    SELECT id, folio_propio, folio_original, area_id





    INTO v_nodo_activo_id, v_folio_propio_actual, v_folio_original, v_area_origen_id





    FROM public.nodo_documental





    WHERE documento_id = p_documento_id AND es_nodo_activo = TRUE;











    IF v_nodo_activo_id IS NULL THEN





        RAISE EXCEPTION





            'El documento % no tiene nodo activo. '





            'Use sp_emitir_documento para iniciar la cadena.', p_documento_id;





    END IF;











    -- 2. Validar estado del documento





    SELECT estado INTO v_estado_doc FROM public.documento WHERE id = p_documento_id;





    IF v_estado_doc IN ('CANCELADO', 'CERRADO') THEN





        RAISE EXCEPTION





            'No se puede turnar: el documento % está en estado %.',





            p_documento_id, v_estado_doc;





    END IF;











    -- 3. *** VALIDACIÓN DE RUTA DE TURNO ***





    v_error_validacion := public.fn_validar_turno(v_area_origen_id, p_area_destino_id);





    IF v_error_validacion IS NOT NULL THEN





        RAISE EXCEPTION '%', v_error_validacion;





    END IF;











    -- 4. Cerrar el nodo activo actual





    UPDATE public.nodo_documental





    SET





        estado         = 'CERRADO',





        es_nodo_activo = FALSE,





        fecha_cierre   = CURRENT_TIMESTAMP,





        observaciones  = COALESCE(observaciones || ' | ', '')





                         || 'Turnado por usuario ' || p_usuario_turna_id::TEXT





    WHERE id = v_nodo_activo_id;











    -- 5. Crear nodo PENDIENTE en el área destino





    INSERT INTO public.nodo_documental (





        documento_id, tipo_nodo, estado,





        nodo_padre_id,





        folio_original, folio_padre, folio_propio,





        area_id, usuario_responsable_id,





        instrucciones, observaciones,





        es_nodo_activo





    )





    VALUES (





        p_documento_id, 'RECEPCION', 'PENDIENTE',





        v_nodo_activo_id,





        v_folio_original,





        v_folio_propio_actual,





        '',                        -- asignado al confirmar recepción





        p_area_destino_id,





        p_usuario_turna_id,





        p_instrucciones,





        p_observaciones,





        TRUE





    )





    RETURNING id INTO p_nodo_nuevo_id;











    -- 6. Actualizar estado documento





    UPDATE public.documento





    SET estado = 'TURNADO', fecha_modificacion = CURRENT_TIMESTAMP





    WHERE id = p_documento_id;











    -- 7. Historial





    INSERT INTO public.historial_documento (documento_id, accion, descripcion, usuario_id, area_id)





    VALUES (





        p_documento_id, 'TURNADO',





        FORMAT('Turnado a "%s" (área %s) por usuario %s',





            (SELECT nombre FROM public.area WHERE id = p_area_destino_id),





            p_area_destino_id, p_usuario_turna_id),





        p_usuario_turna_id, p_area_destino_id





    );











    RAISE NOTICE 'Documento % turnado a área %. Nodo pendiente: %',





        p_documento_id, p_area_destino_id, p_nodo_nuevo_id;





END;





$$;


ALTER FUNCTION public.sp_turnar_documento(p_documento_id integer, p_area_destino_id integer, p_usuario_turna_id integer, p_observaciones character varying, p_instrucciones text, OUT p_nodo_nuevo_id integer) OWNER TO postgres;

--
-- Name: FUNCTION sp_turnar_documento(p_documento_id integer, p_area_destino_id integer, p_usuario_turna_id integer, p_observaciones character varying, p_instrucciones text, OUT p_nodo_nuevo_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sp_turnar_documento(p_documento_id integer, p_area_destino_id integer, p_usuario_turna_id integer, p_observaciones character varying, p_instrucciones text, OUT p_nodo_nuevo_id integer) IS 'V2: Incluye validación de ruta (fn_validar_turno) antes de ejecutar el turno. Cierra el nodo activo y crea uno PENDIENTE en el área destino.';


--
-- Name: trg_limpiar_tokens_al_insertar(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_limpiar_tokens_al_insertar() RETURNS trigger
    LANGUAGE plpgsql
    AS $$





DECLARE





    v_random FLOAT;





BEGIN





    -- Ejecutar limpieza solo el 10% de las veces (probabilístico)





    -- Esto previene overhead en cada inserción





    v_random := random();





    





    IF v_random < 0.1 THEN





        PERFORM fn_limpiar_tokens_expirados();





        RAISE DEBUG 'Limpieza automática de tokens ejecutada';





    END IF;





    





    RETURN NEW;





END;





$$;


ALTER FUNCTION public.trg_limpiar_tokens_al_insertar() OWNER TO postgres;

--
-- Name: trg_prevenir_eliminacion_documento(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_prevenir_eliminacion_documento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$





BEGIN





    -- Solo permitir eliminación de documentos en estado CANCELADO





    IF OLD.estado <> 'CANCELADO' THEN





        RAISE EXCEPTION 





            'No se puede eliminar el documento % porque no está CANCELADO (estado: %)',





            OLD.id, OLD.estado;





    END IF;





    





    -- Verificar si tiene historial





    IF EXISTS (SELECT 1 FROM public.historial_documento WHERE documento_id = OLD.id) THEN





        RAISE EXCEPTION 





            'No se puede eliminar el documento % porque tiene registros en el historial',





            OLD.id;





    END IF;





    





    RETURN OLD;





END;





$$;


ALTER FUNCTION public.trg_prevenir_eliminacion_documento() OWNER TO postgres;

--
-- Name: trg_prevenir_insercion_turno_documento(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_prevenir_insercion_turno_documento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$





BEGIN





    RAISE EXCEPTION 'turno_documento está DEPRECADA. Usar nodo_documental en su lugar.'





        USING HINT = 'Consultar documentación de migración a nodo_documental',





              ERRCODE = 'P0001';





END;





$$;


ALTER FUNCTION public.trg_prevenir_insercion_turno_documento() OWNER TO postgres;

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


--
-- Name: trg_validar_nodo_activo_unico(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_validar_nodo_activo_unico() RETURNS trigger
    LANGUAGE plpgsql
    AS $$





BEGIN





    IF NEW.es_nodo_activo = TRUE THEN





        IF EXISTS (





            SELECT 1 FROM public.nodo_documental





            WHERE documento_id   = NEW.documento_id





              AND es_nodo_activo = TRUE





              AND id             <> NEW.id





        ) THEN





            RAISE EXCEPTION





                'Ya existe un nodo activo para el documento %. '





                'Cierre el nodo activo antes de activar otro. '





                'Use sp_turnar_documento o sp_devolver_documento.',





                NEW.documento_id;





        END IF;





    END IF;





    RETURN NEW;





END;





$$;


ALTER FUNCTION public.trg_validar_nodo_activo_unico() OWNER TO postgres;

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


ALTER TABLE public.archivo_id_seq OWNER TO postgres;

--
-- Name: archivo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.archivo_id_seq OWNED BY public.archivo.id;


--
-- Name: archivo_nodo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.archivo_nodo (
    nodo_id integer NOT NULL,
    archivo_id integer NOT NULL,
    tipo_relacion public.tipo_relacion_archivo_enum DEFAULT 'ADJUNTO'::public.tipo_relacion_archivo_enum,
    fecha_asociacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.archivo_nodo OWNER TO postgres;

--
-- Name: TABLE archivo_nodo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.archivo_nodo IS 'Archivos adjuntos a un nodo específico. Permite saber qué adjuntos incorporó cada área en la cadena.';


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


ALTER TABLE public.area_id_seq OWNER TO postgres;

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


ALTER TABLE public.auditoria_sistema_id_seq OWNER TO postgres;

--
-- Name: auditoria_sistema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_sistema_id_seq OWNED BY public.auditoria_sistema.id;


--
-- Name: consecutivo_area; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consecutivo_area (
    id integer NOT NULL,
    area_id integer NOT NULL,
    tipo_operacion character varying(20) NOT NULL,
    anio smallint DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
    ultimo_consecutivo integer DEFAULT 0 NOT NULL,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT consecutivo_area_tipo_operacion_check CHECK (((length((tipo_operacion)::text) <= 10) AND ((tipo_operacion)::text ~ '^[A-Z]{2,10}$'::text)))
);


ALTER TABLE public.consecutivo_area OWNER TO postgres;

--
-- Name: TABLE consecutivo_area; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.consecutivo_area IS 'Controla el último consecutivo asignado por área, operación y año. Thread-safe: solo se incrementa mediante fn_siguiente_consecutivo.';


--
-- Name: COLUMN consecutivo_area.tipo_operacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.consecutivo_area.tipo_operacion IS 'EMISION: folios EM-... | RECEPCION: folios RE-...';


--
-- Name: consecutivo_area_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.consecutivo_area_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.consecutivo_area_id_seq OWNER TO postgres;

--
-- Name: consecutivo_area_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consecutivo_area_id_seq OWNED BY public.consecutivo_area.id;


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

ALTER TABLE ONLY public.copia_conocimiento FORCE ROW LEVEL SECURITY;


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


ALTER TABLE public.copia_conocimiento_id_seq OWNER TO postgres;

--
-- Name: copia_conocimiento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.copia_conocimiento_id_seq OWNED BY public.copia_conocimiento.id;


--
-- Name: despacho_externo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.despacho_externo (
    id integer NOT NULL,
    documento_id integer NOT NULL,
    nodo_id integer NOT NULL,
    entidad_externa_id integer NOT NULL,
    fecha_despacho timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metodo public.metodo_despacho_enum DEFAULT 'FISICO'::public.metodo_despacho_enum NOT NULL,
    numero_guia character varying(100),
    archivo_acuse_id integer,
    usuario_despacha_id integer NOT NULL,
    observaciones text,
    acuse_recibido boolean DEFAULT false,
    fecha_acuse timestamp without time zone,
    CONSTRAINT chk_despacho_fecha_acuse CHECK (((fecha_acuse IS NULL) OR (fecha_acuse >= fecha_despacho)))
);


ALTER TABLE public.despacho_externo OWNER TO postgres;

--
-- Name: TABLE despacho_externo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.despacho_externo IS 'Registra el despacho físico o digital de un documento hacia una entidad externa. 





Puede ejecutarse desde CUALQUIER área que tenga el documento activo.





NO es obligatorio pasar por Oficialía para documentos salientes.





La Oficialía solo interviene en documentos ENTRANTES (sp_registrar_entrada_externa).';


--
-- Name: COLUMN despacho_externo.nodo_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.despacho_externo.nodo_id IS 'Nodo documental desde el cual se despacha. 





Puede ser de cualquier área (DIRECCION, SUBDIRECCION, etc.), no solo OFICIALÍA.





Permite vincular el despacho a la etapa exacta de la cadena documental.';


--
-- Name: COLUMN despacho_externo.archivo_acuse_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.despacho_externo.archivo_acuse_id IS 'Referencia al archivo de acuse de recepción escaneado o digital. Usa la tabla archivo ya existente.';


--
-- Name: despacho_externo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.despacho_externo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.despacho_externo_id_seq OWNER TO postgres;

--
-- Name: despacho_externo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.despacho_externo_id_seq OWNED BY public.despacho_externo.id;


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
    entidad_externa_origen_id integer,
    entidad_externa_destino_id integer,
    numero_oficio_externo character varying(100),
    es_externo boolean DEFAULT false,
    contexto public.contexto_documento_enum DEFAULT 'OTRO'::public.contexto_documento_enum NOT NULL,
    prestamo_numero_id integer,
    documento_invalidado boolean DEFAULT false,
    fecha_invalidacion timestamp without time zone,
    motivo_invalidacion text,
    CONSTRAINT chk_documento_fecha_limite CHECK (((fecha_limite IS NULL) OR (fecha_limite >= fecha_creacion))),
    CONSTRAINT chk_documento_oficio_requiere_prestamo CHECK (((contexto <> 'OFICIO'::public.contexto_documento_enum) OR (prestamo_numero_id IS NOT NULL)))
);

ALTER TABLE ONLY public.documento FORCE ROW LEVEL SECURITY;


ALTER TABLE public.documento OWNER TO postgres;

--
-- Name: TABLE documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.documento IS 'Registro de documentos del sistema';


--
-- Name: COLUMN documento.entidad_externa_origen_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documento.entidad_externa_origen_id IS 'Entidad que originó el documento desde fuera de la dependencia. NULL para documentos internos.';


--
-- Name: COLUMN documento.entidad_externa_destino_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documento.entidad_externa_destino_id IS 'Entidad externa a quien se le enviará la resolución/respuesta final. NULL para documentos puramente internos.';


--
-- Name: COLUMN documento.numero_oficio_externo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documento.numero_oficio_externo IS 'Número de folio/oficio del remitente externo (si aplica). Permite búsqueda cruzada con el expediente del ciudadano.';


--
-- Name: COLUMN documento.es_externo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documento.es_externo IS 'TRUE cuando el documento tiene origen o destino externo a la dependencia.';


--
-- Name: COLUMN documento.contexto; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documento.contexto IS 'Naturaleza administrativa del documento. Determina reglas de flujo: OFICIO requiere prestamo_numero_id; MEMORANDUM/CIRCULAR permiten cruces con copia_conocimiento.';


--
-- Name: COLUMN documento.prestamo_numero_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documento.prestamo_numero_id IS 'FK al préstamo de número autorizado. Obligatorio cuando contexto = OFICIO. NULL para memorándums, circulares y demás emisiones internas.';


--
-- Name: COLUMN documento.documento_invalidado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documento.documento_invalidado IS 'TRUE si el documento fue invalidado por rechazo de prestamo despues de su emision. 



El documento permanece en el sistema con estado CANCELADO para trazabilidad completa.';


--
-- Name: COLUMN documento.fecha_invalidacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documento.fecha_invalidacion IS 'Fecha y hora en que el documento fue invalidado por rechazo del prestamo.';


--
-- Name: COLUMN documento.motivo_invalidacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documento.motivo_invalidacion IS 'Motivo del rechazo del prestamo que causo la invalidacion del documento. 



Copiado desde la tabla invalidacion_documento para facilitar consultas.';


--
-- Name: CONSTRAINT chk_documento_oficio_requiere_prestamo ON documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT chk_documento_oficio_requiere_prestamo ON public.documento IS 'Un documento con contexto OFICIO debe tener un prestamo_numero_id asociado. 



El prestamo puede estar en cualquier estado (EN_REVISION, APROBADO, APROBADO_POSTERIOR, etc).



Ya no se requiere que el prestamo este APROBADO antes de emitir el documento.';


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


ALTER TABLE public.documento_id_seq OWNER TO postgres;

--
-- Name: documento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documento_id_seq OWNED BY public.documento.id;


--
-- Name: entidad_externa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entidad_externa (
    id integer NOT NULL,
    nombre character varying(300) NOT NULL,
    tipo public.tipo_entidad_externa_enum NOT NULL,
    rfc character varying(13),
    curp character varying(18),
    email character varying(150),
    telefono character varying(20),
    calle character varying(200),
    numero_exterior character varying(20),
    numero_interior character varying(20),
    colonia character varying(100),
    municipio character varying(100),
    estado_republica character varying(100),
    codigo_postal character varying(10),
    activa boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion timestamp without time zone,
    observaciones text,
    CONSTRAINT chk_entidad_curp CHECK (((curp IS NULL) OR (length(TRIM(BOTH FROM curp)) = 18))),
    CONSTRAINT chk_entidad_email CHECK (((email IS NULL) OR ((email)::text ~~ '%@%'::text))),
    CONSTRAINT chk_entidad_nombre CHECK ((length(TRIM(BOTH FROM nombre)) > 0)),
    CONSTRAINT chk_entidad_rfc CHECK (((rfc IS NULL) OR ((length(TRIM(BOTH FROM rfc)) >= 12) AND (length(TRIM(BOTH FROM rfc)) <= 13))))
);


ALTER TABLE public.entidad_externa OWNER TO postgres;

--
-- Name: TABLE entidad_externa; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.entidad_externa IS 'Catálogo de personas u organismos externos que interactúan con la dependencia. Reutilizable: un ciudadano puede tener múltiples trámites sin duplicar datos.';


--
-- Name: COLUMN entidad_externa.tipo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidad_externa.tipo IS 'CIUDADANO, EMPRESA, MUNICIPIO, ESTADO, DEPENDENCIA_FED, ORGANISMO, ONG, OTRO';


--
-- Name: entidad_externa_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.entidad_externa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entidad_externa_id_seq OWNER TO postgres;

--
-- Name: entidad_externa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.entidad_externa_id_seq OWNED BY public.entidad_externa.id;


--
-- Name: excepcion_turno_area; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.excepcion_turno_area (
    id integer NOT NULL,
    area_origen_id integer NOT NULL,
    area_destino_id integer NOT NULL,
    bidireccional boolean DEFAULT false,
    motivo character varying(500),
    activa boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_excepcion_no_self CHECK ((area_origen_id <> area_destino_id))
);


ALTER TABLE public.excepcion_turno_area OWNER TO postgres;

--
-- Name: TABLE excepcion_turno_area; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.excepcion_turno_area IS 'Pares de áreas concretas con permiso de turno independientemente de las reglas por tipo. Ejemplo: Oficialía puede turnar directamente a Secretaría Particular o a cualquier Dirección General.';


--
-- Name: excepcion_turno_area_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.excepcion_turno_area_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.excepcion_turno_area_id_seq OWNER TO postgres;

--
-- Name: excepcion_turno_area_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.excepcion_turno_area_id_seq OWNED BY public.excepcion_turno_area.id;


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

ALTER TABLE ONLY public.historial_documento FORCE ROW LEVEL SECURITY;


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


ALTER TABLE public.historial_documento_id_seq OWNER TO postgres;

--
-- Name: historial_documento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historial_documento_id_seq OWNED BY public.historial_documento.id;


--
-- Name: invalidacion_documento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invalidacion_documento (
    id integer NOT NULL,
    documento_id integer NOT NULL,
    prestamo_numero_id integer NOT NULL,
    usuario_invalida_id integer,
    fecha_invalidacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    motivo text NOT NULL,
    folio_original character varying(80) NOT NULL,
    area_emisora_id integer,
    area_prestamista_id integer,
    CONSTRAINT chk_invalidacion_motivo_no_vacio CHECK ((length(TRIM(BOTH FROM motivo)) > 0))
);


ALTER TABLE public.invalidacion_documento OWNER TO postgres;

--
-- Name: TABLE invalidacion_documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.invalidacion_documento IS 'Registro historico permanente de documentos invalidados por rechazo de prestamo 



posterior a su emision. Esta tabla mantiene la trazabilidad completa para auditorias, 



cumplimiento normativo y analisis estadistico. Los documentos invalidados NO se eliminan 



del sistema, solo se marcan como invalidos con estado CANCELADO.';


--
-- Name: COLUMN invalidacion_documento.motivo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.invalidacion_documento.motivo IS 'Razon detallada del rechazo proporcionada por el area prestamista al revisar el documento.';


--
-- Name: COLUMN invalidacion_documento.folio_original; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.invalidacion_documento.folio_original IS 'Folio del documento al momento de invalidarse (inmutable para referencia historica). 



Este folio ya no es valido pero se conserva para registros y auditorias.';


--
-- Name: invalidacion_documento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invalidacion_documento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.invalidacion_documento_id_seq OWNER TO postgres;

--
-- Name: invalidacion_documento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invalidacion_documento_id_seq OWNED BY public.invalidacion_documento.id;


--
-- Name: nivel_jerarquico_tipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nivel_jerarquico_tipo (
    tipo public.tipo_area_enum NOT NULL,
    nivel_peso smallint NOT NULL,
    descripcion character varying(200),
    CONSTRAINT chk_nivel_peso CHECK (((nivel_peso >= 1) AND (nivel_peso <= 20)))
);


ALTER TABLE public.nivel_jerarquico_tipo OWNER TO postgres;

--
-- Name: TABLE nivel_jerarquico_tipo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.nivel_jerarquico_tipo IS 'Peso jerárquico de cada tipo de área. Permite comparar si un área está por encima o por debajo de otra sin recorrer la tabla area.';


--
-- Name: nodo_documental; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nodo_documental (
    id integer NOT NULL,
    documento_id integer NOT NULL,
    tipo_nodo public.tipo_nodo_enum DEFAULT 'RECEPCION'::public.tipo_nodo_enum NOT NULL,
    estado public.estado_nodo_enum DEFAULT 'PENDIENTE'::public.estado_nodo_enum NOT NULL,
    nodo_padre_id integer,
    folio_original character varying(80) NOT NULL,
    folio_padre character varying(80),
    folio_propio character varying(80) DEFAULT ''::character varying NOT NULL,
    area_id integer NOT NULL,
    usuario_responsable_id integer NOT NULL,
    usuario_recibe_id integer,
    fecha_generacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_recepcion timestamp without time zone,
    fecha_cierre timestamp without time zone,
    instrucciones text,
    observaciones text,
    es_nodo_activo boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_nodo_emision_sin_padre CHECK ((((tipo_nodo = 'EMISION'::public.tipo_nodo_enum) AND (nodo_padre_id IS NULL)) OR ((tipo_nodo <> 'EMISION'::public.tipo_nodo_enum) AND (nodo_padre_id IS NOT NULL)))),
    CONSTRAINT chk_nodo_folio_original_no_vacio CHECK ((length(TRIM(BOTH FROM folio_original)) > 0)),
    CONSTRAINT chk_nodo_no_self CHECK ((nodo_padre_id <> id))
);

ALTER TABLE ONLY public.nodo_documental FORCE ROW LEVEL SECURITY;


ALTER TABLE public.nodo_documental OWNER TO postgres;

--
-- Name: TABLE nodo_documental; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.nodo_documental IS 'Nodo de la cadena documental. Cada área que interviene genera un nodo. La cadena se recorre por nodo_padre_id. Solo un nodo por documento puede tener es_nodo_activo = TRUE.';


--
-- Name: COLUMN nodo_documental.folio_original; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.nodo_documental.folio_original IS 'Folio de emisión. Inmutable durante toda la cadena.';


--
-- Name: COLUMN nodo_documental.folio_padre; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.nodo_documental.folio_padre IS 'Folio del nodo previo (desnormalizado). Responde: ¿quién me lo turnó?';


--
-- Name: COLUMN nodo_documental.folio_propio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.nodo_documental.folio_propio IS 'Folio asignado por esta área. Ejemplo: RE-SMADSOT.DA-0006/2026. Vacío mientras el nodo esté PENDIENTE de recepción.';


--
-- Name: COLUMN nodo_documental.es_nodo_activo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.nodo_documental.es_nodo_activo IS 'TRUE únicamente en el nodo que custodia el documento ahora. Garantizado por índice parcial único y trigger.';


--
-- Name: nodo_documental_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nodo_documental_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.nodo_documental_id_seq OWNER TO postgres;

--
-- Name: nodo_documental_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nodo_documental_id_seq OWNED BY public.nodo_documental.id;


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


ALTER TABLE public.permiso_emision_documento_id_seq OWNER TO postgres;

--
-- Name: permiso_emision_documento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permiso_emision_documento_id_seq OWNED BY public.permiso_emision_documento.id;


--
-- Name: prestamo_numero_oficio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prestamo_numero_oficio (
    id integer NOT NULL,
    area_solicitante_id integer NOT NULL,
    area_prestamista_id integer NOT NULL,
    usuario_solicita_id integer NOT NULL,
    usuario_resuelve_id integer,
    estado public.estado_prestamo_enum DEFAULT 'SOLICITADO'::public.estado_prestamo_enum NOT NULL,
    fecha_solicitud timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_resolucion timestamp without time zone,
    fecha_vencimiento timestamp without time zone,
    folio_asignado character varying(80),
    motivacion text NOT NULL,
    motivo_rechazo text,
    documento_id integer,
    documento_invalidado boolean DEFAULT false,
    fecha_invalidacion timestamp without time zone,
    motivo_invalidacion text,
    dias_revision integer DEFAULT 5,
    fecha_limite_revision timestamp without time zone,
    CONSTRAINT chk_prestamo_doc_si_utilizado CHECK (((estado <> 'UTILIZADO'::public.estado_prestamo_enum) OR (documento_id IS NOT NULL))),
    CONSTRAINT chk_prestamo_folio_si_aprobado CHECK (((estado <> ALL (ARRAY['APROBADO'::public.estado_prestamo_enum, 'EN_REVISION'::public.estado_prestamo_enum, 'APROBADO_POSTERIOR'::public.estado_prestamo_enum, 'APROBADO_AUTOMATICO'::public.estado_prestamo_enum])) OR (folio_asignado IS NOT NULL))),
    CONSTRAINT chk_prestamo_motivo_rechazo_si_rechazado CHECK (((estado <> 'RECHAZADO'::public.estado_prestamo_enum) OR (motivo_rechazo IS NOT NULL))),
    CONSTRAINT chk_prestamo_no_self CHECK (((area_solicitante_id <> area_prestamista_id) OR (area_solicitante_id = area_prestamista_id))),
    CONSTRAINT chk_prestamo_resolucion_posterior CHECK (((fecha_resolucion IS NULL) OR (fecha_resolucion >= fecha_solicitud)))
);


ALTER TABLE public.prestamo_numero_oficio OWNER TO postgres;

--
-- Name: TABLE prestamo_numero_oficio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.prestamo_numero_oficio IS 'Solicitud de préstamo de número de oficio. El área solicitante pide a un área prestamista (propia área, Subsecretaría o Secretaría) que autorice un folio. El folio se genera al APROBAR, no al solicitar. Al UTILIZAR se vincula al documento emitido.';


--
-- Name: COLUMN prestamo_numero_oficio.area_prestamista_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.prestamo_numero_oficio.area_prestamista_id IS 'Área que presta el número: puede ser la propia Dirección, su Subsecretaría o la Secretaría.';


--
-- Name: COLUMN prestamo_numero_oficio.fecha_vencimiento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.prestamo_numero_oficio.fecha_vencimiento IS 'Fecha límite para usar el folio aprobado. Configurable; por defecto NOW + 5 días hábiles. Jobs externos deben marcar como VENCIDO los préstamos expirados.';


--
-- Name: COLUMN prestamo_numero_oficio.folio_asignado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.prestamo_numero_oficio.folio_asignado IS 'Folio generado con fn_generar_folio(area_prestamista_id, EMISION) al momento de aprobar. Este folio se usa directamente en el campo documento.folio al emitir.';


--
-- Name: COLUMN prestamo_numero_oficio.documento_invalidado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.prestamo_numero_oficio.documento_invalidado IS 'TRUE si el documento asociado fue invalidado por rechazo posterior del prestamo. 



El documento permanece en el sistema con estado CANCELADO para trazabilidad.';


--
-- Name: COLUMN prestamo_numero_oficio.fecha_invalidacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.prestamo_numero_oficio.fecha_invalidacion IS 'Fecha y hora en que se invalido el documento asociado al prestamo rechazado.';


--
-- Name: COLUMN prestamo_numero_oficio.motivo_invalidacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.prestamo_numero_oficio.motivo_invalidacion IS 'Razon detallada por la cual se invalido el documento. Proporcionada por el area prestamista.';


--
-- Name: COLUMN prestamo_numero_oficio.dias_revision; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.prestamo_numero_oficio.dias_revision IS 'Dias habiles que tiene el area prestamista para aprobar o rechazar el prestamo 



despues de la emision del documento. Configurable, por defecto: 5 dias.';


--
-- Name: COLUMN prestamo_numero_oficio.fecha_limite_revision; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.prestamo_numero_oficio.fecha_limite_revision IS 'Fecha limite calculada (fecha_solicitud + dias_revision) para que el area prestamista 



revise el prestamo emitido con revision diferida. Si vence sin respuesta, se aprueba automaticamente.';


--
-- Name: CONSTRAINT chk_prestamo_folio_si_aprobado ON prestamo_numero_oficio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT chk_prestamo_folio_si_aprobado ON public.prestamo_numero_oficio IS 'Los prestamos en estado APROBADO, EN_REVISION, APROBADO_POSTERIOR o APROBADO_AUTOMATICO 



deben tener un folio asignado. El folio se genera al momento de la emision (flujo diferido) 



o al momento de la aprobacion (flujo tradicional).';


--
-- Name: prestamo_numero_oficio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prestamo_numero_oficio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.prestamo_numero_oficio_id_seq OWNER TO postgres;

--
-- Name: prestamo_numero_oficio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prestamo_numero_oficio_id_seq OWNED BY public.prestamo_numero_oficio.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    token character varying(500) NOT NULL,
    usuario_id integer NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    ip_address character varying(45),
    user_agent text,
    revoked boolean DEFAULT false,
    revoked_at timestamp without time zone,
    replaced_by_token character varying(500)
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.refresh_tokens IS 'Almacena los refresh tokens para el sistema de autenticaciÃ³n';


--
-- Name: COLUMN refresh_tokens.token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.token IS 'Token aleatorio Ãºnico de 128 caracteres';


--
-- Name: COLUMN refresh_tokens.usuario_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.usuario_id IS 'Referencia al usuario propietario del token';


--
-- Name: COLUMN refresh_tokens.expires_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.expires_at IS 'Fecha y hora de expiraciÃ³n del token';


--
-- Name: COLUMN refresh_tokens.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.created_at IS 'Fecha y hora de creaciÃ³n del token';


--
-- Name: COLUMN refresh_tokens.ip_address; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.ip_address IS 'DirecciÃ³n IP desde donde se generÃ³ el token';


--
-- Name: COLUMN refresh_tokens.user_agent; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.user_agent IS 'User agent del navegador/dispositivo';


--
-- Name: COLUMN refresh_tokens.revoked; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.revoked IS 'Indica si el token ha sido revocado';


--
-- Name: COLUMN refresh_tokens.revoked_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.revoked_at IS 'Fecha y hora de revocaciÃ³n';


--
-- Name: COLUMN refresh_tokens.replaced_by_token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.refresh_tokens.replaced_by_token IS 'Token que reemplazÃ³ a este (rotaciÃ³n)';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: regla_turno; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.regla_turno (
    id integer NOT NULL,
    tipo_origen public.tipo_area_enum NOT NULL,
    tipo_destino public.tipo_area_enum NOT NULL,
    condicion_relacion character varying(20) DEFAULT 'DESCENDENTE'::character varying NOT NULL,
    requiere_justificacion boolean DEFAULT false,
    activa boolean DEFAULT true,
    observaciones character varying(500),
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_regla_turno_condicion CHECK (((condicion_relacion)::text = ANY (ARRAY[('DESCENDENTE'::character varying)::text, ('ASCENDENTE'::character varying)::text, ('LATERAL'::character varying)::text, ('CRUCE'::character varying)::text, ('CUALQUIERA'::character varying)::text]))),
    CONSTRAINT chk_regla_turno_no_self CHECK (((tipo_origen <> tipo_destino) OR ((condicion_relacion)::text = 'CUALQUIERA'::text)))
);


ALTER TABLE public.regla_turno OWNER TO postgres;

--
-- Name: TABLE regla_turno; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.regla_turno IS 'Define las combinaciones de tipo_origen → tipo_destino permitidas al turnar documentos, con la condición posicional requerida. Si no existe ninguna regla activa que cubra el turno solicitado, sp_turnar_documento lo rechaza.';


--
-- Name: COLUMN regla_turno.condicion_relacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.regla_turno.condicion_relacion IS 'DESCENDENTE: destino subordinado al origen | ASCENDENTE: destino superior al origen | LATERAL: mismo padre | CRUCE: distinta rama jerárquica | CUALQUIERA: sin restricción posicional';


--
-- Name: regla_turno_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.regla_turno_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.regla_turno_id_seq OWNER TO postgres;

--
-- Name: regla_turno_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.regla_turno_id_seq OWNED BY public.regla_turno.id;


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
    observaciones character varying(1000),
    nodo_origen_id integer
);

ALTER TABLE ONLY public.respuesta FORCE ROW LEVEL SECURITY;


ALTER TABLE public.respuesta OWNER TO postgres;

--
-- Name: TABLE respuesta; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.respuesta IS 'Respuestas a documentos';


--
-- Name: COLUMN respuesta.nodo_origen_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.respuesta.nodo_origen_id IS 'Nodo documental desde el que se originó la respuesta. Permite saber qué área respondió dentro de la cadena.';


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


ALTER TABLE public.respuesta_id_seq OWNER TO postgres;

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


ALTER TABLE public.rol_id_seq OWNER TO postgres;

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


ALTER TABLE public.tipo_documento_id_seq OWNER TO postgres;

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
    deprecada boolean DEFAULT true,
    fecha_deprecacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_turno_documento_areas CHECK ((area_origen_id <> area_destino_id)),
    CONSTRAINT chk_turno_documento_fecha_recepcion CHECK (((fecha_recepcion IS NULL) OR (fecha_recepcion >= fecha_turno)))
);


ALTER TABLE public.turno_documento OWNER TO postgres;

--
-- Name: TABLE turno_documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.turno_documento IS 'TABLA DEPRECADA: Esta tabla está obsoleta. Usar nodo_documental en su lugar.





Sistema antiguo de turnos reemplazado por el patrón de nodos documentales.





LEGACY: Se mantiene solo para migración de datos históricos.





NO USAR EN CÓDIGO NUEVO.';


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


ALTER TABLE public.turno_documento_id_seq OWNER TO postgres;

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

ALTER TABLE ONLY public.usuario FORCE ROW LEVEL SECURITY;


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


ALTER TABLE public.usuario_id_seq OWNER TO postgres;

--
-- Name: usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuario_id_seq OWNED BY public.usuario.id;


--
-- Name: v_areas; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_areas AS
 SELECT area.id,
    area.nombre,
    area.clave,
    area.tipo,
    area.area_padre_id AS padre_id,
    area.nivel,
    area.activa
   FROM public.area
  WHERE (area.activa = true);


ALTER TABLE public.v_areas OWNER TO postgres;

--
-- Name: VIEW v_areas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_areas IS 'Vista abreviada de áreas activas con nombres de columnas cortos.';


--
-- Name: v_docs; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_docs AS
 SELECT d.id,
    d.folio,
    d.asunto,
    d.estado,
    d.prioridad,
    d.fecha_creacion AS fecha,
    a.nombre AS area,
    td.nombre AS tipo
   FROM (((public.documento d
     LEFT JOIN public.nodo_documental nd ON (((d.id = nd.documento_id) AND (nd.es_nodo_activo = true))))
     LEFT JOIN public.area a ON ((nd.area_id = a.id)))
     JOIN public.tipo_documento td ON ((d.tipo_documento_id = td.id)))
  WHERE (d.estado <> 'CANCELADO'::public.estado_documento_enum);


ALTER TABLE public.v_docs OWNER TO postgres;

--
-- Name: VIEW v_docs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_docs IS 'Vista abreviada de documentos activos con información esencial. Alias corto de consultas frecuentes.';


--
-- Name: v_documento_estado_actual; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_documento_estado_actual AS
 SELECT d.id AS documento_id,
    d.folio AS folio_documento,
    d.asunto,
    d.contenido,
    d.estado AS estado_documento,
    d.contexto,
    d.prioridad,
    d.fecha_creacion,
    d.fecha_limite,
    d.solo_conocimiento,
    d.es_externo,
    a_origen.id AS area_origen_id,
    a_origen.nombre AS area_origen_nombre,
    a_origen.clave AS area_origen_clave,
    u_creador.id AS usuario_creador_id,
    u_creador.nombre AS usuario_creador_nombre,
    n.id AS nodo_activo_id,
    n.tipo_nodo,
    n.estado AS estado_nodo,
    n.folio_propio AS folio_actual,
    n.fecha_generacion AS fecha_nodo,
    n.fecha_recepcion,
    a_actual.id AS area_actual_id,
    a_actual.nombre AS area_actual_nombre,
    a_actual.clave AS area_actual_clave,
    a_actual.tipo AS area_actual_tipo,
    u_responsable.id AS responsable_id,
    u_responsable.nombre AS responsable_nombre,
    u_responsable.email AS responsable_email,
    td.nombre AS tipo_documento_nombre,
    td.clave AS tipo_documento_clave,
    ee_origen.nombre AS entidad_externa_origen,
    ee_destino.nombre AS entidad_externa_destino,
    p.area_prestamista_id,
    p.folio_asignado AS folio_prestamo,
    p.estado AS estado_prestamo
   FROM (((((((((public.documento d
     JOIN public.tipo_documento td ON ((d.tipo_documento_id = td.id)))
     JOIN public.area a_origen ON ((d.area_origen_id = a_origen.id)))
     JOIN public.usuario u_creador ON ((d.usuario_creador_id = u_creador.id)))
     JOIN public.nodo_documental n ON (((d.id = n.documento_id) AND (n.es_nodo_activo = true))))
     JOIN public.area a_actual ON ((n.area_id = a_actual.id)))
     JOIN public.usuario u_responsable ON ((n.usuario_responsable_id = u_responsable.id)))
     LEFT JOIN public.entidad_externa ee_origen ON ((d.entidad_externa_origen_id = ee_origen.id)))
     LEFT JOIN public.entidad_externa ee_destino ON ((d.entidad_externa_destino_id = ee_destino.id)))
     LEFT JOIN public.prestamo_numero_oficio p ON ((d.prestamo_numero_id = p.id)));


ALTER TABLE public.v_documento_estado_actual OWNER TO postgres;

--
-- Name: VIEW v_documento_estado_actual; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_documento_estado_actual IS 'Vista en tiempo real del estado actual de documentos.





    CAMBIO: Convertida de MATERIALIZED VIEW a VIEW normal para simplificar mantenimiento.





    Performance: Si se detectan problemas de rendimiento, considerar índices adicionales en las tablas base.';


--
-- Name: v_nodos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_nodos AS
 SELECT n.id,
    n.documento_id AS doc_id,
    n.tipo_nodo AS tipo,
    n.estado,
    n.folio_propio AS folio,
    n.fecha_generacion AS fecha,
    a.nombre AS area
   FROM (public.nodo_documental n
     JOIN public.area a ON ((n.area_id = a.id)))
  WHERE (n.es_nodo_activo = true);


ALTER TABLE public.v_nodos OWNER TO postgres;

--
-- Name: VIEW v_nodos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_nodos IS 'Vista abreviada de nodos activos. Alias corto para consultas de bandeja de entrada.';


--
-- Name: v_turnos_legacy; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_turnos_legacy AS
 SELECT nd.id,
    nd.documento_id,
    COALESCE(nd_padre.area_id, d.area_origen_id) AS area_origen_id,
    nd.area_id AS area_destino_id,
    nd.usuario_responsable_id AS usuario_turna_id,
    nd.fecha_generacion AS fecha_turno,
    nd.fecha_recepcion,
    nd.observaciones,
        CASE
            WHEN (nd.fecha_recepcion IS NOT NULL) THEN true
            ELSE false
        END AS recibido,
        CASE
            WHEN (nd.es_nodo_activo = true) THEN true
            ELSE false
        END AS activo,
    nd.instrucciones
   FROM ((public.nodo_documental nd
     LEFT JOIN public.nodo_documental nd_padre ON ((nd.nodo_padre_id = nd_padre.id)))
     LEFT JOIN public.documento d ON ((nd.documento_id = d.id)))
  WHERE (nd.tipo_nodo = ANY (ARRAY['RECEPCION'::public.tipo_nodo_enum, 'RETORNO'::public.tipo_nodo_enum, 'DEVOLUCION'::public.tipo_nodo_enum]));


ALTER TABLE public.v_turnos_legacy OWNER TO postgres;

--
-- Name: VIEW v_turnos_legacy; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_turnos_legacy IS 'Vista de compatibilidad para codigo que usa turno_documento (deprecado).





Mapea nodo_documental al formato antiguo de turno_documento.





MIGRAR A: Usar directamente nodo_documental.';


--
-- Name: vw_bandeja_entrada; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_bandeja_entrada AS
 SELECT nd.id AS nodo_id,
    nd.documento_id,
    d.folio AS folio_emision,
    nd.folio_padre AS folio_quien_turno,
    d.asunto,
    d.prioridad,
    d.estado AS estado_documento,
    d.fecha_limite,
        CASE
            WHEN ((d.fecha_limite IS NOT NULL) AND (d.fecha_limite < CURRENT_TIMESTAMP)) THEN true
            ELSE false
        END AS vencido,
    a.id AS area_destino_id,
    a.nombre AS area_destino,
    a_padre.nombre AS area_que_turno,
    concat(u.nombre, ' ', u.apellidos) AS turnado_por,
    nd.fecha_generacion AS fecha_turno,
    (EXTRACT(day FROM (CURRENT_TIMESTAMP - (nd.fecha_generacion)::timestamp with time zone)))::integer AS dias_pendiente,
    nd.instrucciones
   FROM (((((public.nodo_documental nd
     JOIN public.documento d ON ((d.id = nd.documento_id)))
     JOIN public.area a ON ((a.id = nd.area_id)))
     JOIN public.usuario u ON ((u.id = nd.usuario_responsable_id)))
     LEFT JOIN public.nodo_documental nd_padre ON ((nd_padre.id = nd.nodo_padre_id)))
     LEFT JOIN public.area a_padre ON ((a_padre.id = nd_padre.area_id)))
  WHERE ((nd.estado = 'PENDIENTE'::public.estado_nodo_enum) AND (nd.es_nodo_activo = true));


ALTER TABLE public.vw_bandeja_entrada OWNER TO postgres;

--
-- Name: VIEW vw_bandeja_entrada; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_bandeja_entrada IS 'Documentos pendientes de confirmación de recepción por área. Filtra por area_destino_id para obtener la bandeja de un área específica.';


--
-- Name: vw_cadena_documental; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_cadena_documental AS
 SELECT nd.id AS nodo_id,
    nd.documento_id,
    d.folio AS folio_emision_original,
    d.asunto,
    nd.tipo_nodo,
    nd.estado AS estado_nodo,
    nd.es_nodo_activo,
    nd.folio_original,
    nd.folio_padre,
        CASE
            WHEN ((nd.folio_propio)::text = ''::text) THEN '(pendiente)'::character varying
            ELSE nd.folio_propio
        END AS folio_propio,
    a.id AS area_id,
    a.nombre AS area_nombre,
    a.clave AS area_clave,
    nd.nodo_padre_id,
    a_padre.nombre AS area_padre_nombre,
    nd.fecha_generacion,
    nd.fecha_recepcion,
    nd.fecha_cierre,
    concat(u.nombre, ' ', u.apellidos) AS responsable,
    nd.instrucciones,
    nd.observaciones,
    public.fn_ruta_folio(nd.id) AS ruta_folios
   FROM (((((public.nodo_documental nd
     JOIN public.documento d ON ((d.id = nd.documento_id)))
     JOIN public.area a ON ((a.id = nd.area_id)))
     JOIN public.usuario u ON ((u.id = nd.usuario_responsable_id)))
     LEFT JOIN public.nodo_documental nd_padre ON ((nd_padre.id = nd.nodo_padre_id)))
     LEFT JOIN public.area a_padre ON ((a_padre.id = nd_padre.area_id)))
  ORDER BY nd.documento_id, nd.fecha_generacion;


ALTER TABLE public.vw_cadena_documental OWNER TO postgres;

--
-- Name: VIEW vw_cadena_documental; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_cadena_documental IS 'Trazabilidad completa: todos los nodos de todos los documentos. Filtra por documento_id para ver la ruta de un documento específico.';


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
    nd.folio_propio AS folio_vigente,
    a_actual.nombre AS area_actual,
    ( SELECT count(*) AS count
           FROM public.nodo_documental
          WHERE (nodo_documental.documento_id = d.id)) AS numero_nodos,
    ( SELECT count(*) AS count
           FROM public.turno_documento
          WHERE (turno_documento.documento_id = d.id)) AS numero_turnos_legacy,
    ( SELECT count(*) AS count
           FROM public.copia_conocimiento
          WHERE (copia_conocimiento.documento_id = d.id)) AS numero_copias_conocimiento,
    ( SELECT count(*) AS count
           FROM public.respuesta
          WHERE (respuesta.documento_origen_id = d.id)) AS numero_respuestas,
    ( SELECT count(*) AS count
           FROM public.archivo_documento
          WHERE (archivo_documento.documento_id = d.id)) AS numero_archivos
   FROM (((((public.documento d
     JOIN public.tipo_documento td ON ((td.id = d.tipo_documento_id)))
     JOIN public.usuario u ON ((u.id = d.usuario_creador_id)))
     JOIN public.area ao ON ((ao.id = d.area_origen_id)))
     LEFT JOIN public.nodo_documental nd ON (((nd.documento_id = d.id) AND (nd.es_nodo_activo = true))))
     LEFT JOIN public.area a_actual ON ((a_actual.id = nd.area_id)));


ALTER TABLE public.vw_documentos_completos OWNER TO postgres;

--
-- Name: VIEW vw_documentos_completos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_documentos_completos IS 'Vista completa de documentos con información del nodo activo (folio vigente y área actual).';


--
-- Name: vw_documentos_externos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_documentos_externos AS
 SELECT d.id AS documento_id,
    d.folio AS folio_siga,
    d.numero_oficio_externo,
    d.asunto,
    d.estado,
    d.prioridad,
    d.fecha_creacion,
    d.fecha_limite,
    td.nombre AS tipo_documento,
        CASE
            WHEN ((d.entidad_externa_origen_id IS NOT NULL) AND (d.entidad_externa_destino_id IS NULL)) THEN 'ENTRADA'::text
            WHEN ((d.entidad_externa_origen_id IS NULL) AND (d.entidad_externa_destino_id IS NOT NULL)) THEN 'SALIDA'::text
            WHEN ((d.entidad_externa_origen_id IS NOT NULL) AND (d.entidad_externa_destino_id IS NOT NULL)) THEN 'ENTRADA_CON_RESPUESTA'::text
            ELSE 'INTERNO'::text
        END AS direccion_flujo,
    ee_orig.nombre AS remitente_externo,
    ee_orig.tipo AS tipo_remitente,
    ee_orig.rfc AS rfc_remitente,
    ee_dest.nombre AS destinatario_externo,
    ee_dest.tipo AS tipo_destinatario,
    a_actual.nombre AS area_custodia_actual,
    a_actual.tipo AS tipo_area_actual,
    dx.fecha_despacho,
    dx.metodo AS metodo_despacho,
    dx.numero_guia,
    dx.acuse_recibido,
    ( SELECT count(*) AS count
           FROM public.nodo_documental
          WHERE (nodo_documental.documento_id = d.id)) AS total_nodos
   FROM ((((((public.documento d
     JOIN public.tipo_documento td ON ((td.id = d.tipo_documento_id)))
     LEFT JOIN public.entidad_externa ee_orig ON ((ee_orig.id = d.entidad_externa_origen_id)))
     LEFT JOIN public.entidad_externa ee_dest ON ((ee_dest.id = d.entidad_externa_destino_id)))
     LEFT JOIN public.nodo_documental nd_act ON (((nd_act.documento_id = d.id) AND (nd_act.es_nodo_activo = true))))
     LEFT JOIN public.area a_actual ON ((a_actual.id = nd_act.area_id)))
     LEFT JOIN LATERAL ( SELECT dx2.fecha_despacho,
            dx2.metodo,
            dx2.numero_guia,
            dx2.acuse_recibido
           FROM public.despacho_externo dx2
          WHERE (dx2.documento_id = d.id)
          ORDER BY dx2.fecha_despacho DESC
         LIMIT 1) dx ON (true))
  WHERE (d.es_externo = true);


ALTER TABLE public.vw_documentos_externos OWNER TO postgres;

--
-- Name: VIEW vw_documentos_externos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_documentos_externos IS 'Muestra todos los documentos con contexto externo. La columna direccion_flujo indica si es ENTRADA, SALIDA o ENTRADA_CON_RESPUESTA. Incluye datos del despacho más reciente.';


--
-- Name: vw_documentos_invalidados; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_documentos_invalidados AS
 SELECT d.id AS documento_id,
    d.folio,
    d.asunto,
    d.contexto,
    td.nombre AS tipo_documento,
    d.fecha_creacion,
    d.fecha_invalidacion,
    d.motivo_invalidacion,
    i.fecha_invalidacion AS fecha_registro_invalidacion,
    i.motivo AS motivo_detallado,
    p.id AS prestamo_id,
    p.folio_asignado AS folio_prestamo,
    p.estado AS estado_prestamo,
    a_sol.nombre AS area_emisora,
    a_sol.clave AS clave_emisora,
    a_prest.nombre AS area_prestamista,
    a_prest.clave AS clave_prestamista,
    concat(u_invalida.nombre, ' ', u_invalida.apellidos) AS usuario_que_invalido,
    u_invalida.email AS email_invalida,
    concat(u_creador.nombre, ' ', u_creador.apellidos) AS usuario_creador,
    EXTRACT(day FROM (d.fecha_invalidacion - d.fecha_creacion)) AS dias_vida_documento,
    EXTRACT(hour FROM (d.fecha_invalidacion - d.fecha_creacion)) AS horas_vida_documento
   FROM (((((((public.documento d
     JOIN public.invalidacion_documento i ON ((d.id = i.documento_id)))
     JOIN public.prestamo_numero_oficio p ON ((i.prestamo_numero_id = p.id)))
     JOIN public.area a_sol ON ((d.area_origen_id = a_sol.id)))
     JOIN public.area a_prest ON ((p.area_prestamista_id = a_prest.id)))
     LEFT JOIN public.usuario u_invalida ON ((i.usuario_invalida_id = u_invalida.id)))
     LEFT JOIN public.usuario u_creador ON ((d.usuario_creador_id = u_creador.id)))
     LEFT JOIN public.tipo_documento td ON ((d.tipo_documento_id = td.id)))
  WHERE (d.documento_invalidado = true)
  ORDER BY d.fecha_invalidacion DESC;


ALTER TABLE public.vw_documentos_invalidados OWNER TO postgres;

--
-- Name: VIEW vw_documentos_invalidados; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_documentos_invalidados IS 'Vista de auditoria mostrando todos los documentos invalidados por rechazo



de prestamo posterior a su emision. Incluye informacion completa para:



- Reportes de control y auditoria



- Analisis de rechazos por area



- Identificacion de problemas operativos



- Cumplimiento normativo







Consultas tipicas:



  -- Documentos invalidados del mes



  SELECT * FROM vw_documentos_invalidados 



  WHERE fecha_invalidacion >= date_trunc(''month'', CURRENT_DATE);







  -- Documentos invalidados por area



  SELECT area_emisora, COUNT(*) AS total_invalidados



  FROM vw_documentos_invalidados



  GROUP BY area_emisora



  ORDER BY total_invalidados DESC;







  -- Documentos invalidados rapidamente (< 24 horas de vida)



  SELECT * FROM vw_documentos_invalidados



  WHERE horas_vida_documento < 24;';


--
-- Name: vw_estado_actual_documento; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_estado_actual_documento AS
 SELECT d.id AS documento_id,
    d.folio AS folio_emision,
    d.asunto,
    d.estado AS estado_documento,
    d.prioridad,
    d.fecha_creacion,
    d.fecha_limite,
    d.solo_conocimiento,
    nd.id AS nodo_activo_id,
    nd.tipo_nodo,
    nd.estado AS estado_nodo,
        CASE
            WHEN ((nd.folio_propio)::text = ''::text) THEN '(pendiente de recepción)'::character varying
            ELSE nd.folio_propio
        END AS folio_vigente,
    nd.folio_padre,
    nd.folio_original,
    nd.fecha_recepcion,
    nd.instrucciones,
    a.id AS area_custodia_id,
    a.nombre AS area_custodia,
    a.clave AS clave_area_custodia,
    concat(u.nombre, ' ', u.apellidos) AS responsable_actual,
    ( SELECT count(*) AS count
           FROM public.nodo_documental
          WHERE (nodo_documental.documento_id = d.id)) AS total_nodos_cadena,
    (EXTRACT(day FROM (CURRENT_TIMESTAMP - (d.fecha_creacion)::timestamp with time zone)))::integer AS dias_en_sistema,
        CASE
            WHEN ((d.fecha_limite IS NOT NULL) AND (d.fecha_limite < CURRENT_TIMESTAMP) AND (d.estado <> ALL (ARRAY['CERRADO'::public.estado_documento_enum, 'CANCELADO'::public.estado_documento_enum]))) THEN true
            ELSE false
        END AS vencido
   FROM (((public.documento d
     JOIN public.nodo_documental nd ON (((nd.documento_id = d.id) AND (nd.es_nodo_activo = true))))
     JOIN public.area a ON ((a.id = nd.area_id)))
     JOIN public.usuario u ON ((u.id = nd.usuario_responsable_id)));


ALTER TABLE public.vw_estado_actual_documento OWNER TO postgres;

--
-- Name: VIEW vw_estado_actual_documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_estado_actual_documento IS 'Vista rápida: dónde está cada documento, quién lo tiene, cuál es su folio vigente. Responde: ¿Dónde está el documento? ¿Cuál es el folio actual válido? ¿Está vencido?';


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


ALTER TABLE public.vw_jerarquia_areas OWNER TO postgres;

--
-- Name: VIEW vw_jerarquia_areas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_jerarquia_areas IS 'Vista de jerarquía completa de áreas con rutas';


--
-- Name: vw_mis_solicitudes_prestamo; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_mis_solicitudes_prestamo AS
 SELECT p.id AS prestamo_id,
    p.estado,
    p.fecha_solicitud,
    p.fecha_resolucion,
    p.motivacion,
    p.motivo_rechazo,
    p.folio_asignado,
    p.fecha_vencimiento,
        CASE
            WHEN ((p.estado = 'APROBADO'::public.estado_prestamo_enum) AND (p.fecha_vencimiento < CURRENT_TIMESTAMP)) THEN 'VENCIDO'::text
            WHEN ((p.estado = 'APROBADO'::public.estado_prestamo_enum) AND (p.fecha_vencimiento < (CURRENT_TIMESTAMP + '1 day'::interval))) THEN 'POR_VENCER'::text
            WHEN (p.estado = 'APROBADO'::public.estado_prestamo_enum) THEN 'VIGENTE'::text
            ELSE (p.estado)::text
        END AS semaforo,
    a_sol.nombre AS area_solicitante,
    a_prest.nombre AS area_prestamista,
    concat(u_res.nombre, ' ', u_res.apellidos) AS resuelto_por,
    p.documento_id,
    d.folio AS folio_oficio_emitido
   FROM ((((public.prestamo_numero_oficio p
     JOIN public.area a_sol ON ((a_sol.id = p.area_solicitante_id)))
     JOIN public.area a_prest ON ((a_prest.id = p.area_prestamista_id)))
     LEFT JOIN public.usuario u_res ON ((u_res.id = p.usuario_resuelve_id)))
     LEFT JOIN public.documento d ON ((d.id = p.documento_id)))
  ORDER BY p.fecha_solicitud DESC;


ALTER TABLE public.vw_mis_solicitudes_prestamo OWNER TO postgres;

--
-- Name: VIEW vw_mis_solicitudes_prestamo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_mis_solicitudes_prestamo IS 'Vista para el usuario solicitante. Filtra por area_solicitante_id = :id para ver el estado de sus solicitudes y el semáforo de vencimiento.';


--
-- Name: vw_prestamos_pendientes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_prestamos_pendientes AS
 SELECT p.id AS prestamo_id,
    p.estado,
    p.fecha_solicitud,
    p.motivacion,
    p.fecha_vencimiento,
    a_sol.id AS area_solicitante_id,
    a_sol.nombre AS area_solicitante,
    a_sol.tipo AS tipo_area_solicitante,
    a_prest.id AS area_prestamista_id,
    a_prest.nombre AS area_prestamista,
    concat(u_sol.nombre, ' ', u_sol.apellidos) AS solicitante,
    u_sol.email AS email_solicitante,
    p.folio_asignado,
    p.documento_id,
    d.folio AS folio_documento,
    (EXTRACT(hour FROM (CURRENT_TIMESTAMP - (p.fecha_solicitud)::timestamp with time zone)))::integer AS horas_en_espera
   FROM ((((public.prestamo_numero_oficio p
     JOIN public.area a_sol ON ((a_sol.id = p.area_solicitante_id)))
     JOIN public.area a_prest ON ((a_prest.id = p.area_prestamista_id)))
     JOIN public.usuario u_sol ON ((u_sol.id = p.usuario_solicita_id)))
     LEFT JOIN public.documento d ON ((d.id = p.documento_id)))
  ORDER BY p.fecha_solicitud;


ALTER TABLE public.vw_prestamos_pendientes OWNER TO postgres;

--
-- Name: VIEW vw_prestamos_pendientes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_prestamos_pendientes IS 'Vista para el admin del área prestamista. Filtra por area_prestamista_id = :id para ver las solicitudes pendientes de resolución.';


--
-- Name: vw_prestamos_pendientes_revision; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_prestamos_pendientes_revision AS
 SELECT p.id AS prestamo_id,
    p.area_solicitante_id,
    a_sol.nombre AS area_solicitante,
    a_sol.clave AS clave_solicitante,
    p.area_prestamista_id,
    a_prest.nombre AS area_prestamista,
    a_prest.clave AS clave_prestamista,
    p.folio_asignado,
    p.documento_id,
    d.folio AS folio_documento,
    d.asunto,
    d.contexto,
    p.fecha_solicitud,
    p.fecha_limite_revision,
    round((EXTRACT(epoch FROM ((p.fecha_limite_revision)::timestamp with time zone - CURRENT_TIMESTAMP)) / (3600)::numeric), 1) AS horas_restantes,
        CASE
            WHEN (p.fecha_limite_revision < CURRENT_TIMESTAMP) THEN 'VENCIDO'::text
            WHEN (p.fecha_limite_revision < (CURRENT_TIMESTAMP + '1 day'::interval)) THEN 'URGENTE'::text
            WHEN (p.fecha_limite_revision < (CURRENT_TIMESTAMP + '2 days'::interval)) THEN 'PROXIMO'::text
            ELSE 'VIGENTE'::text
        END AS semaforo,
    p.motivacion,
    p.dias_revision,
    concat(u.nombre, ' ', u.apellidos) AS solicitante,
    u.email AS email_solicitante,
    td.nombre AS tipo_documento
   FROM (((((public.prestamo_numero_oficio p
     JOIN public.area a_sol ON ((p.area_solicitante_id = a_sol.id)))
     JOIN public.area a_prest ON ((p.area_prestamista_id = a_prest.id)))
     LEFT JOIN public.documento d ON ((p.documento_id = d.id)))
     LEFT JOIN public.usuario u ON ((p.usuario_solicita_id = u.id)))
     LEFT JOIN public.tipo_documento td ON ((d.tipo_documento_id = td.id)))
  WHERE (p.estado = 'EN_REVISION'::public.estado_prestamo_enum)
  ORDER BY p.fecha_limite_revision;


ALTER TABLE public.vw_prestamos_pendientes_revision OWNER TO postgres;

--
-- Name: VIEW vw_prestamos_pendientes_revision; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_prestamos_pendientes_revision IS 'Vista de dashboard para areas prestamistas mostrando prestamos que requieren



revision y aprobacion/rechazo. Incluye semaforo de urgencia:



- VENCIDO: Plazo vencido, sera aprobado automaticamente



- URGENTE: Menos de 24 horas restantes



- PROXIMO: Menos de 48 horas restantes



- VIGENTE: Mas de 48 horas restantes







Columnas: usa clave en lugar de siglas (clave_solicitante, clave_prestamista)







Consultas tipicas:



  -- Dashboard del area prestamista



  SELECT * FROM vw_prestamos_pendientes_revision 



  WHERE area_prestamista_id = :mi_area_id;







  -- Alertas urgentes



  SELECT * FROM vw_prestamos_pendientes_revision 



  WHERE semaforo IN (''VENCIDO'', ''URGENTE'');';


--
-- Name: vw_rutas_turno_disponibles; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_rutas_turno_disponibles AS
 SELECT a_origen.id AS area_origen_id,
    a_origen.nombre AS area_origen,
    a_origen.tipo AS tipo_origen,
    a_destino.id AS area_destino_id,
    a_destino.nombre AS area_destino,
    a_destino.tipo AS tipo_destino,
    rt.condicion_relacion,
    rt.requiere_justificacion,
    public.fn_relacion_jerarquica(a_origen.id, a_destino.id) AS relacion_real,
    public.fn_validar_turno(a_origen.id, a_destino.id) AS estado_validacion
   FROM ((((public.area a_origen
     CROSS JOIN public.area a_destino)
     JOIN public.nivel_jerarquico_tipo njo ON ((njo.tipo = a_origen.tipo)))
     JOIN public.nivel_jerarquico_tipo njd ON ((njd.tipo = a_destino.tipo)))
     JOIN public.regla_turno rt ON (((rt.tipo_origen = a_origen.tipo) AND (rt.tipo_destino = a_destino.tipo) AND (rt.activa = true))))
  WHERE ((a_origen.activa = true) AND (a_destino.activa = true) AND (a_origen.id <> a_destino.id));


ALTER TABLE public.vw_rutas_turno_disponibles OWNER TO postgres;

--
-- Name: VIEW vw_rutas_turno_disponibles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_rutas_turno_disponibles IS 'Vista para uso del frontend: lista todas las combinaciones de área origen → área destino que tienen al menos una regla potencialmente aplicable. La columna estado_validacion = NULL indica que el turno sería permitido.';


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


ALTER TABLE public.vw_turnos_pendientes OWNER TO postgres;

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
-- Name: consecutivo_area id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consecutivo_area ALTER COLUMN id SET DEFAULT nextval('public.consecutivo_area_id_seq'::regclass);


--
-- Name: copia_conocimiento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.copia_conocimiento ALTER COLUMN id SET DEFAULT nextval('public.copia_conocimiento_id_seq'::regclass);


--
-- Name: despacho_externo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.despacho_externo ALTER COLUMN id SET DEFAULT nextval('public.despacho_externo_id_seq'::regclass);


--
-- Name: documento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento ALTER COLUMN id SET DEFAULT nextval('public.documento_id_seq'::regclass);


--
-- Name: entidad_externa id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidad_externa ALTER COLUMN id SET DEFAULT nextval('public.entidad_externa_id_seq'::regclass);


--
-- Name: excepcion_turno_area id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.excepcion_turno_area ALTER COLUMN id SET DEFAULT nextval('public.excepcion_turno_area_id_seq'::regclass);


--
-- Name: historial_documento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_documento ALTER COLUMN id SET DEFAULT nextval('public.historial_documento_id_seq'::regclass);


--
-- Name: invalidacion_documento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invalidacion_documento ALTER COLUMN id SET DEFAULT nextval('public.invalidacion_documento_id_seq'::regclass);


--
-- Name: nodo_documental id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodo_documental ALTER COLUMN id SET DEFAULT nextval('public.nodo_documental_id_seq'::regclass);


--
-- Name: permiso_emision_documento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permiso_emision_documento ALTER COLUMN id SET DEFAULT nextval('public.permiso_emision_documento_id_seq'::regclass);


--
-- Name: prestamo_numero_oficio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamo_numero_oficio ALTER COLUMN id SET DEFAULT nextval('public.prestamo_numero_oficio_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: regla_turno id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regla_turno ALTER COLUMN id SET DEFAULT nextval('public.regla_turno_id_seq'::regclass);


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
1	cotizacion-44119516.pdf	F:\\siga\\backend\\uploads\\cotizacion-44119516-1773265126961-551197770.pdf	application/pdf	51107	2026-03-11 21:38:46.78077	24	66c5b3e7ceca3f45bf24cbb12d07cbd044cfcf7094e69df37d030e781c8ed213
2	20240413_121737.jpg	F:\\siga\\backend\\uploads\\20240413_121737-1773265130450-141619249.jpg	image/jpeg	43206443	2026-03-11 21:38:51.539302	24	ff516180251d61dc8266076bbcefe4572eac49c3d6c5ba9deae953a62f990d5c
3	cotizacion-44119516.pdf	F:\\siga\\backend\\uploads\\cotizacion-44119516-1773289972413-23521963.pdf	application/pdf	51107	2026-03-12 04:32:52.484438	4	66c5b3e7ceca3f45bf24cbb12d07cbd044cfcf7094e69df37d030e781c8ed213
4	cotizacion-44119516.pdf	F:\\siga\\backend\\uploads\\cotizacion-44119516-1773392608164-567211871.pdf	application/pdf	51107	2026-03-13 09:03:28.006421	6	66c5b3e7ceca3f45bf24cbb12d07cbd044cfcf7094e69df37d030e781c8ed213
5	cotizacion-44119516.pdf	F:\\siga\\backend\\uploads\\cotizacion-44119516-1773392676949-538367210.pdf	application/pdf	51107	2026-03-13 09:04:37.578171	6	66c5b3e7ceca3f45bf24cbb12d07cbd044cfcf7094e69df37d030e781c8ed213
\.


--
-- Data for Name: archivo_documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.archivo_documento (documento_id, archivo_id, tipo_relacion, fecha_asociacion) FROM stdin;
505	3	ADJUNTO	2026-03-12 04:33:10.3595
506	4	ADJUNTO	2026-03-13 09:03:57.530875
507	5	ADJUNTO	2026-03-13 09:04:44.918475
\.


--
-- Data for Name: archivo_nodo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.archivo_nodo (nodo_id, archivo_id, tipo_relacion, fecha_asociacion) FROM stdin;
504	3	ADJUNTO	2026-03-12 04:33:10.389182
506	4	ADJUNTO	2026-03-13 09:03:57.558061
508	5	ADJUNTO	2026-03-13 09:04:44.955199
\.


--
-- Data for Name: area; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.area (id, nombre, clave, tipo, area_padre_id, nivel, activa, fecha_creacion, fecha_modificacion, descripcion) FROM stdin;
20	Administrador	ADMIN	DIRECCION	\N	1	t	2026-03-06 14:30:15.27068	\N	Area Administrativa Principal
28	Departamento de Innovacion y Eficiencia Energetica	SMADSOT.SGASE.DSHTE.DIEE	DEPARTAMENTO	23	5	f	2026-03-06 14:30:15.519973	2026-03-11 17:25:49.931277	Innovacion y Eficiencia Energetica
70	Sistema Informatico de Entrega Recepcion	SMADSOT.SIERE	COORDINACION	21	4	f	2026-03-06 14:30:16.55568	2026-03-11 17:25:49.931277	Sistema Informatico
27	Departamento de Remediacion de Cuencas	SMADSOT.SGASE.DSHTE.DGARC	DEPARTAMENTO	23	5	t	2026-03-06 14:30:15.492042	2026-03-11 16:12:21.880157	Remediacion de Cuencas
29	Departamento de Politica Hidrica	SMADSOT.SGASE.DSHTE.DEL	DEPARTAMENTO	23	5	t	2026-03-06 14:30:15.538746	2026-03-11 16:12:21.880157	Politica Hidrica
30	Departamento de Sustentabilidad Energetica	SMADSOT.SGASE.DGCCCI.DFPI	DEPARTAMENTO	24	5	t	2026-03-06 14:30:15.555533	2026-03-11 16:12:21.880157	Sustentabilidad Energetica
31	Departamento de Cambio Climatico y Ciudades Inteligentes	SMADSOT.SGASE.DGCCCI.DVM	DEPARTAMENTO	24	5	t	2026-03-06 14:30:15.571705	2026-03-11 16:12:21.880157	Cambio Climatico y Ciudades Inteligentes
69	Comite de Control y Desempeno Institucional	SMADSOT.COCODI	COORDINACION	21	4	t	2026-03-06 14:30:16.537952	2026-03-11 16:13:48.20982	Control y Desempeno Institucional
71	Unidad de Igualdad Sustantiva	SMADSOT.UNIS	COORDINACION	21	4	t	2026-03-06 14:30:16.573619	2026-03-11 17:20:25.57931	Igualdad Sustantiva
72	Direccion de Administracion	SMADSOT.DA	DIRECCION	21	3	t	2026-03-06 14:30:16.590891	2026-03-11 17:20:25.57931	Administracion
49	Departamento de Proyectos Estrategicos	SMADSOT.SGTDU.DDUIA.DPE	DEPARTAMENTO	39	5	f	2026-03-06 14:30:16.051257	2026-03-11 17:25:49.931277	Proyectos Estrategicos
50	Departamento de Planes y Programas Municipales	SMADSOT.SGTDU.DDUIA.DPPM	DEPARTAMENTO	39	5	f	2026-03-06 14:30:16.068827	2026-03-11 17:25:49.931277	Planes y Programas Municipales
21	Secretaria	SMADSOT	SECRETARIA	20	2	t	2026-03-06 14:30:15.328979	2026-03-11 15:55:37.133653	Secretaria Principal
22	Subsecretaria de Gestion Ambiental y Sustentabilidad Energetica	SMADSOT.SGASE	SUBSECRETARIA	21	3	t	2026-03-06 14:30:15.347146	2026-03-11 15:55:37.133653	Gestion Ambiental y Sustentabilidad Energetica
23	Direccion de Seguridad Hidrica	SMADSOT.SGASE.DSHTE	DIRECCION	22	4	t	2026-03-06 14:30:15.385485	2026-03-11 15:55:37.133653	Seguridad Hidrica
24	Direccion de Gestion de Cambio Climatico, Ciudades Inteligentes y Transicion Energetica	SMADSOT.SGASE.DGCCCI	DIRECCION	22	4	t	2026-03-06 14:30:15.402466	2026-03-11 15:55:37.133653	Cambio Climatico y Transicion Energetica
25	Direccion de Gestion de Calidad del Aire	SMADSOT.SGASE.DGCA	DIRECCION	22	4	t	2026-03-06 14:30:15.447347	2026-03-11 15:55:37.133653	Calidad del Aire
26	Direccion de Gestion de Residuos	SMADSOT.SGASE.DGR	DIRECCION	22	4	t	2026-03-06 14:30:15.464899	2026-03-11 15:55:37.133653	Gestion de Residuos
32	Departamento de Monitoreo y Evaluacion de Emisiones	SMADSOT.SGASE.DGCA.DMEE	DEPARTAMENTO	25	5	t	2026-03-06 14:30:15.613476	2026-03-11 16:12:21.880157	Monitoreo y Evaluacion de Emisiones
33	Departamento de Verificacion y Regulacion de Fuentes	SMADSOT.SGASE.DGCA.DVRF	DEPARTAMENTO	25	5	t	2026-03-06 14:30:15.631048	2026-03-11 16:12:21.880157	Verificacion y Regulacion de Fuentes
34	Departamento de Tratamiento de Residuos Solidos	SMADSOT.SGASE.DGR.DTRS	DEPARTAMENTO	26	5	t	2026-03-06 14:30:15.66505	2026-03-11 16:12:21.880157	Tratamiento de Residuos Solidos
35	Departamento de Residuos de Manejo Especial	SMADSOT.SGASE.DGR.DRME	DEPARTAMENTO	26	5	t	2026-03-06 14:30:15.681933	2026-03-11 16:12:21.880157	Residuos de Manejo Especial
36	Subsecretaria para la Gestion del Territorio y Desarrollo Urbano	SMADSOT.SGTDU	SUBSECRETARIA	21	3	t	2026-03-06 14:30:15.711717	2026-03-11 16:12:21.880157	Gestion del Territorio y Desarrollo Urbano
37	Direccion de Gestion de Recursos Naturales y Biodiversidad	SMADSOT.SGTDU.DGRNB	DIRECCION	36	4	t	2026-03-06 14:30:15.754189	2026-03-11 16:12:21.880157	Recursos Naturales y Biodiversidad
38	Direccion de Gestion del Suelo y sus Usos	SMADSOT.SGTDU.DGSU	DIRECCION	36	4	t	2026-03-06 14:30:15.772012	2026-03-11 16:12:21.880157	Gestion del Suelo y sus Usos
39	Direccion de Desarrollo Urbano e Impacto Ambiental	SMADSOT.SGTDU.DDUIA	DIRECCION	36	4	t	2026-03-06 14:30:15.805175	2026-03-11 16:12:21.880157	Desarrollo Urbano e Impacto Ambiental
40	Direccion de Gestion de Riesgos	SMADSOT.SGTDU.DGR	DIRECCION	36	4	t	2026-03-06 14:30:15.821207	2026-03-11 16:12:21.880157	Gestion de Riesgos
41	Direccion General de Contaminacion Visual	SMADSOT.DGCV	DIRECCION	36	4	t	2026-03-06 14:30:15.864545	2026-03-11 16:12:21.880157	Contaminacion Visual
42	Departamento de Restauracion y Rehabilitacion de Ecosistemas	SMADSOT.SGTDU.DGRNB.DRRE	DEPARTAMENTO	37	5	t	2026-03-06 14:30:15.883723	2026-03-11 16:12:21.880157	Restauracion de Ecosistemas
43	Departamento de Vida Silvestre	SMADSOT.SGTDU.DGRNB.DVS	DEPARTAMENTO	37	5	t	2026-03-06 14:30:15.924251	2026-03-11 16:12:21.880157	Vida Silvestre
44	Departamento de Ecosistemas Productivos y Biodiversidad	SMADSOT.SGTDU.DGRNB.DEPB	DEPARTAMENTO	37	5	t	2026-03-06 14:30:15.941607	2026-03-11 16:12:21.880157	Ecosistemas Productivos
45	Departamento de Proteccion Forestal	SMADSOT.SGTDU.DGRNB.DPF	DEPARTAMENTO	37	5	t	2026-03-06 14:30:15.970507	2026-03-11 16:12:21.880157	Proteccion Forestal
46	Departamento de Conservacion del Patrimonio	SMADSOT.SGTDU.DGSU.DCP	DEPARTAMENTO	38	5	t	2026-03-06 14:30:15.989517	2026-03-11 16:12:21.880157	Conservacion del Patrimonio
47	Departamento de Usos de Suelo y Reservas Territoriales	SMADSOT.SGTDU.DGSU.DUSRT	DEPARTAMENTO	38	5	t	2026-03-06 14:30:16.005318	2026-03-11 16:12:21.880157	Usos de Suelo y Reservas
48	Departamento de Impacto Urbano y Ambiental	SMADSOT.SGTDU.DDUIA.DIUF	DEPARTAMENTO	39	5	t	2026-03-06 14:30:16.032664	2026-03-11 16:12:21.880157	Impacto Urbano y Ambiental
75	Sistemas	SMADSOT.DA.DRFH.SS	DEPARTAMENTO	73	4	t	2026-03-06 14:30:16.643895	2026-03-11 17:20:25.57931	Sistemas
51	Departamento de Ordenamiento Territorial	SMADSOT.SGTDU.DDUIA.DDM	DEPARTAMENTO	39	5	t	2026-03-06 14:30:16.086418	2026-03-11 16:12:21.880157	Ordenamiento Territorial
52	Departamento de Riesgos y Atlas	SMADSOT.SGTDU.DGR.DRA	DEPARTAMENTO	40	5	t	2026-03-06 14:30:16.107862	2026-03-11 16:12:21.880157	Riesgos y Atlas
53	Departamento de Gestion y Adaptacion ante Riesgos	SMADSOT.SGTDU.DGR.DGAR	DEPARTAMENTO	40	5	t	2026-03-06 14:30:16.124182	2026-03-11 16:12:21.880157	Gestion y Adaptacion ante Riesgos
54	Subdireccion de Prevencion de Contaminacion Visual	SMADSOT.DGCV.SPCV	SUBDIRECCION	41	5	t	2026-03-06 14:30:16.152607	2026-03-11 16:12:21.880157	Prevencion de Contaminacion Visual
55	Subdireccion de Evaluacion y Atencion de la Contaminacion Visual	SMADSOT.DGCV.SEACV	SUBDIRECCION	41	5	t	2026-03-06 14:30:16.170471	2026-03-11 16:12:21.880157	Evaluacion y Atencion de Contaminacion Visual
56	Direccion General de Inspeccion y Vigilancia	SMADSOT.DGIV	DIRECCION	21	3	t	2026-03-06 14:30:16.210112	2026-03-11 16:12:21.880157	Inspeccion y Vigilancia
57	Departamento de Supervision	SMADSOT.DGIV.DS	DEPARTAMENTO	56	4	t	2026-03-06 14:30:16.228753	2026-03-11 16:12:21.880157	Supervision
58	Departamento de Normativa y Sanciones	SMADSOT.DGIV.DNS	DEPARTAMENTO	56	4	t	2026-03-06 14:30:16.277206	2026-03-11 16:12:21.880157	Normativa y Sanciones
59	Departamento de Denuncias Ambientales	SMADSOT.DGIV.DDA	DEPARTAMENTO	56	4	t	2026-03-06 14:30:16.325077	2026-03-11 16:12:21.880157	Denuncias Ambientales
60	Departamento de Dictamenes Tecnicos	SMADSOT.DGIV.DDT	DEPARTAMENTO	56	4	t	2026-03-06 14:30:16.345187	2026-03-11 16:12:21.880157	Dictamenes Tecnicos
61	Direccion General de Asuntos Juridicos	SMADSOT.DGAJ	DIRECCION	21	3	t	2026-03-06 14:30:16.365601	2026-03-11 16:12:21.880157	Asuntos Juridicos
62	Departamento Contencioso	SMADSOT.DGAJ.DCT	DEPARTAMENTO	61	4	t	2026-03-06 14:30:16.396137	2026-03-11 16:12:21.880157	Departamento Contencioso
63	Departamento Consultivo	SMADSOT.DGAJ.DCS	DEPARTAMENTO	61	4	t	2026-03-06 14:30:16.412354	2026-03-11 16:12:21.880157	Departamento Consultivo
64	Departamento de Enlace de Transparencia	SMADSOT.DGAJ.DET	DEPARTAMENTO	61	4	t	2026-03-06 14:30:16.444584	2026-03-11 16:12:21.880157	Enlace de Transparencia
65	Direccion de Planeacion y Geomatica	SMADSOT.DPG	DIRECCION	21	3	t	2026-03-06 14:30:16.461877	2026-03-11 16:12:21.880157	Planeacion y Geomatica
66	Departamento de Planeacion y Evaluacion	SMADSOT.DPG.DPE	DEPARTAMENTO	65	4	t	2026-03-06 14:30:16.482079	2026-03-11 16:12:21.880157	Planeacion y Evaluacion
67	Departamento de Banco de Proyectos y Gestion Concurrente	SMADSOT.DPG.DBPGC	DEPARTAMENTO	65	4	t	2026-03-06 14:30:16.500066	2026-03-11 16:12:21.880157	Banco de Proyectos
68	Departamento de Geomatica e Informacion	SMADSOT.DPG.DGI	DEPARTAMENTO	65	4	t	2026-03-06 14:30:16.519194	2026-03-11 16:12:21.880157	Geomatica e Informacion
73	Coordinacion de Recursos Financieros y Factor Humano	SMADSOT.DA.DRFH	COORDINACION	72	4	t	2026-03-06 14:30:16.607747	2026-03-11 17:20:25.57931	Recursos Financieros y Factor Humano
74	Coordinacion de Recursos Materiales, Servicios Generales y Parque Vehicular	SMADSOT.DA.CRMSGPV	COORDINACION	72	4	t	2026-03-06 14:30:16.626336	2026-03-11 17:20:25.57931	Recursos Materiales y Servicios
76	Unidad Coordinadora de Archivo	SMADSOT.UCA	COORDINACION	72	4	t	2026-03-06 14:30:16.661641	2026-03-11 17:20:25.57931	Archivo
77	Comite de Etica y Prevencion de Conflictos de Interes	SMADSOT-CEPCI	COORDINACION	21	4	t	2026-03-06 14:30:16.67889	2026-03-11 17:20:25.57931	Etica y Prevencion de Conflictos
78	Departamento de Recursos Financieros	SMADSOT.DA.DRFH.RF	DEPARTAMENTO	73	5	t	2026-03-06 14:30:16.697055	2026-03-11 17:20:25.57931	Recursos Financieros
79	Departamento de Factor Humano	SMADSOT.DA.DRFH.RH	DEPARTAMENTO	73	5	t	2026-03-06 14:30:16.714119	2026-03-11 17:20:25.57931	Factor Humano
80	Transparencia de Administracion	SMADSOT.DA.DRFH.TR	DEPARTAMENTO	73	5	t	2026-03-06 14:30:16.730307	2026-03-11 17:20:25.57931	Transparencia
81	Departamento de Recursos Materiales	SMADSOT.DA.CRMSGPV.DRM	DEPARTAMENTO	74	5	t	2026-03-06 14:30:16.747883	2026-03-11 17:20:25.57931	Recursos Materiales
82	Departamento de Servicios Generales y Parque Vehicular	SMADSOT.DA.CRMSGPV.DSGPV	DEPARTAMENTO	74	5	t	2026-03-06 14:30:16.766428	2026-03-11 17:20:25.57931	Servicios Generales
84	Servicios Tecnologicos	SMADSOT.DA.DRMST.ST	DEPARTAMENTO	74	5	t	2026-03-06 14:30:16.802284	2026-03-11 17:20:25.57931	Servicios Tecnologicos
85	Almacen	SMADSOT.DA.DRMST.IN	DEPARTAMENTO	74	5	t	2026-03-06 14:30:16.828025	2026-03-11 17:20:25.57931	Almacen
86	Secretaria Particular	SMADSOT.SP	COORDINACION	21	3	t	2026-03-06 14:30:16.847144	2026-03-11 17:20:25.57931	Secretaria Particular
87	Departamento de Atencion Ciudadana	SMADSOT.SP.AC	DEPARTAMENTO	86	4	t	2026-03-06 14:30:16.866073	2026-03-11 17:20:25.57931	Atencion Ciudadana
88	Instituto de Bienestar Animal	SMADSOT.IBA	DIRECCION	21	3	t	2026-03-06 14:30:16.883804	2026-03-11 17:20:25.57931	Instituto de Bienestar Animal
89	Direccion de Cultura de Bienestar Animal	SMADSOT.IBA.DCBA	DIRECCION	88	4	t	2026-03-06 14:30:16.90177	2026-03-11 17:20:25.57931	Cultura de Bienestar Animal
90	Direccion de Normatividad y Denuncias	SMADSOT.IBA.DND	DIRECCION	88	4	t	2026-03-06 14:30:16.919365	2026-03-11 17:20:25.57931	Normatividad y Denuncias
91	Direccion Medico Veterinario y Forense	SMADSOT.IBA.DMVF	DIRECCION	88	4	t	2026-03-06 14:30:16.935572	2026-03-11 17:20:25.57931	Medico Veterinario y Forense
92	Departamento de Fomento y Cultura del Bienestar Animal	SMADSOT.IBA.DCBA.DFCBA	DEPARTAMENTO	89	5	t	2026-03-06 14:30:16.952637	2026-03-11 17:20:25.57931	Fomento y Cultura
93	Departamento de Vinculacion Social y Administracion de Padrones	SMADSOT.IBA.DCBA.DVSAP	DEPARTAMENTO	89	5	t	2026-03-06 14:30:16.970051	2026-03-11 17:20:25.57931	Vinculacion Social
94	Departamento de Denuncias	SMADSOT.IBA.DND.DD	DEPARTAMENTO	90	5	t	2026-03-06 14:30:16.988286	2026-03-11 17:20:25.57931	Denuncias
95	Departamento de Normatividad y Recomendaciones	SMADSOT.IBA.DND.DNR	DEPARTAMENTO	90	5	t	2026-03-06 14:30:17.01596	2026-03-11 17:20:25.57931	Normatividad y Recomendaciones
96	Departamento de Administracion de la Proteccion Animal	SMADSOT.IBA.DPS.DVI	DEPARTAMENTO	91	5	t	2026-03-06 14:30:17.035392	2026-03-11 17:20:25.57931	Proteccion Animal
3	Oficialia de la Secretaria	SMADSOT-OP	OFICIALÍA	21	3	t	2026-03-05 16:46:42.918556	2026-03-11 17:20:25.57931	Oficialia de Partes - Recepcion y registro de todos los documentos
83	Vehiculos	SMADSOT.DA.DRMST.VE	DEPARTAMENTO	74	5	f	2026-03-06 14:30:16.784343	2026-03-11 17:25:49.931277	Vehiculos
97	Departamento de Proyectos de Bienestar Animal	SMADSOT.IBA.DPBA	DEPARTAMENTO	88	4	f	2026-03-06 14:30:17.054134	2026-03-11 17:25:49.931277	Proyectos de Bienestar Animal
98	Departamento de Iniciativas Sociales	SMADSOT.IBA.DIS	DEPARTAMENTO	88	4	f	2026-03-06 14:30:17.071681	2026-03-11 17:25:49.931277	Iniciativas Sociales
\.


--
-- Data for Name: auditoria_sistema; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria_sistema (id, accion, descripcion, usuario_id, area_id, fecha, detalles, ip_address, user_agent) FROM stdin;
1	LOGIN_EXITOSO	Login exitoso de usuario: admin	23	20	2026-03-08 19:28:25.9672	\N	::1	\N
2	LOGIN_EXITOSO	Login exitoso de usuario: carcamo08	24	65	2026-03-08 19:28:55.994452	\N	::1	\N
3	LOGIN_EXITOSO	Login exitoso de usuario: carcamo08	24	65	2026-03-08 19:30:39.238578	\N	::1	\N

\.


--
-- Data for Name: consecutivo_area; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consecutivo_area (id, area_id, tipo_operacion, anio, ultimo_consecutivo, fecha_actualizacion) FROM stdin;
4	20	EMISION	2026	17	2026-03-11 03:22:44.808261
5	21	EMISION	2026	18	2026-03-11 03:22:44.808261
6	22	EMISION	2026	24	2026-03-11 03:22:44.808261
7	23	EMISION	2026	17	2026-03-11 03:22:44.808261
8	24	EMISION	2026	22	2026-03-11 03:22:44.808261
9	25	EMISION	2026	15	2026-03-11 03:22:44.808261
10	26	EMISION	2026	16	2026-03-11 03:22:44.808261
\.


--
-- Data for Name: copia_conocimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.copia_conocimiento (id, documento_id, area_id, fecha_envio, fecha_lectura, leido, usuario_envia_id) FROM stdin;
1	502	21	2026-03-11 05:54:54.455728	\N	f	24
2	503	21	2026-03-11 06:00:12.859108	\N	f	24
3	504	21	2026-03-11 06:01:44.816004	\N	f	24
4	505	21	2026-03-12 04:33:10.180795	\N	f	4
5	505	72	2026-03-12 04:33:10.331221	\N	f	4
6	506	21	2026-03-13 09:03:57.313472	\N	f	6
7	506	21	2026-03-13 09:03:57.487365	\N	f	6
8	507	21	2026-03-13 09:04:44.715903	\N	f	6
9	507	65	2026-03-13 09:04:44.857454	\N	f	6
\.


--
-- Data for Name: despacho_externo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.despacho_externo (id, documento_id, nodo_id, entidad_externa_id, fecha_despacho, metodo, numero_guia, archivo_acuse_id, usuario_despacha_id, observaciones, acuse_recibido, fecha_acuse) FROM stdin;
\.


--
-- Data for Name: documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documento (id, folio, tipo_documento_id, asunto, contenido, fecha_creacion, fecha_limite, prioridad, estado, usuario_creador_id, area_origen_id, solo_conocimiento, fecha_modificacion, observaciones, entidad_externa_origen_id, entidad_externa_destino_id, numero_oficio_externo, es_externo, contexto, prestamo_numero_id, documento_invalidado, fecha_invalidacion, motivo_invalidacion) FROM stdin;
1	EM-SMADSOT.SSGTDU-DGSSU-0001/2026	11	Documento generado automÃ¡ticamente 1 para SSGTDU-DGSSU	Cuerpo de prueba para validaciÃ³n de interfaces y paginaciÃ³n en el sistema.	2026-02-10 05:55:00	\N	URGENTE	REGISTRADO	5	38	f	\N	\N	\N	\N	\N	f	INFORME	\N	f	\N	\N
2	EM-SMADSOT.SSGTDU-0001/2026	2	Documento generado automÃ¡ticamente 2 para SSGTDU	Cuerpo de prueba para validaciÃ³n de interfaces y paginaciÃ³n en el sistema.	2026-01-16 14:59:00	\N	BAJA	RECIBIDO	7	36	f	\N	\N	\N	\N	\N	f	OTRO	\N	f	\N	\N
3	EM-SMADSOT.SSGASE-DGR-0001/2026	15	Documento generado automÃ¡ticamente 3 para SSGASE-DGR	Cuerpo de prueba para validaciÃ³n de interfaces y paginaciÃ³n en el sistema.	2026-02-05 22:26:00	\N	BAJA	EN_PROCESO	17	26	f	\N	\N	\N	\N	\N	f	INFORME	\N	f	\N	\N
4	EM-SMADSOT.SSGASE-DSH-DPH-0001/2026	11	Documento generado automÃ¡ticamente 4 para SSGASE-DSH-DPH	Cuerpo de prueba para validaciÃ³n de interfaces y paginaciÃ³n en el sistema.	2026-02-25 14:37:00	\N	ALTA	CERRADO	14	29	f	\N	\N	\N	\N	\N	f	INFORME	\N	f	\N	\N
5	EM-SMADSOT.SSGASE-DGCCITE-DSE-0001/2026	15	Documento generado automÃ¡ticamente 5 para SSGASE-DGCCITE-DSE	Cuerpo de prueba para validaciÃ³n de interfaces y paginaciÃ³n en el sistema.	2026-01-26 16:28:00	\N	MEDIA	DEVUELTO	13	30	f	\N	\N	\N	\N	\N	f	MEMORANDUM	\N	f	\N	\N
6	EM-SMADSOT.SSGASE-DSH-0001/2026	7	Documento generado automÃ¡ticamente 6 para SSGASE-DSH	Cuerpo de prueba para validaciÃ³n de interfaces y paginaciÃ³n en el sistema.	2026-03-01 16:12:00	\N	MEDIA	RESPONDIDO	20	23	f	\N	\N	\N	\N	\N	f	MEMORANDUM	\N	f	\N	\N
7	EM-SMADSOT.SSGASE-DGR-DRME-0001/2026	2	Documento generado automÃ¡ticamente 7 para SSGASE-DGR-DRME	Cuerpo de prueba para validaciÃ³n de interfaces y paginaciÃ³n en el sistema.	2026-02-21 05:59:00	\N	ALTA	REGISTRADO	8	35	f	\N	\N	\N	\N	\N	f	OTRO	\N	f	\N	\N
8	EM-SMADSOT.SSGTDU-DDUIA-0001/2026	7	Documento generado automÃ¡ticamente 8 para SSGTDU-DDUIA	Cuerpo de prueba para validaciÃ³n de interfaces y paginaciÃ³n en el sistema.	2026-02-14 07:57:00	\N	MEDIA	DESPACHADO	4	39	f	\N	\N	\N	\N	\N	f	COMUNICADO_INT	\N	f	\N	\N
9	EM-SMADSOT.SSGASE-0001/2026	3	Documento generado automÃ¡ticamente 9 para SSGASE	Cuerpo de prueba para validaciÃ³n de interfaces y paginaciÃ³n en el sistema.	2026-02-28 11:32:00	\N	URGENTE	TURNADO	21	22	f	\N	\N	\N	\N	\N	f	CIRCULAR	\N	f	\N	\N
10	EM-SMADSOT.SSGTDU-0002/2026	11	Documento generado automÃ¡ticamente 10 para SSGTDU	Cuerpo de prueba para validaciÃ³n de interfaces y paginaciÃ³n en el sistema.	2026-02-27 18:13:00	\N	MEDIA	DESPACHADO	7	36	f	\N	\N	\N	\N	\N	f	INFORME	\N	f	\N	\N
\.


--
-- Data for Name: entidad_externa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.entidad_externa (id, nombre, tipo, rfc, curp, email, telefono, calle, numero_exterior, numero_interior, colonia, municipio, estado_republica, codigo_postal, activa, fecha_creacion, fecha_modificacion, observaciones) FROM stdin;
1	CONAGUA	DEPENDENCIA_FED	\N	\N	contacto@conagua.gob.mx	5555555555	Insurgentes Sur	2416	\N	Copilco Universidad	Coyoacan	Ciudad de Mexico	04340	t	2026-03-08 18:06:03.477152	\N	\N
2	CONAGUA	DEPENDENCIA_FED	\N	\N	contacto@conagua.gob.mx	5555555555	Insurgentes Sur	2416	\N	Copilco Universidad	Coyoacan	Ciudad de Mexico	04340	t	2026-03-08 18:07:59.339951	\N	\N
3	CONAGUA	DEPENDENCIA_FED	\N	\N	contacto@conagua.gob.mx	5555555555	Insurgentes Sur	2416	\N	Copilco Universidad	Coyoacan	Ciudad de Mexico	04340	t	2026-03-08 18:08:30.107948	\N	\N
\.


--
-- Data for Name: excepcion_turno_area; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.excepcion_turno_area (id, area_origen_id, area_destino_id, bidireccional, motivo, activa, fecha_creacion) FROM stdin;
\.


--
-- Data for Name: historial_documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historial_documento (id, documento_id, accion, descripcion, usuario_id, area_id, fecha, detalles, ip_address) FROM stdin;
1	1	EMITIDO	Documento emitido con folio: EM-SMADSOT.SSGTDU-DGSSU-0001/2026	5	38	2026-02-10 05:55:00	\N	\N
2	2	EMITIDO	Documento emitido con folio: EM-SMADSOT.SSGTDU-0001/2026	7	36	2026-01-16 14:59:00	\N	\N
3	3	EMITIDO	Documento emitido con folio: EM-SMADSOT.SSGASE-DGR-0001/2026	17	26	2026-02-05 22:26:00	\N	\N
4	4	EMITIDO	Documento emitido con folio: EM-SMADSOT.SSGASE-DSH-DPH-0001/2026	14	29	2026-02-25 14:37:00	\N	\N
5	5	EMITIDO	Documento emitido con folio: EM-SMADSOT.SSGASE-DGCCITE-DSE-0001/2026	13	30	2026-01-26 16:28:00	\N	\N
6	6	EMITIDO	Documento emitido con folio: EM-SMADSOT.SSGASE-DSH-0001/2026	20	23	2026-03-01 16:12:00	\N	\N
7	7	EMITIDO	Documento emitido con folio: EM-SMADSOT.SSGASE-DGR-DRME-0001/2026	8	35	2026-02-21 05:59:00	\N	\N
8	8	EMITIDO	Documento emitido con folio: EM-SMADSOT.SSGTDU-DDUIA-0001/2026	4	39	2026-02-14 07:57:00	\N	\N
9	9	EMITIDO	Documento emitido con folio: EM-SMADSOT.SSGASE-0001/2026	21	22	2026-02-28 11:32:00	\N	\N
10	10	EMITIDO	Documento emitido con folio: EM-SMADSOT.SSGTDU-0002/2026	7	36	2026-02-27 18:13:00	\N	\N
\.


--
-- Data for Name: invalidacion_documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invalidacion_documento (id, documento_id, prestamo_numero_id, usuario_invalida_id, fecha_invalidacion, motivo, folio_original, area_emisora_id, area_prestamista_id) FROM stdin;
\.


--
-- Data for Name: nivel_jerarquico_tipo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nivel_jerarquico_tipo (tipo, nivel_peso, descripcion) FROM stdin;
OFICIALÍA	1	Oficialía de la Secretaría — entrada y salida de documentos externos
SECRETARIA	2	Titular de la dependencia
SECRETARIA_PARTICULAR	3	Enlace directo de la Secretaría
SUBSECRETARIA	3	Unidad de mando intermedio de primer nivel
INSTITUTO	3	Organismo con estructura propia bajo Secretaría
DIRECCION_GENERAL	4	Dirección con alcance transversal
DIRECCION	5	Dirección operativa bajo Subsecretaría o Dirección General
COORDINACION	6	Coordinación bajo Dirección
SUBDIRECCION	6	Subdirección bajo Dirección o Dirección General
DEPARTAMENTO	7	Unidad mínima ejecutora
UNIDAD	7	Unidad especializada (archivo, igualdad, etc.)
COMITE	8	Órgano colegiado interno (no turna documentos operativos)
\.


--
-- Data for Name: nodo_documental; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nodo_documental (id, documento_id, tipo_nodo, estado, nodo_padre_id, folio_original, folio_padre, folio_propio, area_id, usuario_responsable_id, usuario_recibe_id, fecha_generacion, fecha_recepcion, fecha_cierre, instrucciones, observaciones, es_nodo_activo) FROM stdin;
1	1	EMISION	ACTIVO	\N	EM-SMADSOT.SSGTDU-DGSSU-0001/2026	\N	EM-SMADSOT.SSGTDU-DGSSU-0001/2026	38	5	\N	2026-02-10 05:55:00	\N	\N	\N	\N	t
2	2	EMISION	ACTIVO	\N	EM-SMADSOT.SSGTDU-0001/2026	\N	EM-SMADSOT.SSGTDU-0001/2026	36	7	\N	2026-01-16 14:59:00	\N	\N	\N	\N	t
3	3	EMISION	ACTIVO	\N	EM-SMADSOT.SSGASE-DGR-0001/2026	\N	EM-SMADSOT.SSGASE-DGR-0001/2026	26	17	\N	2026-02-05 22:26:00	\N	\N	\N	\N	t
4	4	EMISION	CERRADO	\N	EM-SMADSOT.SSGASE-DSH-DPH-0001/2026	\N	EM-SMADSOT.SSGASE-DSH-DPH-0001/2026	29	14	\N	2026-02-25 14:37:00	\N	\N	\N	\N	t
5	5	EMISION	CERRADO	\N	EM-SMADSOT.SSGASE-DGCCITE-DSE-0001/2026	\N	EM-SMADSOT.SSGASE-DGCCITE-DSE-0001/2026	30	13	\N	2026-01-26 16:28:00	\N	\N	\N	\N	t
6	6	EMISION	CERRADO	\N	EM-SMADSOT.SSGASE-DSH-0001/2026	\N	EM-SMADSOT.SSGASE-DSH-0001/2026	23	20	\N	2026-03-01 16:12:00	\N	\N	\N	\N	t
7	7	EMISION	ACTIVO	\N	EM-SMADSOT.SSGASE-DGR-DRME-0001/2026	\N	EM-SMADSOT.SSGASE-DGR-DRME-0001/2026	35	8	\N	2026-02-21 05:59:00	\N	\N	\N	\N	t
8	8	EMISION	CERRADO	\N	EM-SMADSOT.SSGTDU-DDUIA-0001/2026	\N	EM-SMADSOT.SSGTDU-DDUIA-0001/2026	39	4	\N	2026-02-14 07:57:00	\N	\N	\N	\N	t
9	9	EMISION	PENDIENTE	\N	EM-SMADSOT.SSGASE-0001/2026	\N	EM-SMADSOT.SSGASE-0001/2026	22	21	\N	2026-02-28 11:32:00	\N	\N	\N	\N	t
10	10	EMISION	CERRADO	\N	EM-SMADSOT.SSGTDU-0002/2026	\N	EM-SMADSOT.SSGTDU-0002/2026	36	7	\N	2026-02-27 18:13:00	\N	\N	\N	\N	t
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
-- Data for Name: prestamo_numero_oficio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prestamo_numero_oficio (id, area_solicitante_id, area_prestamista_id, usuario_solicita_id, usuario_resuelve_id, estado, fecha_solicitud, fecha_resolucion, fecha_vencimiento, folio_asignado, motivacion, motivo_rechazo, documento_id, documento_invalidado, fecha_invalidacion, motivo_invalidacion, dias_revision, fecha_limite_revision) FROM stdin;
1	68	21	24	\N	SOLICITADO	2026-03-12 00:19:18.715545	\N	\N	\N	asaasasasasasas	\N	\N	f	\N	\N	5	\N
2	68	65	24	\N	SOLICITADO	2026-03-12 00:19:42.728309	\N	\N	\N	asasasasasas	\N	\N	f	\N	\N	5	\N
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, token, usuario_id, expires_at, created_at, ip_address, user_agent, revoked, revoked_at, replaced_by_token) FROM stdin;
3	44a744a6b08a390df5b498ae82a1fea0e6abdea50d36b4a72dc2d15ffa266078066c4b06365478cbdcdb0155f9fea060c719c397a49d7271305005bef9c904a0	24	2026-03-15 13:30:39.554	2026-03-08 19:30:39.248115	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	t	2026-03-08 19:30:52.373869	\N
1	3e7ef6c9a1803346466f6643292427b27b65738721a053d9fa574604f07cbda7dde023617faa3f3a50886d3cf0e83135983158e63b4289a33831e08fb41edbfa	23	2026-03-15 13:28:25.74	2026-03-08 19:28:25.982321	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	t	2026-03-08 19:28:49.112731	\N
73	9c6d789116c1e59beaf4be167da1192c9eb196b6cee7397983ce863551d1573ea29dcb00bd512e2ef7ec50cd8d0556c3c5218009c12ad9f4f2d9770fe43d774e	23	2026-03-18 20:40:27.009	2026-03-12 02:40:27.02658	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	f	\N	\N
4	68d7063720a883ace009f2d65aa8b0fea441bcc608345caec831b30831be4b5192525f7c1f2cdc7690da5eee67d1578f3d7e707c0e45e6cd80bcd1dbb46f6ab6	23	2026-03-15 17:19:23.758	2026-03-08 23:19:23.747227	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	t	2026-03-08 23:19:40.827771	\N
5	607be00fbfa36fd762bc4563a342607d221e2ec6e8b4db8683cb2f3d18bc771828661a2e6170759466594c9ce6a7729a521c51d2cd43fdab3f9f1d6bafdb74ba	23	2026-03-17 01:17:44.115	2026-03-10 07:17:44.120139	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	t	2026-03-10 07:17:48.28732	\N
\.


--
-- Data for Name: regla_turno; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.regla_turno (id, tipo_origen, tipo_destino, condicion_relacion, requiere_justificacion, activa, observaciones, fecha_creacion) FROM stdin;
1	OFICIALÍA	SECRETARIA	CUALQUIERA	f	t	Oficialía puede turnar a Secretaría	2026-03-12 04:22:46.213341
2	OFICIALÍA	SECRETARIA_PARTICULAR	CUALQUIERA	f	t	Oficialía puede turnar a Secretaría Particular	2026-03-12 04:22:46.213341
3	OFICIALÍA	SUBSECRETARIA	CUALQUIERA	f	t	Oficialía puede turnar a Subsecretarías	2026-03-12 04:22:46.213341
4	OFICIALÍA	INSTITUTO	CUALQUIERA	f	t	Oficialía puede turnar a Institutos	2026-03-12 04:22:46.213341
5	OFICIALÍA	DIRECCION_GENERAL	CUALQUIERA	f	t	Oficialía puede turnar a Direcciones Generales	2026-03-12 04:22:46.213341
6	OFICIALÍA	DIRECCION	CUALQUIERA	f	t	Oficialía puede turnar a Direcciones	2026-03-12 04:22:46.213341
7	OFICIALÍA	COORDINACION	CUALQUIERA	f	t	Oficialía puede turnar a Coordinaciones	2026-03-12 04:22:46.213341
8	OFICIALÍA	SUBDIRECCION	CUALQUIERA	f	t	Oficialía puede turnar a Subdirecciones	2026-03-12 04:22:46.213341
9	OFICIALÍA	DEPARTAMENTO	CUALQUIERA	f	t	Oficialía puede turnar a Departamentos	2026-03-12 04:22:46.213341
10	OFICIALÍA	UNIDAD	CUALQUIERA	f	t	Oficialía puede turnar a Unidades	2026-03-12 04:22:46.213341
11	SECRETARIA	OFICIALÍA	CUALQUIERA	f	t	Secretaría puede despachar a Oficialía	2026-03-12 04:22:46.219746
12	SECRETARIA	SECRETARIA_PARTICULAR	DESCENDENTE	f	t	Secretaría puede turnar a su Secretaría Particular	2026-03-12 04:22:46.219746
13	SECRETARIA	SUBSECRETARIA	DESCENDENTE	f	t	Secretaría puede turnar a Subsecretarías dependientes	2026-03-12 04:22:46.219746
14	SECRETARIA	INSTITUTO	DESCENDENTE	f	t	Secretaría puede turnar a Institutos dependientes	2026-03-12 04:22:46.219746
15	SECRETARIA	DIRECCION_GENERAL	DESCENDENTE	f	t	Secretaría puede turnar a Direcciones Generales	2026-03-12 04:22:46.219746
16	SECRETARIA	DIRECCION	DESCENDENTE	f	t	Secretaría puede turnar a Direcciones	2026-03-12 04:22:46.219746
17	SECRETARIA	COORDINACION	DESCENDENTE	f	t	Secretaría puede turnar a Coordinaciones	2026-03-12 04:22:46.219746
18	SECRETARIA	SUBDIRECCION	DESCENDENTE	f	t	Secretaría puede turnar a Subdirecciones	2026-03-12 04:22:46.219746
19	SECRETARIA	DEPARTAMENTO	DESCENDENTE	f	t	Secretaría puede turnar a Departamentos	2026-03-12 04:22:46.219746
20	SECRETARIA	UNIDAD	DESCENDENTE	f	t	Secretaría puede turnar a Unidades	2026-03-12 04:22:46.219746
21	SECRETARIA_PARTICULAR	SECRETARIA	ASCENDENTE	f	t	Secretaría Particular puede turnar a Secretaría	2026-03-12 04:22:46.224255
22	SECRETARIA_PARTICULAR	OFICIALÍA	CUALQUIERA	f	t	Secretaría Particular puede despachar a Oficialía	2026-03-12 04:22:46.224255
23	SECRETARIA_PARTICULAR	SUBSECRETARIA	LATERAL	f	t	Secretaría Particular puede turnar a Subsecretarías	2026-03-12 04:22:46.224255
24	SECRETARIA_PARTICULAR	DIRECCION_GENERAL	DESCENDENTE	f	t	Secretaría Particular puede turnar a DG	2026-03-12 04:22:46.224255
25	SECRETARIA_PARTICULAR	DIRECCION	DESCENDENTE	f	t	Secretaría Particular puede turnar a Direcciones	2026-03-12 04:22:46.224255
26	SUBSECRETARIA	SECRETARIA	ASCENDENTE	f	t	Subsecretaría puede turnar a Secretaría	2026-03-12 04:22:46.229437
27	SUBSECRETARIA	SECRETARIA_PARTICULAR	LATERAL	f	t	Subsecretaría puede turnar a Secretaría Particular	2026-03-12 04:22:46.229437
28	SUBSECRETARIA	OFICIALÍA	CUALQUIERA	f	t	Subsecretaría puede despachar a Oficialía	2026-03-12 04:22:46.229437
29	SUBSECRETARIA	SUBSECRETARIA	CUALQUIERA	f	t	Subsecretaría puede turnar a otra Subsecretaría	2026-03-12 04:22:46.229437
30	SUBSECRETARIA	DIRECCION_GENERAL	DESCENDENTE	f	t	Subsecretaría puede turnar a sus DG	2026-03-12 04:22:46.229437
31	SUBSECRETARIA	DIRECCION	DESCENDENTE	f	t	Subsecretaría puede turnar a sus Direcciones	2026-03-12 04:22:46.229437
32	SUBSECRETARIA	COORDINACION	DESCENDENTE	f	t	Subsecretaría puede turnar a sus Coordinaciones	2026-03-12 04:22:46.229437
33	SUBSECRETARIA	SUBDIRECCION	DESCENDENTE	f	t	Subsecretaría puede turnar a sus Subdirecciones	2026-03-12 04:22:46.229437
34	SUBSECRETARIA	DEPARTAMENTO	DESCENDENTE	f	t	Subsecretaría puede turnar a sus Departamentos	2026-03-12 04:22:46.229437
35	SUBSECRETARIA	UNIDAD	DESCENDENTE	f	t	Subsecretaría puede turnar a sus Unidades	2026-03-12 04:22:46.229437
36	INSTITUTO	SECRETARIA	ASCENDENTE	f	t	Instituto puede turnar a Secretaría	2026-03-12 04:22:46.23403
37	INSTITUTO	OFICIALÍA	CUALQUIERA	f	t	Instituto puede despachar a Oficialía	2026-03-12 04:22:46.23403
38	INSTITUTO	DIRECCION_GENERAL	DESCENDENTE	f	t	Instituto puede turnar a sus DG	2026-03-12 04:22:46.23403
39	INSTITUTO	DIRECCION	DESCENDENTE	f	t	Instituto puede turnar a sus Direcciones	2026-03-12 04:22:46.23403
40	INSTITUTO	COORDINACION	DESCENDENTE	f	t	Instituto puede turnar a sus Coordinaciones	2026-03-12 04:22:46.23403
41	INSTITUTO	DEPARTAMENTO	DESCENDENTE	f	t	Instituto puede turnar a sus Departamentos	2026-03-12 04:22:46.23403
42	DIRECCION_GENERAL	SUBSECRETARIA	ASCENDENTE	f	t	DG puede turnar a Subsecretaría	2026-03-12 04:22:46.239118
43	DIRECCION_GENERAL	SECRETARIA	ASCENDENTE	f	t	DG puede turnar a Secretaría	2026-03-12 04:22:46.239118
44	DIRECCION_GENERAL	INSTITUTO	ASCENDENTE	f	t	DG puede turnar a Instituto	2026-03-12 04:22:46.239118
45	DIRECCION_GENERAL	OFICIALÍA	CUALQUIERA	f	t	DG puede despachar a Oficialía	2026-03-12 04:22:46.239118
46	DIRECCION_GENERAL	DIRECCION_GENERAL	CUALQUIERA	f	t	DG puede turnar a otra DG	2026-03-12 04:22:46.239118
47	DIRECCION_GENERAL	DIRECCION	DESCENDENTE	f	t	DG puede turnar a sus Direcciones	2026-03-12 04:22:46.239118
48	DIRECCION_GENERAL	COORDINACION	DESCENDENTE	f	t	DG puede turnar a sus Coordinaciones	2026-03-12 04:22:46.239118
49	DIRECCION_GENERAL	SUBDIRECCION	DESCENDENTE	f	t	DG puede turnar a sus Subdirecciones	2026-03-12 04:22:46.239118
50	DIRECCION_GENERAL	DEPARTAMENTO	DESCENDENTE	f	t	DG puede turnar a sus Departamentos	2026-03-12 04:22:46.239118
51	DIRECCION_GENERAL	UNIDAD	DESCENDENTE	f	t	DG puede turnar a sus Unidades	2026-03-12 04:22:46.239118
52	DIRECCION	DIRECCION_GENERAL	ASCENDENTE	f	t	Dirección puede turnar a DG	2026-03-12 04:22:46.243583
53	DIRECCION	SUBSECRETARIA	ASCENDENTE	f	t	Dirección puede turnar a Subsecretaría	2026-03-12 04:22:46.243583
54	DIRECCION	INSTITUTO	ASCENDENTE	f	t	Dirección puede turnar a Instituto	2026-03-12 04:22:46.243583
55	DIRECCION	OFICIALÍA	CUALQUIERA	f	t	Dirección puede despachar a Oficialía	2026-03-12 04:22:46.243583
56	DIRECCION	DIRECCION	CUALQUIERA	f	t	Dirección puede turnar a otra Dirección	2026-03-12 04:22:46.243583
57	DIRECCION	COORDINACION	DESCENDENTE	f	t	Dirección puede turnar a sus Coordinaciones	2026-03-12 04:22:46.243583
58	DIRECCION	SUBDIRECCION	DESCENDENTE	f	t	Dirección puede turnar a sus Subdirecciones	2026-03-12 04:22:46.243583
59	DIRECCION	DEPARTAMENTO	DESCENDENTE	f	t	Dirección puede turnar a sus Departamentos	2026-03-12 04:22:46.243583
60	DIRECCION	UNIDAD	DESCENDENTE	f	t	Dirección puede turnar a sus Unidades	2026-03-12 04:22:46.243583
61	COORDINACION	DIRECCION	ASCENDENTE	f	t	Coordinación puede turnar a Dirección	2026-03-12 04:22:46.248021
62	COORDINACION	DIRECCION_GENERAL	ASCENDENTE	f	t	Coordinación puede turnar a DG	2026-03-12 04:22:46.248021
63	COORDINACION	OFICIALÍA	CUALQUIERA	f	t	Coordinación puede despachar a Oficialía	2026-03-12 04:22:46.248021
64	COORDINACION	COORDINACION	CUALQUIERA	f	t	Coordinación puede turnar a otra Coordinación	2026-03-12 04:22:46.248021
65	COORDINACION	SUBDIRECCION	LATERAL	f	t	Coordinación puede turnar a Subdirección	2026-03-12 04:22:46.248021
66	COORDINACION	DEPARTAMENTO	DESCENDENTE	f	t	Coordinación puede turnar a sus Departamentos	2026-03-12 04:22:46.248021
67	COORDINACION	UNIDAD	DESCENDENTE	f	t	Coordinación puede turnar a sus Unidades	2026-03-12 04:22:46.248021
68	SUBDIRECCION	DIRECCION	ASCENDENTE	f	t	Subdirección puede turnar a Dirección	2026-03-12 04:22:46.259198
69	SUBDIRECCION	DIRECCION_GENERAL	ASCENDENTE	f	t	Subdirección puede turnar a DG	2026-03-12 04:22:46.259198
70	SUBDIRECCION	OFICIALÍA	CUALQUIERA	f	t	Subdirección puede despachar a Oficialía	2026-03-12 04:22:46.259198
71	SUBDIRECCION	SUBDIRECCION	CUALQUIERA	f	t	Subdirección puede turnar a otra Subdirección	2026-03-12 04:22:46.259198
72	SUBDIRECCION	COORDINACION	LATERAL	f	t	Subdirección puede turnar a Coordinación	2026-03-12 04:22:46.259198
73	SUBDIRECCION	DEPARTAMENTO	DESCENDENTE	f	t	Subdirección puede turnar a sus Departamentos	2026-03-12 04:22:46.259198
74	SUBDIRECCION	UNIDAD	DESCENDENTE	f	t	Subdirección puede turnar a sus Unidades	2026-03-12 04:22:46.259198
75	DEPARTAMENTO	COORDINACION	ASCENDENTE	f	t	Departamento puede turnar a Coordinación	2026-03-12 04:22:46.263749
76	DEPARTAMENTO	SUBDIRECCION	ASCENDENTE	f	t	Departamento puede turnar a Subdirección	2026-03-12 04:22:46.263749
77	DEPARTAMENTO	DIRECCION	ASCENDENTE	f	t	Departamento puede turnar a Dirección	2026-03-12 04:22:46.263749
78	DEPARTAMENTO	OFICIALÍA	CUALQUIERA	f	t	Departamento puede despachar a Oficialía	2026-03-12 04:22:46.263749
79	DEPARTAMENTO	DEPARTAMENTO	CUALQUIERA	f	t	Departamento puede turnar a otro Departamento	2026-03-12 04:22:46.263749
80	DEPARTAMENTO	UNIDAD	DESCENDENTE	f	t	Departamento puede turnar a sus Unidades	2026-03-12 04:22:46.263749
81	UNIDAD	DEPARTAMENTO	ASCENDENTE	f	t	Unidad puede turnar a Departamento	2026-03-12 04:22:46.26808
82	UNIDAD	COORDINACION	ASCENDENTE	f	t	Unidad puede turnar a Coordinación	2026-03-12 04:22:46.26808
83	UNIDAD	SUBDIRECCION	ASCENDENTE	f	t	Unidad puede turnar a Subdirección	2026-03-12 04:22:46.26808
84	UNIDAD	DIRECCION	ASCENDENTE	f	t	Unidad puede turnar a Dirección	2026-03-12 04:22:46.26808
85	UNIDAD	OFICIALÍA	CUALQUIERA	f	t	Unidad puede despachar a Oficialía	2026-03-12 04:22:46.26808
86	UNIDAD	UNIDAD	CUALQUIERA	f	t	Unidad puede turnar a otra Unidad	2026-03-12 04:22:46.26808
\.


--
-- Data for Name: respuesta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.respuesta (id, documento_origen_id, folio_respuesta, contenido, fecha_respuesta, usuario_responde_id, area_responde_id, cierra_tramite, documento_respuesta_id, observaciones, nodo_origen_id) FROM stdin;
\.


--
-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rol (id, nombre, descripcion, permisos, activo, fecha_creacion, fecha_modificacion) FROM stdin;
2	Secretario	Titular de Secretaría	GESTIONAR_SECRETARIA,CREAR_DOCUMENTO,TURNAR,VER_TODO,CANCELAR,REPORTES	t	2026-03-05 16:46:42.912356	\N
3	Subsecretario	Titular de Subsecretaría	GESTIONAR_SUBSECRETARIA,CREAR_DOCUMENTO,TURNAR,VER_AREA,REPORTES	t	2026-03-05 16:46:42.912356	\N
4	Director	Director de Área	GESTIONAR_DIRECCION,CREAR_DOCUMENTO,TURNAR,RESPONDER,VER_AREA	t	2026-03-05 16:46:42.912356	\N
5	Subdirector	Subdirector de Área	GESTIONAR_SUBDIRECCION,CREAR_DOCUMENTO,TURNAR,RESPONDER,VER_AREA	t	2026-03-05 16:46:42.912356	\N
6	Coordinador	Coordinador de Área	CREAR_DOCUMENTO,TURNAR,RESPONDER,VER_AREA	t	2026-03-05 16:46:42.912356	\N
7	Jefe de Departamento	Jefe de Departamento	CREAR_DOCUMENTO,RESPONDER,VER_DEPARTAMENTO	t	2026-03-05 16:46:42.912356	\N
8	Analista	Analista operativo	CREAR_DOCUMENTO,VER_ASIGNADOS	t	2026-03-05 16:46:42.912356	\N
9	Oficialía de Partes	Recepción y registro de documentos	REGISTRAR,TURNAR	t	2026-03-05 16:46:42.912356	\N
1	Administrador	Acceso total al sistema	*	t	2026-03-05 16:46:42.912356	\N
10	Consulta	Usuario de solo consulta	VER_PUBLICOS	f	2026-03-05 16:46:42.912356	\N
11	Enlace Administrativo	Enlace administrativo del área, responsable de gestionar solicitudes de préstamo de números de oficio	CREAR_DOCUMENTO,TURNAR,RESPONDER,VER_AREA,APROBAR_PRESTAMO	t	2026-04-02 10:00:00	\N
\.


--
-- Data for Name: tipo_documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipo_documento (id, nombre, clave, descripcion, plantilla, requiere_respuesta, activo, fecha_creacion) FROM stdin;
1	Oficio	EO	Documento oficial de comunicacion institucional	\N	t	t	2026-03-05 16:46:42.932212
2	Memorándum	EM	Comunicado interno entre areas	\N	t	t	2026-03-05 16:46:42.932212
3	Circular	EC	Comunicado general a multiples areas	\N	f	t	2026-03-05 16:46:42.932212
11	Tarjeta Informativa	ET	Reporte breve de informacion relevante	\N	f	t	2026-03-06 14:16:39.304677
12	Memorando Circular	MC	Memorando dirigido a multiples destinatarios	\N	f	t	2026-03-06 14:16:39.310144
16	Oficio Circular	OC	Oficio dirigido a multiples destinatarios	\N	f	t	2026-03-06 14:16:39.322648
7	Acuerdo	ACU	Acuerdo oficial	\N	f	f	2026-03-05 16:46:42.932212
14	Audiencia Martes Ciudadano	AMC	Solicitud de audiencia publica	\N	t	f	2026-03-06 14:16:39.311669
10	Constancia	CONST	Constancia o certificación	\N	f	f	2026-03-05 16:46:42.932212
9	Convocatoria	CONV	Convocatoria a reunión o evento	\N	f	f	2026-03-05 16:46:42.932212
5	Informe	INF	Informe de actividades	\N	f	f	2026-03-05 16:46:42.932212
8	Notificación	NOT	Notificación oficial	\N	f	f	2026-03-05 16:46:42.932212
4	Solicitud	SOL	Solicitud de servicios o recursos	\N	t	f	2026-03-05 16:46:42.932212
6	Dictamen	DIC	Dictamen técnico o legal	\N	f	f	2026-03-05 16:46:42.932212
15	Escritos	ESC	Documentos generales y escritos varios	\N	t	f	2026-03-06 14:16:39.313299
13	Invitacion	INV	Invitacion a evento o reunion	\N	f	f	2026-03-06 14:16:39.310895
\.


--
-- Data for Name: turno_documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.turno_documento (id, documento_id, area_origen_id, area_destino_id, usuario_turna_id, fecha_turno, fecha_recepcion, observaciones, recibido, activo, instrucciones, deprecada, fecha_deprecacion) FROM stdin;
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario (id, nombre, apellidos, telefono, celular, curp, rfc, fecha_nacimiento, sexo, calle, numero_exterior, numero_interior, colonia, codigo_postal, ciudad, estado, email, nombre_usuario, "contraseña", fecha_alta, fecha_ultimo_acceso, activo, area_id, rol_id) FROM stdin;
5	Luis	Hernández Torres	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	luis.hernandez@gobierno.mx	lhernandez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	38	3
7	Roberto	García Mendoza	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roberto.garcia@gobierno.mx	rgarcia	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	36	4
8	Laura	López Castro	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	laura.lopez@gobierno.mx	llopez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	35	4
9	Jorge	Morales Vega	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	jorge.morales@gobierno.mx	jmorales	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	34	4
10	Sandra	Jiménez Ortiz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	sandra.jimenez@gobierno.mx	sjimenez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	33	4
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
18	Mónica	Gutiérrez Navarro	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	monica.gutierrez@gobierno.mx	mgutierrez	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	25	7
4	Ana	Rodríguez Sánchez	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ana.rodriguez@gobierno.mx	arodriguez	$2b$10$2XiVshszllg3Jk/vc.XrxuoBdK/dfdXxeDQ1nyJJRSB2DR.y6f7XW	2026-03-05 16:46:42.940191	2026-03-12 04:32:10.614397	t	39	4
11	Miguel	Cruz Herrera	1234567	0987654321	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	miguel.cruz@gobierno.mx	mcruz	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	32	5
24	Omar	Cárcamo Hernández	1234567	1010101010	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	omar.carcamo@puebla.gob.mx	carcamo08	$2b$10$8PaqgYTvbt79k4.Rz9sxhua70gNjNL1U.0jgjSpaG6g5PR9ud3hTS	2026-03-08 00:42:00.409738	2026-03-12 03:34:40.771489	t	68	8
17	Ricardo	Castillo Rojas	1234567	9999999999	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ricardo.castillo@gobierno.mx	rcastillo	$2a$10$rYvJY9Z8Xq2xKwP9Yj7EwO4v3F2PkJ8Lm9Nn6Qq5Rr7Ss8Tt9Uu0Vv	2026-03-05 16:46:42.940191	\N	t	26	7
6	Patricia	Ramírez Flores	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	patricia.ramirez@gobierno.mx	pramirez	$2b$10$2XiVshszllg3Jk/vc.XrxuoBdK/dfdXxeDQ1nyJJRSB2DR.y6f7XW	2026-03-05 16:46:42.940191	2026-03-13 09:02:40.937219	t	61	4
23	Admin	Sistema	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin@gestor.com	admin	$2b$10$2XiVshszllg3Jk/vc.XrxuoBdK/dfdXxeDQ1nyJJRSB2DR.y6f7XW	2026-03-06 10:51:58.047019	2026-03-13 19:55:21.68822	t	20	1
\.


--
-- Name: archivo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.archivo_id_seq', 5, true);


--
-- Name: area_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.area_id_seq', 99, true);


--
-- Name: auditoria_sistema_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_sistema_id_seq', 78, true);


--
-- Name: consecutivo_area_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consecutivo_area_id_seq', 43, true);


--
-- Name: copia_conocimiento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.copia_conocimiento_id_seq', 9, true);


--
-- Name: despacho_externo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.despacho_externo_id_seq', 1, false);


--
-- Name: documento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documento_id_seq', 507, true);


--
-- Name: entidad_externa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.entidad_externa_id_seq', 3, true);


--
-- Name: excepcion_turno_area_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.excepcion_turno_area_id_seq', 1, false);


--
-- Name: historial_documento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historial_documento_id_seq', 524, true);


--
-- Name: invalidacion_documento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invalidacion_documento_id_seq', 1, false);


--
-- Name: nodo_documental_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nodo_documental_id_seq', 509, true);


--
-- Name: permiso_emision_documento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permiso_emision_documento_id_seq', 40, true);


--
-- Name: prestamo_numero_oficio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prestamo_numero_oficio_id_seq', 2, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 95, true);


--
-- Name: regla_turno_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.regla_turno_id_seq', 86, true);


--
-- Name: respuesta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.respuesta_id_seq', 1, false);


--
-- Name: rol_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rol_id_seq', 11, true);


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

SELECT pg_catalog.setval('public.usuario_id_seq', 24, true);


--
-- Name: archivo_documento archivo_documento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo_documento
    ADD CONSTRAINT archivo_documento_pkey PRIMARY KEY (documento_id, archivo_id);


--
-- Name: archivo_nodo archivo_nodo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo_nodo
    ADD CONSTRAINT archivo_nodo_pkey PRIMARY KEY (nodo_id, archivo_id);


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
-- Name: consecutivo_area consecutivo_area_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consecutivo_area
    ADD CONSTRAINT consecutivo_area_pkey PRIMARY KEY (id);


--
-- Name: copia_conocimiento copia_conocimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.copia_conocimiento
    ADD CONSTRAINT copia_conocimiento_pkey PRIMARY KEY (id);


--
-- Name: despacho_externo despacho_externo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.despacho_externo
    ADD CONSTRAINT despacho_externo_pkey PRIMARY KEY (id);


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
-- Name: entidad_externa entidad_externa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidad_externa
    ADD CONSTRAINT entidad_externa_pkey PRIMARY KEY (id);


--
-- Name: excepcion_turno_area excepcion_turno_area_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.excepcion_turno_area
    ADD CONSTRAINT excepcion_turno_area_pkey PRIMARY KEY (id);


--
-- Name: excepcion_turno_area excepcion_turno_area_uk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.excepcion_turno_area
    ADD CONSTRAINT excepcion_turno_area_uk UNIQUE (area_origen_id, area_destino_id);


--
-- Name: historial_documento historial_documento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_documento
    ADD CONSTRAINT historial_documento_pkey PRIMARY KEY (id);


--
-- Name: invalidacion_documento invalidacion_documento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invalidacion_documento
    ADD CONSTRAINT invalidacion_documento_pkey PRIMARY KEY (id);


--
-- Name: nivel_jerarquico_tipo nivel_jerarquico_tipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nivel_jerarquico_tipo
    ADD CONSTRAINT nivel_jerarquico_tipo_pkey PRIMARY KEY (tipo);


--
-- Name: nodo_documental nodo_documental_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodo_documental
    ADD CONSTRAINT nodo_documental_pkey PRIMARY KEY (id);


--
-- Name: permiso_emision_documento permiso_emision_documento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permiso_emision_documento
    ADD CONSTRAINT permiso_emision_documento_pkey PRIMARY KEY (id);


--
-- Name: prestamo_numero_oficio prestamo_numero_oficio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamo_numero_oficio
    ADD CONSTRAINT prestamo_numero_oficio_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: regla_turno regla_turno_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regla_turno
    ADD CONSTRAINT regla_turno_pkey PRIMARY KEY (id);


--
-- Name: regla_turno regla_turno_uk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regla_turno
    ADD CONSTRAINT regla_turno_uk UNIQUE (tipo_origen, tipo_destino, condicion_relacion);


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
-- Name: consecutivo_area uq_consecutivo_area; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consecutivo_area
    ADD CONSTRAINT uq_consecutivo_area UNIQUE (area_id, tipo_operacion, anio);


--
-- Name: invalidacion_documento uq_invalidacion_documento; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invalidacion_documento
    ADD CONSTRAINT uq_invalidacion_documento UNIQUE (documento_id);


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
-- Name: idx_copia_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_copia_area ON public.copia_conocimiento USING btree (area_id, leido, fecha_envio DESC);


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
-- Name: idx_despacho_externo_doc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_despacho_externo_doc ON public.despacho_externo USING btree (documento_id);


--
-- Name: idx_despacho_externo_entidad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_despacho_externo_entidad ON public.despacho_externo USING btree (entidad_externa_id);


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
-- Name: idx_documento_invalidado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documento_invalidado ON public.documento USING btree (documento_invalidado, fecha_invalidacion DESC) WHERE (documento_invalidado = true);


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
-- Name: idx_entidad_externa_curp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entidad_externa_curp ON public.entidad_externa USING btree (curp) WHERE (curp IS NOT NULL);


--
-- Name: idx_entidad_externa_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entidad_externa_email ON public.entidad_externa USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: idx_entidad_externa_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entidad_externa_nombre ON public.entidad_externa USING gin (to_tsvector('spanish'::regconfig, (nombre)::text));


--
-- Name: idx_entidad_externa_rfc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entidad_externa_rfc ON public.entidad_externa USING btree (rfc) WHERE (rfc IS NOT NULL);


--
-- Name: idx_historial_doc_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_doc_fecha ON public.historial_documento USING btree (documento_id, fecha DESC);


--
-- Name: idx_historial_documento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_documento ON public.historial_documento USING btree (documento_id);


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
-- Name: idx_invalidacion_area_emisora; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invalidacion_area_emisora ON public.invalidacion_documento USING btree (area_emisora_id);


--
-- Name: idx_invalidacion_documento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invalidacion_documento ON public.invalidacion_documento USING btree (documento_id);


--
-- Name: idx_invalidacion_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invalidacion_fecha ON public.invalidacion_documento USING btree (fecha_invalidacion DESC);


--
-- Name: idx_invalidacion_prestamo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invalidacion_prestamo ON public.invalidacion_documento USING btree (prestamo_numero_id);


--
-- Name: idx_nodo_activo_unico; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_nodo_activo_unico ON public.nodo_documental USING btree (documento_id) WHERE (es_nodo_activo = true);


--
-- Name: idx_nodo_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodo_area ON public.nodo_documental USING btree (area_id, fecha_generacion DESC);


--
-- Name: idx_nodo_area_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodo_area_id ON public.nodo_documental USING btree (area_id);


--
-- Name: idx_nodo_documento_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodo_documento_area ON public.nodo_documental USING btree (documento_id, area_id);


--
-- Name: idx_nodo_documento_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodo_documento_id ON public.nodo_documental USING btree (documento_id);


--
-- Name: idx_nodo_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodo_estado ON public.nodo_documental USING btree (estado);


--
-- Name: idx_nodo_folio_original; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodo_folio_original ON public.nodo_documental USING btree (folio_original);


--
-- Name: idx_nodo_folio_propio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodo_folio_propio ON public.nodo_documental USING btree (folio_propio);


--
-- Name: idx_nodo_padre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodo_padre ON public.nodo_documental USING btree (nodo_padre_id);


--
-- Name: idx_nodo_padre_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodo_padre_id ON public.nodo_documental USING btree (nodo_padre_id);


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
-- Name: idx_prestamo_documento_invalidado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prestamo_documento_invalidado ON public.prestamo_numero_oficio USING btree (documento_invalidado, fecha_invalidacion DESC) WHERE (documento_invalidado = true);


--
-- Name: idx_prestamo_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prestamo_estado ON public.prestamo_numero_oficio USING btree (estado, fecha_vencimiento);


--
-- Name: idx_prestamo_estado_revision; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prestamo_estado_revision ON public.prestamo_numero_oficio USING btree (estado, fecha_limite_revision) WHERE (estado = 'EN_REVISION'::public.estado_prestamo_enum);


--
-- Name: idx_prestamo_prestamista; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prestamo_prestamista ON public.prestamo_numero_oficio USING btree (area_prestamista_id, estado);


--
-- Name: idx_prestamo_solicitante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prestamo_solicitante ON public.prestamo_numero_oficio USING btree (area_solicitante_id, estado);


--
-- Name: idx_prestamo_usuario_solicita; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prestamo_usuario_solicita ON public.prestamo_numero_oficio USING btree (usuario_solicita_id);


--
-- Name: idx_refresh_tokens_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_expires_at ON public.refresh_tokens USING btree (expires_at);


--
-- Name: idx_refresh_tokens_revoked; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_revoked ON public.refresh_tokens USING btree (revoked);


--
-- Name: idx_refresh_tokens_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_tokens_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_usuario_id ON public.refresh_tokens USING btree (usuario_id);


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
-- Name: uq_nodo_activo_por_documento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_nodo_activo_por_documento ON public.nodo_documental USING btree (documento_id) WHERE (es_nodo_activo = true);


--
-- Name: turno_documento trg_bloquear_turno_documento; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bloquear_turno_documento BEFORE INSERT OR UPDATE ON public.turno_documento FOR EACH ROW EXECUTE FUNCTION public.trg_prevenir_insercion_turno_documento();


--
-- Name: refresh_tokens trg_cleanup_tokens_auto; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_cleanup_tokens_auto AFTER INSERT ON public.refresh_tokens FOR EACH ROW EXECUTE FUNCTION public.trg_limpiar_tokens_al_insertar();


--
-- Name: nodo_documental trg_nodo_activo_unico; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_nodo_activo_unico BEFORE INSERT OR UPDATE ON public.nodo_documental FOR EACH ROW EXECUTE FUNCTION public.trg_validar_nodo_activo_unico();


--
-- Name: documento trg_prevenir_eliminacion_documento; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prevenir_eliminacion_documento BEFORE DELETE ON public.documento FOR EACH ROW EXECUTE FUNCTION public.trg_prevenir_eliminacion_documento();


--
-- Name: area trg_validar_jerarquia_area_before; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validar_jerarquia_area_before BEFORE INSERT OR UPDATE ON public.area FOR EACH ROW EXECUTE FUNCTION public.trg_validar_jerarquia_area();


--
-- Name: archivo_nodo archivo_nodo_archivo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo_nodo
    ADD CONSTRAINT archivo_nodo_archivo_id_fkey FOREIGN KEY (archivo_id) REFERENCES public.archivo(id);


--
-- Name: archivo_nodo archivo_nodo_nodo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archivo_nodo
    ADD CONSTRAINT archivo_nodo_nodo_id_fkey FOREIGN KEY (nodo_id) REFERENCES public.nodo_documental(id) ON DELETE CASCADE;


--
-- Name: consecutivo_area consecutivo_area_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consecutivo_area
    ADD CONSTRAINT consecutivo_area_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.area(id);


--
-- Name: despacho_externo despacho_externo_archivo_acuse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.despacho_externo
    ADD CONSTRAINT despacho_externo_archivo_acuse_id_fkey FOREIGN KEY (archivo_acuse_id) REFERENCES public.archivo(id);


--
-- Name: despacho_externo despacho_externo_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.despacho_externo
    ADD CONSTRAINT despacho_externo_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documento(id);


--
-- Name: despacho_externo despacho_externo_entidad_externa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.despacho_externo
    ADD CONSTRAINT despacho_externo_entidad_externa_id_fkey FOREIGN KEY (entidad_externa_id) REFERENCES public.entidad_externa(id);


--
-- Name: despacho_externo despacho_externo_nodo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.despacho_externo
    ADD CONSTRAINT despacho_externo_nodo_id_fkey FOREIGN KEY (nodo_id) REFERENCES public.nodo_documental(id);


--
-- Name: despacho_externo despacho_externo_usuario_despacha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.despacho_externo
    ADD CONSTRAINT despacho_externo_usuario_despacha_id_fkey FOREIGN KEY (usuario_despacha_id) REFERENCES public.usuario(id);


--
-- Name: documento documento_entidad_externa_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT documento_entidad_externa_destino_id_fkey FOREIGN KEY (entidad_externa_destino_id) REFERENCES public.entidad_externa(id);


--
-- Name: documento documento_entidad_externa_origen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT documento_entidad_externa_origen_id_fkey FOREIGN KEY (entidad_externa_origen_id) REFERENCES public.entidad_externa(id);


--
-- Name: documento documento_prestamo_numero_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT documento_prestamo_numero_id_fkey FOREIGN KEY (prestamo_numero_id) REFERENCES public.prestamo_numero_oficio(id);


--
-- Name: excepcion_turno_area excepcion_turno_area_area_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.excepcion_turno_area
    ADD CONSTRAINT excepcion_turno_area_area_destino_id_fkey FOREIGN KEY (area_destino_id) REFERENCES public.area(id);


--
-- Name: excepcion_turno_area excepcion_turno_area_area_origen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.excepcion_turno_area
    ADD CONSTRAINT excepcion_turno_area_area_origen_id_fkey FOREIGN KEY (area_origen_id) REFERENCES public.area(id);


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
-- Name: invalidacion_documento invalidacion_documento_area_emisora_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invalidacion_documento
    ADD CONSTRAINT invalidacion_documento_area_emisora_id_fkey FOREIGN KEY (area_emisora_id) REFERENCES public.area(id) ON DELETE SET NULL;


--
-- Name: invalidacion_documento invalidacion_documento_area_prestamista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invalidacion_documento
    ADD CONSTRAINT invalidacion_documento_area_prestamista_id_fkey FOREIGN KEY (area_prestamista_id) REFERENCES public.area(id) ON DELETE SET NULL;


--
-- Name: invalidacion_documento invalidacion_documento_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invalidacion_documento
    ADD CONSTRAINT invalidacion_documento_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documento(id) ON DELETE RESTRICT;


--
-- Name: invalidacion_documento invalidacion_documento_prestamo_numero_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invalidacion_documento
    ADD CONSTRAINT invalidacion_documento_prestamo_numero_id_fkey FOREIGN KEY (prestamo_numero_id) REFERENCES public.prestamo_numero_oficio(id) ON DELETE RESTRICT;


--
-- Name: invalidacion_documento invalidacion_documento_usuario_invalida_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invalidacion_documento
    ADD CONSTRAINT invalidacion_documento_usuario_invalida_id_fkey FOREIGN KEY (usuario_invalida_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: nodo_documental nodo_documental_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodo_documental
    ADD CONSTRAINT nodo_documental_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.area(id);


--
-- Name: nodo_documental nodo_documental_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodo_documental
    ADD CONSTRAINT nodo_documental_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documento(id) ON DELETE RESTRICT;


--
-- Name: nodo_documental nodo_documental_nodo_padre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodo_documental
    ADD CONSTRAINT nodo_documental_nodo_padre_id_fkey FOREIGN KEY (nodo_padre_id) REFERENCES public.nodo_documental(id);


--
-- Name: nodo_documental nodo_documental_usuario_recibe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodo_documental
    ADD CONSTRAINT nodo_documental_usuario_recibe_id_fkey FOREIGN KEY (usuario_recibe_id) REFERENCES public.usuario(id);


--
-- Name: nodo_documental nodo_documental_usuario_responsable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodo_documental
    ADD CONSTRAINT nodo_documental_usuario_responsable_id_fkey FOREIGN KEY (usuario_responsable_id) REFERENCES public.usuario(id);


--
-- Name: prestamo_numero_oficio prestamo_numero_oficio_area_prestamista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamo_numero_oficio
    ADD CONSTRAINT prestamo_numero_oficio_area_prestamista_id_fkey FOREIGN KEY (area_prestamista_id) REFERENCES public.area(id);


--
-- Name: prestamo_numero_oficio prestamo_numero_oficio_area_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamo_numero_oficio
    ADD CONSTRAINT prestamo_numero_oficio_area_solicitante_id_fkey FOREIGN KEY (area_solicitante_id) REFERENCES public.area(id);


--
-- Name: prestamo_numero_oficio prestamo_numero_oficio_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamo_numero_oficio
    ADD CONSTRAINT prestamo_numero_oficio_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documento(id);


--
-- Name: prestamo_numero_oficio prestamo_numero_oficio_usuario_resuelve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamo_numero_oficio
    ADD CONSTRAINT prestamo_numero_oficio_usuario_resuelve_id_fkey FOREIGN KEY (usuario_resuelve_id) REFERENCES public.usuario(id);


--
-- Name: prestamo_numero_oficio prestamo_numero_oficio_usuario_solicita_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamo_numero_oficio
    ADD CONSTRAINT prestamo_numero_oficio_usuario_solicita_id_fkey FOREIGN KEY (usuario_solicita_id) REFERENCES public.usuario(id);


--
-- Name: refresh_tokens refresh_tokens_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- Name: respuesta respuesta_nodo_origen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuesta
    ADD CONSTRAINT respuesta_nodo_origen_id_fkey FOREIGN KEY (nodo_origen_id) REFERENCES public.nodo_documental(id);


--
-- Name: copia_conocimiento; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.copia_conocimiento ENABLE ROW LEVEL SECURITY;

--
-- Name: documento; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.documento ENABLE ROW LEVEL SECURITY;

--
-- Name: historial_documento; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.historial_documento ENABLE ROW LEVEL SECURITY;

--
-- Name: nodo_documental; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.nodo_documental ENABLE ROW LEVEL SECURITY;

--
-- Name: copia_conocimiento pol_copia_area_usuario; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pol_copia_area_usuario ON public.copia_conocimiento FOR SELECT USING (((area_id IN ( SELECT usuario.area_id
   FROM public.usuario
  WHERE (usuario.id = (current_setting('app.current_user_id'::text))::integer))) OR (documento_id IN ( SELECT documento.id
   FROM public.documento
  WHERE (documento.area_origen_id IN ( SELECT usuario.area_id
           FROM public.usuario
          WHERE (usuario.id = (current_setting('app.current_user_id'::text))::integer)))))));


--
-- Name: documento pol_documento_area_usuario; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pol_documento_area_usuario ON public.documento FOR SELECT USING (((area_origen_id IN ( SELECT usuario.area_id
   FROM public.usuario
  WHERE (usuario.id = (current_setting('app.current_user_id'::text))::integer))) OR (id IN ( SELECT nodo_documental.documento_id
   FROM public.nodo_documental
  WHERE ((nodo_documental.area_id IN ( SELECT usuario.area_id
           FROM public.usuario
          WHERE (usuario.id = (current_setting('app.current_user_id'::text))::integer))) AND (nodo_documental.es_nodo_activo = true)))) OR (EXISTS ( SELECT 1
   FROM (public.usuario u
     JOIN public.rol r ON ((u.rol_id = r.id)))
  WHERE ((u.id = (current_setting('app.current_user_id'::text))::integer) AND ((r.nombre)::text = 'Administrador'::text)))) OR (id IN ( SELECT cc.documento_id
   FROM public.copia_conocimiento cc
  WHERE (cc.area_id IN ( SELECT usuario.area_id
           FROM public.usuario
          WHERE (usuario.id = (current_setting('app.current_user_id'::text))::integer)))))));


--
-- Name: POLICY pol_documento_area_usuario ON documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY pol_documento_area_usuario ON public.documento IS 'RLS: Los usuarios solo ven documentos de su área, emitidos por su área, o con copia de conocimiento.





Los administradores ven todos los documentos.';


--
-- Name: documento pol_documento_insert_area_usuario; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pol_documento_insert_area_usuario ON public.documento FOR INSERT WITH CHECK ((area_origen_id IN ( SELECT usuario.area_id
   FROM public.usuario
  WHERE (usuario.id = (current_setting('app.current_user_id'::text))::integer))));


--
-- Name: documento pol_documento_update_area_usuario; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pol_documento_update_area_usuario ON public.documento FOR UPDATE USING (((id IN ( SELECT nodo_documental.documento_id
   FROM public.nodo_documental
  WHERE ((nodo_documental.area_id IN ( SELECT usuario.area_id
           FROM public.usuario
          WHERE (usuario.id = (current_setting('app.current_user_id'::text))::integer))) AND (nodo_documental.es_nodo_activo = true)))) OR (EXISTS ( SELECT 1
   FROM (public.usuario u
     JOIN public.rol r ON ((u.rol_id = r.id)))
  WHERE ((u.id = (current_setting('app.current_user_id'::text))::integer) AND ((r.nombre)::text = 'Administrador'::text))))));


--
-- Name: historial_documento pol_historial_area_usuario; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pol_historial_area_usuario ON public.historial_documento FOR SELECT USING ((documento_id IN ( SELECT documento.id
   FROM public.documento)));


--
-- Name: nodo_documental pol_nodo_area_usuario; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pol_nodo_area_usuario ON public.nodo_documental FOR SELECT USING ((documento_id IN ( SELECT documento.id
   FROM public.documento)));


--
-- Name: POLICY pol_nodo_area_usuario ON nodo_documental; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY pol_nodo_area_usuario ON public.nodo_documental IS 'RLS: Los nodos son visibles solo si el documento asociado es visible.';


--
-- Name: respuesta; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.respuesta ENABLE ROW LEVEL SECURITY;

--
-- Name: copia_conocimiento rls_copia_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_copia_insert ON public.copia_conocimiento FOR INSERT WITH CHECK (((usuario_envia_id = (current_setting('app.usuario_id'::text, true))::integer) AND (EXISTS ( SELECT 1
   FROM public.documento d
  WHERE (d.id = copia_conocimiento.documento_id)))));


--
-- Name: copia_conocimiento rls_copia_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_copia_select ON public.copia_conocimiento FOR SELECT USING (((area_id = (current_setting('app.area_id'::text, true))::integer) OR public.fn_tiene_permiso('VER_TODO'::text) OR (usuario_envia_id = (current_setting('app.usuario_id'::text, true))::integer)));


--
-- Name: documento rls_documento_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_documento_admin ON public.documento USING (public.fn_tiene_permiso('VER_TODO'::text));


--
-- Name: POLICY rls_documento_admin ON documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY rls_documento_admin ON public.documento IS 'Permite a administradores con permiso VER_TODO acceso total a documentos.';


--
-- Name: documento rls_documento_area_involucrada; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_documento_area_involucrada ON public.documento FOR SELECT USING (((area_origen_id = (current_setting('app.area_id'::text, true))::integer) OR (EXISTS ( SELECT 1
   FROM public.nodo_documental nd
  WHERE ((nd.documento_id = documento.id) AND (nd.area_id = (current_setting('app.area_id'::text, true))::integer)))) OR (usuario_creador_id = (current_setting('app.usuario_id'::text, true))::integer) OR (EXISTS ( SELECT 1
   FROM public.copia_conocimiento cc
  WHERE ((cc.documento_id = documento.id) AND (cc.area_id = (current_setting('app.area_id'::text, true))::integer))))));


--
-- Name: POLICY rls_documento_area_involucrada ON documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY rls_documento_area_involucrada ON public.documento IS 'Permite ver documentos donde el Ã¡rea del usuario estÃ¡ involucrada como origen, destino, o copia.';


--
-- Name: documento rls_documento_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_documento_insert ON public.documento FOR INSERT WITH CHECK (((area_origen_id = (current_setting('app.area_id'::text, true))::integer) AND (usuario_creador_id = (current_setting('app.usuario_id'::text, true))::integer)));


--
-- Name: POLICY rls_documento_insert ON documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY rls_documento_insert ON public.documento IS 'Solo permite crear documentos si el Ã¡rea de origen es tu Ã¡rea y eres el creador.';


--
-- Name: documento rls_documento_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_documento_update ON public.documento FOR UPDATE USING (((usuario_creador_id = (current_setting('app.usuario_id'::text, true))::integer) AND (estado <> ALL (ARRAY['CERRADO'::public.estado_documento_enum, 'CANCELADO'::public.estado_documento_enum]))));


--
-- Name: POLICY rls_documento_update ON documento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY rls_documento_update ON public.documento IS 'Solo permite editar documentos creados por ti y que no esten cerrados o cancelados.';


--
-- Name: historial_documento rls_historial_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_historial_select ON public.historial_documento FOR SELECT USING ((public.fn_tiene_permiso('VER_TODO'::text) OR (EXISTS ( SELECT 1
   FROM public.documento d
  WHERE (d.id = historial_documento.documento_id)))));


--
-- Name: nodo_documental rls_nodo_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_nodo_admin ON public.nodo_documental USING (public.fn_tiene_permiso('VER_TODO'::text));


--
-- Name: nodo_documental rls_nodo_area; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_nodo_area ON public.nodo_documental FOR SELECT USING (((area_id = (current_setting('app.area_id'::text, true))::integer) OR (EXISTS ( SELECT 1
   FROM public.documento d
  WHERE (d.id = nodo_documental.documento_id)))));


--
-- Name: nodo_documental rls_nodo_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_nodo_insert ON public.nodo_documental FOR INSERT WITH CHECK (((area_id = (current_setting('app.area_id'::text, true))::integer) AND (usuario_responsable_id = (current_setting('app.usuario_id'::text, true))::integer)));


--
-- Name: nodo_documental rls_nodo_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_nodo_update ON public.nodo_documental FOR UPDATE USING ((area_id = (current_setting('app.area_id'::text, true))::integer));


--
-- Name: respuesta rls_respuesta_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_respuesta_insert ON public.respuesta FOR INSERT WITH CHECK (((usuario_responde_id = (current_setting('app.usuario_id'::text, true))::integer) AND (EXISTS ( SELECT 1
   FROM public.documento d
  WHERE (d.id = respuesta.documento_origen_id)))));


--
-- Name: respuesta rls_respuesta_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_respuesta_select ON public.respuesta FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.documento d
  WHERE (d.id = respuesta.documento_origen_id))));


--
-- Name: usuario rls_usuario_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_usuario_admin ON public.usuario USING (public.fn_tiene_permiso('GESTIONAR_USUARIOS'::text));


--
-- Name: usuario rls_usuario_area; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_usuario_area ON public.usuario FOR SELECT USING (((area_id = (current_setting('app.area_id'::text, true))::integer) OR public.fn_pertenece_a_area_o_descendientes(area_id) OR (id = (current_setting('app.usuario_id'::text, true))::integer)));


--
-- Name: usuario rls_usuario_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_usuario_insert ON public.usuario FOR INSERT WITH CHECK (public.fn_tiene_permiso('CREAR_USUARIO'::text));


--
-- Name: usuario rls_usuario_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_usuario_update ON public.usuario FOR UPDATE USING ((public.fn_tiene_permiso('EDITAR_USUARIO'::text) OR (id = (current_setting('app.usuario_id'::text, true))::integer)));


--
-- Name: usuario; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict Tc2qf5fgOJQP3JOqAHJqJEKg0KMCTVYz4502enQlD0GmUvLbuUkspRdRsBr9eEg

