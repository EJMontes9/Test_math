# 🔐 CREDENCIALES DE ACCESO - MATHMASTER

## Usuarios por Defecto

### 👨‍💼 ADMINISTRADOR
```
Email: admin@mathmaster.com
Contraseña: Admin123!
Rol: admin
```
**Permisos**: Acceso completo al sistema

---

### 👩‍🏫 DOCENTE
```
Email: docente@mathmaster.com
Contraseña: Docente123!
Rol: teacher
```
**Permisos**: Gestión de estudiantes y ejercicios

---

### 👨‍🎓 ESTUDIANTE
```
Email: estudiante@mathmaster.com
Contraseña: Estudiante123!
Rol: student
```
**Permisos**: Realizar ejercicios y ver progreso

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
- Mínimo 12 caracteres
- Incluir mayúsculas, minúsculas, números y símbolos
- No usar palabras del diccionario
- Usar un gestor de contraseñas

---

## 🚀 Cómo Crear los Usuarios

### Opción 1: Con npm (requiere PostgreSQL local)
```bash
cd Backend
npm run seed
```

### Opción 2: Con Docker
```bash
# Levantar servicios
docker-compose up -d

# Esperar a que la base de datos esté lista (30 segundos aprox)

# Ejecutar seed en el contenedor
docker exec -it mathmaster-backend npm run seed
```

---

## 📝 Notas

- Todos los usuarios están activos por defecto (`isActive: true`)
- Las contraseñas están encriptadas con bcrypt (10 salt rounds)
- Los tokens JWT expiran en 7 días por defecto
- El administrador puede crear más usuarios a través del sistema
