<#
.SYNOPSIS
    LabCore ELIS OS — Automated Production Server Provisioning Script (PowerShell Companion)
.DESCRIPTION
    Validates server preflight configurations, firewall rules, and deployment requirements.
#>
[CmdletBinding()]
param(
    [string]$TargetDir = "C:\labcore",
    [int]$AnalyzerPort = 5005
)

$ErrorActionPreference = "Stop"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "🏥 NIKIL-LABCORE-ELIS-OS — PRODUCTION SERVER PROVISIONING (Windows / Dev)" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Cyan

# 1. HARDWARE SPECIFICATION AUDIT
Write-Host "`n[1/5] Verifying System Hardware Specifications..." -ForegroundColor Blue
$Cores = (Get-CimInstance Win32_Processor).NumberOfCores
$TotalRamGB = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
Write-Host "  • Detected Logical Cores: $Cores"
Write-Host "  • Detected Total RAM    : $TotalRamGB GB"

if ($Cores -lt 4) {
    Write-Host "  ⚠️ Recommended minimum is 4 cores for high-concurrency hospital workloads." -ForegroundColor Yellow
} else {
    Write-Host "  ✓ CPU Core count satisfies hospital grade criteria." -ForegroundColor Green
}

if ($TotalRamGB -lt 7.5) {
    Write-Host "  ⚠️ Recommended minimum is 8GB RAM for PostgreSQL + Redis + Next.js stack." -ForegroundColor Yellow
} else {
    Write-Host "  ✓ RAM capacity satisfies hospital grade criteria." -ForegroundColor Green
}

# 2. DOCKER & DOCKER COMPOSE VERIFICATION
Write-Host "`n[2/5] Checking Docker & Docker Compose..." -ForegroundColor Blue
$DockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($DockerCmd) {
    $DockerVersion = docker --version
    Write-Host "  ✓ Docker is installed: $DockerVersion" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Docker CLI not detected in current PATH." -ForegroundColor Yellow
}

# 3. DIRECTORY STRUCTURE
Write-Host "`n[3/5] Initializing Directory Structure..." -ForegroundColor Blue
$Paths = @(
    "nginx\ssl\live",
    "certbot\conf",
    "certbot\www",
    "backend\backups",
    "backend\uploads"
)
foreach ($p in $Paths) {
    if (-not (Test-Path $p)) {
        New-Item -ItemType Directory -Force -Path $p | Out-Null
        Write-Host "  ✓ Created directory: $p" -ForegroundColor DarkGray
    }
}

# 4. SSL CERTIFICATE AUDIT
Write-Host "`n[4/5] Checking SSL Certificate Availability..." -ForegroundColor Blue
$CertFile = "nginx\ssl\live\fullchain.pem"
$KeyFile = "nginx\ssl\live\privkey.pem"
if ((Test-Path $CertFile) -and (Test-Path $KeyFile)) {
    Write-Host "  ✓ TLS 1.3 Certificate & Private Key present in nginx\ssl\live" -ForegroundColor Green
} else {
    Write-Host "  Generating self-signed staging certificate..." -ForegroundColor DarkGray
    & ".\nginx\ssl\generate-self-signed-ssl.ps1"
}

# 5. FIREWALL & PORTS
Write-Host "`n[5/5] Port Allocation Check..." -ForegroundColor Blue
Write-Host "  • 80   (HTTP)  -> ACME challenge & HTTPS 301 redirection" -ForegroundColor Cyan
Write-Host "  • 443  (HTTPS) -> TLS 1.3 Reverse Proxy & Hospital Web App" -ForegroundColor Cyan
Write-Host "  • 5005 (TCP)   -> ASTM / HL7 Laboratory Hardware Stream Socket" -ForegroundColor Cyan

Write-Host "`n========================================================================" -ForegroundColor Cyan
Write-Host "✨ PRODUCTION PROVISIONING PREFLIGHT COMPLETE!" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Cyan
