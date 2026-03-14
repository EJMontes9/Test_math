FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY Backend/requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY Backend/app ./app
COPY Backend/create_default_users.py .
COPY Backend/migrate_db.py .
COPY Backend/start.sh .

# Crear directorios necesarios
RUN mkdir -p /app/uploads /app/static/avatars

# Dar permisos de ejecución al script
RUN chmod +x start.sh

# Crear usuario no-root y dar permisos
RUN useradd -m -u 1001 fastapi && \
    chown -R fastapi:fastapi /app

USER fastapi

# Puerto (Railway usa la variable PORT)
EXPOSE 3000

# Comando para iniciar (ejecuta script que crea usuarios e inicia servidor)
CMD ["./start.sh"]
