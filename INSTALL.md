# INSTRUCCIONES DE INSTALACIÓN Y EJECUCIÓN - SIGA

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalados:

### Obligatorios
- **Node.js 18+**: [https://nodejs.org/](https://nodejs.org/)
- **PostgreSQL 13+**: [https://www.postgresql.org/download/](https://www.postgresql.org/download/)

### Para Build de Tauri (Opcional)
- **Rust**: [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)
- **Visual Studio C++ Build Tools** (Windows)

---

## 🚀 Instalación Paso a Paso

### 1. Instalar Dependencias

Desde la raíz del proyecto:

```bash
npm install
```

Esto instalará las dependencias del proyecto raíz.

Luego, instala las dependencias del backend y frontend:

```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 2. Configurar PostgreSQL

#### Crear usuario y establecer contraseña (si es necesario)

```sql
-- Abre psql o pgAdmin y ejecuta:
ALTER USER postgres WITH PASSWORD 'tu_password';
```

#### Anotar las credenciales

- Host: `localhost`
- Puerto: `5432`
- Usuario: `postgres`
- Contraseña: La que estableciste
- Base de datos: `gestordocumental` (se creará automáticamente)

### 3. Configurar Variables de Entorno

#### Backend

```bash
cd backend
copy .env.example .env
```

Edita el archivo `.env` y configura:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestordocumental
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
JWT_SECRET=genera_un_secreto_seguro_aqui
```

**💡 Generar JWT_SECRET seguro:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Frontend

```bash
cd frontend
copy .env.example .env
```

El archivo `.env` del frontend debe contener:

```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Inicializar Base de Datos

Desde la **raíz del proyecto**:

```bash
npm run db:init
```

Este comando:
- Crea la base de datos `gestordocumental`
- Ejecuta el schema SQL
- Carga los datos de prueba

**⚠️ Nota:** Si la base de datos ya existe, te preguntará si deseas recrearla.

---

## ▶️ Ejecución en Desarrollo

### Opción 1: Ejecutar Backend y Frontend por Separado

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

El servidor estará en: `http://localhost:3000`

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

La aplicación estará en: `http://localhost:5173`

### Opción 2: Desde la Raíz

```bash
# Backend
npm run dev:backend

# Frontend (en otra terminal)
npm run dev:frontend
```

---

## 🧪 Probar el Sistema

### Usuarios de Prueba

El sistema incluye datos de prueba. Puedes iniciar sesión con:

**Usuario Administrador:**
- Usuario: `jperez`
- Contraseña: `password` (el hash en la BD es para `password`)

**Usuario Secretario:**
- Usuario: `mgonzalez`
- Contraseña: `password`

### Endpoints de Prueba

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"nombreUsuario\":\"jperez\",\"contraseña\":\"password\"}"
```

---

## 📦 Build de Producción

### Backend

```bash
cd backend
npm start
```

### Frontend (Web)

```bash
cd frontend
npm run build
npm run preview
```

### Build de Tauri (Aplicación de Escritorio)

**Requisitos adicionales:**
- Rust instalado
- Visual Studio C++ Build Tools

```bash
cd frontend
npm run tauri build
```

El instalador se generará en: `frontend/src-tauri/target/release/bundle/`

---

## 🔧 Comandos Útiles

### PostgreSQL

```bash
# Conectar a PostgreSQL
psql -U postgres

# Conectar a la base de datos SIGA
psql -U postgres -d gestordocumental

# Backup
pg_dump -U postgres gestordocumental > backup.sql

# Restore
psql -U postgres -d gestordocumental < backup.sql
```

### Ver logs del servidor

Los logs se muestran en la consola donde ejecutaste `npm run dev`.

---

## 🐛 Solución de Problemas

### Error: "no pg_hba.conf entry"

Edita `pg_hba.conf` (usualmente en `C:\Program Files\PostgreSQL\XX\data\`) y agrega:

```
host    all             all             127.0.0.1/32            md5
```

Reinicia PostgreSQL.

### Error: "Puerto 3000 ya en uso"

Cambia el puerto en `backend/.env`:

```env
PORT=3001
```

Y actualiza `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

### Error de CORS

Verifica que `CORS_ORIGIN` en `backend/.env` coincida con la URL del frontend:

```env
CORS_ORIGIN=http://localhost:5173
```

### Problemas con Tauri

Asegúrate de tener Rust instalado:

```bash
rustc --version
```

Si no está instalado: [https://rustup.rs/](https://rustup.rs/)

---

## 📚 Estructura del Proyecto

```
SIGA/
├── backend/              # API REST Node.js/Express
│   ├── src/
│   │   ├── config/      # Configuración
│   │   ├── controllers/ # Controladores
│   │   ├── middlewares/ # Middlewares
│   │   ├── repositories/# Repositorios
│   │   ├── routes/      # Rutas
│   │   ├── services/    # Servicios
│   │   └── utils/       # Utilidades
│   └── package.json
├── frontend/             # Aplicación React + Tauri
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas
│   │   ├── services/    # Servicios API
│   │   ├── store/       # Estado global (Zustand)
│   │   └── utils/       # Utilidades
│   └── package.json
├── scripts/              # Scripts de inicialización
└── README.md
```

---

## 🔐 Seguridad

- Las contraseñas se hashean con bcrypt
- Autenticación JWT
- Rate limiting en endpoints críticos
- Validación de datos en backend y frontend
- Headers de seguridad con Helmet
- CORS configurado

---

## 📞 Soporte

Para problemas o preguntas técnicas, contacta al equipo de desarrollo.

---

## ✅ Lista de Verificación de Instalación

- [ ] Node.js instalado
- [ ] PostgreSQL instalado y funcionando
- [ ] Dependencias instaladas (`npm install` en raíz, backend y frontend)
- [ ] Archivo `.env` configurado en backend
- [ ] Archivo `.env` configurado en frontend
- [ ] Base de datos inicializada (`npm run db:init`)
- [ ] Backend funcionando en puerto 3000
- [ ] Frontend funcionando en puerto 5173
- [ ] Login exitoso con usuario de prueba

---

**¡Listo para comenzar el desarrollo! 🎉**
