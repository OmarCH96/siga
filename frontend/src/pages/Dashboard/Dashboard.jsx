/**
 * Página del Dashboard principal
 * Vista principal del sistema después del login
 */

import { useAuth } from '@hooks/useAuth';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>SIGA</h1>
            <p>Sistema Integral de Gestión Administrativa</p>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.nombre?.[0]}{user?.apellidos?.[0]}
              </div>
              <div className="user-details">
                <p className="user-name">{user?.nombre} {user?.apellidos}</p>
                <p className="user-role">{user?.rol_nombre}</p>
                <p className="user-area">{user?.area_nombre}</p>
              </div>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <h3>Menú</h3>
            <ul>
              <li className="nav-item active">
                <a href="#inicio">🏠 Inicio</a>
              </li>
              <li className="nav-item">
                <a href="#documentos">📄 Documentos</a>
              </li>
              <li className="nav-item">
                <a href="#turnos">🔄 Turnos</a>
              </li>
              <li className="nav-item">
                <a href="#usuarios">👥 Usuarios</a>
              </li>
              <li className="nav-item">
                <a href="#reportes">📊 Reportes</a>
              </li>
              <li className="nav-item">
                <a href="#configuracion">⚙️ Configuración</a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="dashboard-main">
          <div className="welcome-section">
            <h2>Bienvenido, {user?.nombre}</h2>
            <p>Sistema base listo para desarrollo</p>
          </div>

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <div className="card-icon">📥</div>
              <h3>Documentos Recibidos</h3>
              <p className="card-number">0</p>
              <p className="card-subtitle">Pendientes de atender</p>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">📤</div>
              <h3>Documentos Enviados</h3>
              <p className="card-number">0</p>
              <p className="card-subtitle">En proceso</p>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">⏰</div>
              <h3>Por Vencer</h3>
              <p className="card-number">0</p>
              <p className="card-subtitle">Próximos a fecha límite</p>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">✅</div>
              <h3>Completados</h3>
              <p className="card-number">0</p>
              <p className="card-subtitle">Este mes</p>
            </div>
          </div>

          <div className="info-section">
            <div className="info-card">
              <h3>ℹ️ Información del Sistema</h3>
              <ul>
                <li><strong>Usuario:</strong> {user?.nombre_usuario}</li>
                <li><strong>Email:</strong> {user?.email}</li>
                <li><strong>Rol:</strong> {user?.rol_nombre}</li>
                <li><strong>Área:</strong> {user?.area_nombre} ({user?.area_clave})</li>
                <li><strong>Tipo de Área:</strong> {user?.area_tipo}</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>🚀 Estado del Proyecto</h3>
              <ul>
                <li>✅ Autenticación implementada</li>
                <li>✅ Conexión a base de datos</li>
                <li>✅ Sistema de permisos</li>
                <li>✅ Rutas protegidas</li>
                <li>⏳ Gestión de documentos (pendiente)</li>
                <li>⏳ Sistema de turnos (pendiente)</li>
                <li>⏳ Reportes (pendiente)</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
