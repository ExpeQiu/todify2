#!/bin/bash

# Todify4 Docker 镜像构建和导出脚本
# 用于手动部署场景

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取版本号（第一个参数，默认为 v1.0）
VERSION=${1:-v1.0}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_info "=========================================="
print_info "Todify4 Docker 镜像构建和导出"
print_info "版本: $VERSION"
print_info "=========================================="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    print_error "Docker 未安装，请先安装 Docker"
    exit 1
fi

# 清理 macOS 隐藏文件
print_info "清理 macOS 隐藏文件..."
find "$PROJECT_ROOT/frontend" -name "._*" -type f -delete 2>/dev/null || true
find "$PROJECT_ROOT/backend" -name "._*" -type f -delete 2>/dev/null || true
find "$PROJECT_ROOT/docker" -name "._*" -type f -delete 2>/dev/null || true
print_info "清理完成"

# 验证前端 nginx 配置
print_info "验证前端 nginx 配置..."
if grep -q "http://backend:3003" "$PROJECT_ROOT/frontend/nginx.conf"; then
    print_warn "检测到 nginx.conf 使用服务名 'backend'，将修改为容器名 'todify3-backend'"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's|http://backend:3003|http://todify3-backend:3003|g' "$PROJECT_ROOT/frontend/nginx.conf"
    else
        sed -i 's|http://backend:3003|http://todify3-backend:3003|g' "$PROJECT_ROOT/frontend/nginx.conf"
    fi
    print_info "已修改 nginx.conf"
else
    print_info "nginx.conf 配置正确（使用 todify3-backend）"
fi

# 构建后端镜像
print_info "构建后端镜像（使用 Dockerfile.centos7）..."
docker build --platform linux/amd64 --no-cache \
  -t todify3-backend:latest \
  -f "$PROJECT_ROOT/backend/Dockerfile.centos7" \
  "$PROJECT_ROOT/backend"

if [ $? -eq 0 ]; then
    print_info "后端镜像构建成功"
    docker tag todify3-backend:latest todify3-backend:$VERSION
else
    print_error "后端镜像构建失败"
    exit 1
fi

# 构建前端镜像
print_info "构建前端镜像（使用 Dockerfile.centos7）..."
docker build --platform linux/amd64 --no-cache \
  -t todify3-frontend:latest \
  -f "$PROJECT_ROOT/frontend/Dockerfile.centos7" \
  "$PROJECT_ROOT/frontend"

if [ $? -eq 0 ]; then
    print_info "前端镜像构建成功"
    docker tag todify3-frontend:latest todify3-frontend:$VERSION
else
    print_error "前端镜像构建失败"
    exit 1
fi

# 拉取 PostgreSQL 镜像（可选）
print_info "拉取 PostgreSQL 镜像..."
docker pull --platform linux/amd64 postgres:15-alpine
docker tag postgres:15-alpine todify3-postgres:$VERSION
print_info "PostgreSQL 镜像准备完成"

# 验证镜像
print_info "验证镜像..."
docker images | grep -E "(todify3|REPOSITORY)" | head -4

# 导出镜像
OUTPUT_FILE="$PROJECT_ROOT/todify4-all-$VERSION.tar"
print_info "导出镜像到: $OUTPUT_FILE"
docker save -o "$OUTPUT_FILE" \
  todify3-backend:$VERSION \
  todify3-frontend:$VERSION \
  todify3-postgres:$VERSION

if [ $? -eq 0 ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    print_info "镜像导出成功"
    print_info "文件大小: $FILE_SIZE"
    print_info "文件位置: $OUTPUT_FILE"
    echo ""
    print_info "=========================================="
    print_info "构建和导出完成！"
    print_info "=========================================="
    echo ""
    print_info "下一步："
    print_info "1. 上传 $OUTPUT_FILE 到服务器"
    print_info "2. 在服务器上执行: docker load -i todify4-all-$VERSION.tar"
    print_info "3. 参考 guide/docker/MANUAL_DEPLOY_GUIDE.md 进行部署"
    echo ""
else
    print_error "镜像导出失败"
    exit 1
fi



