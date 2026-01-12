#!/bin/bash

# 将本地项目数据导入到 Docker 项目
# 用途: 将本地数据库和上传文件导入到 Docker 容器中

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
DOCKER_DIR="$PROJECT_ROOT/docker"

# 数据库配置
SOURCE_DB="${1:-$BACKEND_DIR/data/todify3.db}"
TARGET_DB="$BACKEND_DIR/data/todify4.db"
BACKUP_DIR="$BACKEND_DIR/data/backups"

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

# 检查 Docker 服务是否运行
check_docker() {
    if ! docker compose -f "$DOCKER_DIR/docker-compose.yml" ps | grep -q "todify4-backend.*Up"; then
        error "Docker 服务未运行，请先启动 Docker 服务"
        echo "运行: cd $DOCKER_DIR && docker compose up -d"
        exit 1
    fi
    info "Docker 服务运行正常"
}

# 备份目标数据库
backup_target_db() {
    if [ -f "$TARGET_DB" ]; then
        info "备份目标数据库: $TARGET_DB"
        mkdir -p "$BACKUP_DIR"
        BACKUP_FILE="$BACKUP_DIR/backup-todify4-$(date +%Y%m%d_%H%M%S).db"
        cp "$TARGET_DB" "$BACKUP_FILE"
        info "备份已保存到: $BACKUP_FILE"
    fi
}

# 导入数据库数据
import_database() {
    if [ ! -f "$SOURCE_DB" ]; then
        error "源数据库文件不存在: $SOURCE_DB"
        exit 1
    fi

    info "开始导入数据库数据..."
    info "源数据库: $SOURCE_DB"
    info "目标数据库: $TARGET_DB"

    # 检查 sqlite3 是否安装
    if ! command -v sqlite3 &> /dev/null; then
        error "sqlite3 未安装，请先安装 sqlite3"
        exit 1
    fi

    # 获取源数据库的所有表
    info "获取源数据库表列表..."
    TABLES=$(sqlite3 "$SOURCE_DB" "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")

    if [ -z "$TABLES" ]; then
        warn "源数据库中没有找到表"
        return
    fi

    # 创建目标数据库（如果不存在）
    if [ ! -f "$TARGET_DB" ]; then
        info "创建目标数据库: $TARGET_DB"
        touch "$TARGET_DB"
    fi

    # 使用本地 sqlite3 进行导入
    import_database_local
}

# 本地导入方式
import_database_local() {
    info "使用本地 sqlite3 进行导入..."
    
    # 获取所有表名
    TABLES=$(sqlite3 "$SOURCE_DB" "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    
    if [ -z "$TABLES" ]; then
        warn "源数据库中没有找到表"
        return
    fi
    
    TOTAL_TABLES=$(echo "$TABLES" | wc -l | tr -d ' ')
    info "找到 $TOTAL_TABLES 个表需要导入"
    
    SUCCESS_COUNT=0
    FAIL_COUNT=0
    
    for TABLE in $TABLES; do
        info "导入表: $TABLE"
        
        # 检查目标表是否存在
        TABLE_EXISTS=$(sqlite3 "$TARGET_DB" "SELECT name FROM sqlite_master WHERE type='table' AND name='$TABLE';" 2>/dev/null)
        
        if [ -z "$TABLE_EXISTS" ]; then
            warn "  表 $TABLE 在目标数据库中不存在，跳过"
            FAIL_COUNT=$((FAIL_COUNT + 1))
            continue
        fi
        
        # 导出数据到临时文件
        TEMP_SQL="/tmp/import_${TABLE}_$$.sql"
        sqlite3 "$SOURCE_DB" <<EOF > "$TEMP_SQL"
.mode insert $TABLE
SELECT * FROM "$TABLE";
EOF
        
        # 导入数据
        if [ -s "$TEMP_SQL" ]; then
            # 先清空目标表
            sqlite3 "$TARGET_DB" "DELETE FROM \"$TABLE\";" 2>/dev/null || true
            
            # 导入数据
            if sqlite3 "$TARGET_DB" ".read $TEMP_SQL" 2>/dev/null; then
                ROW_COUNT=$(sqlite3 "$TARGET_DB" "SELECT COUNT(*) FROM \"$TABLE\";" 2>/dev/null || echo "0")
                info "  ✓ 表 $TABLE 导入完成 ($ROW_COUNT 行)"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            else
                warn "  ✗ 表 $TABLE 导入失败"
                FAIL_COUNT=$((FAIL_COUNT + 1))
            fi
            rm -f "$TEMP_SQL"
        else
            info "  表 $TABLE 为空，跳过"
            rm -f "$TEMP_SQL"
        fi
    done
    
    echo ""
    info "导入统计: 成功 $SUCCESS_COUNT 个表, 失败 $FAIL_COUNT 个表"
}

# 同步上传文件
sync_uploads() {
    info "检查上传文件..."
    UPLOADS_SOURCE="$BACKEND_DIR/uploads"
    UPLOADS_TARGET="$BACKEND_DIR/uploads"
    
    if [ ! -d "$UPLOADS_SOURCE" ]; then
        warn "上传文件目录不存在: $UPLOADS_SOURCE"
        return
    fi
    
    UPLOAD_COUNT=$(find "$UPLOADS_SOURCE" -type f | wc -l | tr -d ' ')
    info "找到 $UPLOAD_COUNT 个上传文件"
    info "上传文件已通过 Docker volume 挂载，无需额外同步"
}

# 显示导入结果
show_result() {
    echo ""
    info "========================================="
    info "数据导入完成！"
    info "========================================="
    echo ""
    
    if [ -f "$TARGET_DB" ]; then
        DB_SIZE=$(du -h "$TARGET_DB" | cut -f1)
        info "目标数据库大小: $DB_SIZE"
        
        # 统计表数量
        TABLE_COUNT=$(sqlite3 "$TARGET_DB" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';" 2>/dev/null || echo "0")
        info "数据库表数量: $TABLE_COUNT"
    fi
    
    echo ""
    info "下一步操作:"
    info "1. 重启 Docker 服务以加载新数据:"
    info "   cd $DOCKER_DIR && docker compose restart backend"
    info "2. 检查服务状态:"
    info "   cd $DOCKER_DIR && docker compose ps"
    echo ""
}

# 主函数
main() {
    info "开始导入本地数据到 Docker 项目..."
    echo ""
    
    check_docker
    backup_target_db
    import_database
    sync_uploads
    show_result
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [源数据库路径]"
    echo ""
    echo "选项:"
    echo "  源数据库路径    要导入的源数据库文件路径（默认: backend/data/todify3.db）"
    echo ""
    echo "示例:"
    echo "  $0                                    # 使用默认源数据库 (todify3.db)"
    echo "  $0 backend/data/todify3-v3.db        # 使用指定的数据库文件"
    echo ""
}

# 解析参数
if [ "$1" == "help" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    show_help
    exit 0
fi

# 运行主函数
main
