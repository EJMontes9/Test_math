#!/bin/sh

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a la base de datos..."
sleep 5

# Crear usuarios por defecto
echo "👥 Creando usuarios por defecto..."
python create_default_users.py || true

# Iniciar la aplicación
echo "🚀 Iniciando servidor..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000}
