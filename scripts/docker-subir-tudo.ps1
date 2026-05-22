# Stack completo em Docker: frontend dev + API (sem camada de BD no código)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

docker compose --profile dev-live --profile docker-api up -d --build

Write-Host ""
Write-Host "Frontend dev: http://localhost:5173"
Write-Host "API:        http://localhost:8000"
Write-Host "API: sem rotas de negocio / sem BD — so GET / ate nova implementacao"
