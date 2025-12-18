#!/bin/sh

# Docker 容器入口脚本
# 用于在容器启动时初始化数据库，然后启动应用

set -e

echo "=========================================="
echo "Todify3 Backend 容器启动"
echo "=========================================="

# 设置默认值
DATA_DIR="${DATA_DIR:-/app/data}"
INIT_DATA_DIR="${INIT_DATA_DIR:-/app/init-data}"

# 确保数据目录存在
mkdir -p "$DATA_DIR"
mkdir -p "$INIT_DATA_DIR"

# 检查是否需要初始化数据库
if [ "${INIT_DATABASE:-1}" = "1" ]; then
    echo "执行数据库初始化..."
    
    # 设置环境变量供初始化脚本使用
    export DATA_DIR
    export HISTORY_DATA_DIR="$INIT_DATA_DIR"
    export FORCE_INIT="${FORCE_INIT:-0}"
    
    # 执行数据库初始化脚本
    if [ -f "/app/scripts/init-database.sh" ]; then
        chmod +x /app/scripts/init-database.sh
        /app/scripts/init-database.sh
    else
        echo "警告: 数据库初始化脚本不存在，跳过初始化"
    fi
else
    echo "跳过数据库初始化 (INIT_DATABASE=0)"
fi

# 启动应用
echo "启动应用..."
exec node dist/index.js
