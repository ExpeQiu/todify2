#!/bin/bash

# Todify3 统一数据库初始化脚本 v2.0
# 创建日期: 2025-01-XX
# 说明: 统一执行数据库架构和索引脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/unified-database-schema-v2.sql"
INDEXES_FILE="$SCRIPT_DIR/unified-database-indexes-v2.sql"

# 数据库配置
DB_TYPE="${DB_TYPE:-sqlite}"  # sqlite 或 postgresql
DB_PATH="${DB_PATH:-$SCRIPT_DIR/../../database.db}"

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
        BACKUP_FILE="${DB_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$DB_PATH" "$BACKUP_FILE"
        info "已备份现有数据库到: $BACKUP_FILE"
    fi
    
    # 执行架构脚本
    info "执行数据库架构脚本..."
    sqlite3 "$DB_PATH" < "$SCHEMA_FILE"
    if [ $? -eq 0 ]; then
        info "数据库架构创建成功"
    else
        error "数据库架构创建失败"
        exit 1
    fi
    
    # 执行索引脚本
    info "执行数据库索引脚本..."
    sqlite3 "$DB_PATH" < "$INDEXES_FILE"
    if [ $? -eq 0 ]; then
        info "数据库索引创建成功"
    else
        error "数据库索引创建失败"
        exit 1
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
    info "执行数据库架构脚本..."
    psql -h "$PGHOST" -d "$PGDATABASE" -U "$PGUSER" -f "$SCHEMA_FILE"
    if [ $? -eq 0 ]; then
        info "数据库架构创建成功"
    else
        error "数据库架构创建失败"
        exit 1
    fi
    
    # 执行索引脚本
    info "执行数据库索引脚本..."
    psql -h "$PGHOST" -d "$PGDATABASE" -U "$PGUSER" -f "$INDEXES_FILE"
    if [ $? -eq 0 ]; then
        info "数据库索引创建成功"
    else
        error "数据库索引创建失败"
        exit 1
    fi
    
    info "PostgreSQL 数据库初始化完成"
}

# 主函数
main() {
    info "开始初始化 Todify3 数据库 v2.0"
    info "=================================="
    
    check_files
    
    case "$DB_TYPE" in
        sqlite)
            init_sqlite
            ;;
        postgresql|postgres)
            init_postgresql
            ;;
        *)
            error "不支持的数据库类型: $DB_TYPE"
            error "支持的数据库类型: sqlite, postgresql"
            exit 1
            ;;
    esac
    
    info "=================================="
    info "数据库初始化完成！"
}

# 执行主函数
main

