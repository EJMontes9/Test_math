from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import time
import os
from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, users, paralelos, teacher, student
from app.routers import settings as settings_router
from app.routers import badges as badges_router

settings = get_settings()

# Crear tablas
Base.metadata.create_all(bind=engine)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Crear app
# redirect_slashes=False evita redirects 307 que pueden causar problemas con HTTPS en Railway
app = FastAPI(
    title="MathMaster API",
    description="API REST para plataforma educativa de matemáticas",
    version="2.0.0",
    docs_url="/docs" if settings.NODE_ENV == "development" else None,
    redoc_url="/redoc" if settings.NODE_ENV == "development" else None,
    redirect_slashes=False
)

# CORS - Configuración para Railway y desarrollo local
cors_origins = settings.CORS_ORIGINS_LIST + [
    "https://steadfast-generosity-production.up.railway.app",  # Frontend en Railway
]

# En desarrollo, permitir cualquier origen
if settings.NODE_ENV == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Rate limiting - Solo en producción
if settings.NODE_ENV == "production":
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    print("✅ Rate limiting habilitado (Producción)")
else:
    print("⚠️  Rate limiting deshabilitado (Desarrollo)")


# Middleware para logging y headers de seguridad (equivalente a helmet en Node.js)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    # Headers de seguridad (equivalente a helmet)
    response.headers["X-Content-Type-Options"] = "nosniff"

    # Permitir iframes para archivos PDF (rutas /api/files/)
    # pero denegar para el resto de la aplicación
    if request.url.path.startswith("/api/files/"):
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
    else:
        response.headers["X-Frame-Options"] = "DENY"

    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

    # Header de tiempo de proceso
    response.headers["X-Process-Time"] = str(process_time)

    # Log en desarrollo
    if settings.NODE_ENV == "development":
        print(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")

    return response


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Error de validación",
            "errors": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Error interno del servidor",
            "error": str(exc) if settings.NODE_ENV == "development" else "Internal Server Error"
        }
    )


# Health check
@app.get("/health")
async def health_check():
    return {
        "success": True,
        "message": "MathMaster API is running",
        "timestamp": time.time()
    }


# Incluir routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(paralelos.router)
app.include_router(teacher.router)
app.include_router(student.router)
app.include_router(settings_router.router)
app.include_router(badges_router.router)

# Servir archivos estáticos (avatares, etc.)
os.makedirs("static/avatars", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Servir archivos de recursos educativos (PDFs)
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/api/files", StaticFiles(directory=UPLOADS_DIR), name="uploads")


# Evento de inicio
@app.on_event("startup")
async def startup_event():
    print("=" * 60)
    print("🚀 MathMaster API (FastAPI)")
    print("=" * 60)
    print(f"✅ Entorno: {settings.NODE_ENV}")
    print(f"✅ Puerto: {settings.PORT}")
    print(f"✅ Base de datos: PostgreSQL")
    print(f"📍 Documentación: http://localhost:{settings.PORT}/docs")
    print(f"🏥 Health check: http://localhost:{settings.PORT}/health")
    print(f"🔐 API Auth: http://localhost:{settings.PORT}/api/auth")
    print("=" * 60)


# Evento de cierre
@app.on_event("shutdown")
async def shutdown_event():
    print("👋 Apagando MathMaster API...")
