#!/bin/bash

# 同步本地数据库配置信息到云端项目数据库

set -e

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 服务器信息
SERVER_IP="47.113.225.93"
SERVER_USER="root"
SERVER_PASSWORD="Qb89100820"
DEPLOY_PATH="/root/todify2-deploy"
BACKEND_PATH="${DEPLOY_PATH}/backend"

# 检查sshpass工具
check_sshpass() {
    log_info "检查sshpass工具..."
    if ! command -v sshpass &> /dev/null; then
        log_error "未找到sshpass工具"
        echo ""
        echo "请安装sshpass工具："
        echo "  macOS:   brew install hudochenkov/sshpass/sshpass"
        echo "  Ubuntu:  sudo apt-get install sshpass"
        echo "  CentOS:  sudo yum install sshpass"
        exit 1
    fi
    log_success "sshpass工具已安装"
}

# 检查本地数据库文件
check_local_database() {
    log_info "检查本地数据库文件..."
    local db_path="./backend/data/todify2.db"
    
    if [ ! -f "$db_path" ]; then
        log_error "本地数据库文件不存在: $db_path"
        exit 1
    fi
    
    local db_size=$(ls -lh "$db_path" | awk '{print $5}')
    log_success "找到本地数据库文件: $db_path (大小: $db_size)"
    echo "$db_path"
}

# 备份云端数据库
backup_cloud_database() {
    log_info "备份云端数据库..."
    
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $SERVER_USER@$SERVER_IP << ENDSSH
        cd ${BACKEND_PATH}
        
        # 创建备份目录
        mkdir -p data/backup
        
        # 备份现有数据库文件
        if [ -f "data/todify2.db" ]; then
            backup_file="data/backup/todify2.db.backup.\$(date +%Y%m%d_%H%M%S)"
            cp data/todify2.db "\$backup_file"
            echo "✅ 数据库已备份到: \$backup_file"
        else
            echo "⚠️  云端数据库文件不存在，跳过备份"
        fi
        
        if [ -f "data/database.db" ]; then
            backup_file="data/backup/database.db.backup.\$(date +%Y%m%d_%H%M%S)"
            cp data/database.db "\$backup_file"
            echo "✅ 数据库已备份到: \$backup_file"
        fi
ENDSSH
    
    log_success "云端数据库备份完成"
}

# 同步.env配置文件
sync_env_config() {
    log_info "同步.env配置文件..."
    
    local local_env="./backend/.env"
    
    if [ ! -f "$local_env" ]; then
        log_warning "本地.env文件不存在，跳过同步"
        return
    fi
    
    # 上传.env文件
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$local_env" $SERVER_USER@$SERVER_IP:${BACKEND_PATH}/.env
    
    log_success ".env配置文件已同步"
}

# 同步数据库文件
sync_database_file() {
    log_info "同步数据库文件到云端..."
    
    local local_db="$1"
    local db_name=$(basename "$local_db")
    
    # 上传数据库文件
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$local_db" $SERVER_USER@$SERVER_IP:${BACKEND_PATH}/data/
    
    # 设置正确的权限
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $SERVER_USER@$SERVER_IP << ENDSSH
        chmod 644 ${BACKEND_PATH}/data/${db_name}
        echo "✅ 数据库文件权限已设置"
ENDSSH
    
    log_success "数据库文件已同步: $db_name"
}

# 同步所有数据库文件
sync_all_databases() {
    log_info "同步所有数据库文件..."
    
    # 同步todify2.db
    if [ -f "./backend/data/todify2.db" ]; then
        sync_database_file "./backend/data/todify2.db"
    fi
    
    # 同步database.db（如果存在）
    if [ -f "./backend/data/database.db" ]; then
        sync_database_file "./backend/data/database.db"
    fi
}

# 验证同步结果
verify_sync() {
    log_info "验证同步结果..."
    
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $SERVER_USER@$SERVER_IP << ENDSSH
        echo "=== 云端数据库文件 ==="
        ls -lh ${BACKEND_PATH}/data/*.db 2>/dev/null || echo "未找到数据库文件"
        
        echo ""
        echo "=== 云端.env配置 ==="
        if [ -f "${BACKEND_PATH}/.env" ]; then
            echo "✅ .env文件存在"
            echo "数据库配置:"
            grep -E "^DB_TYPE=|^SQLITE_DB_PATH=|^PG_" ${BACKEND_PATH}/.env || echo "未找到数据库配置"
        else
            echo "❌ .env文件不存在"
        fi
ENDSSH
    
    log_success "验证完成"
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    echo "🔄 同步本地数据库配置到云端"
    echo "=========================================="
    echo ""
    
    # 检查工具
    check_sshpass
    
    # 检查本地数据库
    local_db=$(check_local_database)
    
    # 确认操作
    echo ""
    log_warning "此操作将："
    echo "  1. 备份云端现有数据库"
    echo "  2. 同步.env配置文件"
    echo "  3. 同步数据库文件到云端"
    echo ""
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi
    
    # 执行同步
    backup_cloud_database
    sync_env_config
    sync_all_databases
    verify_sync
    
    echo ""
    echo "=========================================="
    log_success "数据库同步完成！"
    echo "=========================================="
    echo ""
    echo "📋 下一步操作："
    echo "  1. 如需重启服务，请执行："
    echo "     sshpass -p '${SERVER_PASSWORD}' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} 'cd ${DEPLOY_PATH} && ./start-production.sh'"
    echo ""
    echo "  2. 查看服务状态："
    echo "     sshpass -p '${SERVER_PASSWORD}' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} 'pm2 status'"
    echo ""
}

# 执行主函数
main "$@"


