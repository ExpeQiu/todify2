#!/bin/bash

# Todify4 停止脚本
# 用于停止前端和后端服务

echo "🛑 停止 Todify4 服务..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT=3003
FRONTEND_PORT=3001
stopped_count=0

stop_port_service() {
    local port=$1
    local service_name=$2
    local pids
    pids=$(lsof -tiTCP:$port -sTCP:LISTEN 2>/dev/null || true)

    if [ -z "$pids" ]; then
        echo "✅ $service_name 端口 $port 未被占用"
        return 0
    fi

    local stopped_this_service=0
    for pid in $pids; do
        local cmd
        cmd=$(ps -p "$pid" -o command= 2>/dev/null || true)

        # 仅停止当前项目相关进程，避免误杀其他服务
        if echo "$cmd" | grep -q "$SCRIPT_DIR"; then
            echo "🔧 停止 $service_name 进程: PID=$pid"
            kill "$pid" 2>/dev/null || true
            sleep 1

            if kill -0 "$pid" 2>/dev/null; then
                echo "⚠️  进程未退出，强制停止: PID=$pid"
                kill -9 "$pid" 2>/dev/null || true
            fi

            stopped_this_service=1
            stopped_count=$((stopped_count + 1))
        else
            echo "⚠️  跳过非项目进程 (端口 $port): PID=$pid"
            echo "   命令: $cmd"
        fi
    done

    if [ $stopped_this_service -eq 1 ]; then
        if lsof -tiTCP:$port -sTCP:LISTEN >/dev/null 2>&1; then
            echo "⚠️  端口 $port 仍被占用，请手动检查: lsof -iTCP:$port -sTCP:LISTEN"
        else
            echo "✅ $service_name 已停止 (端口 $port 已释放)"
        fi
    fi
}

stop_port_service "$BACKEND_PORT" "后端服务"
stop_port_service "$FRONTEND_PORT" "前端服务"

# 补充清理：按命令特征停止可能残留的项目子进程
if pgrep -f "$SCRIPT_DIR/backend.*ts-node-dev" >/dev/null 2>&1; then
    echo "🔧 清理残留后端开发进程..."
    pkill -f "$SCRIPT_DIR/backend.*ts-node-dev" || true
fi

if pgrep -f "$SCRIPT_DIR/frontend/node_modules/vite" >/dev/null 2>&1; then
    echo "🔧 清理残留前端开发进程..."
    pkill -f "$SCRIPT_DIR/frontend/node_modules/vite" || true
fi

echo ""
if [ "$stopped_count" -gt 0 ]; then
    echo "✅ 停止完成，共处理 $stopped_count 个项目进程"
else
    echo "✅ 未发现需要停止的项目进程"
fi
echo "📋 可选检查:"
echo "   lsof -iTCP:$BACKEND_PORT -sTCP:LISTEN"
echo "   lsof -iTCP:$FRONTEND_PORT -sTCP:LISTEN"
