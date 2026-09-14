# One-time permanent-tunnel setup — run AFTER adding a domain to your
# Cloudflare account.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File setup-permanent-tunnel.ps1 -Domain yourdomain.com -Subdomain jobs
#
# Prerequisites (one-time, interactive):
#   cloudflared.exe tunnel login          # opens browser, pick your domain
#
# What this does:
#   1. creates a NAMED tunnel "jobapply" (reserved under YOUR account)
#   2. writes ~/.cloudflared/config.yml pointing jobs.<domain> -> localhost:8123
#   3. routes DNS (CNAME) automatically
#   4. starts the tunnel with the same keepalive behavior as the quick one
#
# After this, the URL https://jobs.<domain> NEVER changes again —
# it survives reboots and works whenever this PC is on.

param(
    [Parameter(Mandatory = $true)][string]$Domain,
    [string]$Subdomain = "jobs"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$cfd  = Join-Path $root "tools\bin\cloudflared.exe"
$hostname = "$Subdomain.$Domain"

Write-Host "=== JobApply AI - permanent tunnel setup for $hostname ==="

# 1. login check / interactive login
$certOk = (& $cfd tunnel list) -notmatch "Cannot determine default origin|You need to specify"
if (-not $certOk) {
    Write-Host "Opening browser for one-time Cloudflare login (pick your domain $Domain)..."
    & $cfd tunnel login
}

# 2. create the named tunnel (idempotent)
$existing = & $cfd tunnel list 2>$null | Select-String "jobapply"
if (-not $existing) {
    & $cfd tunnel create jobapply
    Write-Host "Created tunnel 'jobapply'."
} else {
    Write-Host "Tunnel 'jobapply' already exists - reusing it."
}

# 3. config.yml
$ingress = @"
tunnel: jobapply
credentials-file: $env:USERPROFILE\.cloudflared\jobapply.json

ingress:
  - hostname: $hostname
    service: http://localhost:8123
  - service: http_status:404
"@
Set-Content -Path "$env:USERPROFILE\.cloudflared\config.yml" -Value $ingress
Write-Host "Wrote $env:USERPROFILE\.cloudflared\config.yml"

# 4. DNS route (idempotent; overwrites existing record pointing elsewhere)
& $cfd tunnel route dns -f jobapply $hostname

# 5. start it now (keepalive script will keep it alive from next logon)
$running = Get-Process cloudflared -ErrorAction SilentlyContinue
if ($running) { Stop-Process -Name cloudflared -Force }
Start-Process -FilePath $cfd `
    -ArgumentList 'tunnel','run','jobapply' `
    -WorkingDirectory $root -WindowStyle Hidden

Set-Content -Path (Join-Path $PSScriptRoot 'CURRENT_URL.txt') -Value "https://$hostname"
Write-Host ""
Write-Host "=== DONE. Your permanent link: https://$hostname ==="
Write-Host "It survives reboots. The scheduled 'JobApply KeepAlive' task restarts it at every logon."
Write-Host "Update your bookmark / WhatsApp link once - it never changes again."
