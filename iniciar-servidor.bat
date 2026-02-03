@echo off
echo ========================================
echo   Iniciando Servidor de Desenvolvimento
echo   MIL Aviacao e RBF
echo ========================================
echo.

cd /d "%~dp0"
call npm run dev

pause
