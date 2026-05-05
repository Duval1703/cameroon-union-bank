@echo off
echo ============================================================
echo   CUB Platform - Database Setup
echo ============================================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL is not installed
    echo Please install PostgreSQL and try again
    pause
    exit /b 1
)

echo ✅ PostgreSQL found
echo.

REM Database configuration
set DB_NAME=cub_database
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

echo 📊 Database Configuration:
echo    Database: %DB_NAME%
echo    User: %DB_USER%
echo    Host: %DB_HOST%
echo    Port: %DB_PORT%
echo.

REM Create database
echo Creating database '%DB_NAME%'...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -c "CREATE DATABASE %DB_NAME%;" 2>nul

if errorlevel 1 (
    echo ⚠️  Database may already exist (this is OK)
) else (
    echo ✅ Database created successfully
)

echo.
echo Running database schema...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f database_schema.sql

if errorlevel 1 (
    echo ❌ Failed to create database schema
    pause
    exit /b 1
)

echo ✅ Database schema created successfully
echo.
echo ============================================================
echo ✅ Database setup complete!
echo ============================================================
echo.
echo Next steps:
echo   1. Update .env file with your database credentials
echo   2. Install Python dependencies: pip install -r requirements.txt
echo   3. Start the backend: python main.py
echo.
pause
