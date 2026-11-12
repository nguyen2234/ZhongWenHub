@echo off
setlocal
title ZhongWenHub — HSK 1-4 Standard Course Downloader
echo ===============================================================================
echo          ZHONGWENHUB — HSK 1-4 STANDARD COURSE 2.0 RESOURCE DOWNLOADER
echo ===============================================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Download-HSK-All.ps1" %*

echo.
echo ===============================================================================
echo Qua trinh hoan tat. Nhan phim bat ky de thoat...
pause >nul
