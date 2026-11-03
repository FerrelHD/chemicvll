@echo off
title Personal OS - Local Daemon Bridge
cd /d "%~dp0"
cls
echo ========================================================
echo    Personal OS (chemicvll) - Local Daemon Bridge
echo ========================================================
echo.
echo Connecting to Supabase Realtime Relay...
echo Once connected, you can start/stop dev servers directly
echo from https://chemicvll.vercel.app or localhost:3000!
echo.
echo Press Ctrl+C anytime to close this daemon.
echo ========================================================
echo.
node local-daemon/daemon.js
pause

