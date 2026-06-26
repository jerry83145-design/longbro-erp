@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0download-organizer.ps1" -Silent
endlocal
