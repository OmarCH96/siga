import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const UnitModal = ({ isOpen, onClose, onSubmit, editingUnit, availableUnits }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    dependencia: '',
    tipo_area: '',
  });

  useEffect(() => {
    if (editingUnit) {
      setFormData({
        nombre: editingUnit.name,
        codigo: editingUnit.code,
        dependencia: editingUnit.parent || '',
        tipo_area: '',
      });
    } else {
      setFormData({
        nombre: '',
        codigo: '',
        dependencia: '',
        tipo_area: '',
      });
    }
  }, [editingUnit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      codigo: '',
      dependencia: '',
      tipo_area: '',
    });
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-background-dark rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">account_tree</span>
              </div>
              <h3 className="text-xl font-bold">
                {editingUnit ? 'Editar Unidad Administrativa' : 'Nueva Unidad Administrativa'}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2">
              Nombre de la Unidad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="Ej: Dirección de Recursos Humanos"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Dependencia Superior</label>
            <select
              name="dependencia"
              value={formData.dependencia}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="">Ninguna (Unidad principal)</option>
              {availableUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Tipo de Area</label>
            <select
              name="tipo_area"
              value={formData.tipo_area}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="">Ninguna (Tipo de area)</option>
              <option value="1">Oficialía</option>
              <option value="2">Secretaría</option>
              <option value="3">Secretaría Particular</option>
              <option value="4">Subsecretaría</option>
              <option value="5">Instituto</option>
              <option value="6">Dirección</option>
              <option value="7">Dirección General</option>
              <option value="8">Subdirección</option>
              <option value="9">Coordinación</option>
              <option value="10">Departamento</option>
              <option value="11">Unidad</option>
              <option value="12">Comité</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">
              Código/Determinante <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="Ej: DRH-001"
              required
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Código único que identifica a la unidad administrativa
            </p>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              <span>{editingUnit ? 'Guardar Cambios' : 'Crear Unidad'}</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

UnitModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  editingUnit: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    code: PropTypes.string,
    parent: PropTypes.number,
  }),
  availableUnits: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default UnitModal;
