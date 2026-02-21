@echo off
echo ==========================================
echo Starting Archive.org Downloader
echo ==========================================

:: Start the FastAPI backend in a new minimized command prompt
echo Starting Backend Server...
cd web_api
start "Archive API" /MIN cmd /c "python -m uvicorn main:app --reload"
cd ..

:: Start the Vite frontend in a new minimized command prompt
echo Starting Frontend Server...
cd web_ui
start "Archive UI" /MIN cmd /c "npm run dev"
cd ..

:: Wait for a few seconds to let servers spin up
echo Waiting for servers to start...
timeout /t 5 /nobreak > NUL

:: Open the browser to the local frontend
echo Opening Browser...
start http://localhost:5174

echo Done! You can close this window.
exit
