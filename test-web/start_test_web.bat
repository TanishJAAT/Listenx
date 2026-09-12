@echo off
title Listen-X Music Lab - Test Web Server
cd /d "%~dp0"
echo ========================================================
echo   Starting Listen-X Isolated Music Test Server (Port 3000)
echo ========================================================
echo.
node server.js
pause
