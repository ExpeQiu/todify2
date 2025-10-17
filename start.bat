@echo off
chcp 65001 >nul
title Todify2 启动器

echo 🚀 启动 Todify2 项目...

REM 检查是否安装了 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 检查是否安装了 npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 npm，请先安装 npm
    pause
    exit /b 1
)

REM 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"

echo 📦 检查后端依赖...
cd /d "%SCRIPT_DIR%backend"
if not exist "node_modules" (
    echo 📥 安装后端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 后端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 后端依赖已存在
)

echo 📦 检查前端依赖...
cd /d "%SCRIPT_DIR%frontend"
if not exist "node_modules" (
    echo 📥 安装前端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 前端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 前端依赖已存在
)

echo 🎯 启动服务...

REM 启动后端服务
echo 🔧 启动后端服务 (端口: 3000)...
cd /d "%SCRIPT_DIR%backend"
start "Todify2-Backend" cmd /k "npm run dev"

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端服务
echo 🎨 启动前端服务 (端口: 5173)...
cd /d "%SCRIPT_DIR%frontend"
start "Todify2-Frontend" cmd /k "npm run dev"

REM 等待前端启动
timeout /t 5 /nobreak >nul

echo.
echo 🎉 Todify2 启动完成!
echo 📱 前端地址: http://localhost:5173
echo 🔧 后端地址: http://localhost:3000
echo.
echo 按任意键退出启动器...
pause >nul