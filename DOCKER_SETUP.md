# 🐳 MathMaster - Configuración Docker

## ✅ Estado Actual: LEVANTADO Y FUNCIONANDO

Todos los servicios están corriendo correctamente:

- ✅ **PostgreSQL Database** - Puerto 5433 (HEALTHY)
- ✅ **Backend API** - Puerto 3000 (HEALTHY)
- ✅ **Frontend** - Puerto 8080 (HEALTHY)
- ✅ **Usuarios creados** - 3 usuarios por defecto

---

## 🌐 URLs Disponibles

### Frontend
- **URL**: http://localhost:8080
- **Descripción**: Aplicación web con login visual

### Backend API
- **URL Base**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Auth Endpoint**: http://localhost:3000/api/auth

### Database
- **Host**: localhost
- **Puerto**: 5433 (mapeado a 5432 interno)
- **Database**: mathmaster_db
- **User**: mathmaster
- **Password**: mathmaster123

---

## 🔐 Credenciales de Acceso

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

---

## 🚀 Comandos Docker Útiles

### Ver estado de los servicios
```bash
docker-compose ps
```

### Ver logs
```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend

# Solo database
docker-compose logs -f db
```

### Detener servicios
```bash
docker-compose down
```

### Detener y eliminar volúmenes (⚠️ CUIDADO: Borra la base de datos)
```bash
docker-compose down -v
```

### Reiniciar un servicio específico
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart db
```

### Reconstruir y levantar
```bash
docker-compose up -d --build
```

### Ejecutar comandos en los contenedores
```bash
# Backend
docker exec mathmaster-backend npm run seed
docker exec mathmaster-backend npm run dev

# Acceder al contenedor
docker exec -it mathmaster-backend sh

# Ver logs en tiempo real
docker logs -f mathmaster-backend
```

---

## 🔧 Troubleshooting

### Si el puerto está ocupado:
```bash
# Verificar qué está usando el puerto
netstat -ano | findstr :3000
netstat -ano | findstr :8080
netstat -ano | findstr :5433

# Cambiar el puerto en docker-compose.yml
```

### Si la base de datos no inicia:
```bash
# Ver logs
docker-compose logs db

# Recrear el contenedor
docker-compose down
docker volume rm test_math_postgres_data
docker-compose up -d
```

### Si necesitas recrear los usuarios:
```bash
docker exec mathmaster-backend npm run seed
```

---

## 📝 Notas Importantes

1. **Puerto PostgreSQL**: Cambié el puerto de 5432 a 5433 porque ya tenías Odoo usando el 5432
2. **Volumen de datos**: Los datos de PostgreSQL se guardan en el volumen `test_math_postgres_data`
3. **Network**: Todos los servicios están en la red `test_math_mathmaster-network`
4. **Health Checks**: Los tres servicios tienen health checks configurados

---

## 🎯 Próximos Pasos

1. ✅ Frontend funcionando
2. ✅ Backend con autenticación JWT
3. ✅ Base de datos PostgreSQL
4. ✅ Usuarios por defecto creados
5. ⏳ Conectar frontend con backend
6. ⏳ Crear módulos de ejercicios
7. ⏳ Deploy en Railway

---

## 🔒 Seguridad

- ✅ Contraseñas encriptadas con bcrypt
- ✅ JWT con expiración
- ✅ CORS configurado
- ✅ Rate limiting activo
- ✅ Helmet para headers de seguridad
- ✅ Contenedor sin permisos de root
- ⚠️ **CAMBIAR credenciales en producción**

---

## 📦 Containers Activos

```
NAME                  STATUS                 PORTS
mathmaster-backend    Up (healthy)           0.0.0.0:3000->3000/tcp
mathmaster-db         Up (healthy)           0.0.0.0:5433->5432/tcp
mathmaster-frontend   Up (healthy)           0.0.0.0:8080->8080/tcp
```
