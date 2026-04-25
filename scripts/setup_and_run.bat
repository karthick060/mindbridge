@echo off
:: ═══════════════════════════════════════════════════════════════════
::  MindBridge — One-Command Setup & Run Script (Windows)
::  Double-click this file, or run it from Command Prompt / VS Code terminal
:: ═══════════════════════════════════════════════════════════════════
title MindBridge Setup

echo.
echo  ================================
echo    MindBridge - Mental Health AI
echo  ================================
echo.

SET ROOT=%~dp0..
SET BACKEND=%ROOT%\backend
SET FRONTEND=%ROOT%\frontend

:: Check Python
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found. Install from https://python.org
    pause & exit /b 1
)
echo [OK] Python found

:: Check Node
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)
echo [OK] Node.js found

:: Backend setup
echo.
echo [1/4] Setting up Python backend...
cd /d "%BACKEND%"

IF NOT EXIST venv (
    python -m venv venv
    echo [OK] Virtual environment created
)

call venv\Scripts\activate.bat

pip install --quiet --upgrade pip
pip install --quiet Django==4.2.9 djangorestframework==3.14.0 django-cors-headers==4.3.1 channels==4.0.0 daphne==4.0.0 whitenoise==6.6.0
echo [OK] Python dependencies installed

echo.
echo [2/4] Setting up database...
python manage.py makemigrations users chat moderation dashboard --no-input 2>nul
python manage.py makemigrations --no-input 2>nul
python manage.py migrate --no-input
echo [OK] Database ready

python manage.py seed_rooms
echo [OK] Sample data loaded

:: Frontend setup
echo.
echo [3/4] Installing frontend dependencies...
cd /d "%FRONTEND%"
IF NOT EXIST node_modules (
    npm install
    echo [OK] Node dependencies installed
) ELSE (
    echo [OK] Dependencies already installed
)

:: Start servers
echo.
echo [4/4] Starting servers...
echo.
echo  Backend  - http://localhost:8000
echo  Frontend - http://localhost:3000
echo.
echo  Your browser will open automatically.
echo  Press Ctrl+C to stop.
echo.

:: Start backend in new window
cd /d "%BACKEND%"
start "MindBridge Backend" cmd /k "venv\Scripts\activate && python manage.py runserver 8000"

:: Wait then start frontend
timeout /t 3 /nobreak >nul
cd /d "%FRONTEND%"
npm start

pause
