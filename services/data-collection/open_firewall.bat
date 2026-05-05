@echo off
echo Opening Windows Firewall ports for CUB servers...
echo.

REM Open port 8000 for MTN/Orange server
netsh advfirewall firewall add rule name="CUB MTN Server Port 8000" dir=in action=allow protocol=TCP localport=8000
echo Port 8000 opened

REM Open port 8001 for CUB Agent
netsh advfirewall firewall add rule name="CUB Agent Port 8001" dir=in action=allow protocol=TCP localport=8001
echo Port 8001 opened

echo.
echo Firewall rules added successfully!
echo.
echo You can now test from your phone:
echo   http://192.168.137.1:8000/health
echo   http://192.168.137.1:8001
echo.
pause
