<#
.SYNOPSIS
    Generates high-entropy RSA 2048-bit SAN certificates for staging & local TLS 1.3
.DESCRIPTION
    Cross-platform PowerShell generator for LabCore ELIS OS self-signed SSL/TLS certificates.
#>
[CmdletBinding()]
param(
    [string]$Domain = "elis.yourhospital.com",
    [int]$DaysValid = 365
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetDir = Join-Path $ScriptDir "live"

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
}

$KeyPath = Join-Path $TargetDir "privkey.pem"
$CertPath = Join-Path $TargetDir "fullchain.pem"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🔐 Generating Self-Signed TLS 1.3 Certificate for: $Domain" -ForegroundColor Green
Write-Host "📁 Destination: $TargetDir" -ForegroundColor DarkGray
Write-Host "=================================================================" -ForegroundColor Cyan

# Locate OpenSSL
$OpenSslPath = $null
$PathMatch = Get-Command openssl -ErrorAction SilentlyContinue
if ($PathMatch) {
    $OpenSslPath = $PathMatch.Source
} elseif (Test-Path "C:\Program Files\Git\usr\bin\openssl.exe") {
    $OpenSslPath = "C:\Program Files\Git\usr\bin\openssl.exe"
}

if ($OpenSslPath) {
    & $OpenSslPath req -x509 `
        -newkey rsa:2048 `
        -nodes `
        -sha256 `
        -keyout $KeyPath `
        -out $CertPath `
        -days $DaysValid `
        -subj "/C=IN/ST=Karnataka/L=Bengaluru/O=LabCore ELIS/OU=Medical Systems/CN=$Domain" `
        -addext "subjectAltName=DNS:$Domain,DNS:localhost,IP:127.0.0.1"
    
    Write-Host "✅ Generated: $CertPath" -ForegroundColor Green
    Write-Host "✅ Generated: $KeyPath" -ForegroundColor Green
    Write-Host "✨ Certificate successfully created for $Domain (Valid for $DaysValid days)" -ForegroundColor Green
} else {
    Write-Error "OpenSSL binary not found in PATH or Git. Please install OpenSSL."
}
