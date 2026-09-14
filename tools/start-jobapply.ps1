# JobApply AI - start/keepalive script.
# Starts the FastAPI server and a Cloudflare quick tunnel if they are not
# already running. Safe to run repeatedly (scheduled task at logon).
# The current public URL is written to tools\CURRENT_URL.txt and the log.

$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path -Parent $PSScriptRoot   # JobApply-AI/
$logs = Join-Path $root ".freebuff"
New-Item -ItemType Directory -Force -Path $logs | Out-Null
$py  = Join-Path $root ".venv\Scripts\python.exe"
$cfd = Join-Path $root "tools\bin\cloudflared.exe"

# ---- 1. App server -------------------------------------------------------
$portListening = Get-NetTCPConnection -LocalPort 8123 -State Listen -ErrorAction SilentlyContinue
if (-not $portListening) {
    Start-Process -FilePath $py `
        -ArgumentList '-m','uvicorn','backend.main:app','--host','0.0.0.0','--port','8123' `
        -WorkingDirectory $root `
        -RedirectStandardOutput (Join-Path $logs 'server.log') `
        -RedirectStandardError  (Join-Path $logs 'server.err.log') `
        -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# ---- 2. Quick tunnel -----------------------------------------------------
$tlog = Join-Path $logs "tunnel.log"
$tunnelRunning = Get-Process cloudflared -ErrorAction SilentlyContinue
if (-not $tunnelRunning) {
    Start-Process -FilePath $cfd `
        -ArgumentList 'tunnel','--url','http://127.0.0.1:8123','--no-autoupdate' `
        -WorkingDirectory $root `
        -RedirectStandardOutput $tlog `
        -RedirectStandardError  ($tlog + '.err') `
        -WindowStyle Hidden
    Start-Sleep -Seconds 8
}

# Resolve the current public URL: tunnel log first, else CURRENT_URL.txt
$url = $null
foreach ($f in @($tlog, ($tlog + '.err'))) {
    if (Test-Path $f) {
        $m = Select-String -Path $f -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' |
             Select-Object -Last 1
        if ($m) { $url = $m.Matches[0].Value; break }
    }
}
$urlFile = Join-Path $PSScriptRoot 'CURRENT_URL.txt'
if (-not $url -and (Test-Path $urlFile)) {
    $url = (Get-Content $urlFile -Raw).Trim()
}
if ($url) {
    Set-Content -Path $urlFile -Value $url
}

# ---- 3. Desktop shortcut (always reflects the current URL) ---------------
if ($url) {
    $desktop = [Environment]::GetFolderPath('Desktop')
    $scPath  = Join-Path $desktop 'JobApply AI (public link).url'
    $ico     = Join-Path $root 'frontend\icons\icon.ico'
    $needsWrite = $true
    if (Test-Path $scPath) {
        if ((Get-Content $scPath -Raw) -match [regex]::Escape($url)) { $needsWrite = $false }
    }
    if ($needsWrite) {
        "[InternetShortcut]`r`nURL=$url`r`nIconIndex=0`r`nIconFile=$ico`r`n" |
            Set-Content -Path $scPath -Encoding ASCII
        "$(Get-Date -Format s)  desktop shortcut -> $url" |
            Add-Content (Join-Path $logs 'keepalive.log')
    }
}

# ---- 4. Health check -----------------------------------------------------
try {
    $h = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8123/health' -TimeoutSec 5
    "$(Get-Date -Format s)  health=$($h.StatusCode)" |
        Add-Content (Join-Path $logs 'keepalive.log')
} catch {
    "$(Get-Date -Format s)  health=DOWN" | Add-Content (Join-Path $logs 'keepalive.log')
}
