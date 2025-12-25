#!/bin/bash

# Todify3 统一数据库初始化脚本 v3.0
# 创建日期: 2025-01-XX
# 说明: 使用v3架构初始化数据库，支持SQLite和PostgreSQL

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/unified-database-schema-v3.sql"
INDEXES_FILE="$SCRIPT_DIR/unified-database-indexes-v3.sql"

# 数据库配置
DB_TYPE="${DB_TYPE:-sqlite}"  # sqlite 或 postgresql
DB_PATH="${DB_PATH:-$SCRIPT_DIR/../../data/todify3-v3.db}"

# 迁移选项
RUN_MIGRATION="${RUN_MIGRATION:-0}"  # 是否执行数据迁移
MIGRATION_SOURCE_DIR="${MIGRATION_SOURCE_DIR:-$SCRIPT_DIR/../../data}"

# 函数：打印信息
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

# 检查文件是否存在
check_files() {
    if [ ! -f "$SCHEMA_FILE" ]; then
        error "架构文件不存在: $SCHEMA_FILE"
        exit 1
    fi
    
    if [ ! -f "$INDEXES_FILE" ]; then
        error "索引文件不存在: $INDEXES_FILE"
        exit 1
    fi
    
    info "文件检查通过"
}

# SQLite 初始化
init_sqlite() {
    info "使用 SQLite 数据库: $DB_PATH"
    
    # 创建数据库目录（如果不存在）
    DB_DIR=$(dirname "$DB_PATH")
    if [ ! -d "$DB_DIR" ]; then
        mkdir -p "$DB_DIR"
        info "创建数据库目录: $DB_DIR"
    fi
    
    # 备份现有数据库（如果存在）
    if [ -f "$DB_PATH" ]; then
        BACKUP_DIR="$DB_DIR/backups"
        mkdir -p "$BACKUP_DIR"
        BACKUP_FILE="$BACKUP_DIR/todify3-v3.backup.$(date +%Y%m%d_%H%M%S).db"
        cp "$DB_PATH" "$BACKUP_FILE"
        info "已备份现有数据库到: $BACKUP_FILE"
    fi
    
    # 执行架构脚本
    info "执行数据库架构脚本 (v3.0)..."
    if sqlite3 "$DB_PATH" < "$SCHEMA_FILE" 2>&1; then
        info "数据库架构创建成功"
    else
        warn "数据库架构创建时出现警告（可能表已存在）"
    fi
    
    # 执行索引脚本
    info "执行数据库索引脚本 (v3.0)..."
    if sqlite3 "$DB_PATH" < "$INDEXES_FILE" 2>&1; then
        info "数据库索引创建成功"
    else
        warn "数据库索引创建时出现警告"
    fi
    
    info "SQLite 数据库初始化完成"
}

# PostgreSQL 初始化
init_postgresql() {
    info "使用 PostgreSQL 数据库"
    
    # 检查必要的环境变量
    if [ -z "$PGHOST" ] || [ -z "$PGDATABASE" ] || [ -z "$PGUSER" ]; then
        error "PostgreSQL 配置不完整，请设置 PGHOST, PGDATABASE, PGUSER 环境变量"
        exit 1
    fi
    
    # 执行架构脚本
    info "执行数据库架构脚本 (v3.0)..."
    if psql -h "$PGHOST" -d "$PGDATABASE" -U "$PGUSER" -f "$SCHEMA_FILE" 2>&1; then
        info "数据库架构创建成功"
    else
        warn "数据库架构创建时出现警告"
    fi
    
    # 执行索引脚本
    info "执行数据库索引脚本 (v3.0)..."
    if psql -h "$PGHOST" -d "$PGDATABASE" -U "$PGUSER" -f "$INDEXES_FILE" 2>&1; then
        info "数据库索引创建成功"
    else
        warn "数据库索引创建时出现警告"
    fi
    
    info "PostgreSQL 数据库初始化完成"
}

# 执行数据迁移
run_data_migration() {
    if [ "$RUN_MIGRATION" != "1" ]; then
        info "跳过数据迁移（设置 RUN_MIGRATION=1 可启用）"
        return 0
    fi
    
    info "开始执行数据迁移..."
    
    # 检查迁移工具是否存在
    MIGRATION_SCRIPT="$SCRIPT_DIR/run-migration-v3.ts"
    if [ ! -f "$MIGRATION_SCRIPT" ]; then
        warn "迁移脚本不存在: $MIGRATION_SCRIPT，跳过迁移"
        return 0
    fi
    
    # 检查 ts-node 是否可用
    if ! command -v ts-node &> /dev/null && [ ! -f "$SCRIPT_DIR/../../node_modules/.bin/ts-node" ]; then
        warn "ts-node 未找到，无法执行迁移脚本"
        warn "请手动运行: ts-node $MIGRATION_SCRIPT --source-dir $MIGRATION_SOURCE_DIR --target $DB_PATH"
        return 0
    fi
    
    # 运行迁移脚本
    info "执行迁移脚本..."
    TS_NODE_PATH="$SCRIPT_DIR/../../node_modules/.bin/ts-node"
    if [ -f "$TS_NODE_PATH" ]; then
        "$TS_NODE_PATH" "$MIGRATION_SCRIPT" --source-dir "$MIGRATION_SOURCE_DIR" --target "$DB_PATH" || warn "迁移执行失败"
    else
        ts-node "$MIGRATION_SCRIPT" --source-dir "$MIGRATION_SOURCE_DIR" --target "$DB_PATH" || warn "迁移执行失败"
    fi
}

# 主函数
main() {
    info "=========================================="
    info "Todify3 数据库初始化脚本 v3.0"
    info "=========================================="
    info "数据库类型: $DB_TYPE"
    info "数据库路径: $DB_PATH"
    info "执行迁移: $RUN_MIGRATION"
    if [ "$RUN_MIGRATION" = "1" ]; then
        info "迁移源目录: $MIGRATION_SOURCE_DIR"
    fi
    info "=========================================="
    
    check_files
    
    case "$DB_TYPE" in
        sqlite)
            init_sqlite
            run_data_migration
            ;;
        postgresql|postgres)
            init_postgresql
            warn "PostgreSQL 数据迁移需要手动执行"
            warn "请运行: ts-node $SCRIPT_DIR/run-migration-v3.ts"
            ;;
        *)
            error "不支持的数据库类型: $DB_TYPE"
            error "支持的数据库类型: sqlite, postgresql"
            exit 1
            ;;
    esac
    
    info "=========================================="
    info "数据库初始化完成！"
    info "=========================================="
    info ""
    info "使用说明:"
    info "1. 验证迁移结果: ts-node $SCRIPT_DIR/validate-migration-v3.ts --target $DB_PATH"
    info "2. 查看数据库: sqlite3 $DB_PATH"
    info ""
}

# 执行主函数
main

