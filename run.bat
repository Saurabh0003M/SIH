@echo off
setlocal enabledelayedexpansion
title Disha Demo Launcher - SIH 2026 PS 26202

cd /d "%~dp0"

echo ============================================================
echo   Starting Disha - on-page guidance that fades
echo ============================================================

:: --- Prerequisite: Python 3 on PATH (only needed to serve files) --------
set "PY="
where python >nul 2>&1 && set "PY=python"
if not defined PY where py >nul 2>&1 && set "PY=py"
if not defined PY goto :nopython

:: --- Free the three ports ------------------------------------------------
echo [1/3] Checking ports 8777, 8931 and 8778...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8777" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8931" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8778" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

:: --- Start the three static servers --------------------------------------
:: Nothing is built and nothing is installed: Disha is plain JavaScript, so
:: these are only file servers. No network call leaves this machine unless a
:: model key is configured.
echo [2/3] Starting the demo harness, the portal and the explainer...
start "Disha-Demo"      /min cmd /c "!PY! -m http.server 8777 --directory prototype\guide-dots"
start "Disha-Portal"    /min cmd /c "!PY! -m http.server 8931 --directory platform"
start "Disha-Explainer" /min cmd /c "!PY! -m http.server 8778 --directory explainer"

echo [3/3] Waiting for the servers to come up...
timeout /t 3 /nobreak >nul

echo.
echo Opening the portal...
start "" http://localhost:8931/practice.html

cls
echo ============================================================
echo   DISHA IS RUNNING
echo ============================================================
echo.
echo   1. THE STUDENT PORTAL - demo this one
echo      http://localhost:8931/practice.html
echo      Vidya Setu, a student assistance portal. Type a goal into Disha:
echo        renew my scholarship for this year        (goes GREEN)
echo        apply for a scholarship                   (goes AMBER - three Apply buttons)
echo        complain that my application was rejected (link is off screen - arrow first)
echo.
echo   2. THE PRODUCT PORTAL - what Disha is, for a judge who wants to read
echo      http://localhost:8931/index.html
echo      Architecture:  http://localhost:8931/architecture.html
echo      Modules:       http://localhost:8931/modules.html
echo.
echo   3. THE PRACTICE BROKER - the older sandbox, four-step chain
echo      http://localhost:8777/demo/index.html
echo      Try:  i want to take my money out
echo.
echo   4. HANDS-FREE, IF YOU DO NOT WANT TO TYPE ON STAGE
echo      http://localhost:8777/demo/index.html?auto=1
echo      One scene:  ...?auto=1^&scene=chain
echo      Scenes: chain ^| red-verify ^| nav ^| fade
echo.
echo   5. HOW THE DOT IS CHOSEN - the numbers behind one decision
echo      http://localhost:8778/how-the-dot-is-chosen.html
echo.
echo ============================================================
echo   [!] Keep this window OPEN during the demo.
echo   Press any key to STOP all servers and exit...
echo ============================================================
pause >nul

echo.
echo Shutting down...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8777" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8931" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8778" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo Done. All servers stopped.
timeout /t 1 /nobreak >nul
exit /b 0

:nopython
echo.
echo [ERROR] Python 3 was not found on PATH.
echo         Install it from python.org (tick "Add python.exe to PATH") and re-run.
echo.
echo         Disha itself needs no Python - it is plain JavaScript. Python is
echo         used here only to serve the files over http, because a browser
echo         will not run an extension's content script from a file:// page.
pause >nul
exit /b 1
