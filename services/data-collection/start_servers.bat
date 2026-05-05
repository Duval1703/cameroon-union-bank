@echo off
REM CUB Data Collection Agent - Windows Start Script

echo ========================================
echo CUB Data Collection Agent - Startup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo Installing dependencies...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo Dependencies installed successfully
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP:~1%

echo Your computer's IP address: %LOCAL_IP%
echo.
echo MOBILE ACCESS INSTRUCTIONS:
echo 1. Make sure your phone is on the same WiFi network
echo 2. Open your phone's browser and go to:
echo    http://%LOCAL_IP%:8000/consent/pending
echo 3. This is where you'll approve data requests
echo.
echo DESKTOP ACCESS:
echo - CUB Agent Dashboard: http://localhost:8001
echo - MTN/Orange Server: http://localhost:8000
echo.
echo ========================================
echo Starting servers...
echo.

REM Create logs directory
if not exist logs mkdir logs

echo Starting MTN/Orange Money Server (Port 8000)...
start /B python mtn_orange_server.py > logs\mtn_orange.log 2>&1

REM Wait for first server to start
timeout /t 2 /nobreak >nul

echo Starting CUB Data Collection Agent (Port 8001)...
start /B python cub_data_agent.py > logs\cub_agent.log 2>&1

REM Wait for servers to fully start
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Both servers are running!
echo.
echo QUICK START GUIDE:
echo 1. Open http://localhost:8001 in your browser
echo 2. Fill in the form with a phone number (e.g., +237670123456)
echo 3. Select a provider (MTN or Orange)
echo 4. Click 'Request Data Collection'
echo 5. On your phone, open http://%LOCAL_IP%:8000/consent/pending
echo 6. Click 'Approve' to send the data
echo 7. Watch the data appear on the CUB dashboard!
echo.
echo Press any key to stop the servers...
echo ========================================
pause >nul

REM Kill Python processes (this will stop both servers)
taskkill /F /IM python.exe /T >nul 2>&1
echo.
echo Servers stopped.
pause
