#Requires -Version 5.1
<#
  One-shot launcher for the local mark stack, no Docker needed.

  PostgreSQL (6001) -> Redis (6379) -> API (4222)
    -> Gateway (8000) -> Web (3010) -> opens the browser on / (sign-in)

  Every service is skipped when its port is already listening, so running this
  repeatedly is safe. Usage:

    .\scripts\start-local.ps1            # start everything, open the browser
    .\scripts\start-local.ps1 -NoBrowser # start everything, no browser
    .\scripts\start-local.ps1 -BuildApi  # recompile the API before starting it
                                         # (needed after backend changes — the
                                         # API runs from dist/, not from source)
#>
param([switch]$NoBrowser, [switch]$BuildApi)

$ErrorActionPreference = "Stop"

$Root = "D:\mark"
$LocalDev = Join-Path $Root ".local-dev"
$LogDir = Join-Path $LocalDev "logs"
$PgData = Join-Path $LocalDev "pg\data"
$PgExe = Join-Path $LocalDev "pg\pgsql\bin\postgres.exe"
$RedisExe = Join-Path $LocalDev "redis5\redis-server.exe"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Test-Port {
    param([int]$Port)
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Wait-ForPort {
    param([int]$Port, [int]$TimeoutSeconds = 90)
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-Port $Port) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Start-MarkService {
    param(
        [string]$Name,
        [int]$Port,
        [string]$WorkingDir,
        [string]$Command,
        [int]$TimeoutSeconds = 90
    )

    if (Test-Port $Port) {
        Write-Host "  $Name already running on port $Port" -ForegroundColor DarkGray
        return $true
    }

    Write-Host "  starting $Name..."
    $log = Join-Path $LogDir "$Name.log"
    Start-Process -FilePath "powershell.exe" -WindowStyle Minimized -ArgumentList @(
        "-NoProfile",
        "-Command",
        "cd '$WorkingDir'; $Command *>&1 | Out-File -FilePath '$log' -Encoding utf8"
    ) | Out-Null

    if (Wait-ForPort -Port $Port -TimeoutSeconds $TimeoutSeconds) {
        Write-Host "  $Name ready (port $Port)" -ForegroundColor Green
        return $true
    }

    Write-Host "  $Name did not open port $Port in time - see $log" -ForegroundColor Yellow
    return $false
}

Write-Host ""
Write-Host "=== mark local stack ===" -ForegroundColor Cyan

Write-Host "[1/5] PostgreSQL (6001)"
if (Test-Port 6001) {
    Write-Host "  already running" -ForegroundColor DarkGray
}
else {
    Write-Host "  starting PostgreSQL..."
    Start-Process -FilePath $PgExe -WindowStyle Hidden `
        -ArgumentList "-D", $PgData, "-p", "6001" `
        -RedirectStandardError (Join-Path $LogDir "postgres.err.log") | Out-Null
    if (Wait-ForPort -Port 6001) { Write-Host "  ready (port 6001)" -ForegroundColor Green }
    else { Write-Host "  failed - see $LogDir\postgres.err.log" -ForegroundColor Red }
}

Write-Host "[2/5] Redis (6379)"
if (Test-Port 6379) {
    Write-Host "  already running" -ForegroundColor DarkGray
}
else {
    Write-Host "  starting Redis 5..."
    Start-Process -FilePath $RedisExe -WindowStyle Hidden -ArgumentList "--port", "6379" | Out-Null
    if (Wait-ForPort -Port 6379 -TimeoutSeconds 30) { Write-Host "  ready (port 6379)" -ForegroundColor Green }
    else { Write-Host "  failed to start" -ForegroundColor Red }
}

Write-Host "[3/5] API (4222)"
# The API runs compiled output (dist/main.js). Source edits — new controllers,
# new Prisma models — only take effect after a build, so rebuild on request (or
# whenever dist is missing) instead of silently serving stale endpoints.
$apiDir = Join-Path $Root "apps\api"
$apiMain = Join-Path $apiDir "dist\main.js"
if ($BuildApi -or -not (Test-Path $apiMain)) {
    Write-Host "  building api (this takes a minute)..."
    Push-Location $apiDir
    try {
        & npm run build *>&1 | Out-File -FilePath (Join-Path $LogDir "api-build.log") -Encoding utf8
        Write-Host "  api built" -ForegroundColor Green
    }
    catch {
        Write-Host "  api build failed - see $LogDir\api-build.log" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}
Start-MarkService -Name "api" -Port 4222 `
    -WorkingDir $apiDir `
    -Command "npx dotenv -e ./dev.env -- node dist/main" | Out-Null

Write-Host "[4/5] API Gateway (8000)"
Start-MarkService -Name "gateway" -Port 8000 `
    -WorkingDir (Join-Path $Root "apps\api-gateway") `
    -Command "npx dotenv -e ./dev.env -- node dist/main" | Out-Null

Write-Host "[5/5] Web (3010)"
$webOk = Start-MarkService -Name "web" -Port 3010 -TimeoutSeconds 120 `
    -WorkingDir (Join-Path $Root "apps\web") `
    -Command "npx dotenv -e ../dev.env -- npx next dev -p 3010"

Write-Host ""
if ($webOk) {
    Write-Host "Sign in     http://localhost:3010/" -ForegroundColor Green
    Write-Host "Dashboard   http://localhost:3010/dashboard" -ForegroundColor Green
    Write-Host "Classes     http://localhost:3010/dashboard/classes" -ForegroundColor Green
    Write-Host "KnowPoints  http://localhost:3010/dashboard/knowledge-points" -ForegroundColor Green
    Write-Host "Students    http://localhost:3010/dashboard/students" -ForegroundColor Green
    Write-Host "Author      http://localhost:3010/author/1" -ForegroundColor Green
    Write-Host "Learner     http://localhost:3010/learner/1" -ForegroundColor Green
    if (-not $NoBrowser) {
        Write-Host "  opening http://localhost:3010/ (sign-in)"
        Start-Process "http://localhost:3010/"
    }
}
else {
    Write-Host "Web did not come up - see $LogDir\web.log" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Logs: $LogDir    Stop with: .\stop-dev.bat" -ForegroundColor DarkGray
