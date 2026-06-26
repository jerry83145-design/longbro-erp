$ErrorActionPreference = "Stop"

$toolRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $toolRoot "download-organizer.pid"
$starter = Join-Path $toolRoot "start-download-organizer.bat"

if (Test-Path -LiteralPath $pidFile) {
  $rawPid = (Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
  $organizerPid = 0
  if ([int]::TryParse([string]$rawPid, [ref]$organizerPid)) {
    $process = Get-Process -Id $organizerPid -ErrorAction SilentlyContinue
    if ($process) {
      Stop-Process -Id $organizerPid -Force
      Start-Sleep -Milliseconds 800
    }
  }
  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

Start-Process -FilePath $starter -WindowStyle Hidden
