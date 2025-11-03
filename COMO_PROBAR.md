# 🧪 Cómo Probar el Login - Guía Rápida

## 🔧 Cambios Realizados

1. ✅ Mejorado manejo de errores (no recarga página)
2. ✅ Mensajes persisten por 5 segundos
3. ✅ Agregado `e.stopPropagation()` para evitar propagación
4. ✅ Agregado `noValidate` al form
5. ✅ Los campos NO se limpian al haber error
6. ✅ CORS configurado correctamente

---

## 🎯 Pasos para Probar

### 1. Refrescar la Página
```
Presiona: Ctrl + Shift + R (Windows/Linux)
o: Cmd + Shift + R (Mac)
```

### 2. Prueba de Credenciales Incorrectas

**Escenario A: Email correcto, contraseña incorrecta**
```
Email: admin@mathmaster.com
Contraseña: wrongpassword123

Resultado Esperado:
❌ Mensaje rojo: "Credenciales inválidas"
✅ Los campos NO se borran
✅ La página NO se recarga
✅ Puedes corregir la contraseña
```

**Escenario B: Email incorrecto**
```
Email: noexiste@mathmaster.com
Contraseña: cualquiera

Resultado Esperado:
❌ Mensaje rojo: "Credenciales inválidas"
✅ Los campos NO se borran
✅ La página NO se recarga
```

### 3. Prueba de Login Exitoso

```
Email: admin@mathmaster.com
Contraseña: Admin123!

Resultado Esperado:
✅ Mensaje verde: "¡Bienvenido!"
✅ Consola muestra (F12):
   🎉 ¡Bienvenido!
   👤 Usuario: Administrador Sistema
   📧 Email: admin@mathmaster.com
   🔐 Rol: admin
✅ Los campos se mantienen
✅ Mensaje desaparece después de 5 segundos
```

---

## 🐛 Si Aún Ves el Problema

### Opción 1: Limpiar Caché del Navegador
```
1. Presiona F12
2. Click derecho en el botón de refrescar
3. Selecciona "Vaciar caché y recargar de forma forzada"
```

### Opción 2: Verificar la Consola
```
1. Presiona F12
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Compártelos si los ves
```

### Opción 3: Verificar Network
```
1. F12 > Network
2. Intenta login
3. Busca la petición a "login"
4. Click en ella
5. Ve a "Response" y verifica qué dice
```

---

## 📊 Comportamiento Correcto

### ❌ Error de Conexión
- Mensaje: "Error de conexión con el servidor"
- Los campos permanecen llenos
- Puedes reintentar

### ❌ Credenciales Inválidas
- Mensaje: "Credenciales inválidas"
- Los campos permanecen llenos
- Puedes corregir y reintentar

### ✅ Login Exitoso
- Mensaje verde: "¡Bienvenido!"
- Mensaje en consola con datos del usuario
- Después de 1.5 segundos se puede redirigir

---

## 🔍 Debugging

Si la página aún se recarga, revisa:

1. **Logs en consola del navegador** (F12)
2. **Network tab** para ver las peticiones
3. **Application > Local Storage** para ver tokens

---

## ✨ Credenciales de Prueba

```
Admin:
  Email: admin@mathmaster.com
  Contraseña: Admin123!

Docente:
  Email: docente@mathmaster.com
  Contraseña: Docente123!

Estudiante:
  Email: estudiante@mathmaster.com
  Contraseña: Estudiante123!
```

---

## 📝 Qué Esperar en la Consola

### Login Exitoso:
```
🎉 ¡Bienvenido! {id: "...", email: "...", ...}
👤 Usuario: [Nombre] [Apellido]
📧 Email: [email]
🔐 Rol: [admin/teacher/student]
```

### Login Fallido:
```
(No hay mensaje en consola, solo el error visual)
```

### Error de Conexión:
```
❌ Error en login: [detalles del error]
```
