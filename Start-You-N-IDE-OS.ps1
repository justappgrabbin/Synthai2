$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host ""
Write-Host "YOU-N-I-VERSE OS launcher" -ForegroundColor Cyan
Write-Host "Starting the self-host Linux container..." -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "Docker was not found. Install/open Docker Desktop, then run this launcher again." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  $dockerDesktop = "$Env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dockerDesktop) {
    Write-Host "Opening Docker Desktop. This can take a minute..." -ForegroundColor Yellow
    Start-Process $dockerDesktop
  }

  $deadline = (Get-Date).AddMinutes(3)
  do {
    Start-Sleep -Seconds 5
    docker info *> $null
    if ($LASTEXITCODE -eq 0) { break }
    Write-Host "Waiting for Docker engine..."
  } while ((Get-Date) -lt $deadline)
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker is still not ready. Open Docker Desktop manually and run this launcher again." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}

New-Item -ItemType Directory -Force -Path "$Root\workspace" | Out-Null

Write-Host "Building and starting YOU-N-I-VERSE OS..." -ForegroundColor Green
docker compose up --build -d
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker Compose could not start YOU-N-I-VERSE OS." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Opening http://localhost:5000" -ForegroundColor Green
Start-Process "http://localhost:5000"

Write-Host ""
Write-Host "Live logs follow. You can close this window later; the container keeps running." -ForegroundColor DarkGray
docker compose logs -f you-n-i-verse-os
