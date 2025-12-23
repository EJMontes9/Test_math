# MathMaster - Plataforma de Ejercicios Matemáticos

Una aplicación web moderna y visual para practicar operaciones combinadas y ecuaciones matemáticas con gestión de paralelos y estudiantes.

## 🚀 Características

- **Sistema de Roles**: Admin, Profesores y Estudiantes
- **Gestión de Paralelos**: Organización de cursos y estudiantes
- **Login Visual y Atractivo**: Interfaz moderna con animaciones fluidas
- **Operaciones Combinadas**: Practica operaciones matemáticas complejas
- **Ecuaciones**: Resuelve ecuaciones paso a paso
- **Dashboard Interactivo**: Estadísticas y métricas en tiempo real
- **Responsive Design**: Funciona en todos los dispositivos
- **API REST**: Backend completo con FastAPI

## 🛠️ Tecnologías

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Estilos modernos y responsivos
- **Framer Motion** - Animaciones fluidas
- **React Router** - Navegación
- **Lucide React** - Iconos modernos
- **Axios** - Cliente HTTP

### Backend
- **FastAPI** - Framework Python moderno y rápido
- **SQLAlchemy** - ORM para PostgreSQL
- **Pydantic** - Validación de datos
- **JWT** - Autenticación segura
- **Bcrypt** - Encriptación de contraseñas
- **Uvicorn** - Servidor ASGI de alto rendimiento

### Base de Datos
- **PostgreSQL 16** - Base de datos relacional

### Infraestructura
- **Docker** - Contenedores
- **Docker Compose** - Orquestación de servicios
- **Nginx** - Servidor web optimizado

## 📦 Instalación y Ejecución

### Con Docker (Recomendado)

```bash
# Clonar el repositorio
git clone <tu-repo>
cd Test_math

# Levantar todos los servicios
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# La aplicación estará disponible en:
# - Frontend (Docker): http://localhost:8080
# - Backend API: http://localhost:3000
# - Documentación API: http://localhost:3000/docs
```

### Desarrollo Local

#### Frontend
```bash
cd Frontend
npm install
npm run dev
# Disponible en http://localhost:5173
```

#### Backend
```bash
cd Backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 3000
# Disponible en http://localhost:3000
```


## Creación de usuarios por defecto
```bash
docker-compose exec backend python create_sample_data.py
```

## 🔐 Credenciales de Acceso

Ver archivo `CREDENCIALES.md` para usuarios de prueba.

**Credenciales rápidas**:
- Admin: `admin@mathmaster.com` / `admin123`
- Profesor: `profesor@mathmaster.com` / `profesor123`

## 📁 Estructura del Proyecto

```
Test_math/
├── Frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   │   └── layout/      # Layouts (Admin, Teacher)
│   │   ├── pages/           # Páginas de la aplicación
│   │   │   ├── Login.jsx    # Página de login
│   │   │   ├── admin/       # Páginas de administrador
│   │   │   └── teacher/     # Páginas de profesor
│   │   ├── services/        # Servicios API
│   │   ├── context/         # Contextos React
│   │   └── utils/           # Utilidades
│   ├── Dockerfile           # Configuración Docker
│   └── package.json         # Dependencias
├── Backend/                  # API FastAPI
│   ├── app/
│   │   ├── routers/         # Endpoints de la API
│   │   ├── models/          # Modelos de base de datos
│   │   ├── schemas/         # Esquemas Pydantic
│   │   ├── auth.py          # Autenticación JWT
│   │   ├── database.py      # Configuración DB
│   │   └── main.py          # Punto de entrada
│   ├── Dockerfile           # Configuración Docker
│   └── requirements.txt     # Dependencias Python
├── docker-compose.yml       # Orquestación de servicios
└── README.md                # Este archivo
```

## 🎨 Características Visuales

- **Gradientes Modernos**: Colores vibrantes de azul a púrpura
- **Glassmorphism**: Efecto de vidrio esmerilado en las tarjetas
- **Animaciones de Entrada**: Transiciones suaves al cargar
- **Iconos Flotantes**: Elementos matemáticos animados en el fondo
- **Hover Effects**: Interacciones visuales al pasar el mouse
- **Loading States**: Indicadores de carga animados
- **Sidebar Responsivo**: Navegación adaptable

## 🔜 Próximas Características

- [ ] Módulo de Operaciones Combinadas completo
- [ ] Módulo de Ecuaciones completo
- [ ] Sistema de puntuación y ranking
- [ ] Historial de ejercicios
- [ ] Reportes y analytics
- [ ] Sistema de metas (versus)
- [ ] Notificaciones en tiempo real

## 📝 Scripts Disponibles

### Frontend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview de la build
```

### Backend
```bash
uvicorn app.main:app --reload  # Servidor de desarrollo
```

### Docker
```bash
docker-compose up -d           # Inicia todos los servicios
docker-compose down            # Detiene todos los servicios
docker-compose logs -f         # Ver logs en tiempo real
docker-compose restart backend # Reiniciar servicio específico
```

## 🔧 Variables de Entorno

Ver `.env.example` para la lista completa. Las principales son:

```env
# Frontend
VITE_API_URL=http://localhost:3000/api

# Backend
PORT=3000
DB_HOST=db
DB_PORT=5432
DB_NAME=mathmaster_db
DB_USER=mathmaster
DB_PASSWORD=mathmaster123
JWT_SECRET=mathmaster-super-secret-jwt-key-2024
JWT_EXPIRES_IN=7
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👤 Autor

Desarrollado con ❤️ para mejorar el aprendizaje de matemáticas
