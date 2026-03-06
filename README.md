# Sistema Integral de Gestión Administrativa (SIGA)

Sistema de gestión de documentos administrativos para la **Secretaría de Medio Ambiente, Desarrollo Sustentable y Ordenamiento Territorial**.

Aplicación de escritorio desarrollada con **React**, **Tauri** y **Node.js**, con backend en **Express** y base de datos **PostgreSQL**.

---

## 🚀 Características Principales

✅ **Sistema Completo de Autenticación**
- Login seguro con JWT
- Hash de contraseñas con bcrypt
- Almacenamiento seguro de tokens (compatible con Tauri)
- Control de sesiones

✅ **Arquitectura Limpia y Escalable**
- Backend con arquitectura en capas (Controller → Service → Repository)
- Frontend con React + Zustand para estado global
- Código modular y bien documentado

✅ **Seguridad Implementada**
- Helmet para headers de seguridad
- CORS configurado
- Rate limiting en endpoints críticos
- Validación de datos en backend y frontend
- Sistema de permisos basado en roles

✅ **Base de Datos PostgreSQL**
- Schema completo incluido
- Datos de prueba para desarrollo
- Script de inicialización automatizada

✅ **Preparado para Firma Electrónica**
- Módulo base con node-forge
- Estructura preparada para integración futura
- Soporte para certificados PKCS#12

---

## 📋 Stack Tecnológico

### Frontend
- **React 18** - UI Library
- **Vite 5** - Build tool
- **React Router** - Navegación
- **Zustand** - Estado global
- **Axios** - Cliente HTTP
- **Tauri 1.5+** - Empaquetado para escritorio

### Backend
- **Node.js 18+** - Runtime
- **Express 4** - Framework web
- **PostgreSQL 13+** - Base de datos
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas
- **Helmet** - Seguridad HTTP
- **CORS** - Control de acceso
- **express-rate-limit** - Rate limiting
- **multer** - Upload de archivos
- **node-forge** - Firma electrónica (preparado)

---

## 📂 Estructura del Proyecto

```
SIGA/
├── backend/                    # API REST Node.js/Express
│   ├── src/
│   │   ├── config/            # Configuración y DB
│   │   ├── controllers/       # Controladores
│   │   ├── middlewares/       # Middlewares (auth, validate, error)
│   │   ├── repositories/      # Capa de datos
│   │   ├── routes/            # Definición de rutas
│   │   ├── services/          # Lógica de negocio
│   │   │   └── signature.service.js  # Preparado para firma
│   │   └── utils/             # Utilidades
│   ├── .env.example
│   └── package.json
│
├── frontend/                   # Aplicación React + Tauri
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/             # Páginas
│   │   │   ├── Login/
│   │   │   └── Dashboard/
│   │   ├── services/          # Servicios API
│   │   │   ├── api.js         # Cliente Axios
│   │   │   └── auth.service.js
│   │   ├── store/             # Estado global (Zustand)
│   │   │   └── authStore.js
│   │   ├── hooks/             # Hooks personalizados
│   │   │   └── useAuth.js
│   │   ├── utils/             # Utilidades
│   │   │   └── secureStorage.js  # Compatible con Tauri
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── src-tauri/             # Configuración Tauri
│   ├── .env.example
│   └── package.json
│
├── scripts/                    # Scripts de utilidad
│   └── init-db.js             # Inicialización de BD
│
├── schema_database_postgresql.sql      # Schema de BD
├── datos_prueba_postgresql_v2.sql     # Datos de prueba
├── README.md                  # Este archivo
└── INSTALL.md                 # Guía de instalación detallada
```

---

## 🔧 Instalación Rápida

### Requisitos Previos
- Node.js 18+
- PostgreSQL 13+
- Rust (solo para build de Tauri)

### Pasos

1. **Instalar dependencias**
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

2. **Configurar entorno**
```bash
# Backend
cd backend
copy .env.example .env
# Editar .env con tus configuraciones de PostgreSQL

# Frontend
cd ../frontend
copy .env.example .env
```

3. **Inicializar base de datos**
```bash
npm run db:init
```

4. **Ejecutar en desarrollo**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**📖 Para instrucciones detalladas, consulta [INSTALL.md](./INSTALL.md)**

---

## 🧪 Usuarios de Prueba

El sistema incluye usuarios precargados:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `jperez` | `password` | Administrador |
| `mgonzalez` | `password` | Secretario |
| `cmartinez` | `password` | Secretario |

---

## 🔐 Características de Seguridad

- ✅ **Hash de contraseñas** con bcrypt (salt rounds: 10)
- ✅ **JWT** con expiración configurable
- ✅ **Rate limiting** en endpoints de autenticación
- ✅ **Validación** de datos en backend y frontend
- ✅ **Headers de seguridad** con Helmet
- ✅ **CORS** configurado
- ✅ **Almacenamiento seguro** compatible con Tauri
- ✅ **Control de permisos** basado en roles

---

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/register` - Registro (solo admin)
- `GET /api/auth/me` - Perfil del usuario
- `GET /api/auth/verify` - Verificar token

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `GET /api/usuarios/:id` - Obtener usuario
- `GET /api/usuarios/area/:areaId` - Usuarios por área
- `PATCH /api/usuarios/:id/status` - Activar/desactivar

---

## 📦 Scripts Disponibles

### Proyecto Raíz
```bash
npm run db:init          # Inicializar base de datos
npm run install:all      # Instalar todas las dependencias
npm run dev:backend      # Ejecutar backend
npm run dev:frontend     # Ejecutar frontend
```

### Backend
```bash
npm run dev              # Desarrollo con nodemon
npm start                # Producción
```

### Frontend
```bash
npm run dev              # Desarrollo con Vite
npm run build            # Build de producción
npm run tauri:dev        # Desarrollo con Tauri
npm run tauri:build      # Build de aplicación de escritorio
```

---

## 🏗️ Próximas Implementaciones

El sistema está listo como base. Se pueden implementar:

- 📄 Gestión completa de documentos
- 🔄 Sistema de turnos entre áreas
- 📊 Reportes y estadísticas
- 🔍 Búsqueda avanzada de documentos
- 📎 Gestión de archivos adjuntos
- ✍️ Firma electrónica completa
- 📧 Notificaciones por email
- 📱 Notificaciones push
- 🗂️ Archivo digital
- 🔐 Autenticación de dos factores

---

## 🐛 Solución de Problemas

### Error de conexión a base de datos
- Verificar que PostgreSQL esté corriendo
- Revisar credenciales en `backend/.env`
- Verificar que la base de datos existe

### Error de CORS
- Verificar que `CORS_ORIGIN` en backend coincida con la URL del frontend

### Puerto en uso
- Cambiar `PORT` en `backend/.env`
- Actualizar `VITE_API_URL` en `frontend/.env`

---

## 📞 Soporte y Documentación

- **Instalación Detallada**: Ver [INSTALL.md](./INSTALL.md)
- **Arquitectura Backend**: Ver comentarios en código
- **Troubleshooting**: Ver sección en INSTALL.md

---

## 📄 Licencia

Uso gubernamental - Secretaría de Medio Ambiente, Desarrollo Sustentable y Ordenamiento Territorial

---

## ✅ Estado del Proyecto

- ✅ **Autenticación completa**
- ✅ **Base de datos configurada**
- ✅ **Backend funcional**
- ✅ **Frontend con rutas protegidas**
- ✅ **Sistema de permisos**
- ✅ **Almacenamiento seguro**
- ✅ **Módulo de firma preparado**
- ✅ **Listo para desarrollo**

**🎉 Proyecto listo para comenzar desarrollo inmediato**
