@echo off
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║  Setting up Windows Port Forwarding to WSL                    ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo Adding port forwarding rules...
echo.

netsh interface portproxy add v4tov4 listenport=8000 listenaddress=192.168.137.1 connectport=8000 connectaddress=192.168.206.23
echo ✓ Port 8000 forwarded

netsh interface portproxy add v4tov4 listenport=8001 listenaddress=192.168.137.1 connectport=8001 connectaddress=192.168.206.23
echo ✓ Port 8001 forwarded

echo.
echo Opening Windows Firewall...
echo.

netsh advfirewall firewall add rule name="CUB Port 8000" dir=in action=allow protocol=TCP localport=8000
echo ✓ Firewall rule added for port 8000

netsh advfirewall firewall add rule name="CUB Port 8001" dir=in action=allow protocol=TCP localport=8001
echo ✓ Firewall rule added for port 8001

echo.
echo ═══════════════════════════════════════════════════════════════
echo   ✅ Setup Complete!
echo ═══════════════════════════════════════════════════════════════
echo.

echo Current port forwarding rules:
netsh interface portproxy show all

echo.
echo Now test from your phone browser:
echo   http://192.168.137.1:8000/health
echo.
pause
