#!/bin/bash

# 导出配置数据库脚本
# 导出不包含历史对话数据的数据库，仅包含配置信息
# 可用于导入到云端服务器

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

echo "📦 开始导出配置数据库..."

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

# 创建导出目录
EXPORT_DIR="$BACKEND_DIR/data/exports"
mkdir -p "$EXPORT_DIR"
echo "📁 导出目录: $EXPORT_DIR"

# 生成导出文件名（带时间戳）
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
EXPORT_FILE="$EXPORT_DIR/config-database-${TIMESTAMP}.sql"
EXPORT_DB="$EXPORT_DIR/config-database-${TIMESTAMP}.db"

if [ "$DB_TYPE" = "sqlite" ]; then
    # SQLite 数据库导出
    echo "🗄️  导出 SQLite 配置数据库..."
    
    # 确定数据库文件路径
    DB_PATH=${SQLITE_DB_PATH:-./data/todify2.db}
    
    # 如果是相对路径，转换为绝对路径
    if [[ "$DB_PATH" != /* ]]; then
        DB_PATH="$BACKEND_DIR/$DB_PATH"
    fi
    
    # 规范化路径
    DB_PATH=$(cd "$(dirname "$DB_PATH")" && pwd)/$(basename "$DB_PATH")
    
    echo "📂 源数据库文件: $DB_PATH"
    
    # 检查数据库文件是否存在
    if [ ! -f "$DB_PATH" ]; then
        echo -e "${RED}❌ 错误: 数据库文件不存在: $DB_PATH${NC}"
        exit 1
    fi
    
    # 检查 sqlite3 命令是否可用
    if ! command -v sqlite3 &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 sqlite3 命令，请先安装 SQLite${NC}"
        exit 1
    fi
    
    echo "💾 创建配置数据库..."
    
    # 创建新的空数据库
    rm -f "$EXPORT_DB"
    sqlite3 "$EXPORT_DB" "PRAGMA journal_mode=WAL;"
    
    # 定义配置表列表（需要保留的表）
    CONFIG_TABLES=(
        # AI配置相关
        "ai_roles"
        "agent_workflows"
        "workflow_templates"
        "page_tool_configs"
        "public_page_configs"
        "article_types"
        "article_type_ai_roles"
        
        # 业务配置
        "brands"
        "car_models"
        "car_series"
        "tech_categories"
        "tech_points"
        "tech_point_car_models"
        "tech_point_knowledge_points"
        "tech_point_resources"
        
        # 项目配置
        "projects"
        "project_sources"
        "project_tech_points"
        "project_knowledge_points"
        "project_files"
        "project_source_informations"
        
        # 知识库配置
        "knowledge_points"
        "public_knowledge_categories"
        "public_knowledge_files"
        "resources"
        
        # 字段映射配置
        "ai_search_field_mappings"
        
        # 其他配置
        "id_mappings"
    )
    
    # 定义需要排除的历史数据表
    HISTORY_TABLES=(
        "ai_search_conversations"
        "ai_search_messages"
        "ai_search_outputs"
        "chat_messages"
        "conversations"
        "workflow_executions"
        "knowledge_usage_logs"
        "brainstorm_sessions"
        "brainstorm_messages"
        "brainstorm_participants"
        "workflow_stats_summary"
    )
    
    echo ""
    echo "📋 导出配置表:"
    for table in "${CONFIG_TABLES[@]}"; do
        # 检查表是否存在
        TABLE_EXISTS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='$table';" 2>/dev/null || echo "0")
        if [ "$TABLE_EXISTS" = "1" ]; then
            ROW_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null || echo "0")
            echo "   ✅ $table ($ROW_COUNT 条记录)"
            
            # 导出表结构
            sqlite3 "$DB_PATH" ".schema $table" 2>/dev/null | sqlite3 "$EXPORT_DB" 2>/dev/null || true
            
            # 导出表数据
            if [ "$ROW_COUNT" -gt 0 ]; then
                sqlite3 "$DB_PATH" ".mode insert $table" ".output /tmp/export_${table}.sql" "SELECT * FROM \"$table\";" 2>/dev/null || true
                if [ -f "/tmp/export_${table}.sql" ]; then
                    sqlite3 "$EXPORT_DB" < "/tmp/export_${table}.sql" 2>/dev/null || true
                    rm -f "/tmp/export_${table}.sql"
                fi
            fi
        else
            echo "   ⚠️  $table (表不存在)"
        fi
    done
    
    echo ""
    echo "🚫 排除历史数据表:"
    for table in "${HISTORY_TABLES[@]}"; do
        TABLE_EXISTS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='$table';" 2>/dev/null || echo "0")
        if [ "$TABLE_EXISTS" = "1" ]; then
            ROW_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null || echo "0")
            echo "   ❌ $table ($ROW_COUNT 条记录 - 已排除)"
        fi
    done
    
    # 导出索引
    echo ""
    echo "📊 导出索引..."
    sqlite3 "$DB_PATH" "SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL AND tbl_name IN ($(IFS=','; echo "${CONFIG_TABLES[*]/#/\'}${CONFIG_TABLES[*]/%/\'}"))" 2>/dev/null | while read -r index_sql; do
        if [ -n "$index_sql" ]; then
            echo "$index_sql" | sqlite3 "$EXPORT_DB" 2>/dev/null || true
        fi
    done
    
    # 导出为SQL文件
    echo ""
    echo "💾 生成SQL导出文件..."
    sqlite3 "$EXPORT_DB" ".dump" > "$EXPORT_FILE" 2>/dev/null
    
    # 验证导出文件
    if [ -f "$EXPORT_DB" ]; then
        EXPORT_SIZE=$(du -h "$EXPORT_DB" | cut -f1)
        SQL_SIZE=$(du -h "$EXPORT_FILE" | cut -f1)
        echo -e "${GREEN}✅ 配置数据库导出成功${NC}"
        echo ""
        echo "📋 导出信息:"
        echo "   数据库文件: $(basename "$EXPORT_DB")"
        echo "   数据库路径: $EXPORT_DB"
        echo "   数据库大小: $EXPORT_SIZE"
        echo "   SQL文件: $(basename "$EXPORT_FILE")"
        echo "   SQL路径: $EXPORT_FILE"
        echo "   SQL大小: $SQL_SIZE"
        echo "   时间: $(date)"
        
        # 显示导出统计
        echo ""
        echo "📊 导出统计:"
        TOTAL_TABLES=0
        TOTAL_ROWS=0
        for table in "${CONFIG_TABLES[@]}"; do
            TABLE_EXISTS=$(sqlite3 "$EXPORT_DB" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='$table';" 2>/dev/null || echo "0")
            if [ "$TABLE_EXISTS" = "1" ]; then
                ROW_COUNT=$(sqlite3 "$EXPORT_DB" "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null || echo "0")
                TOTAL_TABLES=$((TOTAL_TABLES + 1))
                TOTAL_ROWS=$((TOTAL_ROWS + ROW_COUNT))
            fi
        done
        echo "   配置表数量: $TOTAL_TABLES"
        echo "   总记录数: $TOTAL_ROWS"
        
    else
        echo -e "${RED}❌ 导出失败: 导出文件未创建${NC}"
        exit 1
    fi
    
elif [ "$DB_TYPE" = "postgresql" ]; then
    echo -e "${YELLOW}⚠️  PostgreSQL 导出功能待实现${NC}"
    exit 1
else
    echo -e "${RED}❌ 错误: 不支持的数据库类型: $DB_TYPE${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 配置数据库导出完成！${NC}"
echo ""
echo "📝 使用说明:"
echo "   1. 数据库文件 ($(basename "$EXPORT_DB")): 可直接复制到云端服务器"
echo "   2. SQL文件 ($(basename "$EXPORT_FILE")): 可通过 sqlite3 导入"
echo ""
echo "   导入命令:"
echo "   sqlite3 new_database.db < $EXPORT_FILE"
echo "   或"
echo "   cp $EXPORT_DB /path/to/cloud/server/data/new_database.db"
