# MathMaster - Plataforma de Ejercicios Matemáticos

Una aplicación web moderna y visual para practicar operaciones combinadas y ecuaciones matemáticas.

## 🚀 Características

- **Login Visual y Atractivo**: Interfaz moderna con animaciones fluidas
- **Operaciones Combinadas**: Practica operaciones matemáticas complejas
- **Ecuaciones**: Resuelve ecuaciones paso a paso
- **Responsive Design**: Funciona en todos los dispositivos
- **Animaciones Suaves**: Usando Framer Motion para una mejor experiencia

## 🛠️ Tecnologías

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Estilos modernos y responsivos
- **Framer Motion** - Animaciones fluidas
- **React Router** - Navegación
- **Lucide React** - Iconos modernos

### Infraestructura
- **Docker** - Contenedores
- **Nginx** - Servidor web optimizado
- **Railway** - Deployment en la nube

## 📦 Instalación y Ejecución

### Con Docker (Recomendado)

```bash
# Clonar el repositorio
git clone <tu-repo>
cd Test_math

# Levantar los servicios
docker-compose up --build

# La aplicación estará disponible en http://localhost:8080
```

### Desarrollo Local

```bash
# Instalar dependencias del frontend
cd Frontend
npm install

# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:5173
```

## 🚢 Deployment en Railway

1. Conecta tu repositorio a Railway
2. Railway detectará automáticamente el `railway.json`
3. Las variables de entorno se configuran en el dashboard de Railway
4. El deployment se hace automáticamente

### Variables de Entorno Necesarias

Ver `.env.example` para la lista completa de variables.

## 📁 Estructura del Proyecto

```
Test_math/
├── Frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas de la aplicación
│   │   │   └── Login.jsx    # Página de login
│   │   ├── assets/          # Recursos estáticos
│   │   ├── App.jsx          # Componente principal
│   │   └── main.jsx         # Punto de entrada
│   ├── Dockerfile           # Configuración Docker
│   ├── nginx.conf           # Configuración Nginx
│   └── package.json         # Dependencias
├── Backend/                  # API Backend (próximamente)
├── docker-compose.yml       # Orquestación de servicios
├── railway.json             # Configuración Railway
└── README.md                # Este archivo
```

## 🎨 Características Visuales

- **Gradientes Modernos**: Colores vibrantes de azul a púrpura
- **Glassmorphism**: Efecto de vidrio esmerilado en las tarjetas
- **Animaciones de Entrada**: Transiciones suaves al cargar
- **Iconos Flotantes**: Elementos matemáticos animados en el fondo
- **Hover Effects**: Interacciones visuales al pasar el mouse
- **Loading States**: Indicadores de carga animados

## 🔜 Próximas Características

- [ ] Dashboard principal
- [ ] Módulo de Operaciones Combinadas
- [ ] Módulo de Ecuaciones
- [ ] Sistema de puntuación
- [ ] Historial de ejercicios
- [ ] Perfil de usuario
- [ ] Backend con API REST
- [ ] Base de datos PostgreSQL

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Construye para producción
npm run preview      # Preview de la build

# Docker
docker-compose up    # Inicia todos los servicios
docker-compose down  # Detiene todos los servicios
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
