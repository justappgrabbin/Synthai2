$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok($Message) {
  Write-Host "OK $Message" -ForegroundColor Green
}

function Write-Warn($Message) {
  Write-Host "! $Message" -ForegroundColor Yellow
}

function Wait-ForHttp($Url, $Seconds) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  do {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 4
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Seconds 3
    }
  } while ((Get-Date) -lt $deadline)

  return $false
}

function Get-LanIp {
  try {
    $ip = Get-NetIPAddress -AddressFamily IPv4 |
      Where-Object {
        $_.IPAddress -notlike "127.*" -and
        $_.IPAddress -notlike "169.254.*" -and
        $_.PrefixOrigin -ne "WellKnown"
      } |
      Select-Object -First 1 -ExpandProperty IPAddress

    if ($ip) { return $ip }
  } catch {
    return $null
  }

  return $null
}

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host ""
Write-Host "YOU-N-I-VERSE OS self-installer" -ForegroundColor Magenta
Write-Host "This starts the existing Linux Docker container with the OS, Synthia server, Python service, mesh, and terminal bridge." -ForegroundColor DarkGray

Write-Step "Checking Docker"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "Docker was not found." -ForegroundColor Red
  Write-Host "Install Docker Desktop, open it once, then run this file again:" -ForegroundColor Yellow
  Write-Host "https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
  Read-Host "Press Enter to close"
  exit 1
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  $dockerDesktop = "$Env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dockerDesktop) {
    Write-Warn "Docker engine is not awake yet. Opening Docker Desktop..."
    Start-Process $dockerDesktop
  }

  $deadline = (Get-Date).AddMinutes(4)
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
Write-Ok "Docker is ready"

Write-Step "Preparing local files"
if (-not (Test-Path "$Root\.env")) {
  Copy-Item "$Root\.env.example" "$Root\.env"
  Write-Ok "Created .env from .env.example"
} else {
  Write-Ok ".env already exists"
}

New-Item -ItemType Directory -Force -Path "$Root\workspace" | Out-Null
Write-Ok "Workspace folder is ready"

Write-Step "Building and starting the Linux container"
docker compose up --build -d
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker Compose could not start YOU-N-I-VERSE OS." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit $LASTEXITCODE
}

Write-Step "Waiting for the OS to answer"
$studioUrl = "http://localhost:5000"
$healthUrl = "http://localhost:5000/api/health"
$isHealthy = Wait-ForHttp $healthUrl 120

if ($isHealthy) {
  Write-Ok "Studio health check passed"
} else {
  Write-Warn "The container started, but the health check is still warming up. Opening the app anyway."
}

$lanIp = Get-LanIp
$mobileUrl = $null
if ($lanIp) {
  $mobileUrl = "http://$lanIp`:5000"
}

Write-Host ""
Write-Host "YOU-N-I-VERSE OS is running." -ForegroundColor Green
Write-Host "Computer: $studioUrl" -ForegroundColor Green
if ($mobileUrl) {
  Write-Host "Phone on same Wi-Fi: $mobileUrl" -ForegroundColor Green
  Write-Host "On Android Chrome: open that phone URL, tap menu, then Install app/Add to Home screen." -ForegroundColor DarkGray
  Write-Host "On iPhone Safari: open that phone URL, tap Share, then Add to Home Screen." -ForegroundColor DarkGray
} else {
  Write-Warn "Could not detect a LAN IP. Use ipconfig to find your IPv4 address, then open http://YOUR-IP:5000 on your phone."
}

Write-Host ""
Write-Host "Useful checks:" -ForegroundColor Cyan
Write-Host "  docker compose ps"
Write-Host "  docker compose logs -f you-n-i-verse-os"
Write-Host "  docker compose down"

Write-Host ""
Write-Host "Opening the OS on this computer..." -ForegroundColor Green
Start-Process $studioUrl

Write-Host ""
Write-Host "Live logs follow. You can close this window later; the container keeps running." -ForegroundColor DarkGray
docker compose logs -f you-n-i-verse-os
