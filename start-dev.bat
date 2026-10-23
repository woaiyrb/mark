@echo off
rem ===== mark dev environment launcher (one click) =====
rem PostgreSQL -> Redis -> API -> Gateway -> Web -> browser
rem All logic lives in scripts\start-local.ps1.
rem Pass -NoBrowser to start everything without opening a browser.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1" %*
if errorlevel 1 (
  echo.
  echo Launcher failed - see the output above.
  pause
  exit /b 1
)
