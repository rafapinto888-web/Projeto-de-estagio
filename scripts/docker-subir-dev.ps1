# Frontend dev (hot reload) + dependencias npm sincronizadas (package-lock.json)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

docker compose --profile dev-live up -d --build web-dev

Write-Host ""
Write-Host "Frontend dev: http://localhost:5173"
Write-Host "API local (se usares): http://localhost:8000"
