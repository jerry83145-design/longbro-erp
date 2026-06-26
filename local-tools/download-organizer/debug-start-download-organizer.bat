@echo off
setlocal
echo Starting download organizer...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0download-organizer.ps1"
echo.
echo If you see this line, the organizer has stopped.
pause
endlocal
