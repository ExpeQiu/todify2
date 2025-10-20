#!/bin/bash

# Todify2 本地启动脚本
# 用于同时启动前端和后端服务

echo "🚀 启动 Todify2 项目..."

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查是否安装了 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 npm"
    exit 1
fi

# 函数：检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  警告: 端口 $port 已被占用"
        return 1
    fi
    return 0
}

# 检查端口
echo "🔍 检查端口状态..."
check_port 3000
backend_port_free=$?
check_port 5173
frontend_port_free=$?

# 安装依赖函数
install_dependencies() {
    local dir=$1
    local name=$2
    
    echo "📦 检查 $name 依赖..."
    cd "$dir"
    
    if [ ! -d "node_modules" ]; then
        echo "📥 安装 $name 依赖..."
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ $name 依赖安装失败"
            exit 1
        fi
    else
        echo "✅ $name 依赖已存在"
    fi
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 安装后端依赖
install_dependencies "$SCRIPT_DIR/backend" "后端"

# 安装前端依赖
install_dependencies "$SCRIPT_DIR/frontend" "前端"

echo "🎯 启动服务..."

# 启动后端服务
echo "🔧 启动后端服务 (端口: 3001)..."
cd "$SCRIPT_DIR/backend"
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务
echo "🎨 启动前端服务 (端口: 3000)..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# 等待前端启动
sleep 5

echo ""
echo "🎉 Todify2 启动完成!"
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获 Ctrl+C 信号
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ 服务已停止"; exit 0' INT

# 等待进程结束
wait