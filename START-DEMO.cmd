@echo off
setlocal
cd /d "%~dp0"
echo Before starting: MySQL must be running and database\setup.sql must be executed.
echo This launcher opens backend and frontend terminals. Keep both open.
echo Open http://127.0.0.1:5173 after the backend says Started Application.
start "Table and Thyme - Backend" cmd /k call "%~dp0start-backend.cmd"
start "Table and Thyme - Frontend" cmd /k call "%~dp0start-preview.cmd"
