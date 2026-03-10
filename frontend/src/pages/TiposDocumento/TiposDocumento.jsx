/**
 * Página de Gestión de Tipos de Documento
 * Permite listar, crear, editar y administrar tipos de documento del sistema
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '@hooks/useAuth';
import useTiposDocumento from '@hooks/useTiposDocumento';
import AdminSidebar from '@components/dashboard/AdminSidebar';
import AdminTopNavbar from '@components/dashboard/AdminTopNavbar';
import Paginacion from '@components/Paginacion';

/**
 * Componente de tabla de tipos de documento
 */
const TiposDocumentoTable = ({ tiposDocumento, onEdit, onToggleStatus, onDelete, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center p-16">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700 border-t-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary animate-pulse">description</span>
          </div>
        </div>
        <p className="mt-4 text-slate-600 dark:text-slate-400 font-semibold">Cargando tipos de documento...</p>
      </div>
    );
  }

  if (!tiposDocumento || tiposDocumento.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center p-16 bg-slate-50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
        <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-500">draft</span>
        </div>
        <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No hay tipos de documento registrados</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Comienza agregando tu primer tipo de documento al sistema</p>
      </div>
    );
  }

  const getDocumentIcon = (clave) => {
    const iconMap = {
      'OFF': 'drafts',
      'CIR': 'campaign',
      'MEM': 'assignment',
      'TEC': 'analytics',
    };
    // Buscar coincidencia parcial en la clave
    const key = Object.keys(iconMap).find(k => clave?.toUpperCase().includes(k));
    return iconMap[key] || 'description';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 border-b-2 border-primary/10">
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Nombre</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Clave</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Descripción</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-center">Requiere Respuesta</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-center">Activo</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {tiposDocumento.map((tipo) => (
            <tr key={tipo.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 border-b border-slate-100 dark:border-slate-800">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-lg">{getDocumentIcon(tipo.clave)}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{tipo.nombre}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 font-mono">
                  {tipo.clave}
                </code>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                {tipo.descripcion || <span className="text-slate-400 italic">Sin descripción</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {tipo.requiere_respuesta ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    Sí
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    No
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <label className="inline-flex relative items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tipo.activo}
                    onChange={() => onToggleStatus(tipo.id, !tipo.activo)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <button
                  type="button"
                  onClick={() => onEdit(tipo)}
                  className="p-1 hover:text-primary transition-colors"
                  title="Editar"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(tipo.id)}
                  className="p-1 hover:text-red-500 transition-colors ml-2"
                  title="Eliminar"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

TiposDocumentoTable.propTypes = {
  tiposDocumento: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      nombre: PropTypes.string.isRequired,
      clave: PropTypes.string.isRequired,
      descripcion: PropTypes.string,
      requiere_respuesta: PropTypes.bool,
      activo: PropTypes.bool,
    })
  ),
  onEdit: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

TiposDocumentoTable.defaultProps = {
  tiposDocumento: [],
  loading: false,
};

/**
 * Modal para crear/editar tipo de documento
 */
const TipoDocumentoModal = ({ isOpen, onClose, onSubmit, tipoDocumento, loading }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    clave: '',
    descripcion: '',
    requiere_respuesta: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (tipoDocumento) {
      setFormData({
        nombre: tipoDocumento.nombre || '',
        clave: tipoDocumento.clave || '',
        descripcion: tipoDocumento.descripcion || '',
        requiere_respuesta: tipoDocumento.requiere_respuesta || false,
      });
    } else {
      setFormData({
        nombre: '',
        clave: '',
        descripcion: '',
        requiere_respuesta: false,
      });
    }
    setErrors({});
  }, [tipoDocumento, isOpen]);

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

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.clave.trim()) {
      newErrors.clave = 'La clave es requerida';
    } else if (formData.clave.length > 20) {
      newErrors.clave = 'La clave no puede exceder 20 caracteres';
    }

    if (formData.descripcion && formData.descripcion.length > 500) {
      newErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {tipoDocumento ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nombre del Documento *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                  errors.nombre
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                }`}
                placeholder="Ej: Oficio, Circular, Memorando"
              />
              {errors.nombre && (
                <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>
              )}
            </div>

            {/* Clave */}
            <div>
              <label htmlFor="clave" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Clave del Sistema *
              </label>
              <input
                type="text"
                id="clave"
                name="clave"
                value={formData.clave}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors font-mono ${
                  errors.clave
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                }`}
                placeholder="Ej: OFF-2024, CIR-77, MEM-INT"
                maxLength="20"
              />
              {errors.clave && (
                <p className="mt-1 text-xs text-red-500">{errors.clave}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors resize-none ${
                  errors.descripcion
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                }`}
                placeholder="Breve descripción del tipo de documento..."
                maxLength="500"
              />
              {errors.descripcion && (
                <p className="mt-1 text-xs text-red-500">{errors.descripcion}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                {formData.descripcion.length} / 500 caracteres
              </p>
            </div>

            {/* Requiere Respuesta */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <input
                type="checkbox"
                id="requiere_respuesta"
                name="requiere_respuesta"
                checked={formData.requiere_respuesta}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <label htmlFor="requiere_respuesta" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                Este tipo de documento requiere respuesta
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading}
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              {tipoDocumento ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

TipoDocumentoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  tipoDocumento: PropTypes.object,
  loading: PropTypes.bool,
};

TipoDocumentoModal.defaultProps = {
  tipoDocumento: null,
  loading: false,
};

/**
 * Componente principal de la página
 */
const TiposDocumento = () => {
  const { user, logout } = useAuth();
  const {
    tiposDocumento,
    loading,
    error,
    filters,
    total,
    totalPages,
    stats,
    createTipoDocumento,
    updateTipoDocumento,
    toggleStatus,
    deleteTipoDocumento,
    handlePageChange,
    handleFilterChange,
    clearFilters,
  } = useTiposDocumento();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActivo, setFilterActivo] = useState(undefined);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Mostrar alertas temporales
  const showAlert = (message, type = 'success') => {
    setAlertMessage({ message, type });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  // Manejar creación/edición
  const handleSubmit = async (formData) => {
    setActionLoading(true);
    try {
      if (editingTipo) {
        await updateTipoDocumento(editingTipo.id, formData);
        showAlert('Tipo de documento actualizado exitosamente', 'success');
      } else {
        await createTipoDocumento(formData);
        showAlert('Tipo de documento creado exitosamente', 'success');
      }
      setModalOpen(false);
      setEditingTipo(null);
    } catch (err) {
      console.error('Error al guardar:', err);
      showAlert(err.response?.data?.error || 'Error al guardar el tipo de documento', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir modal para edición
  const handleEdit = (tipo) => {
    setEditingTipo(tipo);
    setModalOpen(true);
  };

  // Abrir modal para crear nuevo
  const handleCreate = () => {
    setEditingTipo(null);
    setModalOpen(true);
  };

  // Cambiar estado activo
  const handleToggleStatus = async (id, activo) => {
    try {
      await toggleStatus(id, activo);
      showAlert(`Tipo de documento ${activo ? 'activado' : 'desactivado'} exitosamente`, 'success');
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      showAlert(err.response?.data?.error || 'Error al cambiar el estado', 'error');
    }
  };

  // Eliminar tipo de documento
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este tipo de documento?')) {
      return;
    }

    try {
      await deleteTipoDocumento(id);
      showAlert('Tipo de documento eliminado exitosamente', 'success');
    } catch (err) {
      console.error('Error al eliminar:', err);
      showAlert(err.response?.data?.error || 'Error al eliminar el tipo de documento', 'error');
    }
  };

  // Aplicar búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange({ search: searchQuery });
  };

  // Aplicar filtro de estado
  const handleFilterActivoChange = (value) => {
    setFilterActivo(value);
    handleFilterChange({ activo: value === 'all' ? undefined : value === 'true' });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <AdminSidebar user={user} onLogout={logout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopNavbar />

        <div className="flex-1 overflow-y-auto p-8">
          {/* Alertas */}
          {alertMessage && (
            <div className={`mb-4 p-4 rounded-lg border ${
              alertMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">
                  {alertMessage.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span className="font-semibold">{alertMessage.message}</span>
              </div>
            </div>
          )}

          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Tipos de Documento
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Configure y administre las categorías de documentación oficial
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Nuevo Tipo de Documento
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Total</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-2xl">description</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Activos</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.activos}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">check_circle</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Inactivos</p>
                  <p className="text-3xl font-bold text-slate-600 dark:text-slate-400 mt-1">{stats.inactivos}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-2xl">cancel</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Búsqueda */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre, clave o descripción..."
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </form>

              {/* Filtro de estado */}
              <select
                value={filterActivo === undefined ? 'all' : filterActivo.toString()}
                onChange={(e) => handleFilterActivoChange(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 px-4 text-sm focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">Todos los estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>

              {/* Botón limpiar filtros */}
              {(searchQuery || filterActivo !== undefined) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterActivo(undefined);
                    clearFilters();
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <TiposDocumentoTable
              tiposDocumento={tiposDocumento}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
              loading={loading}
            />

            {/* Paginación */}
            {!loading && tiposDocumento.length > 0 && (
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
                <Paginacion
                  currentPage={filters.page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  total={total}
                  pageSize={filters.limit}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      <TipoDocumentoModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTipo(null);
        }}
        onSubmit={handleSubmit}
        tipoDocumento={editingTipo}
        loading={actionLoading}
      />
    </div>
  );
};

export default TiposDocumento;
