@echo off
title JobApply AI - manual start
echo ============================================
echo   JobApply AI - starting server + tunnel
echo ============================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-jobapply.ps1"
echo.
if exist "%~dp0CURRENT_URL.txt" (
    echo   Public link ^(also in tools\CURRENT_URL.txt^):
    type "%~dp0CURRENT_URL.txt"
) else (
    echo   Tunnel URL not captured yet - check JobApply-AI\.freebuff\tunnel.log
)
echo.
echo   Local:  http://127.0.0.1:8123
echo   Password: see JobApply-AI\.auth_password
echo.
echo   This window can be closed - the services keep running.
pause >nul
