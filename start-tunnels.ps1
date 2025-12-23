# Script para iniciar tuneles de Cloudflare para MathMaster
# Ejecutar como: powershell -ExecutionPolicy Bypass -File start-tunnels.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  MathMaster - Iniciando Tuneles Cloudflare" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que los contenedores esten corriendo
Write-Host "Verificando contenedores Docker..." -ForegroundColor Yellow
$containers = docker-compose ps --format json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue

if (-not $containers) {
    Write-Host "Los contenedores no estan corriendo. Iniciando..." -ForegroundColor Red
    docker-compose up -d
    Start-Sleep -Seconds 10
}

Write-Host "Contenedores OK" -ForegroundColor Green
Write-Host ""

# Crear archivos temporales para capturar las URLs
$backendLog = "$env:TEMP\cloudflared-backend.log"
$frontendLog = "$env:TEMP\cloudflared-frontend.log"

# Iniciar tunel del backend en segundo plano
Write-Host "Iniciando tunel del Backend (API)..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel", "--url", "http://localhost:3000" -PassThru -RedirectStandardOutput $backendLog -RedirectStandardError $backendLog -WindowStyle Hidden

Start-Sleep -Seconds 5

# Leer URL del backend
$backendUrl = ""
$attempts = 0
while ($backendUrl -eq "" -and $attempts -lt 10) {
    Start-Sleep -Seconds 2
    $attempts++
    if (Test-Path $backendLog) {
        $content = Get-Content $backendLog -Raw
        if ($content -match "(https://[a-z0-9-]+\.trycloudflare\.com)") {
            $backendUrl = $matches[1]
        }
    }
}

if ($backendUrl -eq "") {
    Write-Host "Error: No se pudo obtener URL del backend" -ForegroundColor Red
    exit 1
}

Write-Host "Backend URL: $backendUrl" -ForegroundColor Green
Write-Host ""

# Ahora necesitamos actualizar el frontend para usar la URL del backend
Write-Host "Actualizando configuracion del Frontend..." -ForegroundColor Yellow

# Modificar la variable de entorno en el contenedor del frontend
docker exec mathmaster-frontend sh -c "echo 'window.API_URL=\"$backendUrl/api\"' > /usr/share/nginx/html/config.js"

# Iniciar tunel del frontend en segundo plano
Write-Host "Iniciando tunel del Frontend..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel", "--url", "http://localhost:8080" -PassThru -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendLog -WindowStyle Hidden

Start-Sleep -Seconds 5

# Leer URL del frontend
$frontendUrl = ""
$attempts = 0
while ($frontendUrl -eq "" -and $attempts -lt 10) {
    Start-Sleep -Seconds 2
    $attempts++
    if (Test-Path $frontendLog) {
        $content = Get-Content $frontendLog -Raw
        if ($content -match "(https://[a-z0-9-]+\.trycloudflare\.com)") {
            $frontendUrl = $matches[1]
        }
    }
}

if ($frontendUrl -eq "") {
    Write-Host "Error: No se pudo obtener URL del frontend" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  TUNELES ACTIVOS - Compartir con clientes" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "FRONTEND (Aplicacion):" -ForegroundColor Cyan
Write-Host "  $frontendUrl" -ForegroundColor White
Write-Host ""
Write-Host "BACKEND (API):" -ForegroundColor Cyan
Write-Host "  $backendUrl" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  CREDENCIALES DE PRUEBA" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Admin:" -ForegroundColor Cyan
Write-Host "  Email: admin@mathmaster.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Profesor:" -ForegroundColor Cyan
Write-Host "  Email: profesor@mathmaster.com" -ForegroundColor White
Write-Host "  Password: docente123" -ForegroundColor White
Write-Host ""
Write-Host "Estudiante:" -ForegroundColor Cyan
Write-Host "  Email: estudiante@mathmaster.com" -ForegroundColor White
Write-Host "  Password: estudiante123" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Red
Write-Host "  Presiona ENTER para detener los tuneles" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red

Read-Host

# Detener procesos
Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue

Write-Host "Tuneles detenidos." -ForegroundColor Yellow
