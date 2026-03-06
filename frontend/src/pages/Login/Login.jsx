/**
 * Página de Login
 * Formulario de autenticación de usuarios con diseño moderno
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    nombreUsuario: '',
    contraseña: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Limpiar error al desmontar
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombreUsuario || !formData.contraseña) {
      return;
    }

    const result = await login(formData.nombreUsuario, formData.contraseña);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="bg-pattern min-h-screen flex flex-col font-display">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Login Card */}
        <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Card Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800 text-center">
            <div className="flex justify-center mb-4 text-primary">
              <span className="material-symbols-outlined text-5xl">eco</span>
            </div>
            <h1 className="text-slate-900 dark:text-slate-100 text-sm font-bold uppercase tracking-wider mb-2 leading-tight">
              Secretaría de Medio Ambiente, Desarrollo Sustentable y Ordenamiento Territorial
            </h1>
            <div className="h-px w-12 bg-primary mx-auto my-3"></div>
            <h2 className="text-primary text-xl font-bold leading-tight">
              Sistema Integral de Gestión Administrativa
            </h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* User Field */}
            <div className="flex flex-col gap-2">
              <label 
                htmlFor="nombreUsuario" 
                className="text-slate-700 dark:text-slate-300 text-sm font-semibold"
              >
                Usuario
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-slate-400">
                  person
                </span>
                <input
                  id="nombreUsuario"
                  name="nombreUsuario"
                  type="text"
                  value={formData.nombreUsuario}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  placeholder="Ingrese su nombre de usuario"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label 
                htmlFor="contraseña" 
                className="text-slate-700 dark:text-slate-300 text-sm font-semibold"
              >
                Contraseña
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-slate-400">
                  lock
                </span>
                <input
                  id="contraseña"
                  name="contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.contraseña}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  placeholder="Ingrese su contraseña"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:cursor-not-allowed"
                  disabled={isLoading}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
                  disabled={isLoading}
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  Recordarme
                </span>
              </label>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              >
                ¿Olvidó su contraseña?
              </button>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
              disabled={isLoading || !formData.nombreUsuario || !formData.contraseña}
            >
              <span>{isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}</span>
              {!isLoading && (
                <span className="material-symbols-outlined text-lg">login</span>
              )}
              {isLoading && (
                <div className="spinner-small"></div>
              )}
            </button>
          </form>

          {/* Card Footer */}
          <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            </div>
          </div>
        </div>

        {/* External Footer */}
        <footer className="mt-8 text-center space-y-1">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-widest">
            Versión 1.0.0 | 2026 | Gobierno del Estado
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-[10px]">
            Todos los derechos reservados. Política de privacidad y términos de uso.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
