# Documento Técnico — MathMaster

**Versión:** 2.0.0
**Fecha:** Marzo 2026
**Tipo de sistema:** Plataforma educativa gamificada de matemáticas

---

## Tabla de Contenidos

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Base de Datos — Modelo de Datos](#5-base-de-datos--modelo-de-datos)
6. [Backend — API FastAPI](#6-backend--api-fastapi)
7. [Frontend — React](#7-frontend--react)
8. [Sistema de Autenticación y Roles](#8-sistema-de-autenticación-y-roles)
9. [Lógica de Negocio Principal](#9-lógica-de-negocio-principal)
10. [Infraestructura y Despliegue](#10-infraestructura-y-despliegue)
11. [Variables de Entorno](#11-variables-de-entorno)
12. [Credenciales por Defecto](#12-credenciales-por-defecto)
13. [Flujos Principales del Sistema](#13-flujos-principales-del-sistema)

---

## 1. Visión General del Sistema

**MathMaster** es una plataforma educativa gamificada diseñada para la enseñanza de matemáticas en entornos escolares. El sistema permite a profesores gestionar clases (paralelos), asignar metas y competencias, mientras que los estudiantes practican matemáticas a través de un sistema de juego con puntos, insignias y rankings.

### Roles del sistema

| Rol | Descripción |
|-----|-------------|
| **Admin** | Gestiona usuarios, paralelos, configuración global del sistema |
| **Profesor (Teacher)** | Crea ejercicios, metas, competencias, ve el progreso de sus estudiantes |
| **Estudiante (Student)** | Juega ejercicios, ve su progreso, participa en competencias |

### Características clave

- Ejercicios matemáticos generados dinámicamente y adaptativos por dificultad
- Sistema de puntuación con bonificaciones y penalizaciones
- Insignias (badges) por logros
- Competencias (Versus) entre paralelos
- Metas educativas asignables por el profesor
- Ranking de estudiantes
- Recursos educativos (PDFs, videos, links)
- Reportes en PDF generados desde el backend
- Recuperación de contraseña por correo electrónico

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Backend** | FastAPI (Python) | 0.115.0 |
| **Servidor ASGI** | Uvicorn | 0.32.0 |
| **ORM** | SQLAlchemy | 2.0.35 |
| **Base de Datos** | PostgreSQL | 16 (Alpine) |
| **Autenticación** | JWT — python-jose | 3.3.0 |
| **Cifrado** | bcrypt — passlib | 1.7.4 |
| **Migraciones** | Alembic | 1.13.3 |
| **Rate Limiting** | SlowAPI | 0.1.9 |
| **PDF Generation** | ReportLab | 4.2.5 |
| **Frontend** | React | 19.1.1 |
| **Bundler** | Vite | 7.1.7 |
| **Routing** | React Router DOM | 7.9.5 |
| **HTTP Client** | Axios | 1.13.1 |
| **Estilos** | Tailwind CSS | 4.1.16 |
| **Animaciones** | Framer Motion | 12.23.24 |
| **Iconos** | Lucide React | 0.552.0 |
| **Contenedorización** | Docker + Docker Compose | — |

---

## 3. Arquitectura del Sistema

```mermaid
graph TB
    subgraph Cliente["Cliente (Browser)"]
        FE["Frontend React + Vite<br/>Puerto 8080"]
    end

    subgraph Servidor["Servidor Docker"]
        BE["Backend FastAPI<br/>Puerto 3000"]
        DB["PostgreSQL 16<br/>Puerto 5432 (interno)<br/>5433 (externo)"]
        ST["Archivos Estáticos<br/>/static/avatars<br/>/uploads"]
    end

    FE -- "HTTP REST / JSON<br/>Bearer JWT" --> BE
    BE -- "SQLAlchemy ORM<br/>psycopg2" --> DB
    BE -- "Archivos" --> ST
    FE -- "GET /api/files/*" --> ST

    style Cliente fill:#dbeafe,stroke:#3b82f6
    style Servidor fill:#dcfce7,stroke:#16a34a
```

### Comunicación entre capas

```mermaid
sequenceDiagram
    participant Browser
    participant React
    participant Axios
    participant FastAPI
    participant SQLAlchemy
    participant PostgreSQL

    Browser->>React: Interacción de usuario
    React->>Axios: Llamada a servicio (ej: studentService.js)
    Axios->>Axios: Añade header Authorization: Bearer JWT
    Axios->>FastAPI: HTTP Request (GET/POST/PUT/DELETE)
    FastAPI->>FastAPI: Middleware CORS + Seguridad
    FastAPI->>FastAPI: Validación JWT → get_current_user()
    FastAPI->>SQLAlchemy: Query (db.query(Model).filter(...))
    SQLAlchemy->>PostgreSQL: SQL
    PostgreSQL-->>SQLAlchemy: Resultado
    SQLAlchemy-->>FastAPI: Objeto ORM
    FastAPI-->>Axios: JSON Response
    Axios-->>React: Datos
    React-->>Browser: Re-render UI
```

---

## 4. Estructura del Proyecto

```
Test_math/
├── Backend/                        # API REST en Python/FastAPI
│   ├── app/
│   │   ├── main.py                 # Punto de entrada, middlewares, rutas
│   │   ├── config.py               # Variables de entorno (Pydantic Settings)
│   │   ├── database.py             # Conexión SQLAlchemy a PostgreSQL
│   │   ├── models.py               # Modelos ORM (15 tablas)
│   │   ├── schemas.py              # Esquemas Pydantic (validación entrada/salida)
│   │   ├── auth.py                 # JWT, bcrypt, middleware de roles
│   │   ├── exercise_generator.py   # Generador dinámico de ejercicios
│   │   ├── ai_recommendations.py   # Recomendaciones de ejercicios
│   │   ├── routers/
│   │   │   ├── auth.py             # /api/auth — login, logout, perfil
│   │   │   ├── users.py            # /api/users — CRUD usuarios (admin)
│   │   │   ├── paralelos.py        # /api/paralelos — CRUD paralelos (admin)
│   │   │   ├── teacher.py          # /api/teacher — funciones de profesor
│   │   │   ├── student.py          # /api/student — juego y progreso
│   │   │   ├── badges.py           # /api/badges — insignias
│   │   │   └── settings.py         # /api/settings — config del sistema
│   │   └── services/
│   │       └── email_service.py    # Envío de emails SMTP (Gmail)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── create_admin.py             # Script: crear usuario admin inicial
│   ├── create_badges.py            # Script: cargar insignias iniciales
│   ├── create_settings.py          # Script: cargar configuración inicial
│   └── reset_passwords.py          # Script: resetear contraseñas
│
├── Frontend/                       # SPA en React + Vite
│   ├── src/
│   │   ├── App.jsx                 # Raíz: Router, Providers, Rutas
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Estado global de autenticación
│   │   │   └── SettingsContext.jsx # Configuración global del sistema
│   │   ├── services/
│   │   │   ├── api.js              # Instancia Axios + interceptor JWT
│   │   │   ├── authService.js      # login, logout, perfil, cambio de contraseña
│   │   │   ├── studentService.js   # dashboard, juego, progreso, ranking
│   │   │   ├── teacherService.js   # paralelos, metas, competencias, reportes
│   │   │   ├── paraleloService.js  # CRUD paralelos
│   │   │   ├── userService.js      # CRUD usuarios
│   │   │   ├── badgeService.js     # insignias
│   │   │   ├── resourceService.js  # recursos educativos
│   │   │   └── settingService.js   # configuración del sistema
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   ├── TeacherLayout.jsx
│   │   │   │   └── StudentLayout.jsx
│   │   │   └── modals/             # Componentes modales reutilizables
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── ForgotPassword.jsx
│   │       ├── Profile.jsx
│   │       ├── AboutUs.jsx
│   │       ├── admin/
│   │       │   ├── Dashboard.jsx
│   │       │   ├── Users.jsx
│   │       │   ├── Paralelos.jsx
│   │       │   └── Settings.jsx
│   │       ├── teacher/
│   │       │   ├── Dashboard.jsx
│   │       │   ├── MyParalelos.jsx
│   │       │   ├── ParaleloStudents.jsx
│   │       │   ├── StudentDetail.jsx
│   │       │   ├── Goals.jsx
│   │       │   ├── Versus.jsx
│   │       │   ├── TeacherRanking.jsx
│   │       │   ├── Resources.jsx
│   │       │   ├── Performance.jsx
│   │       │   ├── Reports.jsx
│   │       │   └── Badges.jsx
│   │       └── student/
│   │           ├── Dashboard.jsx
│   │           ├── Game.jsx
│   │           ├── Ranking.jsx
│   │           ├── Goals.jsx
│   │           ├── Challenges.jsx
│   │           ├── Badges.jsx
│   │           └── Resources.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── docker-compose.yml              # Orquestación de los 3 servicios
├── .env.example                    # Plantilla de variables de entorno
├── DOCUMENTO_TECNICO.md            # Este documento
└── COMO_PROBAR.md                  # Guía de pruebas
```

---

## 5. Base de Datos — Modelo de Datos

### Diagrama Entidad-Relación

```mermaid
erDiagram
    users {
        UUID id PK
        string email
        string password
        string first_name
        string last_name
        enum role "admin|teacher|student"
        string avatar
        string reset_token
        datetime reset_token_expires
        boolean is_active
        datetime created_at
    }

    paralelos {
        UUID id PK
        string name
        string level
        UUID teacher_id FK
        int student_count
        boolean is_active
        text description
    }

    enrollments {
        UUID id PK
        UUID student_id FK
        UUID paralelo_id FK
        datetime enrolled_at
        boolean is_active
    }

    exercises {
        UUID id PK
        UUID paralelo_id FK
        string title
        text question
        enum exercise_type "multiple_choice|true_false|fill_blank|numeric"
        enum difficulty "easy|medium|hard"
        enum topic "operations|fractions|etc"
        text correct_answer
        text options
        int points
        int time_limit
        boolean is_practice
    }

    exercise_attempts {
        UUID id PK
        UUID exercise_id FK
        UUID student_id FK
        UUID game_session_id FK
        text student_answer
        boolean is_correct
        int time_taken
        int points_earned
        int points_lost
    }

    game_sessions {
        UUID id PK
        UUID student_id FK
        UUID paralelo_id FK
        int total_score
        int exercises_completed
        int correct_answers
        int wrong_answers
        datetime started_at
        datetime ended_at
        boolean is_active
    }

    student_topic_progress {
        UUID id PK
        UUID student_id FK
        enum topic
        int total_attempts
        int correct_attempts
        int wrong_attempts
        int mastery_level "0-100"
        boolean needs_improvement
        datetime last_practiced
    }

    goals {
        UUID id PK
        UUID teacher_id FK
        UUID paralelo_id FK
        string title
        enum goal_type "exercises|accuracy|points|streak|topic_mastery"
        int target_value
        enum topic
        int reward_points
        UUID badge_id FK
        datetime start_date
        datetime end_date
    }

    student_goals {
        UUID id PK
        UUID goal_id FK
        UUID student_id FK
        int current_value
        enum status "active|completed|expired|cancelled"
        datetime completed_at
        int points_earned
    }

    challenges {
        UUID id PK
        UUID teacher_id FK
        UUID paralelo1_id FK
        UUID paralelo2_id FK
        string title
        enum topic
        enum difficulty
        int num_exercises
        int time_limit
        enum status "pending|active|completed|cancelled"
        UUID winner_paralelo_id FK
        int paralelo1_score
        int paralelo2_score
    }

    challenge_participants {
        UUID id PK
        UUID challenge_id FK
        UUID student_id FK
        UUID paralelo_id FK
        int score
        int exercises_completed
        boolean has_finished
    }

    badges {
        UUID id PK
        UUID teacher_id FK
        string name
        string icon
        enum category "achievement|streak|mastery|social|special"
        string requirement
        int requirement_value
        int points
    }

    student_badges {
        UUID id PK
        UUID badge_id FK
        UUID student_id FK
        boolean is_equipped
        datetime earned_at
    }

    resources {
        UUID id PK
        UUID teacher_id FK
        UUID paralelo_id FK
        string title
        string url
        enum resource_type "pdf|video|link"
        enum topic
        int view_count
    }

    settings {
        UUID id PK
        string key
        text value
        enum type "string|number|boolean|json"
        string category
        text description
    }

    users ||--o{ paralelos : "enseña"
    users ||--o{ enrollments : "inscrito_en"
    paralelos ||--o{ enrollments : "tiene"
    paralelos ||--o{ exercises : "tiene"
    exercises ||--o{ exercise_attempts : "tiene"
    users ||--o{ exercise_attempts : "intenta"
    game_sessions ||--o{ exercise_attempts : "contiene"
    users ||--o{ game_sessions : "juega"
    paralelos ||--o{ game_sessions : "contexto"
    users ||--o{ student_topic_progress : "tiene"
    users ||--o{ goals : "crea"
    goals ||--o{ student_goals : "asignado_a"
    users ||--o{ student_goals : "tiene"
    users ||--o{ challenges : "crea"
    paralelos ||--o{ challenges : "compite_en"
    challenges ||--o{ challenge_participants : "tiene"
    users ||--o{ challenge_participants : "participa"
    badges ||--o{ student_badges : "ganado_en"
    users ||--o{ student_badges : "tiene"
    users ||--o{ resources : "crea"
```

### Descripción de cada tabla

| Tabla | Descripción |
|-------|-------------|
| `users` | Todos los usuarios del sistema con su rol (admin/teacher/student) |
| `paralelos` | Clases/grupos escolares asignados a un profesor |
| `enrollments` | Relación muchos-a-muchos entre estudiantes y paralelos |
| `exercises` | Ejercicios matemáticos (pueden ser creados por profesor o generados dinámicamente) |
| `exercise_attempts` | Registro de cada intento de un estudiante en un ejercicio |
| `game_sessions` | Sesión de juego de un estudiante (agrupa múltiples intentos) |
| `student_topic_progress` | Progreso de dominio de cada tema matemático por estudiante |
| `goals` | Metas educativas creadas por el profesor |
| `student_goals` | Asignación y seguimiento de metas por estudiante |
| `challenges` | Competencias entre dos paralelos |
| `challenge_participants` | Participación individual de estudiantes en competencias |
| `badges` | Catálogo de insignias (sistema o creadas por profesor) |
| `student_badges` | Insignias ganadas por cada estudiante |
| `resources` | Material educativo (PDF, video, enlace) |
| `settings` | Configuración global del sistema (clave-valor) |

---

## 6. Backend — API FastAPI

### Punto de entrada: `Backend/app/main.py`

Este archivo:
1. Crea la instancia de FastAPI con título, versión y configuración de Swagger
2. Configura middleware CORS (permisivo en desarrollo, restrictivo en producción)
3. Agrega headers de seguridad HTTP en cada respuesta
4. Habilita rate limiting solo en producción (100 req / 15 min por IP)
5. Registra todos los routers bajo el prefijo `/api/...`
6. Monta archivos estáticos en `/static` y `/api/files`

### Mapa de Endpoints

```mermaid
graph LR
    API["/api"]

    API --> AUTH["/auth"]
    AUTH --> A1["POST /login"]
    AUTH --> A2["POST /logout"]
    AUTH --> A3["GET /me"]
    AUTH --> A4["POST /forgot-password"]
    AUTH --> A5["POST /reset-password"]
    AUTH --> A6["POST /change-password"]
    AUTH --> A7["PUT /profile"]
    AUTH --> A8["POST /upload-avatar"]
    AUTH --> A9["DELETE /avatar"]

    API --> USERS["/users ⚙️ admin"]
    USERS --> U1["GET / — Listar usuarios"]
    USERS --> U2["POST / — Crear usuario"]
    USERS --> U3["GET /{id}"]
    USERS --> U4["PUT /{id}"]
    USERS --> U5["DELETE /{id}"]
    USERS --> U6["GET /stats"]

    API --> PAR["/paralelos ⚙️ admin"]
    PAR --> P1["GET / — Listar"]
    PAR --> P2["POST / — Crear"]
    PAR --> P3["GET /{id}"]
    PAR --> P4["PUT /{id}"]
    PAR --> P5["DELETE /{id}"]
    PAR --> P6["POST /{id}/assign-students"]
    PAR --> P7["GET /{id}/students"]

    API --> TEACH["/teacher 🎓 teacher"]
    TEACH --> T1["GET /my-paralelos"]
    TEACH --> T2["GET /paralelo/{id}/students"]
    TEACH --> T3["GET /student/{id}/progress"]
    TEACH --> T4["POST/PUT/DELETE /goals"]
    TEACH --> T5["POST/GET/PUT /challenges"]
    TEACH --> T6["POST /exercise"]
    TEACH --> T7["GET /performance"]
    TEACH --> T8["POST /generate-report"]

    API --> STU["/student 🎮 student"]
    STU --> S1["GET /dashboard"]
    STU --> S2["POST /start-game"]
    STU --> S3["POST /submit-answer"]
    STU --> S4["GET /game-session/{id}"]
    STU --> S5["POST /end-game"]
    STU --> S6["GET /my-progress"]
    STU --> S7["GET /my-goals"]
    STU --> S8["GET /topic-progress"]
    STU --> S9["GET /badges"]
    STU --> S10["GET /ranking"]

    API --> BADG["/badges"]
    API --> SET["/settings ⚙️ admin"]
```

### Archivos del Backend y su responsabilidad

| Archivo | Responsabilidad |
|---------|----------------|
| `main.py` | Punto de entrada, middlewares, montaje de rutas |
| `config.py` | Lee variables de entorno usando Pydantic Settings |
| `database.py` | Crea engine SQLAlchemy, session factory, `get_db()` dependency |
| `models.py` | Define las 15 tablas con sus relaciones ORM |
| `schemas.py` | Define los esquemas Pydantic para request/response de cada endpoint |
| `auth.py` | `verify_password`, `get_password_hash`, `create_access_token`, `get_current_user`, `require_role` |
| `exercise_generator.py` | Clase `ExerciseGenerator` — genera ejercicios dinámicamente por tema y dificultad |
| `ai_recommendations.py` | Lógica de recomendaciones basada en historial del estudiante |
| `routers/auth.py` | Endpoints de autenticación y gestión de perfil |
| `routers/users.py` | CRUD completo de usuarios (solo admin) |
| `routers/paralelos.py` | CRUD de paralelos, asignación de estudiantes |
| `routers/teacher.py` | Toda la funcionalidad del rol profesor |
| `routers/student.py` | Toda la funcionalidad del rol estudiante (juego, progreso) |
| `routers/badges.py` | CRUD de insignias |
| `routers/settings.py` | Configuración del sistema |
| `services/email_service.py` | Envío de emails vía SMTP (Gmail) para recuperación de contraseña |

---

## 7. Frontend — React

### Contextos globales

```mermaid
graph TD
    APP["App.jsx"]
    AUTH["AuthContext.jsx<br/>(estado del usuario autenticado)"]
    SET["SettingsContext.jsx<br/>(configuración del sistema)"]
    ROUTER["React Router DOM<br/>(navegación)"]

    APP --> AUTH
    AUTH --> SET
    SET --> ROUTER
    ROUTER --> PAGES["Páginas y Layouts"]
```

**`AuthContext.jsx`** — Mantiene:
- El usuario actual (`user`)
- El token JWT
- Funciones: `login()`, `logout()`, `updateUser()`
- Persiste en `localStorage`

**`SettingsContext.jsx`** — Mantiene:
- Configuración general del sistema (obtenida del API `/api/settings`)
- Nombre de la plataforma, colores, etc.

### Servicios del Frontend (`src/services/`)

Todos los servicios importan la instancia de Axios (`api.js`) que ya incluye el token JWT en cada petición.

| Servicio | Endpoints que consume |
|---------|----------------------|
| `authService.js` | `/api/auth/*` |
| `studentService.js` | `/api/student/*` |
| `teacherService.js` | `/api/teacher/*` |
| `paraleloService.js` | `/api/paralelos/*` |
| `userService.js` | `/api/users/*` |
| `badgeService.js` | `/api/badges/*` |
| `resourceService.js` | `/api/teacher/resources/*` |
| `settingService.js` | `/api/settings/*` |

### Rutas del Frontend

```mermaid
graph TD
    ROOT["/"]
    LOGIN["/login"]
    FORGOT["/forgot-password"]

    ROOT --> LOGIN

    ADMIN["/admin/*<br/>AdminLayout"]
    ADMIN --> AD["/admin/dashboard"]
    ADMIN --> AU["/admin/users"]
    ADMIN --> AP["/admin/paralelos"]
    ADMIN --> AS["/admin/settings"]

    TEACHER["/teacher/*<br/>TeacherLayout"]
    TEACHER --> TD["/teacher/dashboard"]
    TEACHER --> TM["/teacher/paralelos"]
    TEACHER --> TS["/teacher/paralelo/:id/students"]
    TEACHER --> TSD["/teacher/student/:id"]
    TEACHER --> TG["/teacher/goals"]
    TEACHER --> TV["/teacher/versus"]
    TEACHER --> TR["/teacher/ranking"]
    TEACHER --> TRE["/teacher/resources"]
    TEACHER --> TP["/teacher/performance"]
    TEACHER --> TRP["/teacher/reports"]
    TEACHER --> TB["/teacher/badges"]

    STUDENT["/student/*<br/>StudentLayout"]
    STUDENT --> SGD["/student/dashboard"]
    STUDENT --> SGG["/student/game"]
    STUDENT --> SGR["/student/ranking"]
    STUDENT --> SGO["/student/goals"]
    STUDENT --> SGC["/student/challenges"]
    STUDENT --> SGB["/student/badges"]
    STUDENT --> SGRS["/student/resources"]
```

### Layouts por rol

Cada rol tiene su propio layout wrapper que:
- Verifica que el usuario esté autenticado y tenga el rol correcto
- Renderiza la barra de navegación lateral específica del rol
- Renderiza la página activa dentro del `<Outlet />`

---

## 8. Sistema de Autenticación y Roles

### Flujo de autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant FE as Frontend
    participant API as FastAPI /auth/login
    participant DB as PostgreSQL

    U->>FE: Ingresa email + contraseña
    FE->>API: POST /api/auth/login { email, password }
    API->>DB: SELECT * FROM users WHERE email = ?
    DB-->>API: User record
    API->>API: bcrypt.verify(password, user.password)
    alt Contraseña válida
        API->>API: create_access_token({ sub: email })
        API-->>FE: { token: "jwt...", user: {...} }
        FE->>FE: localStorage.setItem('token', jwt)
        FE->>FE: AuthContext.setUser(user)
        FE->>U: Redirige según rol (/admin | /teacher | /student)
    else Contraseña inválida
        API-->>FE: 401 Unauthorized
        FE->>U: Muestra error
    end
```

### Protección de endpoints en el backend

```python
# auth.py — Middleware de roles
def require_role(required_role: UserRole):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role and current_user.role != UserRole.admin:
            raise HTTPException(403, "No tienes permisos")
        return current_user
    return role_checker
```

El rol `admin` tiene acceso a todos los endpoints. El rol `teacher` solo accede a `/api/teacher/*` y el rol `student` solo a `/api/student/*`.

### Token JWT

- **Algoritmo:** HS256
- **Expiración:** 7 días (configurable con `JWT_EXPIRES_IN`)
- **Payload:** `{ sub: email, exp: timestamp }`
- **Reset de contraseña:** Token separado con expiración de 1 hora

---

## 9. Lógica de Negocio Principal

### 9.1 Generador de Ejercicios (`exercise_generator.py`)

La clase `ExerciseGenerator` genera ejercicios matemáticos en tiempo de ejecución sin necesitar almacenarlos en la base de datos.

```mermaid
flowchart TD
    START["generate_exercise(topic, difficulty, score)"]
    ADJ["_adjust_difficulty_by_score()"]
    SCORE{"score?"}

    START --> ADJ
    ADJ --> SCORE
    SCORE -- "< 100" --> EASY["Fuerza easy"]
    SCORE -- "100-299" --> ORIG["Usa dificultad original"]
    SCORE -- "300-599" --> UP["Sube un nivel"]
    SCORE -- ">= 600" --> HARD["Fuerza hard"]

    GEN{"Tema seleccionado"}
    EASY --> GEN
    ORIG --> GEN
    UP --> GEN
    HARD --> GEN

    GEN -- "operations" --> BO["_generate_basic_operations()"]
    GEN -- "combined_operations" --> CO["_generate_combined_operations()"]
    GEN -- "linear_equations" --> LE["_generate_linear_equation()"]
    GEN -- "quadratic_equations" --> QE["_generate_quadratic_equation()"]
    GEN -- "fractions" --> FR["_generate_fractions()"]
    GEN -- "percentages" --> PC["_generate_percentages()"]

    BO & CO & LE & QE & FR & PC --> RESULT["Dict con: title, question,<br/>correct_answer, options, explanation"]
```

**Temas matemáticos disponibles:**

| Tema | Descripción |
|------|-------------|
| `operations` | Operaciones básicas: +, -, ×, ÷ |
| `combined_operations` | Operaciones con múltiples pasos y paréntesis |
| `linear_equations` | Ecuaciones lineales (ax + b = c, etc.) |
| `quadratic_equations` | Ecuaciones cuadráticas (x² + bx + c = 0) |
| `fractions` | Suma, multiplicación y división de fracciones |
| `percentages` | Cálculo de porcentajes |

### 9.2 Sistema de Puntuación

```mermaid
flowchart LR
    ANSWER{"¿Respuesta correcta?"}

    BASE["Puntos base por dificultad:<br/>Easy → 10 pts<br/>Medium → 20 pts<br/>Hard → 35 pts"]

    ANSWER -- "SI" --> SPEED{"time_taken < 30s?"}
    SPEED -- "SI" --> BONUS_SPEED["+ 5 pts de bonus"]
    SPEED -- "NO" --> BONUS_SCORE

    BONUS_SPEED --> BONUS_SCORE{"score > 200?"}
    BONUS_SCORE -- "200-499" --> M1["× 1.15"]
    BONUS_SCORE -- ">= 500" --> M2["× 1.30"]
    BONUS_SCORE -- "< 200" --> EARN["Guardar en<br/>points_earned"]

    M1 & M2 --> EARN

    ANSWER -- "NO" --> PEN["Penalización = 40% del valor"]
    PEN --> PEN_SCORE{"score > 200?"}
    PEN_SCORE -- "200-499" --> P1["× 1.2"]
    PEN_SCORE -- ">= 500" --> P2["× 1.5"]
    PEN_SCORE -- "< 200" --> LOSE["Guardar en<br/>points_lost"]
    P1 & P2 --> LOSE
```

### 9.3 Flujo de una sesión de juego del estudiante

```mermaid
sequenceDiagram
    participant S as Estudiante
    participant FE as Frontend Game.jsx
    participant API as API /student

    S->>FE: Selecciona tema y dificultad
    FE->>API: POST /start-game { paralelo_id, topic, difficulty }
    API->>API: Crea GameSession en BD
    API->>API: ExerciseGenerator.generate_exercise()
    API-->>FE: { session_id, exercise: {...} }

    loop Por cada ejercicio
        FE->>S: Muestra pregunta y opciones
        S->>FE: Selecciona respuesta
        FE->>API: POST /submit-answer { session_id, exercise_id, answer, time_taken }
        API->>API: Compara respuesta con correct_answer
        API->>API: calculate_points() → points_earned, points_lost
        API->>API: Actualiza GameSession.total_score
        API->>API: Actualiza StudentTopicProgress.mastery_level
        API->>API: Verifica StudentGoals → actualiza progreso
        API->>API: ExerciseGenerator.generate_exercise() (siguiente)
        API-->>FE: { is_correct, points, next_exercise }
        FE->>S: Muestra resultado y confeti si correcto
    end

    S->>FE: Termina juego
    FE->>API: POST /end-game { session_id }
    API->>API: Marca GameSession como inactiva
    API-->>FE: Resumen de la sesión
    FE->>S: Muestra estadísticas finales
```

### 9.4 Sistema de Metas (Goals)

```mermaid
flowchart TD
    PROF["Profesor crea meta"]
    TIPOS{"Tipo de meta"}

    PROF --> TIPOS
    TIPOS --> E["exercises<br/>Completar N ejercicios"]
    TIPOS --> A["accuracy<br/>Alcanzar N% de precisión"]
    TIPOS --> P["points<br/>Ganar N puntos"]
    TIPOS --> ST["streak<br/>Racha de N días"]
    TIPOS --> TM["topic_mastery<br/>Dominar tema al N%"]

    E & A & P & ST & TM --> ASSIGN["Asignar a estudiantes del paralelo<br/>(StudentGoal por cada estudiante)"]
    ASSIGN --> TRACK["Sistema actualiza current_value<br/>en cada submit-answer"]
    TRACK --> CHECK{"current_value >= target_value?"}
    CHECK -- "SI" --> COMPLETE["status = completed<br/>Otorgar reward_points<br/>Asignar badge si aplica"]
    CHECK -- "NO" --> TRACK
```

### 9.5 Sistema de Competencias (Versus)

```mermaid
flowchart TD
    PROF["Profesor crea Challenge<br/>selecciona 2 paralelos"]
    CFG["Configura: tema, dificultad,<br/>N° ejercicios, tiempo límite"]
    PROF --> CFG

    CFG --> ACTIVE["status = active<br/>Estudiantes de ambos paralelos<br/>pueden participar"]

    ACTIVE --> P1["Estudiantes Paralelo 1<br/>juegan ejercicios específicos<br/>del challenge"]
    ACTIVE --> P2["Estudiantes Paralelo 2<br/>juegan ejercicios específicos<br/>del challenge"]

    P1 --> SCORE1["paralelo1_score += puntos individuales"]
    P2 --> SCORE2["paralelo2_score += puntos individuales"]

    SCORE1 & SCORE2 --> END["Profesor cierra challenge<br/>o tiempo límite cumplido"]
    END --> WINNER{"¿Quién tiene más puntos?"}
    WINNER --> WP["winner_paralelo_id asignado<br/>status = completed"]
```

### 9.6 Seguimiento de Progreso por Tema

Cada vez que un estudiante responde un ejercicio, el backend actualiza `StudentTopicProgress`:

```python
mastery_level = (correct_attempts / total_attempts) * 100  # 0-100
needs_improvement = mastery_level < 50
```

Esto permite al profesor ver en la vista de rendimiento qué temas necesitan refuerzo para cada estudiante.

---

## 10. Infraestructura y Despliegue

### Docker Compose — 3 servicios

```mermaid
graph LR
    subgraph RED["mathmaster-network (bridge)"]
        FE["Frontend<br/>React + Vite<br/>:8080"]
        BE["Backend<br/>FastAPI + Uvicorn<br/>:3000"]
        DB["PostgreSQL 16<br/>:5432 (interno)<br/>:5433 (externo)"]
    end

    USR["Usuario"]
    FE_VOL["uploads_data<br/>(PDFs)"]
    DB_VOL["postgres_data<br/>(datos persistentes)"]

    USR --> FE
    FE --> BE
    BE --> DB
    BE --> FE_VOL
    DB --> DB_VOL
```

### Servicios Docker

| Servicio | Container | Puerto | Imagen |
|----------|-----------|--------|--------|
| `db` | `mathmaster-db` | 5433:5432 | postgres:16-alpine |
| `backend` | `mathmaster-backend` | 3000:3000 | Python 3 (Dockerfile) |
| `frontend` | `mathmaster-frontend` | 8080:8080 | Node (Dockerfile) |

### Health Checks

Todos los servicios tienen health checks configurados:
- **DB:** `pg_isready -U mathmaster` (cada 10s)
- **Backend:** Llama a `http://localhost:3000/health` (cada 30s)
- **Frontend:** Llama a `http://localhost:8080/health` (cada 30s)

El backend espera a que la DB esté healthy antes de iniciarse (`depends_on: condition: service_healthy`).

### URLs de acceso (desarrollo local)

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/docs |
| Health Check | http://localhost:3000/health |
| PostgreSQL | localhost:5433 |

### Producción (Railway)

- Frontend: `https://steadfast-generosity-production.up.railway.app`
- El Swagger UI se desactiva en producción (`docs_url=None`)
- CORS solo permite orígenes configurados
- Rate limiting activo

---

## 11. Variables de Entorno

### Backend (`.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_HOST` | Host de PostgreSQL | `db` (Docker) / `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la BD | `mathmaster_db` |
| `DB_USER` | Usuario de la BD | `mathmaster` |
| `DB_PASSWORD` | Contraseña de la BD | `mathmaster123` |
| `JWT_SECRET` | Clave secreta para firmar JWT | clave larga y segura |
| `JWT_ALGORITHM` | Algoritmo JWT | `HS256` |
| `JWT_EXPIRES_IN` | Días de expiración del token | `7` |
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno | `development` / `production` |
| `CORS_ORIGINS` | Orígenes permitidos | `http://localhost:8080,...` |
| `SMTP_HOST` | Servidor de correo | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Cuenta de correo | `tu@gmail.com` |
| `SMTP_PASSWORD` | Contraseña de aplicación | generada en Google |
| `FRONTEND_URL` | URL del frontend (para emails) | `http://localhost:8080` |

### Frontend (`.env` / variables Vite)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base de la API | `http://localhost:3000/api` |

---

## 12. Credenciales por Defecto

> **Nota:** Estas credenciales se crean mediante los scripts de inicialización (`create_admin.py`).

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | `admin@mathmaster.com` | `Admin123!` |
| Profesor | `docente@mathmaster.com` | `Docente123!` |
| Estudiante 1 | `estudiante@mathmaster.com` | `Estudiante123!` |
| Estudiante 2-5 | `estudiante2-5@mathmaster.com` | `Estudiante123!` |

---

## 13. Flujos Principales del Sistema

### Flujo completo de un nuevo usuario

```mermaid
flowchart TD
    ADMIN["Admin crea usuario<br/>POST /api/users"]
    ASSIGN["Admin asigna al paralelo<br/>POST /api/paralelos/{id}/assign-students"]
    LOGIN["Usuario hace login<br/>POST /api/auth/login"]
    JWT["Recibe JWT token"]
    ROLE{"¿Cuál es su rol?"}

    ADMIN --> ASSIGN --> LOGIN --> JWT --> ROLE

    ROLE -- "admin" --> DASH_A["/admin/dashboard<br/>Estadísticas globales"]
    ROLE -- "teacher" --> DASH_T["/teacher/dashboard<br/>Mis paralelos, actividad reciente"]
    ROLE -- "student" --> DASH_S["/student/dashboard<br/>Mi progreso, metas activas"]
```

### Flujo de recuperación de contraseña

```mermaid
sequenceDiagram
    participant U as Usuario
    participant FE as ForgotPassword.jsx
    participant API as /api/auth
    participant EMAIL as Gmail SMTP

    U->>FE: Ingresa su email
    FE->>API: POST /forgot-password { email }
    API->>API: Genera reset_token (1 hora de vigencia)
    API->>API: Guarda token en users.reset_token
    API->>EMAIL: Envía email con link de reset
    EMAIL-->>U: Email con link

    U->>FE: Abre link con token
    FE->>API: POST /reset-password { token, new_password }
    API->>API: Verifica token y expiración
    API->>API: Hash nueva contraseña con bcrypt
    API->>API: Limpia reset_token
    API-->>FE: Éxito
    FE->>U: Redirige al login
```

### Flujo de creación de una competencia (Versus)

```mermaid
flowchart TD
    PROF["Profesor va a /teacher/versus"]
    SELECT["Selecciona 2 paralelos,<br/>tema, dificultad, N° ejercicios"]
    CREATE["POST /api/teacher/challenges<br/>status = pending"]
    ACTIVATE["PUT /api/teacher/challenges/{id}<br/>status = active"]
    STU1["Estudiantes Paralelo 1<br/>ven challenge en /student/challenges"]
    STU2["Estudiantes Paralelo 2<br/>ven challenge en /student/challenges"]
    PLAY1["Juegan ejercicios del tema<br/>Sus puntos suman al paralelo1_score"]
    PLAY2["Juegan ejercicios del tema<br/>Sus puntos suman al paralelo2_score"]
    CLOSE["Profesor cierra el challenge<br/>status = completed"]
    WINNER["Sistema determina winner_paralelo_id<br/>basado en puntaje total"]

    PROF --> SELECT --> CREATE --> ACTIVATE
    ACTIVATE --> STU1 & STU2
    STU1 --> PLAY1
    STU2 --> PLAY2
    PLAY1 & PLAY2 --> CLOSE --> WINNER
```

---

## Apéndice: Scripts de inicialización

El proyecto incluye scripts Python para poblar datos iniciales:

| Script | Función |
|--------|---------|
| `create_admin.py` | Crea el usuario administrador inicial |
| `create_badges.py` | Carga el catálogo base de insignias del sistema |
| `create_settings.py` | Carga la configuración inicial del sistema |
| `reset_passwords.py` | Resetea contraseñas de usuarios de prueba |

Estos scripts se ejecutan directamente con Python dentro del contenedor del backend:

```bash
docker exec -it mathmaster-backend python create_admin.py
docker exec -it mathmaster-backend python create_badges.py
docker exec -it mathmaster-backend python create_settings.py
```

---

*Documento generado para el proyecto MathMaster v2.0.0 — Marzo 2026*
