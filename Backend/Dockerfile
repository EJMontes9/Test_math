FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements desde Backend/
COPY Backend/requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código desde Backend/
COPY Backend/app ./app

# Crear directorios necesarios
RUN mkdir -p /app/uploads /app/static/avatars

# Crear usuario no-root y dar permisos
RUN useradd -m -u 1001 fastapi && \
    chown -R fastapi:fastapi /app

USER fastapi

# Puerto (Railway usa la variable PORT)
EXPOSE 3000

# Comando para iniciar
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000}"]
