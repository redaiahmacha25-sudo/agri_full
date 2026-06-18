@echo off
setlocal enabledelayedexpansion

REM ================================================================
REM AgriConnect — Run full stack with minimal/no manual steps
REM Starts:
REM 1) Backend (Node/Express)
REM 2) Frontend static server
REM 3) Optional: wait for backend / health endpoint
REM ================================================================

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

set "BACKEND_PORT=5000"
set "FRONTEND_API_PORT=5000"
set "FRONTEND_PORT=5500"

REM Ensure uploads dir exists
if not exist "%BACKEND%\uploads" mkdir "%BACKEND%\uploads"

REM Install backend dependencies if node_modules missing
if not exist "%BACKEND%\node_modules" (
  echo Installing backend dependencies...
  cd /d "%BACKEND%" && npm install
)

REM Ensure backend .env exists (don’t read its contents; just ensure file is present)
if not exist "%BACKEND%\.env" (
  if exist "%BACKEND%\.env.example" (
    echo Creating backend .env from .env.example...
    copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
  )
)

REM Start backend
set "BACKEND_STARTED=0"

cd /d "%BACKEND%"
start "agri-backend" /b cmd /c "node server.js"

REM Wait for health endpoint
echo Waiting for backend to become ready on http://localhost:!BACKEND_PORT!/api/health ...
for /l %%i in (1,1,60) do (
  curl -s "http://localhost:!BACKEND_PORT!/api/health" >nul 2>&1
  if !errorlevel! equ 0 (
    set "BACKEND_STARTED=1"
    goto :frontend
  )
  timeout /t 1 >nul
)

echo Backend did not become ready within expected time.
echo Continuing anyway...

:frontend
REM Serve frontend
REM Use a simple static server (npx serve) if available.
if not exist "%FRONTEND%\node_modules" (
  REM no-op; frontend is static
)

echo Starting frontend static server at http://localhost:!FRONTEND_PORT!/ ...

REM Install local serve if not present
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found in PATH. Install Node.js first.
  exit /b 1
)



cd /d "%FRONTEND%"
start "agri-frontend" /b cmd /c "node -e \"const http=require('http'),fs=require('fs'),path=require('path');const root=process.cwd();const port=process.env.PORT||!FRONTEND_PORT!;http.createServer((req,res)=>{let u=(req.url||'/').split('?')[0];if(u.endsWith('/')) u+='index.html';u=u.replace(/\\.\\./g,'');const fp=path.join(root,u);fs.readFile(fp,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found');}const ext=path.extname(fp).toLowerCase();const m={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json'};res.writeHead(200,{'Content-Type':m[ext]||'application/octet-stream'});res.end(d);});}).listen(port,()=>console.log('Frontend on http://localhost:'+port));\""

echo.
echo Backend URL:   http://localhost:!BACKEND_PORT!/api/health
echo Frontend URL:  http://localhost:!FRONTEND_PORT!/ 

echo.
echo Done. Backend and frontend should now be running.\


