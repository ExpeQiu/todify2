#!/bin/bash

# Todify3 服务启动脚本
# 用于手动启动或重启服务

set -e

PROJECT_DIR="/root/todify3"
cd "$PROJECT_DIR"

# 检查ecosystem.config.js是否存在
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ ecosystem.config.js 不存在"
    exit 1
fi

case "$1" in
    start)
        echo "🚀 启动 Todify3 服务..."
        pm2 start ecosystem.config.js
        pm2 save
        echo "✅ 服务启动完成"
        ;;
    stop)
        echo "🛑 停止 Todify3 服务..."
        pm2 stop ecosystem.config.js
        pm2 save
        echo "✅ 服务停止完成"
        ;;
    restart)
        echo "🔄 重启 Todify3 服务..."
        pm2 restart ecosystem.config.js
        pm2 save
        echo "✅ 服务重启完成"
        ;;
    status)
        echo "📊 Todify3 服务状态:"
        pm2 list | grep todify3 || echo "未找到todify3服务"
        ;;
    logs)
        echo "📋 Todify3 服务日志:"
        pm2 logs todify3-backend todify3-frontend --lines 50
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac

