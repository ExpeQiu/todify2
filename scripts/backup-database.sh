#!/bin/bash

# 数据库备份脚本
# 支持 SQLite 和 PostgreSQL 数据库备份

set -e  # 遇到错误立即退出

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📦 开始备份数据库..."

# 检查后端目录是否存在
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ 错误: 后端目录不存在: $BACKEND_DIR${NC}"
    exit 1
fi

# 加载环境变量
ENV_FILE="$BACKEND_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    echo "📄 读取环境配置: $ENV_FILE"
    # 安全地读取 .env 文件中的配置
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # 跳过注释和空行
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # 移除引号
        value=$(echo "$value" | sed -e 's/^["'\'']//' -e 's/["'\'']$//')
        
        # 只导出数据库相关的环境变量
        case "$key" in
            DB_TYPE|SQLITE_DB_PATH|PG_HOST|PG_PORT|PG_USER|PG_PASSWORD|PG_DATABASE)
                export "$key=$value"
                ;;
        esac
    done < <(grep -v '^#' "$ENV_FILE" | grep -v '^$')
else
    echo -e "${YELLOW}⚠️  警告: .env 文件不存在，使用默认配置${NC}"
fi

# 确定数据库类型
DB_TYPE=${DB_TYPE:-sqlite}
echo "🔍 数据库类型: $DB_TYPE"

# 创建备份目录
BACKUP_DIR="$BACKEND_DIR/data/backups"
mkdir -p "$BACKUP_DIR"
echo "📁 备份目录: $BACKUP_DIR"

# 生成备份文件名（带时间戳）
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_PREFIX="backup-${TIMESTAMP}"

if [ "$DB_TYPE" = "sqlite" ]; then
    # SQLite 数据库备份
    echo "🗄️  备份 SQLite 数据库..."
    
    # 确定数据库文件路径
    DB_PATH=${SQLITE_DB_PATH:-./data/todify3.db}
    
    # 如果是相对路径，转换为绝对路径
    if [[ "$DB_PATH" != /* ]]; then
        DB_PATH="$BACKEND_DIR/$DB_PATH"
    fi
    
    # 规范化路径
    DB_PATH=$(cd "$(dirname "$DB_PATH")" && pwd)/$(basename "$DB_PATH")
    
    echo "📂 数据库文件: $DB_PATH"
    
    # 检查数据库文件是否存在
    if [ ! -f "$DB_PATH" ]; then
        echo -e "${RED}❌ 错误: 数据库文件不存在: $DB_PATH${NC}"
        exit 1
    fi
    
    # 获取数据库文件大小
    DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
    echo "📊 数据库大小: $DB_SIZE"
    
    # 执行备份（使用 VACUUM INTO 创建备份，这是 SQLite 推荐的备份方式）
    BACKUP_FILE="$BACKUP_DIR/${BACKUP_PREFIX}.db"
    
    # 检查 sqlite3 命令是否可用
    if command -v sqlite3 &> /dev/null; then
        echo "💾 使用 sqlite3 创建备份..."
        sqlite3 "$DB_PATH" "VACUUM INTO '$BACKUP_FILE';"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ SQLite 备份成功${NC}"
        else
            echo -e "${YELLOW}⚠️  VACUUM INTO 失败，尝试直接复制文件...${NC}"
            cp "$DB_PATH" "$BACKUP_FILE"
        fi
    else
        echo "💾 使用文件复制方式备份..."
        cp "$DB_PATH" "$BACKUP_FILE"
    fi
    
    # 验证备份文件
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}✅ 备份完成: $BACKUP_FILE${NC}"
        echo "📊 备份文件大小: $BACKUP_SIZE"
        
        # 显示备份文件信息
        echo ""
        echo "📋 备份信息:"
        echo "   文件: $(basename "$BACKUP_FILE")"
        echo "   路径: $BACKUP_FILE"
        echo "   大小: $BACKUP_SIZE"
        echo "   时间: $(date)"
    else
        echo -e "${RED}❌ 备份失败: 备份文件未创建${NC}"
        exit 1
    fi
    
elif [ "$DB_TYPE" = "postgresql" ]; then
    # PostgreSQL 数据库备份
    echo "🗄️  备份 PostgreSQL 数据库..."
    
    # 检查 pg_dump 命令是否可用
    if ! command -v pg_dump &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 pg_dump 命令，请先安装 PostgreSQL 客户端工具${NC}"
        exit 1
    fi
    
    # 获取 PostgreSQL 配置
    PG_HOST=${PG_HOST:-localhost}
    PG_PORT=${PG_PORT:-5432}
    PG_USER=${PG_USER:-postgres}
    PG_DATABASE=${PG_DATABASE:-todify3}
    
    echo "🔗 连接信息:"
    echo "   主机: $PG_HOST"
    echo "   端口: $PG_PORT"
    echo "   用户: $PG_USER"
    echo "   数据库: $PG_DATABASE"
    
    # 构建 pg_dump 命令
    BACKUP_FILE="$BACKUP_DIR/${BACKUP_PREFIX}.sql"
    
    # 如果有密码，使用环境变量
    if [ -n "$PG_PASSWORD" ]; then
        export PGPASSWORD="$PG_PASSWORD"
    fi
    
    echo "💾 正在备份..."
    pg_dump -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" \
        --format=plain --no-owner --no-acl > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}✅ PostgreSQL 备份成功${NC}"
        echo -e "${GREEN}✅ 备份完成: $BACKUP_FILE${NC}"
        echo "📊 备份文件大小: $BACKUP_SIZE"
        
        # 显示备份文件信息
        echo ""
        echo "📋 备份信息:"
        echo "   文件: $(basename "$BACKUP_FILE")"
        echo "   路径: $BACKUP_FILE"
        echo "   大小: $BACKUP_SIZE"
        echo "   时间: $(date)"
    else
        echo -e "${RED}❌ PostgreSQL 备份失败${NC}"
        exit 1
    fi
    
    # 清理密码环境变量
    unset PGPASSWORD
else
    echo -e "${RED}❌ 错误: 不支持的数据库类型: $DB_TYPE${NC}"
    echo "   支持的数据库类型: sqlite, postgresql"
    exit 1
fi

# 显示备份目录中的所有备份文件
echo ""
echo "📂 备份目录中的所有备份文件:"
ls -lh "$BACKUP_DIR" | tail -n +2 | awk '{print "   " $9 " (" $5 ")"}'

# 统计备份文件数量
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" | wc -l | tr -d ' ')
echo ""
echo "📊 备份统计: 共 $BACKUP_COUNT 个备份文件"

# 提示清理旧备份
echo ""
echo -e "${YELLOW}💡 提示: 可以使用以下命令清理旧备份（保留最近10个）:${NC}"
echo "   ls -t $BACKUP_DIR | tail -n +11 | xargs -I {} rm $BACKUP_DIR/{}"

echo ""
echo -e "${GREEN}🎉 数据库备份完成！${NC}"

