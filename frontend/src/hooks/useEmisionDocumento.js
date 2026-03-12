/**
 * Hook personalizado para emisión de documentos
 * Maneja estado del formulario, validación y emisión
 */

import { useState, useEffect, useCallback } from 'react';
import documentoService from '@services/documento.service';
import useAuthStore from '@store/authStore';

/**
 * Valores iniciales del formulario
 */
const INITIAL_FORM_STATE = {
  tipo_documento_id: '',
  asunto: '',
  contenido: '',
  fecha_limite: '',
  prioridad: 'MEDIA',
  contexto: 'OTRO',
  prestamo_numero_id: '',
  instrucciones: '',
  observaciones: '',
};

/**
 * Hook para gestionar la emisión de documentos
 * @returns {Object} Estado y funciones del hook
 */
export const useEmisionDocumento = () => {
  // Estado del formulario
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  
  // Estado de carga y errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [documentoEmitido, setDocumentoEmitido] = useState(null);
  
  // Catálogos
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [errorTipos, setErrorTipos] = useState(null);
  
  // Verificar permisos
  const { hasPermission } = useAuthStore();
  const puedeCrearDocumento = hasPermission('CREAR_DOCUMENTO');

  /**
   * Cargar tipos de documento al montar el componente
   */
  useEffect(() => {
    if (puedeCrearDocumento) {
      cargarTiposDocumento();
    }
  }, [puedeCrearDocumento]);

  /**
   * Cargar lista de tipos de documento
   */
  const cargarTiposDocumento = async () => {
    setLoadingTipos(true);
    setErrorTipos(null);
    
    try {
      const response = await documentoService.obtenerTiposDocumento();
      setTiposDocumento(response.data || []);
    } catch (err) {
      console.error('Error al cargar tipos de documento:', err);
      setErrorTipos(err.response?.data?.error || 'Error al cargar tipos de documento');
      setTiposDocumento([]);
    } finally {
      setLoadingTipos(false);
    }
  };

  /**
   * Actualizar un campo del formulario
   * @param {string} field - Nombre del campo
   * @param {any} value - Valor del campo
   */
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Limpiar errores al editar
    if (error) {
      setError(null);
    }
  }, [error]);

  /**
   * Actualizar múltiples campos del formulario
   * @param {Object} fields - Objeto con los campos a actualizar
   */
  const updateFields = useCallback((fields) => {
    setFormData(prev => ({
      ...prev,
      ...fields,
    }));
    
    if (error) {
      setError(null);
    }
  }, [error]);

  /**
   * Validar el formulario antes de emitir
   * @returns {Object} { valid: boolean, errors: Object }
   */
  const validarFormulario = useCallback(() => {
    const errors = {};

    // Campos obligatorios
    if (!formData.tipo_documento_id || formData.tipo_documento_id === '') {
      errors.tipo_documento_id = 'Debe seleccionar un tipo de documento';
    }

    if (!formData.asunto || formData.asunto.trim() === '') {
      errors.asunto = 'El asunto es obligatorio';
    } else if (formData.asunto.trim().length < 10) {
      errors.asunto = 'El asunto debe tener al menos 10 caracteres';
    } else if (formData.asunto.trim().length > 500) {
      errors.asunto = 'El asunto no puede exceder 500 caracteres';
    }

    if (!formData.contenido || formData.contenido.trim() === '') {
      errors.contenido = 'El contenido es obligatorio';
    } else if (formData.contenido.trim().length < 20) {
      errors.contenido = 'El contenido debe tener al menos 20 caracteres';
    }

    // Validar fecha límite (debe ser futura si se proporciona)
    if (formData.fecha_limite) {
      const fechaLimite = new Date(formData.fecha_limite);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaLimite < hoy) {
        errors.fecha_limite = 'La fecha límite debe ser mayor o igual a hoy';
      }
    }

    // Validar prioridad
    const prioridadesValidas = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];
    if (!prioridadesValidas.includes(formData.prioridad)) {
      errors.prioridad = 'Prioridad no válida';
    }

    // Validar contexto
    const contextosValidos = ['OFICIO', 'MEMORANDUM', 'CIRCULAR', 'COMUNICADO_INT', 'INFORME', 'EXPEDIENTE', 'OTRO'];
    if (!contextosValidos.includes(formData.contexto)) {
      errors.contexto = 'Contexto no válido';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }, [formData]);

  /**
   * Emitir documento
   * @returns {Promise<Object>} Documento emitido o null si hay error
   */
  const emitir = async () => {
    // Verificar permisos
    if (!puedeCrearDocumento) {
      setError('No tiene permisos para crear documentos');
      return null;
    }

    // Validar formulario
    const { valid, errors } = validarFormulario();
    
    if (!valid) {
      const mensajesError = Object.values(errors).join(', ');
      setError(mensajesError);
      return null;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setDocumentoEmitido(null);
    
    try {
      // Preparar datos (remover campos vacíos opcionales)
      const datosEmision = {
        tipo_documento_id: parseInt(formData.tipo_documento_id, 10),
        asunto: formData.asunto.trim(),
        contenido: formData.contenido.trim(),
        prioridad: formData.prioridad,
        contexto: formData.contexto,
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.fecha_limite) {
        datosEmision.fecha_limite = formData.fecha_limite;
      }

      if (formData.prestamo_numero_id && formData.prestamo_numero_id.trim() !== '') {
        datosEmision.prestamo_numero_id = formData.prestamo_numero_id.trim();
      }

      if (formData.instrucciones && formData.instrucciones.trim() !== '') {
        datosEmision.instrucciones = formData.instrucciones.trim();
      }

      if (formData.observaciones && formData.observaciones.trim() !== '') {
        datosEmision.observaciones = formData.observaciones.trim();
      }

      // Emitir documento
      const response = await documentoService.emitirDocumento(datosEmision);
      
      setSuccess(true);
      setDocumentoEmitido(response.data || response);
      
      return response.data || response;
    } catch (err) {
      console.error('Error al emitir documento:', err);
      const mensajeError = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Error al emitir el documento';
      setError(mensajeError);
      setSuccess(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resetear el formulario a su estado inicial
   */
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setError(null);
    setSuccess(false);
    setDocumentoEmitido(null);
  }, []);

  /**
   * Limpiar solo mensajes de error/éxito (mantener datos del formulario)
   */
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    // Estado del formulario
    formData,
    updateField,
    updateFields,
    
    // Estado de emisión
    loading,
    error,
    success,
    documentoEmitido,
    
    // Catálogos
    tiposDocumento,
    loadingTipos,
    errorTipos,
    
    // Permisos
    puedeCrearDocumento,
    
    // Funciones
    emitir,
    resetForm,
    clearMessages,
    validarFormulario,
    cargarTiposDocumento,
  };
};

export default useEmisionDocumento;
