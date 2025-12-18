#!/bin/bash

# Docker 数据库初始化脚本
# 用途: 在容器启动时初始化数据库结构和导入历史数据

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="${DATA_DIR:-$BASE_DIR/data}"
SQL_SCRIPTS_DIR="$BASE_DIR/src/scripts"
HISTORY_DATA_DIR="${HISTORY_DATA_DIR:-/app/init-data}"

# 数据库配置
DB_TYPE="${DB_TYPE:-sqlite}"
DB_PATH="${SQLITE_DB_PATH:-$DATA_DIR/todify3.db}"

# Dify API 配置（用于环境变量替换）
DIFY_BASE_URL="${DIFY_BASE_URL:-http://47.113.225.93:9999/v1}"
DIFY_WORKFLOW_BASE_URL="${DIFY_WORKFLOW_BASE_URL:-${DIFY_BASE_URL}}"
export DIFY_BASE_URL
export DIFY_WORKFLOW_BASE_URL

# 日志函数
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# 检查 SQLite 数据库文件是否存在
check_database_exists() {
    if [ -f "$DB_PATH" ]; then
        info "数据库文件已存在: $DB_PATH"
        return 0
    else
        info "数据库文件不存在，将创建新数据库: $DB_PATH"
        return 1
    fi
}

# 初始化 SQLite 数据库架构
init_sqlite_schema() {
    info "开始初始化 SQLite 数据库架构..."
    
    # 确保数据目录存在
    mkdir -p "$(dirname "$DB_PATH")"
    
    # 检查架构文件是否存在
    SCHEMA_FILE="$SQL_SCRIPTS_DIR/unified-database-schema-v2.sql"
    if [ ! -f "$SCHEMA_FILE" ]; then
        warn "架构文件不存在: $SCHEMA_FILE"
        warn "将使用模型自动初始化表结构"
        return 0
    fi
    
    # 执行架构脚本
    info "执行数据库架构脚本: $SCHEMA_FILE"
    if sqlite3 "$DB_PATH" < "$SCHEMA_FILE" 2>&1; then
        info "数据库架构初始化成功"
    else
        warn "数据库架构初始化时出现警告（可能表已存在）"
    fi
    
    # 执行索引脚本
    INDEXES_FILE="$SQL_SCRIPTS_DIR/unified-database-indexes-v2.sql"
    if [ -f "$INDEXES_FILE" ]; then
        info "执行数据库索引脚本: $INDEXES_FILE"
        if sqlite3 "$DB_PATH" < "$INDEXES_FILE" 2>&1; then
            info "数据库索引初始化成功"
        else
            warn "数据库索引初始化时出现警告"
        fi
    fi
}

# 导入历史数据
import_history_data() {
    info "检查历史数据文件..."
    
    # 检查历史数据目录
    if [ ! -d "$HISTORY_DATA_DIR" ]; then
        info "历史数据目录不存在: $HISTORY_DATA_DIR，跳过数据导入"
        return 0
    fi
    
    # 导入 SQL 文件
    info "查找 SQL 数据文件..."
    SQL_FILES=$(find "$HISTORY_DATA_DIR" -type f -name "*.sql" | sort)
    
    if [ -z "$SQL_FILES" ]; then
        info "未找到 SQL 数据文件"
    else
        for sql_file in $SQL_FILES; do
            info "导入 SQL 数据文件: $(basename "$sql_file")"
            
            # 处理环境变量替换（支持 ${VAR_NAME} 格式）
            temp_sql=$(mktemp)
            sed "s|\${DIFY_BASE_URL}|${DIFY_BASE_URL}|g; s|\${DIFY_WORKFLOW_BASE_URL}|${DIFY_WORKFLOW_BASE_URL}|g" \
                "$sql_file" > "$temp_sql"
            
            if sqlite3 "$DB_PATH" < "$temp_sql" 2>&1; then
                info "成功导入: $(basename "$sql_file")"
            else
                warn "导入时出现警告: $(basename "$sql_file")（可能数据已存在）"
            fi
            
            rm -f "$temp_sql"
        done
    fi
    
    # 导入 SQLite 数据库文件（合并数据）
    info "查找 SQLite 数据库备份文件..."
    DB_FILES=$(find "$HISTORY_DATA_DIR" -type f -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" | sort)
    
    if [ -z "$DB_FILES" ]; then
        info "未找到 SQLite 数据库备份文件"
    else
        for db_file in $DB_FILES; do
            info "合并数据库文件: $(basename "$db_file")"
            
            # 使用 SQLite 的 ATTACH DATABASE 功能合并数据
            temp_script=$(mktemp)
            cat > "$temp_script" <<EOF
ATTACH DATABASE '$db_file' AS source_db;

-- 获取源数据库的所有表
SELECT name FROM source_db.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
EOF
            
            tables=$(sqlite3 "$db_file" ".tables" 2>/dev/null || echo "")
            
            if [ -n "$tables" ]; then
                for table in $tables; do
                    info "  合并表: $table"
                    sqlite3 "$DB_PATH" <<EOF 2>&1 || warn "合并表 $table 时出现警告（可能表结构不匹配或数据已存在）"
ATTACH DATABASE '$db_file' AS source_db;
INSERT OR IGNORE INTO $table SELECT * FROM source_db.$table;
DETACH DATABASE source_db;
EOF
                done
            fi
            
            rm -f "$temp_script"
            info "成功合并: $(basename "$db_file")"
        done
    fi
}

# 初始化 PostgreSQL 数据库
init_postgresql() {
    info "PostgreSQL 数据库初始化"
    warn "PostgreSQL 初始化需要额外的配置，请使用专门的初始化脚本"
    # 这里可以添加 PostgreSQL 的初始化逻辑
}

# 主函数
main() {
    info "=========================================="
    info "Todify3 数据库初始化脚本"
    info "=========================================="
    info "数据库类型: $DB_TYPE"
    info "数据库路径: $DB_PATH"
    info "历史数据目录: $HISTORY_DATA_DIR"
    info "=========================================="
    
    case "$DB_TYPE" in
        sqlite)
            db_exists=0
            check_database_exists || db_exists=1
            
            # 如果数据库不存在，或者强制初始化，执行架构初始化
            if [ "$db_exists" -eq 1 ] || [ "${FORCE_INIT:-0}" = "1" ]; then
                init_sqlite_schema
            else
                info "数据库已存在，跳过架构初始化（设置 FORCE_INIT=1 可强制初始化）"
            fi
            
            # 导入历史数据（如果存在）
            import_history_data
            ;;
        postgresql|postgres)
            init_postgresql
            ;;
        *)
            error "不支持的数据库类型: $DB_TYPE"
            exit 1
            ;;
    esac
    
    info "=========================================="
    info "数据库初始化完成！"
    info "=========================================="
}

# 执行主函数
main
