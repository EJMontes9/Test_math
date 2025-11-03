# 🔐 CREDENCIALES DE ACCESO - MATHMASTER

## Usuarios por Defecto

### 👨‍💼 ADMINISTRADOR
```
Email: admin@mathmaster.com
Contraseña: admin123
Rol: admin
```
**Permisos**: Acceso completo al sistema

---

### 👩‍🏫 PROFESOR
```
Email: profesor@mathmaster.com
Contraseña: profesor123
Rol: teacher
```
**Permisos**: Gestión de paralelos, estudiantes y ejercicios

---

## ⚠️ IMPORTANTE - SEGURIDAD

### Para Producción:
1. **CAMBIAR** todas estas contraseñas antes de subir a producción
2. **CAMBIAR** el `JWT_SECRET` en las variables de entorno
3. **CONFIGURAR** HTTPS en el servidor
4. **HABILITAR** backups automáticos de la base de datos
5. **REVISAR** los logs regularmente
6. **ACTUALIZAR** las dependencias periódicamente

### Recomendaciones de Contraseñas:
- Mínimo 8 caracteres
- Incluir mayúsculas, minúsculas y números
- No usar palabras del diccionario
- Usar un gestor de contraseñas

---

## 🚀 Cómo Crear los Usuarios

### Con Docker (Recomendado)
```bash
# Levantar servicios
docker-compose up -d

# Los usuarios se crean automáticamente al iniciar el backend
# Si necesitas reinicializar la base de datos:
docker-compose down -v
docker-compose up -d --build
```

---

## 📝 Notas

- Todos los usuarios están activos por defecto (`isActive: true`)
- Las contraseñas están encriptadas con bcrypt
- Los tokens JWT expiran en 7 días por defecto
- El administrador puede crear más usuarios a través del sistema
