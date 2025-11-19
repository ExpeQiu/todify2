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

# 函数：等待服务启动
wait_for_service() {
    local url=$1
    local log_file=$2
    local pid=$3
    local max_attempts=60
    local attempt=0
    
    echo "⏳ 等待服务启动: $url"
    while [ $attempt -lt $max_attempts ]; do
        # 检查进程是否还在运行
        if ! kill -0 $pid 2>/dev/null; then
            echo "❌ 服务进程已退出"
            return 1
        fi
        
        # 尝试连接服务
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ 服务已就绪: $url"
            return 0
        fi
        
        # 每5秒显示一次进度
        if [ $((attempt % 5)) -eq 0 ] && [ $attempt -gt 0 ]; then
            echo "   等待中... ($attempt/$max_attempts 秒)"
            # 显示最近的日志（如果有）
            if [ -f "$log_file" ]; then
                echo "   最近日志:"
                tail -3 "$log_file" | sed 's/^/   /' || true
            fi
        fi
        
        attempt=$((attempt + 1))
        sleep 1
    done
    echo "❌ 服务启动超时: $url"
    return 1
}

# 检查端口
echo "🔍 检查端口状态..."
BACKEND_PORT=3003
FRONTEND_PORT=3001

check_port $BACKEND_PORT
backend_port_free=$?
check_port $FRONTEND_PORT
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

# 修复后端依赖（ARM64架构兼容性）
fix_backend_dependencies() {
    local dir=$1
    echo "🔧 检查后端依赖兼容性..."
    cd "$dir"
    
    # 检查架构
    ARCH=$(uname -m)
    if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "arm64e" ]; then
        echo "📱 检测到 ARM64 架构，检查 sqlite3 模块..."
        
        # 检查 sqlite3 是否需要重建
        if [ -d "node_modules/sqlite3" ]; then
            echo "🔨 重建 sqlite3 模块以支持 ARM64..."
            npm rebuild sqlite3
            if [ $? -ne 0 ]; then
                echo "⚠️  sqlite3 重建失败，尝试重新安装..."
                npm install sqlite3 --force
            fi
        fi
        
        # 检查 @jridgewell/sourcemap-codec 模块
        if [ -d "node_modules/@jridgewell/sourcemap-codec" ]; then
            if [ ! -f "node_modules/@jridgewell/sourcemap-codec/dist/sourcemap-codec.umd.js" ]; then
                echo "🔨 修复 @jridgewell/sourcemap-codec 模块..."
                npm install @jridgewell/sourcemap-codec --force
            fi
        fi
    fi
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 安装后端依赖
install_dependencies "$SCRIPT_DIR/backend" "后端"

# 修复后端依赖兼容性问题
fix_backend_dependencies "$SCRIPT_DIR/backend"

# 安装前端依赖
install_dependencies "$SCRIPT_DIR/frontend" "前端"

# 检查前端是否缺少 reactflow
if [ ! -d "$SCRIPT_DIR/frontend/node_modules/reactflow" ]; then
    echo "📥 安装缺失的 reactflow 依赖..."
    cd "$SCRIPT_DIR/frontend"
    npm install reactflow
fi

echo "🎯 启动服务..."

# 启动后端服务
echo "🔧 启动后端服务 (端口: $BACKEND_PORT)..."
cd "$SCRIPT_DIR/backend"

# 确保日志文件存在
BACKEND_LOG="/tmp/backend.log"
touch "$BACKEND_LOG"

# 启动服务并捕获 PID
PORT=$BACKEND_PORT npm run dev > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# 等待一小段时间让进程启动
sleep 2

# 检查进程是否还在运行
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ 后端服务启动失败，进程已退出"
    echo "📋 查看日志:"
    cat "$BACKEND_LOG"
    exit 1
fi

# 等待后端启动
echo "⏳ 等待后端服务启动..."
if wait_for_service "http://localhost:$BACKEND_PORT/api/health" "$BACKEND_LOG" "$BACKEND_PID"; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    echo "📋 查看完整日志:"
    cat "$BACKEND_LOG"
    echo ""
    echo "📋 查看进程状态:"
    ps aux | grep -E "node|ts-node" | grep -v grep || echo "未找到相关进程"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动前端服务
echo "🎨 启动前端服务 (端口: $FRONTEND_PORT)..."
cd "$SCRIPT_DIR/frontend"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# 等待前端启动
sleep 3

echo ""
echo "=========================================="
echo "🎉 Todify2 启动完成!"
echo "=========================================="
echo "📱 前端地址: http://localhost:$FRONTEND_PORT"
echo "🔧 后端地址: http://localhost:$BACKEND_PORT"
echo ""
echo "📋 日志文件:"
echo "   后端: $BACKEND_LOG"
echo "   前端: /tmp/frontend.log"
echo ""
echo "💡 提示: 使用以下命令查看实时日志:"
echo "   tail -f $BACKEND_LOG"
echo "   tail -f /tmp/frontend.log"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "=========================================="

# 捕获 Ctrl+C 信号
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ 服务已停止"; exit 0' INT

# 等待进程结束
wait