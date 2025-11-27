#!/bin/bash

# Todify3 本地启动脚本
# 用于同时启动前端和后端服务

echo "🚀 启动 Todify3 项目..."

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
            if [ -f "$log_file" ]; then
                echo "📋 查看错误日志 (最后 20 行):"
                tail -20 "$log_file" | sed 's/^/   /' || true
            fi
            return 1
        fi
        
        # 尝试连接服务（增加超时时间，避免快速失败）
        if curl -s -f --max-time 2 "$url" > /dev/null 2>&1; then
            echo "✅ 服务已就绪: $url"
            return 0
        fi
        
        # 检查日志中是否显示服务已启动
        if [ -f "$log_file" ]; then
            if grep -q "Backend server 已启动\|server.*started\|listening on" "$log_file" 2>/dev/null; then
                # 如果日志显示已启动，再等待2秒后重试一次
                sleep 2
                if curl -s -f --max-time 2 "$url" > /dev/null 2>&1; then
                    echo "✅ 服务已就绪: $url"
                    return 0
                fi
            fi
        fi
        
        # 检查日志中是否有明显的错误
        if [ -f "$log_file" ]; then
            # 检查常见的错误模式
            if grep -i "error\|failed\|cannot\|unable" "$log_file" | tail -1 | grep -v "debug\|info" > /dev/null 2>&1; then
                local last_error=$(grep -i "error\|failed\|cannot\|unable" "$log_file" | tail -1)
                if [ -n "$last_error" ]; then
                    echo "⚠️  检测到可能的错误: $last_error"
                fi
            fi
        fi
        
        # 每5秒显示一次进度
        if [ $((attempt % 5)) -eq 0 ] && [ $attempt -gt 0 ]; then
            echo "   等待中... ($attempt/$max_attempts 秒)"
            # 显示最近的日志（如果有）
            if [ -f "$log_file" ]; then
                local recent_logs=$(tail -3 "$log_file" 2>/dev/null)
                if [ -n "$recent_logs" ]; then
                    echo "   最近日志:"
                    echo "$recent_logs" | sed 's/^/   /' || true
                fi
            fi
        fi
        
        attempt=$((attempt + 1))
        sleep 1
    done
    echo "❌ 服务启动超时: $url"
    if [ -f "$log_file" ]; then
        echo "📋 查看完整日志 (最后 30 行):"
        tail -30 "$log_file" | sed 's/^/   /' || true
    fi
    return 1
}

# 检查端口
echo "🔍 检查端口状态..."
BACKEND_PORT=3003
FRONTEND_PORT=3001

# 函数：清理占用端口的进程
cleanup_port() {
    local port=$1
    local service_name=$2
    local pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo "⚠️  端口 $port 被进程 $pid 占用 ($service_name)"
        # 检查是否是之前的 todify 进程
        local cmd=$(ps -p $pid -o command= 2>/dev/null | head -1)
        if echo "$cmd" | grep -qE "todify|ts-node|node.*backend|node.*frontend"; then
            echo "   检测到可能是之前的 $service_name 进程，正在终止..."
            kill -9 $pid 2>/dev/null
            sleep 1
            # 再次检查
            if ! lsof -ti :$port >/dev/null 2>&1; then
                echo "✅ 端口 $port 已释放"
                return 0
            fi
        else
            echo "   警告: 端口被其他进程占用，请手动处理:"
            echo "   lsof -i :$port"
            echo "   kill -9 $pid"
            return 1
        fi
    fi
    return 0
}

check_port $BACKEND_PORT
backend_port_free=$?
if [ $backend_port_free -ne 0 ]; then
    if ! cleanup_port $BACKEND_PORT "后端服务"; then
        echo "❌ 无法清理端口 $BACKEND_PORT，请手动处理后重试"
        exit 1
    fi
fi

check_port $FRONTEND_PORT
frontend_port_free=$?
if [ $frontend_port_free -ne 0 ]; then
    if ! cleanup_port $FRONTEND_PORT "前端服务"; then
        echo "⚠️  前端端口 $FRONTEND_PORT 被占用，但将继续启动（前端可能稍后启动）"
    fi
fi

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

# 检查后端 .env 文件
if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    echo "⚠️  警告: 后端 .env 文件不存在"
    echo "   创建默认 .env 文件..."
    cat > "$SCRIPT_DIR/backend/.env" << EOF
# 服务器端口配置
PORT=3003

# 数据库配置
DB_TYPE=sqlite
SQLITE_DB_PATH=./data/todify2.db

# 服务器配置
NODE_ENV=development
EOF
    echo "✅ 已创建默认 .env 文件，请根据需要修改配置"
fi

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

# 确保数据库目录存在
if [ -f ".env" ]; then
    # 从 .env 文件中读取数据库路径
    DB_PATH=$(grep "^SQLITE_DB_PATH=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs || echo "./data/todify2.db")
    # 如果路径是相对路径，确保相对于 backend 目录
    if [[ "$DB_PATH" != /* ]]; then
        DB_PATH="$SCRIPT_DIR/backend/$DB_PATH"
    fi
    DB_DIR=$(dirname "$DB_PATH")
    if [ ! -d "$DB_DIR" ]; then
        echo "📁 创建数据库目录: $DB_DIR"
        mkdir -p "$DB_DIR"
    fi
    echo "📂 数据库路径: $DB_PATH"
fi

# 确保日志文件存在
BACKEND_LOG="/tmp/backend.log"
touch "$BACKEND_LOG"

# 清理旧的日志文件
> "$BACKEND_LOG"

# 检查必要的依赖
echo "🔍 检查后端依赖..."
if [ ! -d "node_modules" ]; then
    echo "❌ 后端依赖未安装，请先运行 npm install"
    exit 1
fi

# 检查 TypeScript 编译工具
if ! command -v ts-node-dev &> /dev/null && [ ! -f "node_modules/.bin/ts-node-dev" ]; then
    echo "⚠️  警告: ts-node-dev 未找到，尝试安装..."
    npm install ts-node-dev --save-dev
fi

# 启动服务并捕获 PID
echo "🚀 正在启动后端服务..."
PORT=$BACKEND_PORT npm run dev > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# 等待一小段时间让进程启动
sleep 5

# 检查进程是否还在运行
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ 后端服务启动失败，进程已退出"
    echo "📋 查看日志:"
    cat "$BACKEND_LOG"
    echo ""
    echo "💡 常见问题排查:"
    echo "   1. 检查端口 $BACKEND_PORT 是否被占用: lsof -i :$BACKEND_PORT"
    echo "   2. 检查数据库文件权限"
    echo "   3. 检查 .env 文件配置"
    echo "   4. 检查 node_modules 是否完整: cd backend && npm install"
    exit 1
fi

# 等待后端启动
echo "⏳ 等待后端服务启动..."
if wait_for_service "http://localhost:$BACKEND_PORT/api/health" "$BACKEND_LOG" "$BACKEND_PID"; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败或超时"
    echo ""
    echo "📋 查看完整日志 (最后 50 行):"
    tail -50 "$BACKEND_LOG"
    echo ""
    echo "📋 查看进程状态:"
    ps aux | grep -E "node|ts-node" | grep -v grep || echo "未找到相关进程"
    echo ""
    echo "💡 诊断建议:"
    echo "   1. 检查端口 $BACKEND_PORT 是否被占用: lsof -i :$BACKEND_PORT"
    echo "   2. 检查数据库连接: 查看日志中的数据库错误"
    echo "   3. 检查环境变量: cat backend/.env"
    echo "   4. 手动启动测试: cd backend && PORT=$BACKEND_PORT npm run dev"
    echo ""
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
echo "🎉 Todify3 启动完成!"
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