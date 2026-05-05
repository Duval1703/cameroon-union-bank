@echo off
echo ======================================================================
echo   🏦 CUB SMS Data Collection Agent - Startup Script
echo ======================================================================
echo.
echo   📱 Mechanism 2: SMS-Based Data Collection
echo   Fallback when direct API access to MTN/Orange is unavailable
echo.
echo ======================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python is not installed
    echo Please install Python and try again
    pause
    exit /b 1
)

REM Check dependencies
echo 📦 Checking dependencies...
python -c "import fastapi, pydantic, uvicorn" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Missing dependencies detected
    echo Installing required packages...
    pip install fastapi pydantic uvicorn httpx
)

echo ✅ Dependencies OK
echo.

REM Start the SMS Collection Agent
echo 🚀 Starting SMS Data Collection Agent...
echo.
echo    Dashboard: http://localhost:8004
echo    API Docs:  http://localhost:8004/docs
echo.
echo ======================================================================
echo.

python sms_collection_agent.py
