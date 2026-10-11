@echo off
chcp 65001 >nul
title Manga Library Optimizer
echo ========================================================
echo   Manga Library - PDF Auto Splitter ^& Optimizer
echo ========================================================
echo.
python "%~dp0process_manga.py"
echo.
pause
