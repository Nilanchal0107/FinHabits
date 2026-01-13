#!/bin/bash
# FinHabits Startup Script for Linux/Mac

echo "========================================"
echo "FinHabits - Expense and Habit Tracker"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "WARNING: .env file not found!"
    echo "Please create a .env file with your GEMINI_API_KEY"
    echo "You can copy .env.example to .env and add your API key"
    echo ""
    echo "Get your free API key from: https://makersuite.google.com/app/apikey"
    echo ""
    read -p "Press enter to continue..."
fi

# Initialize database if it doesn't exist
if [ ! -f finhabits.db ]; then
    echo "Initializing database..."
    python3 database.py
    echo "Database initialized!"
    echo ""
fi

echo "Starting FinHabits server..."
echo ""
echo "Open your browser and visit: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 app.py
