@echo off
setlocal

rem ===== mark dev environment stopper =====

set "ROOT=D:\mark"
set "PGDIR=%ROOT%\.local-dev\pg"
set "PGBIN=%PGDIR%\pgsql\bin"
set "PGDATA=%PGDIR%\data"

echo [1/3] stopping dev servers (node/turbo)
taskkill /f /im node.exe /t >nul 2>&1
taskkill /f /im turbo.exe >nul 2>&1

echo [2/3] stopping Redis
taskkill /f /im redis-server.exe >nul 2>&1

echo [3/3] stopping PostgreSQL
"%PGBIN%\pg_ctl.exe" -D "%PGDATA%" -m fast stop >nul 2>&1

echo.
echo All mark dev services stopped.
exit /b 0
