@echo off
setlocal

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker was not found. Please install and start Docker Desktop first.
  pause
  exit /b 1
)

echo Starting ReadingHelper Agent with Docker Compose...
echo The browser will open http://localhost:8080 shortly.
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 8; Start-Process 'http://localhost:8080'"
docker compose up --build

echo.
echo Application stopped.
pause
