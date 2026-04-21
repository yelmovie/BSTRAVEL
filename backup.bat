@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul

set "SRC=D:\BSTRAVEL"
set "ROOT=D:\backup"

if not exist "%SRC%\" (
  echo [ERROR] Source not found: %SRC%
  pause
  exit /b 1
)

if not exist "%ROOT%\" mkdir "%ROOT%"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd"') do set "D=%%i"
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format HHmm"') do set "T=%%i"

set "DEST=%ROOT%\BSTRAVEL_%D%"
if exist "!DEST!\" (
  set "DEST=%ROOT%\BSTRAVEL_%D%_%T%"
)

if exist "!DEST!\" (
  echo [ERROR] Backup folder already exists: !DEST!
  echo Run again in one minute or delete that folder manually.
  pause
  exit /b 1
)

mkdir "!DEST!"
if errorlevel 1 (
  echo [ERROR] Cannot create !DEST!
  pause
  exit /b 1
)

echo Backing up...
echo   From: %SRC%
echo   To:   !DEST!
echo   Excluding: node_modules, dist

robocopy "%SRC%" "!DEST!" /E /XD node_modules dist /NFL /NDL /NJH /NJS /nc /ns /np
set "RC=!ERRORLEVEL!"
if !RC! GEQ 8 (
  echo [ERROR] robocopy failed (code !RC!)
  pause
  exit /b 1
)

echo.
echo Backup complete: !DEST!
pause
exit /b 0
