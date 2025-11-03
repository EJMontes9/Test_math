# 🧪 Guía de Pruebas - Sistema de Login

## ✅ Funcionalidades Implementadas

### 1. **Login Completo**
- ✅ Conexión con backend
- ✅ Validación de credenciales
- ✅ Mensajes de error personalizados
- ✅ Mensaje de bienvenida en consola
- ✅ Indicador de carga (spinner)
- ✅ Deshabilitar form durante carga

### 2. **Recordarme**
- ✅ Guarda el email en localStorage
- ✅ Auto-completa el email al volver
- ✅ Checkbox persiste el estado

### 3. **Olvidaste tu Contraseña**
- ✅ Página dedicada
- ✅ Simulación de envío de email
- ✅ Mensaje de confirmación
- ✅ Botón para volver al login
- ⚠️ **Pendiente**: Implementación real en backend

---

## 🎯 Casos de Prueba

### ✅ Caso 1: Login Exitoso

**Pasos:**
1. Abrir http://localhost:8080
2. Ingresar credenciales válidas:
   - Email: `admin@mathmaster.com`
   - Contraseña: `Admin123!`
3. Click en "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Mensaje verde: "¡Bienvenido!"
- ✅ En la consola del navegador (F12):
  ```
  🎉 ¡Bienvenido! {id: "...", email: "admin@mathmaster.com", ...}
  👤 Usuario: Administrador Sistema
  📧 Email: admin@mathmaster.com
  🔐 Rol: admin
  ```

---

### ❌ Caso 2: Credenciales Inválidas

**Pasos:**
1. Ingresar email válido pero contraseña incorrecta:
   - Email: `admin@mathmaster.com`
   - Contraseña: `wrongpassword`
2. Click en "Iniciar Sesión"

**Resultado Esperado:**
- ❌ Mensaje rojo: "Credenciales inválidas"
- El formulario se habilita nuevamente

---

### ❌ Caso 3: Usuario No Existe

**Pasos:**
1. Ingresar email que no existe:
   - Email: `noexiste@mathmaster.com`
   - Contraseña: `cualquiera`
2. Click en "Iniciar Sesión"

**Resultado Esperado:**
- ❌ Mensaje rojo: "Credenciales inválidas"

---

### 💾 Caso 4: Recordarme Activado

**Pasos:**
1. Marcar checkbox "Recordarme"
2. Ingresar: `estudiante@mathmaster.com`
3. Hacer login exitoso
4. Cerrar el navegador
5. Volver a abrir http://localhost:8080

**Resultado Esperado:**
- ✅ El email ya está pre-cargado
- ✅ El checkbox "Recordarme" está marcado

---

### 💾 Caso 5: Recordarme Desactivado

**Pasos:**
1. Desmarcar checkbox "Recordarme"
2. Ingresar email y contraseña
3. Hacer login
4. Cerrar navegador y volver

**Resultado Esperado:**
- ✅ El email NO está pre-cargado
- ✅ El checkbox está desmarcado

---

### 🔑 Caso 6: Olvidé mi Contraseña

**Pasos:**
1. Click en "¿Olvidaste tu contraseña?"
2. Ingresar email: `docente@mathmaster.com`
3. Click en "Enviar Instrucciones"

**Resultado Esperado:**
- ✅ Pantalla de confirmación
- ✅ Mensaje: "¡Email Enviado!"
- ✅ Nota amarilla indicando que está pendiente de implementación
- ✅ En consola:
  ```
  📧 Email de recuperación enviado a: docente@mathmaster.com
  ⚠️ NOTA: Esta funcionalidad está pendiente de implementación en el backend
  ```

---

## 🔐 Credenciales de Prueba

### Administrador
```
Email: admin@mathmaster.com
Contraseña: Admin123!
```

### Docente
```
Email: docente@mathmaster.com
Contraseña: Docente123!
```

### Estudiante
```
Email: estudiante@mathmaster.com
Contraseña: Estudiante123!
```

---

## 🌐 URLs

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

---

## 🐛 Errores Comunes y Soluciones

### Error: "Error de conexión con el servidor"

**Causa**: El backend no está corriendo

**Solución**:
```bash
docker-compose ps
# Si no está corriendo:
docker-compose up -d
```

---

### Error: CORS

**Causa**: Problemas de CORS entre frontend y backend

**Solución**:
- Verificar que el backend tenga configurado CORS para http://localhost:8080
- Verificar en Backend/src/app.js línea de CORS

---

### El checkbox "Recordarme" no funciona

**Solución**:
1. Abrir DevTools (F12)
2. Ir a Application > Local Storage
3. Verificar que exista `rememberedEmail`

---

## 📊 Consola del Navegador

Para ver todos los mensajes de login:
1. Presiona F12 (DevTools)
2. Ve a la pestaña "Console"
3. Haz login
4. Verás mensajes detallados:
   - 🎉 Bienvenida
   - 👤 Datos del usuario
   - 📧 Email
   - 🔐 Rol

---

## 🔄 Flujo Completo de Prueba

1. **Verificar que Docker esté corriendo**:
   ```bash
   docker-compose ps
   ```

2. **Abrir la aplicación**:
   - Frontend: http://localhost:8080

3. **Probar login fallido**:
   - Email: admin@mathmaster.com
   - Contraseña: wrongpassword
   - Verificar mensaje de error

4. **Probar login exitoso**:
   - Email: admin@mathmaster.com
   - Contraseña: Admin123!
   - Abrir consola (F12) y verificar mensajes

5. **Probar "Recordarme"**:
   - Marcar checkbox
   - Hacer login
   - Cerrar y reabrir navegador
   - Verificar que el email esté pre-cargado

6. **Probar "Olvidé mi contraseña"**:
   - Click en el enlace
   - Ingresar email
   - Verificar pantalla de confirmación

---

## ✨ Mejoras Futuras (Pendientes)

- [ ] Implementar recuperación de contraseña real en backend
- [ ] Agregar captcha para seguridad
- [ ] Implementar límite de intentos fallidos
- [ ] Agregar autenticación de dos factores (2FA)
- [ ] Crear dashboard después del login
- [ ] Implementar auto-logout por inactividad
- [ ] Agregar "Mostrar/Ocultar contraseña"

---

## 📝 Notas Técnicas

### LocalStorage
El sistema guarda en localStorage:
- `token`: JWT token de autenticación
- `user`: Objeto con datos del usuario
- `rememberedEmail`: Email si está marcado "Recordarme"

### API Endpoints Usados
- `POST /api/auth/login`: Login de usuario
- `GET /api/auth/me`: Obtener usuario actual (no usado aún)

### Seguridad
- ✅ Contraseñas encriptadas con bcrypt
- ✅ JWT con expiración de 7 días
- ✅ CORS configurado
- ✅ Rate limiting activo
- ✅ Validación de inputs
