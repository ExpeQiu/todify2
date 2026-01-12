#!/bin/bash

# 检查部署状态脚本

set -e

# 服务器配置
SERVER_IP="47.113.225.93"
SERVER_USER="root"
SERVER_PASSWORD="Qb89100820"
DEPLOY_PATH="/root/todify4"
SSH_OPTIONS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "检查 Todify4 部署状态"
echo -e "==========================================${NC}"
echo ""

# 检查本地镜像文件
echo -e "${BLUE}[1] 检查本地镜像文件...${NC}"
if [ -f "/tmp/todify4-images.tar.gz" ]; then
    local_size=$(du -h /tmp/todify4-images.tar.gz | cut -f1)
    echo -e "${GREEN}✅ 本地镜像文件存在: /tmp/todify4-images.tar.gz (${local_size})${NC}"
else
    echo -e "${YELLOW}⚠️  本地镜像文件不存在${NC}"
    # 查找可能的临时文件
    temp_files=$(find /tmp -name "todify4-images.tar.gz" 2>/dev/null | head -3)
    if [ -n "$temp_files" ]; then
        echo -e "${YELLOW}找到可能的镜像文件:${NC}"
        echo "$temp_files"
    fi
fi
echo ""

# 检查服务器连接
echo -e "${BLUE}[2] 检查服务器连接...${NC}"
if sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS -T $SERVER_USER@$SERVER_IP "echo '连接成功'" &>/dev/null; then
    echo -e "${GREEN}✅ 服务器连接正常${NC}"
else
    echo -e "${RED}❌ 无法连接到服务器${NC}"
    exit 1
fi
echo ""

# 检查服务器上的镜像文件
echo -e "${BLUE}[3] 检查服务器上的镜像文件...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS -T $SERVER_USER@$SERVER_IP << ENDSSH
    if [ -f "/tmp/todify4-images.tar.gz" ]; then
        server_size=\$(du -h /tmp/todify4-images.tar.gz | cut -f1)
        echo "✅ 服务器镜像文件存在: /tmp/todify4-images.tar.gz (\$server_size)"
    else
        echo "⚠️  服务器镜像文件不存在"
    fi
ENDSSH
echo ""

# 检查 Docker 容器状态
echo -e "${BLUE}[4] 检查 Docker 容器状态...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS -T $SERVER_USER@$SERVER_IP << ENDSSH
    cd ${DEPLOY_PATH}/docker 2>/dev/null || {
        echo "⚠️  Docker 目录不存在"
        exit 0
    }
    
    echo "=== Docker Compose 服务状态 ==="
    if docker compose version &> /dev/null; then
        docker compose ps 2>/dev/null || echo "⚠️  无法获取服务状态"
    else
        docker-compose ps 2>/dev/null || echo "⚠️  无法获取服务状态"
    fi
    
    echo ""
    echo "=== Docker 容器状态 ==="
    docker ps --filter "name=todify4" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "⚠️  无法获取容器状态"
ENDSSH
echo ""

# 检查端口监听
echo -e "${BLUE}[5] 检查端口监听状态...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS -T $SERVER_USER@$SERVER_IP << ENDSSH
    echo "检查端口: 8118, 8111, 8113"
    netstat -tlnp 2>/dev/null | grep -E ":8118|:8111|:8113" || \
    ss -tlnp 2>/dev/null | grep -E ":8118|:8111|:8113" || \
    echo "⚠️  未发现端口监听"
ENDSSH
echo ""

# 检查服务健康状态
echo -e "${BLUE}[6] 检查服务健康状态...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS -T $SERVER_USER@$SERVER_IP << ENDSSH
    echo "测试后端健康检查..."
    curl -s --max-time 5 http://localhost:8113/api/health 2>/dev/null | head -3 || echo "⚠️  后端服务无响应"
    
    echo ""
    echo "测试前端..."
    curl -s --max-time 5 http://localhost:8111/ 2>/dev/null | head -3 || echo "⚠️  前端服务无响应"
    
    echo ""
    echo "测试 Nginx 代理..."
    curl -s --max-time 5 http://localhost:8118/ 2>/dev/null | head -3 || echo "⚠️  Nginx 服务无响应"
ENDSSH
echo ""

echo -e "${GREEN}=========================================="
echo "状态检查完成"
echo -e "==========================================${NC}"
