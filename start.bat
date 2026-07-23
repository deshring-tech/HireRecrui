@echo off
cd /d "%~dp0"

if not exist node_modules (
    echo Installing dependencies, this only happens once...
    call npm install
)

echo Starting HireFlow AI...
start "HireFlow AI Server" cmd /k npm run dev

timeout /t 6 /nobreak >nul
start "" http://localhost:3000

echo.
echo HireFlow AI is starting at http://localhost:3000
echo A separate window is running the server - close it to stop the app.
