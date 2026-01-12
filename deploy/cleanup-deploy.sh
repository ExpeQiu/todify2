#!/bin/bash

# Todify4 云端部署清理脚本
# 用于清理服务器上的所有部署文件

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

# 服务器配置
SERVER_IP="47.113.225.93"
SERVER_USER="root"
SERVER_PASSWORD="Qb89100820"
DEPLOY_PATH="/root/todify4"
SSH_OPTIONS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

# 解析参数
SKIP_CONFIRM=false
if [[ "$1" == "-y" ]] || [[ "$1" == "--yes" ]]; then
    SKIP_CONFIRM=true
fi

echo "=========================================="
echo "🧹 Todify4 云端部署清理脚本"
echo "=========================================="
echo ""
echo "服务器配置："
echo "  - 服务器: ${SERVER_USER}@${SERVER_IP}"
echo "  - 部署路径: ${DEPLOY_PATH}"
echo ""

# 确认操作
if [ "$SKIP_CONFIRM" = false ]; then
    read -p "⚠️  此操作将删除服务器上的所有部署文件，是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "操作已取消"
        exit 0
    fi
else
    log_warning "跳过确认，直接执行清理..."
fi

# 检查服务器连接
log_info "检查服务器连接..."
if ! sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS -T $SERVER_USER@$SERVER_IP "echo '连接成功'" &>/dev/null; then
    log_error "无法连接到服务器"
    exit 1
fi
log_success "服务器连接正常"

# 清理 Docker 服务
log_info "停止并删除 Docker 容器和服务..."
sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS -T $SERVER_USER@$SERVER_IP << ENDSSH
    set -e
    
    echo "📦 停止 Docker Compose 服务..."
    if [ -d "${DEPLOY_PATH}/docker" ]; then
        cd ${DEPLOY_PATH}/docker
        docker compose down --remove-orphans 2>/dev/null || docker-compose down --remove-orphans 2>/dev/null || true
    fi
    
    echo "🗑️  删除容器..."
    docker rm -f todify4-backend todify4-frontend todify4-nginx todify4-postgres 2>/dev/null || true
    
    echo "🗑️  删除镜像..."
    docker rmi todify4-backend:latest todify4-frontend:latest 2>/dev/null || true
    
    echo "🗑️  清理 Docker 网络..."
    docker network prune -f 2>/dev/null || true
    
    echo "🗑️  清理 Docker 卷..."
    docker volume ls | grep todify4 | awk '{print \$2}' | xargs -r docker volume rm 2>/dev/null || true
    
    echo "✅ Docker 清理完成"
ENDSSH

log_success "Docker 服务清理完成"

# 清理项目文件
log_info "删除项目文件..."
sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS -T $SERVER_USER@$SERVER_IP << ENDSSH
    set -e
    
    if [ -d "${DEPLOY_PATH}" ]; then
        echo "🗑️  删除项目目录: ${DEPLOY_PATH}"
        rm -rf ${DEPLOY_PATH}
        echo "✅ 项目目录已删除"
    else
        echo "ℹ️  项目目录不存在，跳过"
    fi
ENDSSH

log_success "项目文件清理完成"

# 清理临时文件
log_info "清理临时文件..."
sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS -T $SERVER_USER@$SERVER_IP << ENDSSH
    set -e
    
    echo "🗑️  清理临时镜像文件..."
    rm -f /tmp/todify4-images.tar.gz 2>/dev/null || true
    
    echo "🗑️  清理临时部署文件..."
    rm -f /tmp/deploy.tar.gz 2>/dev/null || true
    
    echo "✅ 临时文件清理完成"
ENDSSH

log_success "临时文件清理完成"

# 验证清理结果
log_info "验证清理结果..."
sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS -T $SERVER_USER@$SERVER_IP << ENDSSH
    echo "=== 检查容器 ==="
    docker ps --filter "name=todify4" --format "table {{.Names}}\t{{.Status}}" || echo "无容器运行"
    
    echo ""
    echo "=== 检查镜像 ==="
    docker images | grep todify4 || echo "无镜像存在"
    
    echo ""
    echo "=== 检查项目目录 ==="
    if [ -d "${DEPLOY_PATH}" ]; then
        echo "⚠️  项目目录仍存在: ${DEPLOY_PATH}"
        ls -la ${DEPLOY_PATH} | head -10
    else
        echo "✅ 项目目录已删除"
    fi
    
    echo ""
    echo "=== 检查临时文件 ==="
    if [ -f "/tmp/todify4-images.tar.gz" ] || [ -f "/tmp/deploy.tar.gz" ]; then
        echo "⚠️  临时文件仍存在"
        ls -lh /tmp/todify4-images.tar.gz /tmp/deploy.tar.gz 2>/dev/null || true
    else
        echo "✅ 临时文件已清理"
    fi
ENDSSH

echo ""
log_success "=========================================="
log_success "清理完成！"
log_success "=========================================="
echo ""
echo "已清理内容："
echo "  ✅ Docker 容器和服务"
echo "  ✅ Docker 镜像"
echo "  ✅ 项目文件目录"
echo "  ✅ 临时文件"
echo ""
