#!/bin/bash

# 数据库初始化脚本
# 用于在服务器上初始化数据库

echo "🗄️  初始化数据库..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 数据库文件路径
DB_DIR="$SCRIPT_DIR/backend/data"
DB_FILE="$DB_DIR/database.db"

# 创建数据库目录
mkdir -p "$DB_DIR"

# 检查数据库文件是否存在
if [ ! -f "$DB_FILE" ]; then
    echo "📝 创建新的数据库文件..."
    touch "$DB_FILE"
else
    echo "✅ 数据库文件已存在"
fi

# 设置数据库文件权限
chmod 664 "$DB_FILE"

echo "✅ 数据库初始化完成"
echo "📁 数据库位置: $DB_FILE"
