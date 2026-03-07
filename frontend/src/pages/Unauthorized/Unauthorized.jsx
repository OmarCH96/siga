/**
 * Página de acceso no autorizado
 * Se muestra cuando el usuario no tiene permisos suficientes.
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

const Unauthorized = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: '0 0 12px', color: '#0f172a' }}>Acceso No Autorizado</h1>
        <p style={{ margin: '0 0 24px', color: '#475569' }}>
          Este usuario no tiene permisos para entrar al dashboard administrativo.
        </p>

        {user?.nombre_usuario && (
          <p style={{ margin: '0 0 24px', color: '#334155' }}>
            Usuario actual: <strong>{user.nombre_usuario}</strong>
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/login"
            style={{
              textDecoration: 'none',
              background: '#2563eb',
              color: '#ffffff',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 600,
            }}
          >
            Volver a Login
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
            }}
          >
            Cerrar Sesion
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
