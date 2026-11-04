@echo off
chcp 65001 >nul
title Manga Library - R2 Cloud Sync
echo ========================================================
echo   Manga Library - Metadata Builder ^& Cloudflare R2 Sync
echo ========================================================
echo.
python "%~dp0process_manga.py"
echo.
pause
