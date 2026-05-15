# Stack completo em Docker: frontend dev + API + Postgres
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

docker compose stop web 2>$null
docker compose --profile dev-live --profile docker-api --profile bundled-db up -d --build

Write-Host ""
Write-Host "Frontend dev: http://localhost:5173"
Write-Host "API:        http://localhost:8000"
Write-Host "Postgres:   localhost:5433 (utilizador postgres, BD inventario)"
