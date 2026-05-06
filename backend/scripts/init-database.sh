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
    info "创建 PostgreSQL 核心表结构（幂等）..."

    node <<'EOF'
const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT || 5432),
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DATABASE || 'todify4',
  });

  await client.connect();

  const statements = [
    `CREATE TABLE IF NOT EXISTS tech_categories (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      parent_id BIGINT,
      level INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tech_points (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category_id BIGINT,
      parent_id BIGINT,
      level INTEGER NOT NULL DEFAULT 1,
      tech_type TEXT NOT NULL DEFAULT 'technology',
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'active',
      tags TEXT,
      technical_details TEXT,
      benefits TEXT,
      applications TEXT,
      keywords TEXT,
      source_url TEXT,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS source_information (
      id BIGSERIAL PRIMARY KEY,
      source_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT,
      description TEXT,
      page_type TEXT,
      conversation_id TEXT,
      metadata TEXT,
      status TEXT DEFAULT 'active',
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS ai_search_conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      sources TEXT NOT NULL,
      page_type TEXT,
      dify_conversation_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS ai_search_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      sources TEXT,
      outputs TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS ai_search_outputs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      message_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      page_type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS ai_search_field_mappings (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL UNIQUE,
      config TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS article_types (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      enabled INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS article_type_ai_roles (
      id TEXT PRIMARY KEY,
      article_type_id TEXT NOT NULL,
      ai_role_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(article_type_id, ai_role_id)
    )`,
    `CREATE TABLE IF NOT EXISTS files (
      id BIGSERIAL PRIMARY KEY,
      file_id TEXT UNIQUE NOT NULL,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      file_hash TEXT,
      category TEXT DEFAULT 'general',
      tags TEXT,
      description TEXT,
      uploader_id TEXT,
      conversation_id TEXT,
      usage_count INTEGER DEFAULT 0,
      last_used_at TIMESTAMP,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS brainstorm_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      topic TEXT NOT NULL,
      description TEXT,
      creator_id TEXT,
      project_id INTEGER,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'stopped')),
      config TEXT,
      summary TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS brainstorm_participants (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      ai_role_id TEXT NOT NULL,
      display_name TEXT,
      role_type TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS brainstorm_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      participant_id BIGINT,
      round_number INTEGER NOT NULL DEFAULT 1,
      content TEXT NOT NULL,
      reply_to_id TEXT,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE SCHEMA IF NOT EXISTS shared`,
    `CREATE TABLE IF NOT EXISTS shared.tech_points (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      tech_principle TEXT,
      tech_boundary TEXT,
      technical_details JSONB,
      metadata JSONB,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_tech_categories_status ON tech_categories(status)`,
    `CREATE INDEX IF NOT EXISTS idx_tech_points_category_id ON tech_points(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tech_points_status ON tech_points(status)`,
    `CREATE INDEX IF NOT EXISTS idx_source_information_status ON source_information(status)`,
    `CREATE INDEX IF NOT EXISTS idx_source_information_page_type ON source_information(page_type)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_search_messages_conversation_id ON ai_search_messages(conversation_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_search_outputs_conversation_id ON ai_search_outputs(conversation_id)`,
    `CREATE INDEX IF NOT EXISTS idx_article_types_code ON article_types(code)`,
    `CREATE INDEX IF NOT EXISTS idx_article_types_enabled ON article_types(enabled)`,
    `CREATE INDEX IF NOT EXISTS idx_article_type_ai_roles_article_type_id ON article_type_ai_roles(article_type_id)`,
    `CREATE INDEX IF NOT EXISTS idx_article_type_ai_roles_ai_role_id ON article_type_ai_roles(ai_role_id)`,
    `CREATE INDEX IF NOT EXISTS idx_files_file_id ON files(file_id)`,
    `CREATE INDEX IF NOT EXISTS idx_files_category ON files(category)`,
    `CREATE INDEX IF NOT EXISTS idx_files_status ON files(status)`,
    `CREATE INDEX IF NOT EXISTS idx_files_conversation_id ON files(conversation_id)`,
    `CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_files_file_hash ON files(file_hash)`,
    `CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_status ON brainstorm_sessions(status)`,
    `CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_created_at ON brainstorm_sessions(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_creator_id ON brainstorm_sessions(creator_id)`,
    `CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_project_id ON brainstorm_sessions(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_brainstorm_participants_session_id ON brainstorm_participants(session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_brainstorm_participants_ai_role_id ON brainstorm_participants(ai_role_id)`,
    `CREATE INDEX IF NOT EXISTS idx_brainstorm_participants_sort_order ON brainstorm_participants(sort_order)`,
    `CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_session_id ON brainstorm_messages(session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_participant_id ON brainstorm_messages(participant_id)`,
    `CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_round_number ON brainstorm_messages(round_number)`,
    `CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_created_at ON brainstorm_messages(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_reply_to_id ON brainstorm_messages(reply_to_id)`,
    `CREATE INDEX IF NOT EXISTS idx_shared_tech_points_status ON shared.tech_points(status)`,
  ];

  for (const sql of statements) {
    await client.query(sql);
  }

  await client.query(`
    INSERT INTO shared.tech_points (name, description, status, created_at, updated_at)
    SELECT p.name, p.description, COALESCE(p.status, 'active'), COALESCE(p.created_at, CURRENT_TIMESTAMP), COALESCE(p.updated_at, CURRENT_TIMESTAMP)
    FROM tech_points p
    WHERE NOT EXISTS (
      SELECT 1 FROM shared.tech_points s WHERE s.name = p.name
    )
  `);

  await client.end();
}

run().then(() => {
  console.log('✅ PostgreSQL 核心表初始化完成');
}).catch((err) => {
  console.error('❌ PostgreSQL 初始化失败:', err.message || err);
  process.exit(1);
});
EOF
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
