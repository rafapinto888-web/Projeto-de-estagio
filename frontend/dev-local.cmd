@echo off
REM Frontend local no Windows: usa npm.cmd (evita erro de Execution Policy do npm.ps1 no PowerShell).
REM Porta 5174 = nao choca com Docker (web-dev mapeia 5173).
cd /d "%~dp0"
call npm.cmd install
call npm.cmd run dev:local
pause
