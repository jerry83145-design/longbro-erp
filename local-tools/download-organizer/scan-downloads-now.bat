@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0download-organizer.ps1" -ScanOnce -NoPrompt
endlocal
