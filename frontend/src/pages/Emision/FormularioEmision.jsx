/**
 * Formulario de Emisión de Documentos
 * Convierte el HTML maquetado con Tailwind a JSX de React
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useEmisionDocumento } from '@hooks/useEmisionDocumento';
import { getAreasActivas } from '@services/area.service';
import documentoService from '@services/documento.service';
import archivoService from '@services/archivo.service';
import * as prestamoService from '@services/prestamo.service';
import AppLayout from '@components/Layout/AppLayout';
import { useToast } from '@hooks/useToast';
import { ToastContainer } from '@components/Toast';
import ConfirmDialog from '@components/ConfirmDialog';

const FormularioEmision = () => {
    const navigate = useNavigate();
    const { logout, user, hasPermission } = useAuth();
    const toast = useToast();

    // Hook de emisión con estado y funciones
    const {
        formData,
        updateField,
        loading,
        error,
        success,
        documentoEmitido,
        tiposDocumento,
        loadingTipos,
        errorTipos,
        puedeCrearDocumento,
        emitir,
        resetForm,
        clearMessages,
        validarFormulario
    } = useEmisionDocumento();

    // Estados para modales
    const [isModalFolioOpen, setIsModalFolioOpen] = useState(false);
    const [isModalFirmaOpen, setIsModalFirmaOpen] = useState(false);
    
    // Estado para mostrar modal de éxito
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // **NUEVO: Estado para destinatarios y copias**
    const [areasDisponibles, setAreasDisponibles] = useState([]);
    const [loadingAreas, setLoadingAreas] = useState(false);
    const [errorAreas, setErrorAreas] = useState(null);
    const [destinatarios, setDestinatarios] = useState([]);
    const [copias, setCopias] = useState([]);

    // **NUEVO: Estado para archivos adjuntos**
    const [archivos, setArchivos] = useState([]);
    const [archivosSubiendo, setArchivosSubiendo] = useState([]);
    const [errorArchivos, setErrorArchivos] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // **NUEVO: Estados para modal de préstamo de folios**
    const [areasPrestamistas, setAreasPrestamistas] = useState([]);
    const [loadingPrestamistas, setLoadingPrestamistas] = useState(false);
    const [areaPrestamistaSeleccionada, setAreaPrestamistaSeleccionada] = useState('');
    const [folioPreview, setFolioPreview] = useState('');
    const [motivacionPrestamo, setMotivacionPrestamo] = useState('');
    const [prestamosAprobados, setPrestamosAprobados] = useState([]);
    const [errorPrestamo, setErrorPrestamo] = useState(null);
    const [loadingPrestamo, setLoadingPrestamo] = useState(false);
    const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
    const [solicitudReserva, setSolicitudReserva] = useState(null);
    const [documentoRegistrado, setDocumentoRegistrado] = useState(null);

    // **NUEVO: Estados para validación inline y modal de confirmación**
    const [fieldErrors, setFieldErrors] = useState({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isEmitting, setIsEmitting] = useState(false);

    // **NUEVO: Estados para preview del consecutivo**
    const [proximoConsecutivo, setProximoConsecutivo] = useState(null);
    const [loadingConsecutivo, setLoadingConsecutivo] = useState(false);
    const [errorConsecutivo, setErrorConsecutivo] = useState(null);

    // Verificar permisos al montar
    useEffect(() => {
        if (!puedeCrearDocumento) {
            console.warn('Usuario sin permiso CREAR_DOCUMENTO');
        }
    }, [puedeCrearDocumento]);

    // Debug: Log del usuario y área
    useEffect(() => {
        console.log('Usuario completo:', user);
        console.log('Área del usuario:', user?.area);
        console.log('Clave del área:', user?.area?.clave);
        
        // Advertencia si falta la clave del área
        if (user && (!user.area || !user.area.clave)) {
            console.warn('⚠️ La clave del área no está disponible. Por favor, cierre sesión y vuelva a iniciar sesión.');
        }
    }, [user]);

    // **NUEVO: Cargar áreas disponibles al montar**
    useEffect(() => {
        const cargarAreas = async () => {
            if (!puedeCrearDocumento) return;
            
            setLoadingAreas(true);
            setErrorAreas(null);
            
            try {
                const response = await getAreasActivas();
                // getAreasActivas devuelve { success, count, data: [...todas las áreas] }
                const areas = response.data || response || [];
                setAreasDisponibles(areas);
                console.log('Áreas cargadas:', areas.length);
            } catch (err) {
                console.error('Error al cargar áreas:', err);
                setErrorAreas(err.response?.data?.error || 'Error al cargar áreas');
                setAreasDisponibles([]);
            } finally {
                setLoadingAreas(false);
            }
        };

        cargarAreas();
    }, [puedeCrearDocumento]);

    // **NUEVO: Cargar áreas prestamistas cuando se abre el modal**
    useEffect(() => {
        const cargarAreasPrestamistas = async () => {
            if (!isModalFolioOpen) return;
            
            setLoadingPrestamistas(true);
            setErrorPrestamo(null);
            
            try {
                const response = await prestamoService.getAreasPrestamistas();
                setAreasPrestamistas(response.data || []);
                
                // Si hay solo un área (la propia), seleccionarla automáticamente
                if (response.data && response.data.length === 1) {
                    setAreaPrestamistaSeleccionada(response.data[0].id.toString());
                }
                
                // Cargar préstamos aprobados
                const prestamosResp = await prestamoService.getPrestamosAprobados();
                setPrestamosAprobados(prestamosResp.data || []);
            } catch (err) {
                console.error('Error al cargar áreas prestamistas:', err);
                setErrorPrestamo(err.response?.data?.error || 'Error al cargar áreas prestamistas');
            } finally {
                setLoadingPrestamistas(false);
            }
        };

        cargarAreasPrestamistas();
    }, [isModalFolioOpen]);

    // **NUEVO: Cargar preview del folio cuando cambia el área seleccionada o el tipo de documento**
    useEffect(() => {
        const cargarPreviewFolio = async () => {
            // Necesitamos tanto el área como el tipo de documento
            if (!areaPrestamistaSeleccionada || !formData.tipo_documento_id) {
                setFolioPreview('');
                return;
            }
            
            try {
                // Usar getPreviewConsecutivo para mostrar el folio real (con número o RESERVA si es área padre)
                const resultado = await documentoService.getPreviewConsecutivo(
                    parseInt(areaPrestamistaSeleccionada, 10),
                    parseInt(formData.tipo_documento_id, 10)
                );
                const data = resultado.data || {};
                const esAreaPropia = parseInt(areaPrestamistaSeleccionada, 10) === user?.area?.id;
                const base = `${data.clave_tipo_doc || ''}.${data.clave_area || ''}`;
                // Área propia → mostrar folio real; área padre → el número se asigna al aprobar
                if (esAreaPropia) {
                    setFolioPreview(data.folio_completo || `${base}-${String(data.consecutivo).padStart(4, '0')}/${data.anio}`);
                } else {
                    setFolioPreview(`${base}-RESERVA/${data.anio || new Date().getFullYear()}`);
                }
            } catch (err) {
                console.error('Error al cargar preview de folio:', err);
                setFolioPreview('');
            }
        };

        cargarPreviewFolio();
    }, [areaPrestamistaSeleccionada, formData.tipo_documento_id]);

    // **NUEVO: Cargar preview del número consecutivo**
    useEffect(() => {
        const cargarProximoConsecutivo = async () => {
            // Determinar el área emisora - prioridad:
            // 1. Préstamo seleccionado (área prestamista)
            // 2. Área seleccionada en el modal (areaPrestamistaSeleccionada)
            // 3. Área del usuario (por defecto)
            let areaEmisora = null;
            
            // 1. Préstamo aprobado con folio ya asignado
            if (prestamoSeleccionado?.area_prestamista_id) {
                areaEmisora = prestamoSeleccionado.area_prestamista_id;
            }
            // 2. Reserva confirmada (área padre seleccionada y confirmada en el modal)
            else if (solicitudReserva?.area_prestamista_id) {
                areaEmisora = solicitudReserva.area_prestamista_id;
            }
            // 3. Área propia del usuario (flujo normal sin préstamo)
            else if (user?.area?.id) {
                areaEmisora = user.area.id;
            }

            // Solo cargar si tenemos área y tipo de documento
            if (!areaEmisora || !formData.tipo_documento_id) {
                setProximoConsecutivo(null);
                return;
            }

            setLoadingConsecutivo(true);
            setErrorConsecutivo(null);

            try {
                const resultado = await documentoService.getPreviewConsecutivo(
                    areaEmisora,
                    formData.tipo_documento_id
                );

                console.log('Preview de consecutivo recibido:', resultado);
                setProximoConsecutivo(resultado.data);
            } catch (err) {
                console.error('Error al cargar preview de consecutivo:', err);
                setErrorConsecutivo(err.response?.data?.error || err.message);
                setProximoConsecutivo(null);
            } finally {
                setLoadingConsecutivo(false);
            }
        };

        cargarProximoConsecutivo();
    }, [
        prestamoSeleccionado?.area_prestamista_id,
        solicitudReserva?.area_prestamista_id,
        user?.area?.id,
        formData.tipo_documento_id
    ]);

    // **NUEVO: Handlers para destinatarios**
    const handleAgregarDestinatario = async (e) => {
        const areaId = parseInt(e.target.value, 10);
        if (!areaId || isNaN(areaId)) return;

        // Buscar el área seleccionada
        const areaSeleccionada = areasDisponibles.find(a => a.id === areaId);
        if (!areaSeleccionada) return;

        // Verificar que no esté ya en destinatarios
        const yaEstaEnDestinatarios = destinatarios.some(d => d.id === areaId);
        if (yaEstaEnDestinatarios) {
            // Resetear el select
            e.target.value = '';
            return;
        }

        // **PRE-VALIDACIÓN: Verificar si el turno es permitido**
        try {
            const validacion = await documentoService.validarTurno(areaId);
            
            if (!validacion.data.valido) {
                // Mostrar mensaje de error al usuario
                toast.error(`Turno no permitido: ${validacion.data.mensaje || 'El turno no cumple con las reglas configuradas.'}`, 7000);
                // Resetear el select
                e.target.value = '';
                return;
            }
        } catch (err) {
            console.error('Error al validar turno:', err);
            toast.error('Error al validar el turno. Por favor, intente nuevamente.');
            // Resetear el select
            e.target.value = '';
            return;
        }

        // Si la validación pasó, agregar a destinatarios
        setDestinatarios([...destinatarios, {
            id: areaSeleccionada.id,
            nombre: areaSeleccionada.nombre,
            clave: areaSeleccionada.clave
        }]);

        // Resetear el select
        e.target.value = '';
    };

    const handleRemoverDestinatario = (areaId) => {
        setDestinatarios(destinatarios.filter(d => d.id !== areaId));
    };

    // **NUEVO: Handlers para copias de conocimiento**
    const handleAgregarCopia = (e) => {
        const areaId = parseInt(e.target.value, 10);
        if (!areaId || isNaN(areaId)) return;

        // Buscar el área seleccionada
        const areaSeleccionada = areasDisponibles.find(a => a.id === areaId);
        if (!areaSeleccionada) return;

        // Verificar que no esté ya en copias
        const yaEstaEnCopias = copias.some(c => c.id === areaId);
        if (yaEstaEnCopias) return;

        // Agregar a copias
        setCopias([...copias, {
            id: areaSeleccionada.id,
            nombre: areaSeleccionada.nombre,
            clave: areaSeleccionada.clave
        }]);

        // Resetear el select
        e.target.value = '';
    };

    const handleRemoverCopia = (areaId) => {
        setCopias(copias.filter(c => c.id !== areaId));
    };

    // **NUEVO: Handlers para archivos adjuntos**
    
    /**
     * Abrir selector de archivos
     */
    const handleAbrirSelectorArchivos = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    /**
     * Procesar archivos seleccionados o arrastrados
     */
    const procesarArchivos = async (archivosNuevos) => {
        if (!archivosNuevos || archivosNuevos.length === 0) return;

        setErrorArchivos(null);

        // Validar cada archivo
        const archivosValidos = [];
        const errores = [];

        Array.from(archivosNuevos).forEach(archivo => {
            const { valido, error } = archivoService.validarArchivo(archivo);
            if (valido) {
                archivosValidos.push(archivo);
            } else {
                errores.push(error);
            }
        });

        // Si hay errores de validación, mostrarlos
        if (errores.length > 0) {
            setErrorArchivos(errores.join('; '));
        }

        // Si no hay archivos válidos, terminar
        if (archivosValidos.length === 0) return;

        // Subir archivos al servidor
        for (const archivo of archivosValidos) {
            try {
                // Agregar a lista de archivos subiendo
                const archivoTemp = {
                    id: `temp-${Date.now()}-${Math.random()}`,
                    nombre_archivo: archivo.name,
                    tamaño: archivo.size,
                    tipo_mime: archivo.type,
                    subiendo: true,
                    progreso: 0,
                };
                setArchivosSubiendo(prev => [...prev, archivoTemp]);

                // Subir archivo
                const response = await archivoService.uploadArchivos([archivo], (progreso) => {
                    // Actualizar progreso
                    setArchivosSubiendo(prev => 
                        prev.map(a => a.id === archivoTemp.id ? { ...a, progreso } : a)
                    );
                });

                // Archivo subido exitosamente
                const archivoSubido = response.data[0];
                
                // Agregar a lista de archivos
                setArchivos(prev => [...prev, archivoSubido]);

                // Remover de lista de subiendo
                setArchivosSubiendo(prev => prev.filter(a => a.id !== archivoTemp.id));

                console.log('Archivo subido exitosamente:', archivoSubido);
            } catch (error) {
                console.error('Error al subir archivo:', error);
                setErrorArchivos(prev => 
                    prev 
                        ? `${prev}; Error al subir ${archivo.name}` 
                        : `Error al subir ${archivo.name}`
                );
                // Remover de lista de subiendo
                setArchivosSubiendo(prev => prev.filter(a => a.nombre_archivo !== archivo.name));
            }
        }
    };

    /**
     * Handler para cambio en input file
     */
    const handleFileInputChange = (e) => {
        procesarArchivos(e.target.files);
        // Limpiar input para permitir subir el mismo archivo de nuevo
        e.target.value = '';
    };

    /**
     * Handler para drag over
     */
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    /**
     * Handler para drag leave
     */
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    /**
     * Handler para drop
     */
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const archivosArrastrados = e.dataTransfer.files;
        procesarArchivos(archivosArrastrados);
    };

    /**
     * Remover archivo de la lista
     */
    const handleRemoverArchivo = (archivoId) => {
        setArchivos(archivos.filter(a => a.id !== archivoId));
    };

    /**
     * Obtener ícono y color según tipo MIME
     */
    const obtenerIconoArchivo = (tipoMime) => {
        return archivoService.obtenerIconoPorTipoMime(tipoMime);
    };

    // **NUEVO: Filtrar áreas para los selects**
    // Excluir: área propia, áreas ya seleccionadas en destinatarios, áreas ya seleccionadas en copias
    const areasParaDestinatarios = areasDisponibles.filter(area => {
        // Excluir área propia
        if (area.id === user?.area?.id) return false;
        // Excluir ya seleccionadas en destinatarios
        if (destinatarios.some(d => d.id === area.id)) return false;
        // Excluir ya seleccionadas en copias
        if (copias.some(c => c.id === area.id)) return false;
        return true;
    });

    const areasParaCopias = areasDisponibles.filter(area => {
        // Excluir área propia
        if (area.id === user?.area?.id) return false;
        // Excluir ya seleccionadas en destinatarios
        if (destinatarios.some(d => d.id === area.id)) return false;
        // Excluir ya seleccionadas en copias
        if (copias.some(c => c.id === area.id)) return false;
        return true;
    });

    // Calcular valores dinámicos para el folio
    const areaClave = user?.area?.clave || 'AREA';
    console.log('areaClave calculada:', areaClave);
    const añoActual = new Date().getFullYear();
    const fechaActual = new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    // Obtener la clave del tipo de documento seleccionado
    const tipoDocumentoSeleccionado = tiposDocumento.find(
        tipo => tipo.id === parseInt(formData.tipo_documento_id)
    );
    const tipoDocumentoClave = tipoDocumentoSeleccionado?.clave || 'EM';
    
    // Clave de área efectiva para el folio: área prestamista confirmada > área propia
    const folioAreaClave = proximoConsecutivo?.clave_area
        || solicitudReserva?.area_prestamista_clave
        || areaClave;

    // ¿El folio viene de un área padre (no la propia del usuario)?
    const esFolioDeAreaPadre = !!(solicitudReserva || prestamoSeleccionado);

    const folioBase = `${tipoDocumentoClave}.${folioAreaClave}`;

    // Referencia completa:
    // - Préstamo aprobado → usa el folio ya asignado
    // - Reserva pendiente → el número es desconocido hasta aprobación (muestra RESERVA)
    // - Flujo normal → muestra el próximo consecutivo real del área
    const referenciaCompleta =
        prestamoSeleccionado?.folio_asignado
        || (solicitudReserva
            ? `${folioBase}-RESERVA/${añoActual}`
            : proximoConsecutivo?.folio_completo
                || `${folioBase}-${'----'}/${añoActual}`);

    // Lógica condicional: mostrar campo "Préstamo de Número" solo si contexto === 'OFICIO'
    const requierePrestamoNumero = formData.contexto === 'OFICIO';

    // **NUEVO: Handlers para modal de préstamo de folios**
    const handleSolicitarFolio = async () => {
        if (!areaPrestamistaSeleccionada) {
            setErrorPrestamo('Debe seleccionar un área');
            return;
        }

        const areaSeleccionada = areasPrestamistas.find(
            a => a.id === parseInt(areaPrestamistaSeleccionada)
        );

        // Si el área seleccionada es la propia del usuario → flujo normal sin reserva
        const esAreaPropia = Number(areaPrestamistaSeleccionada) === user?.area?.id;
        if (esAreaPropia) {
            setSolicitudReserva(null);
            setIsModalFolioOpen(false);
            setAreaPrestamistaSeleccionada('');
            setMotivacionPrestamo('');
            setFolioPreview('');
            setErrorPrestamo(null);
            toast.info('Se usará el folio de su área. Emisión normal.');
            return;
        }

        // Área diferente al usuario → reserva de folio con PENDIENTE_PRESTAMO.
        // Aplica para cualquier contexto: OFICIO, MEMORANDUM, CIRCULAR, etc.
        if (!motivacionPrestamo || motivacionPrestamo.trim().length < 10) {
            setErrorPrestamo('La motivación debe tener al menos 10 caracteres');
            return;
        }

        setSolicitudReserva({
            area_prestamista_id: parseInt(areaPrestamistaSeleccionada, 10),
            area_prestamista_nombre: areaSeleccionada?.nombre || 'Área seleccionada',
            area_prestamista_clave: areaSeleccionada?.clave || '',
            motivacion: motivacionPrestamo.trim()
        });

        // Limpiar préstamo aprobado previo si había uno
        updateField('prestamo_numero_id', null);
        setPrestamoSeleccionado(null);

        setIsModalFolioOpen(false);
        setAreaPrestamistaSeleccionada('');
        setMotivacionPrestamo('');
        setFolioPreview('');
        setErrorPrestamo(null);

        toast.success(`Reserva configurada desde ${areaSeleccionada?.nombre}. El documento quedará bloqueado hasta la aprobación del área prestamista.`);
    };

    const handleCerrarModalFolio = () => {
        setIsModalFolioOpen(false);
        setAreaPrestamistaSeleccionada('');
        setMotivacionPrestamo('');
        setFolioPreview('');
        setErrorPrestamo(null);
    };

    // **NUEVO: Handler para usar un préstamo aprobado**
    const handleUsarPrestamo = (prestamo) => {
        // Setear el ID del préstamo en formData
        updateField('prestamo_numero_id', prestamo.id);
        
        // Guardar el objeto completo para mostrar información
        setPrestamoSeleccionado(prestamo);
        setSolicitudReserva(null);
        
        // Cerrar el modal
        setIsModalFolioOpen(false);
        
        console.log('Préstamo seleccionado:', prestamo);
    };

    // **NUEVO: Handler para deseleccionar préstamo**
    const handleCambiarPrestamo = () => {
        updateField('prestamo_numero_id', null);
        setPrestamoSeleccionado(null);
        setSolicitudReserva(null);
        setIsModalFolioOpen(true);
    };

    // Handler para cambios en inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        updateField(name, value);
        // Limpiar error del campo cuando el usuario empieza a escribir
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Handler para mostrar modal de confirmación
    const handleGuardar = async () => {
        // Limpiar errores previos
        setFieldErrors({});

        // Validación frontend
        const { valid, errors } = validarFormulario();
        
        if (!valid) {
            console.error('Errores de validación:', errors);
            
            // Convertir errores a objeto para mostrar inline
            const errorsObj = {};
            Object.values(errors).forEach(error => {
                // Extraer el nombre del campo del mensaje de error
                if (error.includes('tipo de documento')) errorsObj.tipo_documento_id = error;
                else if (error.includes('asunto')) errorsObj.asunto = error;
                else if (error.includes('prioridad')) errorsObj.prioridad = error;
                else if (error.includes('contenido')) errorsObj.contenido = error;
                else if (error.includes('destinatarios')) errorsObj.destinatarios = error;
            });
            setFieldErrors(errorsObj);
            
            toast.error('Por favor, corrija los errores en el formulario', 5000);
            return;
        }

        // Para OFICIO se requiere préstamo aprobado o una reserva configurada.
        if (requierePrestamoNumero && !formData.prestamo_numero_id && !solicitudReserva) {
            toast.error('Para OFICIO debe seleccionar un préstamo aprobado o configurar reserva', 5000);
            return;
        }

        // Si se usa préstamo aprobado, debe ser un entero válido.
        if (formData.contexto === 'OFICIO' && formData.prestamo_numero_id && !Number.isInteger(Number(formData.prestamo_numero_id))) {
            toast.error('Documentos tipo OFICIO requieren un préstamo de número válido', 5000);
            return;
        }

        // Mostrar modal de confirmación
        setShowConfirmModal(true);
    };

    // Handler para ejecutar la emisión real después de confirmación
    const handleConfirmarEmision = async () => {
        setIsEmitting(true);

        try {
            let resultado = null;
            let esPendientePrestamo = false;

            // PASO 1: Si hay reserva configurada (área padre distinta a la del usuario),
            // usar el endpoint unificado /documentos/emitir con area_folio_id.
            // Aplica para cualquier contexto, no solo OFICIO.
            if (solicitudReserva && !formData.prestamo_numero_id) {
                const reservaResp = await documentoService.emitirDocumento({
                    tipo_documento_id: parseInt(formData.tipo_documento_id, 10),
                    asunto: formData.asunto.trim(),
                    contenido: formData.contenido?.trim() || null,
                    fecha_limite: formData.fecha_limite || null,
                    prioridad: formData.prioridad,
                    contexto: formData.contexto,
                    instrucciones: formData.instrucciones?.trim() || null,
                    observaciones: formData.observaciones?.trim() || null,
                    area_folio_id: solicitudReserva.area_prestamista_id,
                    motivacion: solicitudReserva.motivacion,
                });

                const data = reservaResp?.data || {};
                resultado = {
                    documentoId: data.documentoId,
                    nodoId: data.nodoId,
                    folio: data.folio,
                    prestamoId: data.prestamoId,
                };

                esPendientePrestamo = data.pendienteAprobacion === true;

                setDocumentoRegistrado({
                    documento_id: data.documentoId,
                    nodo_id: data.nodoId,
                    folio: data.folio,
                    asunto: formData.asunto,
                    estado: esPendientePrestamo ? 'PENDIENTE_PRESTAMO' : 'REGISTRADO',
                });
            } else {
                // PASO 1: Emisión normal con préstamo aprobado (flujo actual).
                resultado = await emitir();
                if (!resultado) {
                    toast.error('Error al emitir documento', 5000);
                    setIsEmitting(false);
                    return;
                }
            }

            // **PASO 1.5: Marcar préstamo como UTILIZADO si se usó uno**
            if (!esPendientePrestamo && formData.prestamo_numero_id) {
                try {
                    await prestamoService.marcarPrestamoUtilizado(Number(formData.prestamo_numero_id));
                    console.log('Préstamo marcado como UTILIZADO:', formData.prestamo_numero_id);
                } catch (err) {
                    console.error('Error al marcar préstamo como utilizado:', err);
                    // No bloqueamos el flujo, solo registramos el error
                }
            }

            // **PASO 2: Turnar a cada destinatario**
            if (!esPendientePrestamo && destinatarios.length > 0 && resultado.documentoId) {
                console.log('Iniciando turnado a destinatarios:', destinatarios);
                
                for (const destinatario of destinatarios) {
                    try {
                        await documentoService.turnarDocumento(
                            resultado.documentoId,
                            destinatario.id,
                            null, // observaciones
                            formData.instrucciones || null // instrucciones
                        );
                        console.log(`Documento turnado a: ${destinatario.nombre}`);
                    } catch (err) {
                        console.error(`Error al turnar a ${destinatario.nombre}:`, err);
                        toast.warning(`No se pudo turnar a ${destinatario.nombre}`, 4000);
                        // Continuamos con los demás destinatarios aunque uno falle
                    }
                }
            }

            // **PASO 3: Crear copias de conocimiento**
            if (!esPendientePrestamo && copias.length > 0 && resultado.documentoId) {
                console.log('Creando copias de conocimiento:', copias);
                
                try {
                    const areasIds = copias.map(c => c.id);
                    await documentoService.crearCopiasConocimiento(
                        resultado.documentoId,
                        areasIds
                    );
                    console.log('Copias de conocimiento creadas exitosamente');
                } catch (err) {
                    console.error('Error al crear copias de conocimiento:', err);
                    toast.warning('No se pudieron crear todas las copias de conocimiento', 4000);
                }
            }

            // **PASO 4: Vincular archivos adjuntos**
            if (!esPendientePrestamo && archivos.length > 0 && resultado.documentoId) {
                console.log('Vinculando archivos al documento:', archivos);
                
                try {
                    const archivosIds = archivos.map(a => a.id);
                    await archivoService.vincularArchivosDocumento(
                        resultado.documentoId,
                        archivosIds,
                        'ADJUNTO'
                    );

                    // También vincular con el nodo de emisión si existe
                    if (resultado.nodoId) {
                        await archivoService.vincularArchivosNodo(
                            resultado.nodoId,
                            archivosIds,
                            'ADJUNTO'
                        );
                    }

                    console.log('Archivos vinculados exitosamente');
                } catch (err) {
                    console.error('Error al vincular archivos:', err);
                    toast.warning('No se pudieron vincular todos los archivos', 4000);
                }
            }

            // **PASO 5: Éxito - mostrar modal y limpiar estado**
            setShowSuccessModal(true);
            setShowConfirmModal(false);
            setDestinatarios([]);
            setCopias([]);
            setArchivos([]);
            setArchivosSubiendo([]);
            setErrorArchivos(null);
            setPrestamoSeleccionado(null);
            setSolicitudReserva(null);
            setFieldErrors({});

            if (esPendientePrestamo) {
                toast.success(
                    `Documento registrado con folio ${resultado.folio || 'N/A'} en estado PENDIENTE_PRESTAMO.`,
                    8000
                );
                toast.info('No se puede turnar, editar ni adjuntar archivos hasta aprobar el préstamo.', 7000);
            } else {
                toast.success(`¡Documento emitido exitosamente! Folio: ${resultado.folio || 'N/A'}`, 7000);
            }
        } catch (error) {
            console.error('Error en emisión:', error);
            toast.error('Ocurrió un error al emitir el documento', 5000);
        } finally {
            setIsEmitting(false);
        }
    };

    // Handler para emitir otro documento
    const handleEmitirOtro = () => {
        resetForm();
        setShowSuccessModal(false);
        setDestinatarios([]);
        setCopias([]);
        setArchivos([]);
        setArchivosSubiendo([]);
        setErrorArchivos(null);
        setPrestamoSeleccionado(null);
        setSolicitudReserva(null);
        setDocumentoRegistrado(null);
    };

    // Handler para ver detalle del documento emitido
    const handleVerDetalle = () => {
        const documentoResultado = documentoEmitido || documentoRegistrado;
        if (documentoResultado?.documento_id) {
            navigate(`/documentos/${documentoResultado.documento_id}`);
        }
    };

    // Calcular fecha mínima para fecha límite (hoy)
    const fechaMinima = new Date().toISOString().split('T')[0];
    const documentoResultado = documentoEmitido || documentoRegistrado;

    return (
        <AppLayout activeRoute="emitir">
            <div className="p-4 max-w-7xl mx-auto w-full space-y-4 pb-24">
                        {/* Breadcrumbs & Header */}
                        <div>
                            <nav className="flex text-xs text-slate-400 mb-1 gap-2 items-center">
                                <span>Gestión Administrativa</span>
                                <span className="material-symbols-outlined !text-[12px]">chevron_right</span>
                                <span className="text-primary font-medium">Nueva Emisión</span>
                            </nav>
                            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                Emisión de Documento
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Complete los campos requeridos para la generación y firma del oficio institucional.
                            </p>
                        </div>

                        {/* Mensaje de sin permisos */}
                        {!puedeCrearDocumento && (
                            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 flex items-start gap-2 border border-red-300">
                                <span className="material-symbols-outlined !text-base">block</span>
                                <div>
                                    <p className="text-sm font-bold">Acceso Denegado</p>
                                    <p className="text-sm">No tiene permisos para crear documentos. Contacte al administrador del sistema.</p>
                                </div>
                            </div>
                        )}

                        {/* Mensaje de Error */}
                        {error && (
                            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 flex items-start gap-2">
                                <span className="material-symbols-outlined !text-base">error</span>
                                <div className="flex-1">
                                    <span className="text-sm font-semibold">{error}</span>
                                </div>
                                <button 
                                    onClick={clearMessages}
                                    className="material-symbols-outlined !text-sm hover:text-red-900"
                                >
                                    close
                                </button>
                            </div>
                        )}

                        {/* Mensaje de Éxito inline (alternativo al modal) */}
                        {(success || documentoRegistrado) && !showSuccessModal && documentoResultado && (
                            <div className="bg-emerald-100 text-emerald-800 p-3 rounded-lg mb-4 flex items-start gap-2 border border-emerald-300">
                                <span className="material-symbols-outlined !text-base">check_circle</span>
                                <div className="flex-1">
                                    <p className="text-sm font-bold">
                                        {documentoResultado.estado === 'PENDIENTE_PRESTAMO'
                                            ? 'Documento registrado con préstamo pendiente'
                                            : '¡Documento emitido exitosamente!'}
                                    </p>
                                    <p className="text-sm">Folio: <span className="font-mono font-semibold">{documentoResultado.folio || 'N/A'}</span></p>
                                </div>
                            </div>
                        )}

                        {/* Advertencia de Área sin Clave */}
                        {user && (!user.area || !user.area.clave) && (
                            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4 flex items-start gap-2">
                                <span className="material-symbols-outlined !text-base">warning</span>
                                <div>
                                    <p className="text-sm font-bold">Información del área incompleta</p>
                                    <p className="text-sm">Por favor, cierre sesión y vuelva a iniciar sesión para actualizar su información.</p>
                                </div>
                            </div>
                        )}

                        {/* Card 1: Folio y Datos */}
                        <section className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between gap-4">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary !text-base">tag</span>
                                        Folio y Datos del Documento
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {/* Botón de diagnóstico (temporal) */}
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const areaId = prestamoSeleccionado?.area_prestamista_id || user?.area?.id;
                                                const tipoDocId = formData.tipo_documento_id;
                                                if (!areaId || !tipoDocId) {
                                                    alert('Seleccione un área y tipo de documento primero');
                                                    return;
                                                }
                                                try {
                                                    const diag = await documentoService.getDiagnosticoConsecutivo(areaId, tipoDocId);
                                                    console.log('=== DIAGNÓSTICO DE CONSECUTIVOS ===');
                                                    console.log('Datos completos:', diag);
                                                    console.log('Tipo documento:', diag.data?.tipo_documento);
                                                    console.log('Área:', diag.data?.area);
                                                    console.log('Consecutivos existentes:', diag.data?.consecutivos_existentes);
                                                    console.log('Clave buscada:', diag.data?.clave_buscada);
                                                    console.log('Próximo consecutivo:', diag.data?.proximo_consecutivo);
                                                    console.log('Folio completo:', diag.data?.folio_completo);
                                                    alert(`Diagnóstico completado. Ver consola del navegador.\n\nPróximo consecutivo: ${diag.data?.proximo_consecutivo}\nFolio: ${diag.data?.folio_completo}`);
                                                } catch (err) {
                                                    console.error('Error en diagnóstico:', err);
                                                    alert('Error al obtener diagnóstico: ' + err.message);
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-bold rounded-lg hover:bg-yellow-600 transition-all flex items-center gap-1.5"
                                            title="Ver diagnóstico de consecutivos en consola"
                                        >
                                            <span className="material-symbols-outlined !text-sm">bug_report</span> Debug
                                        </button>
                                        {/* Botón siempre visible para seleccionar área de emisión */}
                                        <button
                                            type="button"
                                            onClick={() => setIsModalFolioOpen(true)}
                                            className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
                                        >
                                            <span className="material-symbols-outlined !text-sm">autorenew</span> Seleccionar área
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                        Tipo de documento <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        name="tipo_documento_id"
                                        value={formData.tipo_documento_id}
                                        onChange={handleInputChange}
                                        disabled={!puedeCrearDocumento || loadingTipos}
                                        className={`w-full rounded-lg bg-white dark:bg-slate-900 text-sm py-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            fieldErrors.tipo_documento_id 
                                                ? 'border-2 border-red-500 dark:border-red-500' 
                                                : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <option value="">Seleccione un tipo...</option>
                                        {loadingTipos && <option>Cargando...</option>}
                                        {errorTipos && <option>Error al cargar</option>}
                                        {!loadingTipos && tiposDocumento.length > 0 && (
                                            tiposDocumento.map(tipo => (
                                                <option key={tipo.id} value={tipo.id}>
                                                    {tipo.nombre}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {fieldErrors.tipo_documento_id && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">error</span>
                                            {fieldErrors.tipo_documento_id}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Folio</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 font-mono py-1.5"
                                        disabled
                                        type="text"
                                        value={folioBase}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Número</label>
                                    <input
                                        className={`w-full border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono py-1.5 ${
                                            loadingConsecutivo 
                                                ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 animate-pulse' 
                                                : proximoConsecutivo 
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold border-emerald-300 dark:border-emerald-700' 
                                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'
                                        }`}
                                        disabled
                                        type="text"
                                        value={
                                            errorConsecutivo 
                                                ? '⚠️ Error' 
                                                : loadingConsecutivo 
                                                    ? 'Cargando...' 
                                                    : proximoConsecutivo?.consecutivo 
                                                        ? String(proximoConsecutivo.consecutivo).padStart(4, '0') 
                                                        : '----'
                                        }
                                        title={
                                            proximoConsecutivo?.folio_completo 
                                                ? `Folio completo: ${proximoConsecutivo.folio_completo}` 
                                                : 'Número de folio consecutivo'
                                        }
                                    />
                                    {proximoConsecutivo && !loadingConsecutivo && (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined !text-xs">info</span>
                                            Este será el número asignado
                                        </p>
                                    )}
                                    {errorConsecutivo && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined !text-xs">error</span>
                                            No se pudo cargar
                                        </p>
                                    )}
                                    {!proximoConsecutivo && !loadingConsecutivo && !errorConsecutivo && formData.tipo_documento_id && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined !text-xs">warning</span>
                                            Seleccione tipo de documento
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Año</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 font-mono py-1.5"
                                        disabled
                                        type="text"
                                        value={añoActual}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Referencia</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 font-mono font-bold py-1.5"
                                        disabled
                                        type="text"
                                        value={referenciaCompleta}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fecha</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 py-1.5"
                                        disabled
                                        type="text"
                                        value={fechaActual}
                                    />
                                </div>
                            </div>

                            {/* Banner de área emisora del folio cuando es distinta a la propia */}
                            {esFolioDeAreaPadre && (
                                <div className="px-4 pb-3">
                                    <div className={`flex items-start gap-2.5 p-3 rounded-lg border ${
                                        solicitudReserva
                                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                                            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                                    }`}>
                                        <span className={`material-symbols-outlined !text-base mt-0.5 ${
                                            solicitudReserva ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                                        }`}>account_tree</span>
                                        <div className="flex-1 min-w-0">
                                            {solicitudReserva ? (
                                                <>
                                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                                        Folio reservado — área padre: {solicitudReserva.area_prestamista_nombre}
                                                    </p>
                                                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                                                        El número consecutivo se asignará cuando el área apruebe la solicitud. El documento quedará en <strong>PENDIENTE_PRESTAMO</strong>.
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                        Folio aprobado — área: {prestamoSeleccionado?.area_prestamista_nombre}
                                                    </p>
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                                                        Usando folio pre-aprobado: <span className="font-mono font-bold">{prestamoSeleccionado?.folio_asignado}</span>
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setSolicitudReserva(null); setPrestamoSeleccionado(null); updateField('prestamo_numero_id', null); }}
                                            className="text-xs font-bold underline whitespace-nowrap mt-0.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                        >
                                            Cambiar área
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Card 2: Datos del Remitente */}
                        <section className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-base">person</span>
                                    Datos del Remitente
                                </h3>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dependencia</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500"
                                        disabled
                                        type="text"
                                        value="Secretaría de Medio Ambiente, Desarrollo Sustentable y Ordenamiento Territorial"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unidad Administrativa</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500"
                                        disabled
                                        type="text"
                                        value={user?.area?.nombre || 'Sin área asignada'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cargo del remitente</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500"
                                        disabled
                                        type="text"
                                        value={user?.rol?.nombre || 'Sin cargo asignado'}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Remitente</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 font-bold"
                                        disabled
                                        type="text"
                                        value={user ? `${user.nombre} ${user.apellidos}` : 'Sin usuario'}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            {/* Card 3: Detalles del Contenido */}
                            <section className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
                                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary !text-base">description</span>
                                        Detalles del Contenido
                                    </h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                            Tema / Asunto <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            name="asunto"
                                            value={formData.asunto}
                                            onChange={handleInputChange}
                                            disabled={!puedeCrearDocumento}
                                            className={`w-full rounded-lg bg-white dark:bg-slate-900 text-sm focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
                                                fieldErrors.asunto 
                                                    ? 'border-2 border-red-500 dark:border-red-500' 
                                                    : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                            placeholder="Escriba el tema principal del documento (10-500 caracteres)..."
                                            type="text"
                                            maxLength="500"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">{formData.asunto.length}/500 caracteres</p>
                                        {fieldErrors.asunto && (
                                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">error</span>
                                                {fieldErrors.asunto}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                            Síntesis / Contenido <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="contenido"
                                            value={formData.contenido}
                                            onChange={handleInputChange}
                                            disabled={!puedeCrearDocumento}
                                            className={`w-full rounded-lg bg-white dark:bg-slate-900 text-sm focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
                                                fieldErrors.contenido 
                                                    ? 'border-2 border-red-500 dark:border-red-500' 
                                                    : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                            placeholder="Resumen detallado del contenido (mínimo 20 caracteres)..."
                                            rows="3"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">{formData.contenido.length} caracteres</p>
                                        {fieldErrors.contenido && (
                                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">error</span>
                                                {fieldErrors.contenido}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prioridad</label>
                                            <select
                                                name="prioridad"
                                                value={formData.prioridad}
                                                onChange={handleInputChange}
                                                disabled={!puedeCrearDocumento}
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="BAJA">Baja</option>
                                                <option value="MEDIA">Media</option>
                                                <option value="ALTA">Alta</option>
                                                <option value="URGENTE">Urgente</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Contexto</label>
                                            <select
                                                name="contexto"
                                                value={formData.contexto}
                                                onChange={handleInputChange}
                                                disabled={!puedeCrearDocumento}
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="OFICIO">Oficio</option>
                                                <option value="MEMORANDUM">Memorándum</option>
                                                <option value="CIRCULAR">Circular</option>
                                                <option value="COMUNICADO_INT">Comunicado Interno</option>
                                                <option value="INFORME">Informe</option>
                                                <option value="EXPEDIENTE">Expediente</option>
                                                <option value="OTRO">Otro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                                Fecha límite de atención
                                            </label>
                                            <input
                                                name="fecha_limite"
                                                value={formData.fecha_limite}
                                                onChange={handleInputChange}
                                                disabled={!puedeCrearDocumento}
                                                min={fechaMinima}
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                type="date"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Campo condicional: Préstamo de Número (solo si contexto === 'OFICIO') */}
                                    {requierePrestamoNumero && (
                                        <div className="border-l-4 border-primary pl-4 bg-primary/5 dark:bg-primary/10 p-3 rounded-r-lg">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                                                Préstamo de Número <span className="text-red-500">*</span>
                                            </label>
                                            {prestamoSeleccionado ? (
                                                <div className="space-y-2">
                                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                                                {prestamoSeleccionado.folio_asignado}
                                                            </span>
                                                            <span className="text-xs px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full">
                                                                Aprobado
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            Área: {prestamoSeleccionado.area_prestamista_nombre}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500">
                                                            Vence en {Math.floor(prestamoSeleccionado.dias_restantes)} días
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleCambiarPrestamo}
                                                        disabled={!puedeCrearDocumento}
                                                        className="w-full py-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                                    >
                                                        <span className="material-symbols-outlined !text-sm">swap_horiz</span>
                                                        Cambiar préstamo
                                                    </button>
                                                </div>
                                            ) : solicitudReserva ? (
                                                <div className="space-y-2">
                                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-semibold text-amber-700 dark:text-amber-400">
                                                                Reserva configurada
                                                            </span>
                                                            <span className="text-xs px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded-full">
                                                                Pendiente
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            Área: {solicitudReserva.area_prestamista_nombre}
                                                            {solicitudReserva.area_prestamista_clave ? ` (${solicitudReserva.area_prestamista_clave})` : ''}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                                            Motivo: {solicitudReserva.motivacion}
                                                        </p>
                                                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                                                            Al emitir se registrará como PENDIENTE_PRESTAMO hasta aprobación.
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsModalFolioOpen(true)}
                                                        disabled={!puedeCrearDocumento}
                                                        className="w-full py-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                                    >
                                                        <span className="material-symbols-outlined !text-sm">swap_horiz</span>
                                                        Cambiar selección
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsModalFolioOpen(true)}
                                                        disabled={!puedeCrearDocumento}
                                                        className="w-full py-3 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-sm text-slate-600 dark:text-slate-400 hover:text-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="material-symbols-outlined !text-lg">add_circle</span>
                                                        Seleccionar préstamo aprobado
                                                    </button>
                                                    <p className="text-xs text-slate-500 mt-2">
                                                        <span className="material-symbols-outlined !text-xs align-middle">info</span>
                                                        Campo obligatorio para documentos tipo OFICIO
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Instrucciones Adicionales</label>
                                        <textarea
                                            name="instrucciones"
                                            value={formData.instrucciones}
                                            onChange={handleInputChange}
                                            disabled={!puedeCrearDocumento}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="Instrucciones u observaciones adicionales (opcional)..."
                                            rows="2"
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="space-y-6">
                                {/* Card 6: Archivos Adjuntos */}
                                <section className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary !text-base">attach_file</span>
                                                Archivos Adjuntos
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={handleAbrirSelectorArchivos}
                                                disabled={!puedeCrearDocumento}
                                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="material-symbols-outlined !text-sm">add</span> Agregar más archivos
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        {/* Banner de bloqueo cuando hay reserva pendiente */}
                                        {solicitudReserva && (
                                            <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-start gap-2">
                                                <span className="material-symbols-outlined text-amber-600 !text-base mt-0.5">lock</span>
                                                <div>
                                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Adjuntar bloqueado temporalmente</p>
                                                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                                                        El documento quedará en <strong>PENDIENTE_PRESTAMO</strong>. Podrá adjuntar archivos una vez que <strong>{solicitudReserva.area_prestamista_nombre}</strong> apruebe el folio.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Input file oculto */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png"
                                            onChange={handleFileInputChange}
                                            className="hidden"
                                            disabled={!puedeCrearDocumento || !!solicitudReserva}
                                        />

                                        {/* Zona de drag & drop */}
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={handleAbrirSelectorArchivos}
                                            className={`border-2 border-dashed rounded-xl p-4 text-center flex flex-col items-center justify-center cursor-pointer transition-colors ${
                                                isDragging
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 hover:border-primary/50'
                                            } ${!puedeCrearDocumento ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">upload_file</span>
                                            <p className="text-xs text-slate-500">
                                                {isDragging ? 'Suelta los archivos aquí' : 'Arrastra y suelta archivos o haz clic para subir'}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Formatos: PDF, DOCX, XLSX, JPG, PNG • Máximo 50 MB por archivo
                                            </p>
                                        </div>

                                        {/* Error de archivos */}
                                        {errorArchivos && (
                                            <div className="mt-3 bg-red-100 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                                                <span className="material-symbols-outlined !text-base">error</span>
                                                <span>{errorArchivos}</span>
                                            </div>
                                        )}

                                        {/* Lista de archivos subiendo */}
                                        {archivosSubiendo.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {archivosSubiendo.map(archivo => (
                                                    <div
                                                        key={archivo.id}
                                                        className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <span className="material-symbols-outlined text-primary animate-spin">
                                                                progress_activity
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold truncate">{archivo.nombre_archivo}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                                        <div
                                                                            className="bg-primary h-1.5 rounded-full transition-all"
                                                                            style={{ width: `${archivo.progreso}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-xs text-slate-500 whitespace-nowrap">
                                                                        {archivo.progreso}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Lista de archivos subidos */}
                                        {archivos.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {archivos.map(archivo => {
                                                    const { icono, color } = obtenerIconoArchivo(archivo.tipo_mime);
                                                    return (
                                                        <div
                                                            key={archivo.id}
                                                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700"
                                                        >
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <span className={`material-symbols-outlined ${color}`}>{icono}</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold truncate">{archivo.nombre_archivo}</p>
                                                                    <p className="text-[10px] text-slate-500">
                                                                        {archivoService.formatearTamaño(archivo.tamaño)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoverArchivo(archivo.id)}
                                                                disabled={!puedeCrearDocumento}
                                                                className="material-symbols-outlined text-slate-400 hover:text-danger transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                title="Eliminar archivo"
                                                            >
                                                                delete
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Mensaje cuando no hay archivos */}
                                        {archivos.length === 0 && archivosSubiendo.length === 0 && !errorArchivos && (
                                            <p className="text-xs text-slate-400 text-center mt-3">
                                                No se han adjuntado archivos
                                            </p>
                                        )}
                                    </div>
                                </section>

                                {/* Card 4: Destinatarios y Copias */}
                                <section className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary !text-base">group</span>
                                            Destinatarios y Copias
                                        </h3>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Banner de bloqueo cuando hay reserva pendiente */}
                                        {solicitudReserva && (
                                            <div className="col-span-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-start gap-2">
                                                <span className="material-symbols-outlined text-amber-600 !text-base mt-0.5">lock</span>
                                                <div>
                                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Turnar y copias bloqueados temporalmente</p>
                                                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                                                        No se puede turnar ni añadir copias hasta que <strong>{solicitudReserva.area_prestamista_nombre}</strong> apruebe el folio reservado.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Destinatarios */}
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-slate-500 uppercase">
                                                Destinatarios (Turnar)
                                            </label>
                                            <select 
                                                onChange={handleAgregarDestinatario}
                                                disabled={!puedeCrearDocumento || loadingAreas}
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                value=""
                                            >
                                                <option value="">
                                                    {loadingAreas ? 'Cargando áreas...' : 'Seleccionar destinatario...'}
                                                </option>
                                                {errorAreas && <option disabled>Error al cargar áreas</option>}
                                                {!loadingAreas && areasParaDestinatarios.map(area => (
                                                    <option key={area.id} value={area.id}>
                                                        {area.nombre} ({area.clave})
                                                    </option>
                                                ))}
                                            </select>
                                            
                                            {/* Chips de destinatarios seleccionados */}
                                            <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                                {destinatarios.length === 0 && (
                                                    <span className="text-xs text-slate-400 italic">Sin destinatarios seleccionados</span>
                                                )}
                                                {destinatarios.map(destinatario => (
                                                    <span 
                                                        key={destinatario.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20"
                                                    >
                                                        {destinatario.nombre}
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleRemoverDestinatario(destinatario.id)}
                                                            disabled={!puedeCrearDocumento}
                                                            className="material-symbols-outlined !text-xs hover:text-red-600 transition-colors disabled:opacity-50"
                                                            title="Remover"
                                                        >
                                                            close
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Copias de conocimiento (CC) */}
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-slate-500 uppercase">
                                                Copias de conocimiento (CC)
                                            </label>
                                            <select
                                                onChange={handleAgregarCopia}
                                                disabled={!puedeCrearDocumento || loadingAreas}
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                value=""
                                            >
                                                <option value="">
                                                    {loadingAreas ? 'Cargando áreas...' : 'Seleccionar CC...'}
                                                </option>
                                                {errorAreas && <option disabled>Error al cargar áreas</option>}
                                                {!loadingAreas && areasParaCopias.map(area => (
                                                    <option key={area.id} value={area.id}>
                                                        {area.nombre} ({area.clave})
                                                    </option>
                                                ))}
                                            </select>
                                            
                                            {/* Chips de copias seleccionadas */}
                                            <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                                {copias.length === 0 && (
                                                    <span className="text-xs text-slate-400 italic">Sin copias seleccionadas</span>
                                                )}
                                                {copias.map(copia => (
                                                    <span 
                                                        key={copia.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full"
                                                    >
                                                        {copia.nombre}
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleRemoverCopia(copia.id)}
                                                            disabled={!puedeCrearDocumento}
                                                            className="material-symbols-outlined !text-xs hover:text-red-600 transition-colors disabled:opacity-50"
                                                            title="Remover"
                                                        >
                                                            close
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Card 5: Control y Seguimiento */}
                        <section className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-base">visibility</span>
                                    Control y Seguimiento
                                </h3>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Capturó</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400"
                                        disabled
                                        type="text"
                                        value={user ? `${user.nombre} ${user.apellidos}` : 'Usuario no disponible'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha de captura</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400"
                                        disabled
                                        type="text"
                                        value={new Date().toLocaleString('es-MX', { 
                                            day: '2-digit', 
                                            month: '2-digit', 
                                            year: 'numeric', 
                                            hour: '2-digit', 
                                            minute: '2-digit',
                                            hour12: true 
                                        })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Respuesta (Lectura)</label>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 resize-none"
                                        disabled
                                        rows="1"
                                        value="Sin respuesta previa..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Aprobó</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400"
                                        disabled
                                        placeholder="Pendiente de aprobación..."
                                        type="text"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Sticky Footer Actions */}
                        <footer className="fixed bottom-0 left-64 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between z-20">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalFirmaOpen(true)}
                                    className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined !text-base">key</span> Firma Electrónica
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleGuardar}
                                    disabled={!puedeCrearDocumento || loading || isEmitting || success || documentoRegistrado !== null}
                                    className="px-5 py-2 bg-success text-white text-sm font-bold rounded-lg hover:bg-success/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {(loading || isEmitting) && (
                                        <span className="material-symbols-outlined !text-base animate-spin">progress_activity</span>
                                    )}
                                    {loading || isEmitting
                                        ? 'Procesando...'
                                        : success
                                            ? 'Emitido'
                                            : documentoRegistrado !== null
                                                ? 'Registrado'
                                                : 'Emitir Documento'}
                                </button>
                                
                                {success && (
                                    <button
                                        type="button"
                                        onClick={handleEmitirOtro}
                                        className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined !text-base">add_circle</span>
                                        Emitir Otro
                                    </button>
                                )}
                                
                                <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />
                                <button
                                    type="button"
                                    onClick={() => navigate('/recepciones')}
                                    className="px-5 py-2 text-white bg-slate-500 hover:bg-slate-600 text-sm font-bold rounded-lg transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </footer>

                        {/* Modal: Firma Electrónica */}
                        {isModalFirmaOpen && (
                            <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                                <div className="modal-content bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-8 shadow-2xl border border-slate-200 dark:border-slate-800 mx-4">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">verified_user</span> Firma Electrónica
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() => setIsModalFirmaOpen(false)}
                                            className="material-symbols-outlined text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            close
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-6">
                                        Cargue sus archivos de certificados para firmar digitalmente el documento.
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Archivo .key</label>
                                            <input
                                                type="file"
                                                accept=".key"
                                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Archivo .cer</label>
                                            <input
                                                type="file"
                                                accept=".cer"
                                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Contraseña</label>
                                            <input
                                                type="password"
                                                placeholder="••••••••"
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                        <div className="flex gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalFirmaOpen(false)}
                                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30"
                                            >
                                                Firmar Documento
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal: Éxito en Emisión */}
                        {showSuccessModal && documentoResultado && (
                            <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                                <div className="modal-content bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-8 shadow-2xl border border-slate-200 dark:border-slate-800 mx-4">
                                    <div className="text-center mb-6">
                                        {documentoResultado.estado === 'PENDIENTE_PRESTAMO' ? (
                                            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-4xl">pending</span>
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-4xl">check_circle</span>
                                            </div>
                                        )}
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                            {documentoResultado.estado === 'PENDIENTE_PRESTAMO'
                                                ? 'Documento Registrado'
                                                : '¡Documento Emitido!'}
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            {documentoResultado.estado === 'PENDIENTE_PRESTAMO'
                                                ? 'El documento fue registrado con folio reservado. Queda bloqueado hasta que el área prestamista apruebe el préstamo.'
                                                : 'El documento se ha emitido exitosamente en el sistema'}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500 uppercase">Folio generado:</span>
                                                <span className="text-sm font-mono font-bold text-primary">
                                                    {documentoResultado?.folio || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500 uppercase">ID Documento:</span>
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    #{documentoResultado?.documento_id || 'N/A'}
                                                </span>
                                            </div>
                                            {documentoResultado?.asunto && (
                                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Asunto:</span>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                                        {documentoResultado.asunto}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleEmitirOtro}
                                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Emitir Otro
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleVerDetalle}
                                            className="flex-1 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined !text-sm">visibility</span>
                                            Ver Detalle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal: Solicitar Folio */}
                        {isModalFolioOpen && (
                            <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                                <div className="modal-content bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 mx-4 max-h-[90vh] overflow-y-auto">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">folder_open</span> Seleccionar Área de Emisión
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={handleCerrarModalFolio}
                                            className="material-symbols-outlined text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            close
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-6">
                                        Seleccione el área desde la cual se generará el folio. Si elige un <strong>área padre</strong> (diferente a la suya), el documento quedará en <strong>PENDIENTE_PRESTAMO</strong> hasta que dicha área apruebe el folio reservado.
                                    </p>

                                    {/* Préstamos aprobados disponibles */}
                                    {prestamosAprobados && prestamosAprobados.length > 0 && (
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 !text-sm">check_circle</span>
                                                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Folios Aprobados Disponibles</p>
                                            </div>
                                            <div className="space-y-2">
                                                {prestamosAprobados.map(prestamo => (
                                                    <div key={prestamo.id} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                                                                    {prestamo.folio_asignado}
                                                                </p>
                                                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                                                    Área: {prestamo.area_prestamista_nombre}
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                                                                    Vence en {Math.floor(prestamo.dias_restantes)} días
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUsarPrestamo(prestamo)}
                                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                                                            >
                                                                <span className="material-symbols-outlined !text-sm">check</span>
                                                                Usar este folio
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-5">
                                        {/* Selector de Área Prestamista */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                                Área para el folio
                                            </label>
                                            {loadingPrestamistas ? (
                                                <div className="text-center py-4">
                                                    <span className="text-sm text-slate-500">Cargando áreas...</span>
                                                </div>
                                            ) : (
                                                <select 
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary"
                                                    value={areaPrestamistaSeleccionada}
                                                    onChange={(e) => setAreaPrestamistaSeleccionada(e.target.value)}
                                                >
                                                    <option value="">Seleccionar área...</option>
                                                    {areasPrestamistas.map(area => (
                                                        <option key={area.id} value={area.id}>
                                                            {area.es_area_propia ? '★ ' : ''}{area.nombre} ({area.clave})
                                                            {area.es_area_propia ? ' - Mi área' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                            <p className="text-xs text-slate-500 mt-1">
                                                Solo se muestran las áreas autorizadas para prestar números (ancestros y área propia)
                                            </p>
                                        </div>

                                        {/* Vista previa del folio */}
                                        {folioPreview && (
                                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-primary !text-sm">info</span>
                                                    <p className="text-xs font-bold text-slate-500 uppercase">Vista previa del folio</p>
                                                </div>
                                                <p className="text-lg font-bold font-mono text-primary">{folioPreview}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Esta será la nomenclatura del documento
                                                </p>
                                                {!areasPrestamistas.find(a => a.id === parseInt(areaPrestamistaSeleccionada))?.es_area_propia && (
                                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                                                        <span className="material-symbols-outlined !text-xs">schedule</span>
                                                        El número consecutivo se asignará cuando el área apruebe su solicitud
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Campo de motivación (solo si no es área propia) */}
                                        {areaPrestamistaSeleccionada && 
                                         !areasPrestamistas.find(a => a.id === parseInt(areaPrestamistaSeleccionada))?.es_area_propia && (
                                            <div className="mt-4">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                                    Motivo de la solicitud *
                                                </label>
                                                <textarea
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary resize-none"
                                                    rows="3"
                                                    placeholder="Explique brevemente por qué necesita un folio de esta área (mínimo 10 caracteres)"
                                                    value={motivacionPrestamo}
                                                    onChange={(e) => setMotivacionPrestamo(e.target.value)}
                                                    maxLength="500"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {motivacionPrestamo.length}/500 caracteres
                                                    {motivacionPrestamo.length < 10 && motivacionPrestamo.length > 0 && 
                                                        <span className="text-amber-600 ml-2">• Mínimo 10 caracteres</span>
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {/* Error */}
                                        {errorPrestamo && (
                                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                                <p className="text-sm text-red-700 dark:text-red-400">
                                                    {errorPrestamo}
                                                </p>
                                            </div>
                                        )}

                                        {/* Botones de acción */}
                                        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                                            <button
                                                type="button"
                                                onClick={handleCerrarModalFolio}
                                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                disabled={loadingPrestamo}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSolicitarFolio}
                                                disabled={!areaPrestamistaSeleccionada || loadingPrestamo}
                                                className="flex-1 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loadingPrestamo ? (
                                                    <>
                                                        <span className="animate-spin material-symbols-outlined !text-sm">refresh</span>
                                                        Procesando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined !text-sm">check_circle</span>
                                                        {areaPrestamistaSeleccionada && !areasPrestamistas.find(a => a.id === parseInt(areaPrestamistaSeleccionada))?.es_area_propia
                                                            ? 'Solicitar Reserva de Folio'
                                                            : 'Confirmar Selección'
                                                        }
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

            {/* Toast Container */}
            <ToastContainer toasts={toast.toasts} onClose={toast.closeToast} />

            {/* Modal de Confirmación */}
            <ConfirmDialog
                isOpen={showConfirmModal}
                onClose={() => !isEmitting && setShowConfirmModal(false)}
                onConfirm={handleConfirmarEmision}
                title="Confirmar Emisión de Documento"
                confirmText="Emitir Documento"
                cancelText="Revisar"
                loading={isEmitting}
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Por favor, revise los datos antes de emitir el documento:
                    </p>

                    {/* Tipo de Documento */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                            Tipo de Documento
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {tiposDocumento.find(t => t.id === parseInt(formData.tipo_documento_id))?.nombre || 'No seleccionado'}
                        </p>
                    </div>

                    {/* Asunto */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                            Asunto
                        </p>
                        <p className="text-sm text-slate-900 dark:text-white">
                            {formData.asunto || 'Sin asunto'}
                        </p>
                    </div>

                    {/* Prioridad */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                            Prioridad
                        </p>
                        <p className="text-sm text-slate-900 dark:text-white capitalize">
                            {formData.prioridad || 'MEDIA'}
                        </p>
                    </div>

                    {/* Destinatarios */}
                    {destinatarios.length > 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                                Destinatarios ({destinatarios.length})
                            </p>
                            <div className="space-y-1">
                                {destinatarios.map((dest) => (
                                    <div key={dest.id} className="flex items-center gap-2 text-sm">
                                        <span className="material-symbols-outlined text-primary text-base">
                                            arrow_forward
                                        </span>
                                        <span className="text-slate-900 dark:text-white">
                                            {dest.nombre}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Copias */}
                    {copias.length > 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                                Copias de Conocimiento ({copias.length})
                            </p>
                            <div className="space-y-1">
                                {copias.map((copia) => (
                                    <div key={copia.id} className="flex items-center gap-2 text-sm">
                                        <span className="material-symbols-outlined text-slate-400 text-base">
                                            visibility
                                        </span>
                                        <span className="text-slate-900 dark:text-white">
                                            {copia.nombre}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Archivos */}
                    {archivos.length > 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                                Archivos Adjuntos ({archivos.length})
                            </p>
                            <div className="space-y-1">
                                {archivos.map((archivo) => (
                                    <div key={archivo.id} className="flex items-center gap-2 text-sm">
                                        <span className="material-symbols-outlined text-blue-500 text-base">
                                            attach_file
                                        </span>
                                        <span className="text-slate-900 dark:text-white truncate">
                                            {archivo.nombre_archivo}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Advertencia final */}
                    {solicitudReserva && formData.contexto === 'OFICIO' && !formData.prestamo_numero_id ? (
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-base">
                                    pending
                                </span>
                                <p className="text-xs text-orange-800 dark:text-orange-200">
                                    El documento quedará en estado <strong>PENDIENTE_PRESTAMO</strong>. No podrá turnarse ni adjuntar archivos hasta que el área <strong>{solicitudReserva.area_prestamista_nombre}</strong> apruebe el préstamo.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base">
                                    warning
                                </span>
                                <p className="text-xs text-amber-800 dark:text-amber-200">
                                    Una vez emitido, el documento será registrado oficialmente y se generará su folio permanente.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </ConfirmDialog>
        </AppLayout>
    );
};

export default FormularioEmision;
