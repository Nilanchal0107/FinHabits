@echo off
REM FinHabits Startup Script for Windows

echo ========================================
echo FinHabits - Expense and Habit Tracker
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found!
    echo Please create a .env file with your GEMINI_API_KEY
    echo You can copy .env.example to .env and add your API key
    echo.
    echo Get your free API key from: https://makersuite.google.com/app/apikey
    echo.
    pause
)

REM Initialize database if it doesn't exist
if not exist finhabits.db (
    echo Initializing database...
    python database.py
    echo Database initialized!
    echo.
)

echo Starting FinHabits server...
echo.
echo Open your browser and visit: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

python app.py
