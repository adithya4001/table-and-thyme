@echo off
setlocal
cd /d "%~dp0frontend"
set "FRONTEND_PORT=5173"
node scripts/serve.cjs --preview
pause
