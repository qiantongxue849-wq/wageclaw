@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [WageClaw] 正在构建核心脚本并启动桌面端...
call node scripts\build-core.mjs
call "node_modules\.bin\electron.cmd" .
pause
