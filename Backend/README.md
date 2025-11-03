# MathMaster Backend API

Backend seguro para la plataforma MathMaster con autenticación JWT y base de datos PostgreSQL.

## 🔐 Características de Seguridad

- **Autenticación JWT**: Tokens seguros con expiración configurable
- **Bcrypt**: Encriptación de contraseñas con salt rounds
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configuración de orígenes permitidos
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Express Validator**: Validación de entrada de datos
- **PostgreSQL**: Base de datos relacional robusta

## 📋 Usuarios por Defecto

Ejecuta `npm run seed` para crear los usuarios por defecto:

### 👨‍💼 ADMINISTRADOR
```
Email: admin@mathmaster.com
Contraseña: Admin123!
```

### 👩‍🏫 DOCENTE
```
Email: docente@mathmaster.com
Contraseña: Docente123!
```

### 👨‍🎓 ESTUDIANTE
```
Email: estudiante@mathmaster.com
Contraseña: Estudiante123!
```

## 🚀 Instalación y Uso

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus configuraciones

# Crear usuarios por defecto (requiere PostgreSQL corriendo)
npm run seed

# Iniciar servidor en desarrollo
npm run dev

# El servidor estará en http://localhost:3000
```

### Con Docker

```bash
# Desde la raíz del proyecto
docker-compose up --build

# Crear usuarios por defecto en el contenedor
docker exec -it mathmaster-backend npm run seed
```

## 📡 Endpoints API

### Autenticación

#### POST /api/auth/login
Login de usuario

**Request:**
```json
{
  "email": "admin@mathmaster.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@mathmaster.com",
      "firstName": "Administrador",
      "lastName": "Sistema",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET /api/auth/me
Obtener información del usuario actual (requiere autenticación)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@mathmaster.com",
      "firstName": "Administrador",
      "lastName": "Sistema",
      "role": "admin",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Health Check

#### GET /health
Verificar estado del servidor

**Response:**
```json
{
  "success": true,
  "message": "MathMaster API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🗂️ Estructura del Proyecto

```
Backend/
├── src/
│   ├── config/          # Configuraciones (DB, etc)
│   ├── controllers/     # Controladores de rutas
│   ├── middleware/      # Middleware personalizado
│   ├── models/          # Modelos de Sequelize
│   ├── routes/          # Definición de rutas
│   ├── seeders/         # Datos de prueba
│   ├── utils/           # Utilidades (JWT, etc)
│   ├── app.js           # Configuración de Express
│   └── server.js        # Punto de entrada
├── .env                 # Variables de entorno
├── .env.example         # Ejemplo de variables
├── Dockerfile           # Configuración Docker
├── package.json         # Dependencias
└── README.md            # Este archivo
```

## 🔧 Variables de Entorno

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mathmaster_db
DB_USER=mathmaster
DB_PASSWORD=mathmaster123

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📦 Dependencias Principales

- **express**: Framework web
- **sequelize**: ORM para PostgreSQL
- **bcryptjs**: Encriptación de contraseñas
- **jsonwebtoken**: Autenticación JWT
- **helmet**: Seguridad HTTP headers
- **cors**: Cross-Origin Resource Sharing
- **express-rate-limit**: Rate limiting
- **express-validator**: Validación de datos
- **morgan**: Logger HTTP
- **dotenv**: Variables de entorno

## 🛡️ Medidas de Seguridad Implementadas

1. **Contraseñas**: Hasheadas con bcrypt (10 salt rounds)
2. **JWT**: Tokens con expiración y firma secreta
3. **Rate Limiting**: Máximo 100 requests por 15 minutos
4. **CORS**: Solo orígenes permitidos
5. **Helmet**: Headers de seguridad HTTP
6. **Validación**: Todas las entradas son validadas
7. **Error Handling**: Mensajes de error genéricos en producción
8. **Non-root User**: Docker container corre con usuario no-root

## 🚀 Deploy en Railway

El backend está optimizado para Railway:

1. Railway detectará automáticamente Node.js
2. Agregará PostgreSQL automáticamente
3. Configurar las variables de entorno en Railway dashboard
4. El deploy se hace automáticamente

## 📝 Scripts Disponibles

```bash
npm start        # Producción
npm run dev      # Desarrollo con nodemon
npm run seed     # Crear usuarios por defecto
npm test         # Tests (pendiente)
```

## 🤝 Roles y Permisos

- **admin**: Acceso total al sistema
- **teacher**: Gestión de estudiantes y ejercicios
- **student**: Solo puede realizar ejercicios

## 📄 Licencia

MIT
