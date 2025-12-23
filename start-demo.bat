@echo off
title MathMaster - Demo para Clientes
color 0A

echo.
echo ============================================
echo   MathMaster - Iniciando Demo
echo ============================================
echo.

REM Usar cloudflared local del proyecto
set CLOUDFLARED=%~dp0cloudflared.exe

REM Verificar que existe el exe
if not exist "%CLOUDFLARED%" (
    echo [ERROR] cloudflared.exe no encontrado en el directorio del proyecto.
    echo Descargalo desde: https://github.com/cloudflare/cloudflared/releases
    pause
    exit /b 1
)

echo [1/5] Verificando contenedores Docker...
cd /d "c:\Users\erick\OneDrive\Documentos\Development\Test_math"
docker-compose ps | findstr "Up" >nul 2>&1
if %errorlevel% neq 0 (
    echo       Iniciando contenedores...
    docker-compose up -d
    timeout /t 15 /nobreak >nul
)
echo       OK
echo.

echo [2/5] Iniciando tunel del Backend...
echo       (Espera unos segundos...)
start /b cmd /c ""%CLOUDFLARED%" tunnel --url http://localhost:3000 2>&1 | findstr trycloudflare > %TEMP%\backend_url.txt"
timeout /t 8 /nobreak >nul

REM Leer URL del backend
set BACKEND_URL=
for /f "tokens=*" %%a in ('type %TEMP%\backend_url.txt 2^>nul ^| findstr https') do (
    for %%b in (%%a) do (
        echo %%b | findstr "https://.*trycloudflare.com" >nul && set BACKEND_URL=%%b
    )
)

if "%BACKEND_URL%"=="" (
    echo [ERROR] No se pudo obtener URL del backend
    echo Intentando de nuevo...
    timeout /t 5 /nobreak >nul
    for /f "tokens=*" %%a in ('type %TEMP%\backend_url.txt 2^>nul') do echo %%a
)

echo       Backend: %BACKEND_URL%
echo.

echo [3/5] Actualizando Frontend con URL del Backend...
REM Actualizar docker-compose.yml temporalmente no es viable, mejor usar variable en runtime

echo [4/5] Iniciando tunel del Frontend...
start /b cmd /c ""%CLOUDFLARED%" tunnel --url http://localhost:8080 2>&1 | findstr trycloudflare > %TEMP%\frontend_url.txt"
timeout /t 8 /nobreak >nul

REM Leer URL del frontend
set FRONTEND_URL=
for /f "tokens=*" %%a in ('type %TEMP%\frontend_url.txt 2^>nul ^| findstr https') do (
    for %%b in (%%a) do (
        echo %%b | findstr "https://.*trycloudflare.com" >nul && set FRONTEND_URL=%%b
    )
)

echo       Frontend: %FRONTEND_URL%
echo.

echo [5/5] Configuracion completa!
echo.
echo ============================================
echo   URLS PARA COMPARTIR CON CLIENTES
echo ============================================
echo.
echo   FRONTEND (Aplicacion Web):
echo   %FRONTEND_URL%
echo.
echo   BACKEND (API - solo referencia):
echo   %BACKEND_URL%
echo.
echo ============================================
echo   CREDENCIALES DE PRUEBA
echo ============================================
echo.
echo   ADMINISTRADOR:
echo     Email: admin@mathmaster.com
echo     Password: admin123
echo.
echo   PROFESOR:
echo     Email: profesor@mathmaster.com
echo     Password: docente123
echo.
echo   ESTUDIANTE:
echo     Email: estudiante@mathmaster.com
echo     Password: estudiante123
echo.
echo ============================================
echo.
echo INSTRUCCIONES PARA CLIENTES:
echo.
echo 1. Abrir el link del FRONTEND en su navegador
echo 2. Click en el icono de engranaje (esquina superior derecha)
echo 3. Ingresar la URL del backend: %BACKEND_URL%/api
echo 4. Click en "Guardar"
echo 5. Iniciar sesion con las credenciales de arriba
echo.
echo Presiona cualquier tecla para cerrar los tuneles...
pause >nul

REM Matar procesos de cloudflared
taskkill /f /im cloudflared.exe >nul 2>&1

echo.
echo Tuneles cerrados. Adios!
