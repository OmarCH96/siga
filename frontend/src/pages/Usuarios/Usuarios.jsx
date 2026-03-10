/**
 * Página de Gestión de Usuarios
 * Permite listar, crear y administrar usuarios del sistema
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '@hooks/useAuth';
import useUsuarios from '@hooks/useUsuarios';
import { getInitials } from '@utils/dataFormatters';
import AdminSidebar from '@components/dashboard/AdminSidebar';
import AdminTopNavbar from '@components/dashboard/AdminTopNavbar';
import Paginacion from '@components/Paginacion';



/**
 * Componente de tabla de usuarios
 */
const UsuariosTable = ({ usuarios, onEdit, onToggleStatus, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center p-16">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700 border-t-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary animate-pulse">group</span>
          </div>
        </div>
        <p className="mt-4 text-slate-600 dark:text-slate-400 font-semibold">Cargando usuarios...</p>
      </div>
    );
  }

  if (!usuarios || usuarios.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center p-16 bg-slate-50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
        <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-500">group_off</span>
        </div>
        <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No hay usuarios registrados</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Comienza agregando tu primer usuario al sistema</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 border-b-2 border-primary/10">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Nombre</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Área</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Rol</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Estatus</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 border-b border-slate-100 dark:border-slate-800">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-sm font-bold text-white shadow-md">
                      {getInitials(usuario.nombre, usuario.apellidos)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                        {usuario.nombre} {usuario.apellidos}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{usuario.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {usuario.area_nombre || <span className="text-slate-400 italic">Sin área</span>}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-primary to-primary/80 text-white shadow-sm">
                    {usuario.rol_nombre || 'Sin rol'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {usuario.activo ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    {/* Botón Editar */}
                    <button
                      type="button"
                      onClick={() => onEdit(usuario)}
                      className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Editar usuario"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                    
                    {/* Botón Toggle Status */}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(usuario.id, !usuario.activo)}
                      className={`group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                        usuario.activo 
                          ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' 
                          : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400'
                      }`}
                      title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {usuario.activo ? 'toggle_on' : 'toggle_off'}
                      </span>
                      <span className="hidden sm:inline">
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
};

UsuariosTable.propTypes = {
  usuarios: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEdit: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

/**
 * Componente de drawer para crear/editar usuario
 */
const UsuarioDrawer = ({ isOpen, onClose, onSave, areas, roles, usuarioToEdit = null }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    nombreUsuario: '',
    contraseña: '',
    areaId: '',
    rolId: '',
    telefono: '',
    celular: '',
    activo: true,
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEditMode = !!usuarioToEdit;

  // Cargar datos del usuario cuando se abre en modo edición
  useEffect(() => {
    if (isOpen && usuarioToEdit) {
      setFormData({
        nombre: usuarioToEdit.nombre || '',
        apellidos: usuarioToEdit.apellidos || '',
        email: usuarioToEdit.email || '',
        nombreUsuario: usuarioToEdit.nombre_usuario || '',
        contraseña: '', // No cargamos la contraseña por seguridad
        areaId: usuarioToEdit.area_id || '',
        rolId: usuarioToEdit.rol_id || '',
        telefono: usuarioToEdit.telefono || '',
        celular: usuarioToEdit.celular || '',
        activo: usuarioToEdit.activo !== undefined ? usuarioToEdit.activo : true,
      });
    } else if (isOpen && !usuarioToEdit) {
      // Reset form for creation mode
      setFormData({
        nombre: '',
        apellidos: '',
        email: '',
        nombreUsuario: '',
        contraseña: '',
        areaId: '',
        rolId: '',
        telefono: '',
        celular: '',
        activo: true,
      });
    }
    setErrors({});
  }, [isOpen, usuarioToEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'Nombre requerido';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Apellidos requeridos';
    if (!formData.email.trim()) newErrors.email = 'Email requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Username solo es requerido en modo creación
    if (!isEditMode) {
      if (!formData.nombreUsuario.trim()) newErrors.nombreUsuario = 'Nombre de usuario requerido';
      else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.nombreUsuario)) {
        newErrors.nombreUsuario = 'Nombre de usuario inválido (3-20 caracteres, solo letras, números y _)';
      }
    }
    
    // Contraseña solo es requerida en modo creación
    if (!isEditMode) {
      if (!formData.contraseña.trim()) newErrors.contraseña = 'Contraseña requerida';
      else if (formData.contraseña.length < 8) {
        newErrors.contraseña = 'Contraseña debe tener al menos 8 caracteres';
      }
    }
    
    if (!formData.areaId) newErrors.areaId = 'Área requerida';
    if (!formData.rolId) newErrors.rolId = 'Rol requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const result = await onSave(formData);

      if (result.success) {
        // Resetear formulario
        setFormData({
          nombre: '',
          apellidos: '',
          email: '',
          nombreUsuario: '',
          contraseña: '',
          areaId: '',
          rolId: '',
          telefono: '',
          celular: '',
          activo: true,
        });
        setErrors({});
        onClose();
      } else {
        // Mostrar error del servidor
        setErrors({ general: result.error });
      }
    } catch (err) {
      setErrors({ general: 'Error al guardar usuario' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      email: '',
      nombreUsuario: '',
      contraseña: '',
      areaId: '',
      rolId: '',
      telefono: '',
      celular: '',
      activo: true,
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-end animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l-2 border-primary/20 animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b-2 border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-2xl text-white">
                {isEditMode ? 'edit' : 'person_add'}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                {isEditMode ? 'Actualice la información del usuario' : 'Complete la información del usuario'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-2.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
            title="Cerrar"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Error general */}
          {errors.general && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-l-4 border-red-500 rounded-xl p-5 text-red-800 dark:text-red-200 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">error</span>
                <p className="font-semibold text-base">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Datos Personales */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">person</span>
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">Datos Personales</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>Nombre(s)</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 rounded-xl text-base font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${errors.nombre ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  placeholder="Ej. Juan Manuel"
                />
                {errors.nombre && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errors.nombre}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>Apellidos</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 rounded-xl text-base font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${errors.apellidos ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  placeholder="Ej. Pérez García"
                />
                {errors.apellidos && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errors.apellidos}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Credenciales */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">lock</span>
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">Credenciales</h4>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>Email Corporativo</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 rounded-xl text-base font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${errors.email ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  placeholder="usuario@empresa.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Nombre de Usuario</span>
                    {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="nombreUsuario"
                    value={formData.nombreUsuario}
                    onChange={handleChange}
                    readOnly={isEditMode}
                    disabled={isEditMode}
                    className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 rounded-xl text-base font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                      isEditMode ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900' : ''
                    } ${
                      errors.nombreUsuario ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-slate-700'
                    }`}
                    placeholder="usuario123"
                  />
                  {errors.nombreUsuario && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {errors.nombreUsuario}
                    </p>
                  )}
                  {isEditMode && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">info</span>
                      El nombre de usuario no se puede cambiar
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>{isEditMode ? 'Nueva Contraseña' : 'Contraseña Temporal'}</span>
                    {!isEditMode && <span className="text-red-500">*</span>}
                    {isEditMode && <span className="text-xs font-normal text-slate-500">(opcional)</span>}
                  </label>
                  <input
                    type="password"
                    name="contraseña"
                    value={formData.contraseña}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 rounded-xl text-base font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                      errors.contraseña ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-slate-700'
                    }`}
                    placeholder={isEditMode ? 'Dejar en blanco para mantener la actual' : 'Min. 8 caracteres'}
                  />
                  {errors.contraseña && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {errors.contraseña}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Contacto */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">phone</span>
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">Contacto</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">call</span>
                  <span>Teléfono Fijo</span>
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-base font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">smartphone</span>
                  <span>Móvil</span>
                </label>
                <input
                  type="tel"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-base font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </section>

          {/* Área y Rol */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">badge</span>
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">Asignación</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>Área</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="areaId"
                    value={formData.areaId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 rounded-xl text-base font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none ${errors.areaId ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <option value="">Seleccione un área</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nombre}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
                {errors.areaId && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errors.areaId}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>Rol</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="rolId"
                    value={formData.rolId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 rounded-xl text-base font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none ${errors.rolId ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <option value="">Seleccione un rol</option>
                    {roles.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
                {errors.rolId && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errors.rolId}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Estado */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="w-6 h-6 text-primary border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary cursor-pointer"
                />
              </div>
              <div>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                  Usuario Activo
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Los usuarios inactivos no podrán acceder al sistema
                </p>
              </div>
            </label>
          </section>
        </form>

        {/* Footer */}
        <div className="p-6 border-t-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-end gap-4 shadow-lg">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-8 py-3 rounded-xl text-base font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-10 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {saving ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">
                  {isEditMode ? 'save' : 'add_circle'}
                </span>
                <span>{isEditMode ? 'Actualizar Usuario' : 'Crear Usuario'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

UsuarioDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  areas: PropTypes.arrayOf(PropTypes.object).isRequired,
  roles: PropTypes.arrayOf(PropTypes.object).isRequired,
  usuarioToEdit: PropTypes.object,
};

/**
 * Página principal de gestión de usuarios
 */
const Usuarios = () => {
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  const {
    usuarios,
    areas,
    roles,
    loading,
    error,
    filters,
    total,
    totalPages,
    stats,
    createUsuario,
    updateUsuario,
    updateUsuarioStatus,
    changePage,
    updateSearch,
    updateFilters,
    clearError,
  } = useUsuarios();

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearch(localSearchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearchTerm, updateSearch]);

  const handleOpenDrawer = () => {
    setSelectedUsuario(null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedUsuario(null);
  };

  const handleSaveUsuario = async (usuarioData) => {
    if (selectedUsuario) {
      // Modo edición
      const result = await updateUsuario(selectedUsuario.id, usuarioData);
      return result;
    } else {
      // Modo creación
      const result = await createUsuario(usuarioData);
      return result;
    }
  };

  const handleEditUsuario = (usuario) => {
    setSelectedUsuario(usuario);
    setIsDrawerOpen(true);
  };

  const handleToggleStatus = async (id, activo) => {
    if (window.confirm(`¿Está seguro de ${activo ? 'activar' : 'desactivar'} este usuario?`)) {
      await updateUsuarioStatus(id, activo);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <AdminSidebar user={user} onLogout={logout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopNavbar
          searchTerm={localSearchTerm}
          onSearchChange={setLocalSearchTerm}
          selectedUnitName="Gestión de Usuarios"
          searchPlaceholder="Buscar usuarios por nombre, email o área..."
        />

        <div className="flex-1 overflow-auto p-8">
          {/* Header con estadísticas */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-2">
                  Gestión de Usuarios
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-base">
                  Administra los accesos y perfiles de los empleados de la organización
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenDrawer}
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white px-6 py-3.5 rounded-xl text-base font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 hover:scale-105"
              >
                <span className="material-symbols-outlined text-2xl">person_add</span>
                <span>Nuevo Usuario</span>
                <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
              </button>
            </div>
            
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Total Usuarios</p>
                    <p className="text-3xl font-black text-blue-900 dark:text-blue-100">{stats.total}</p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">group</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-5 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">Activos</p>
                    <p className="text-3xl font-black text-green-900 dark:text-green-100">
                      {stats.activos}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400">check_circle</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Inactivos</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                      {stats.inactivos}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-slate-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-slate-600 dark:text-slate-400">cancel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros y controles */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Filtros por área y rol */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Área:
                  </label>
                  <select
                    value={filters.areaId || ''}
                    onChange={(e) => updateFilters({ areaId: e.target.value ? parseInt(e.target.value) : undefined, page: 1 })}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  >
                    <option value="">Todas las áreas</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Rol:
                  </label>
                  <select
                    value={filters.rolId || ''}
                    onChange={(e) => updateFilters({ rolId: e.target.value ? parseInt(e.target.value) : undefined, page: 1 })}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  >
                    <option value="">Todos los roles</option>
                    {roles.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Estado:
                  </label>
                  <select
                    value={filters.activo === undefined ? '' : filters.activo ? 'true' : 'false'}
                    onChange={(e) => updateFilters({ activo: e.target.value === '' ? undefined : e.target.value === 'true', page: 1 })}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  >
                    <option value="">Todos</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                  </select>
                </div>
              </div>

              {/* Control de registros por página */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mostrar:
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => updateFilters({ limit: parseInt(e.target.value), page: 1 })}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-sm text-slate-600 dark:text-slate-400">registros</span>
              </div>
            </div>
          </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-l-4 border-red-500 rounded-lg p-5 flex items-start justify-between shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">error</span>
            </div>
            <div>
              <p className="font-bold text-red-800 dark:text-red-200 text-base mb-1">Error al cargar datos</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors p-1"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <UsuariosTable
          usuarios={usuarios}
          onEdit={handleEditUsuario}
          onToggleStatus={handleToggleStatus}
          loading={loading}
        />
        
        {/* Paginación */}
        {!loading && total > 0 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
            <Paginacion
              currentPage={filters.page}
              totalPages={totalPages}
              onPageChange={changePage}
              total={total}
              pageSize={filters.limit}
            />
          </div>
        )}
      </div>

      {/* Drawer */}
      <UsuarioDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSave={handleSaveUsuario}
        areas={areas}
        roles={roles}
        usuarioToEdit={selectedUsuario}
      />
        </div>
      </main>
    </div>
  );
};

export default Usuarios;
