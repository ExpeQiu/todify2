#!/bin/bash

# Todify3 Docker 快速部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_info "Docker 环境检查通过"
}

# 检查环境变量文件
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warn ".env 文件不存在，从示例文件创建..."
        if [ -f ".env.docker.example" ]; then
            cp .env.docker.example .env
            print_info "已创建 .env 文件，请编辑配置后再运行部署"
            exit 0
        else
            print_error ".env.docker.example 文件不存在"
            exit 1
        fi
    fi
    print_info "环境变量文件检查通过"
}

# 创建必要的目录
create_directories() {
    print_info "创建必要的目录..."
    mkdir -p backend/data
    mkdir -p backend/uploads
    print_info "目录创建完成"
}

# 构建镜像
build_images() {
    print_info "开始构建 Docker 镜像..."
    print_warn "使用 DOCKER_BUILDKIT=0 避免 macOS 扩展属性问题"
    if docker compose version &> /dev/null; then
        DOCKER_BUILDKIT=0 docker compose build
    else
        DOCKER_BUILDKIT=0 docker-compose build
    fi
    print_info "镜像构建完成"
}

# 启动服务
start_services() {
    local db_type=$1
    
    print_info "启动服务 (数据库类型: ${db_type})..."
    
    if [ "$db_type" == "postgres" ]; then
        if docker compose version &> /dev/null; then
            docker compose -f docker-compose.yml -f docker-compose.postgres.yml up -d
        else
            docker-compose -f docker-compose.yml -f docker-compose.postgres.yml up -d
        fi
    else
        if docker compose version &> /dev/null; then
            docker compose up -d
        else
            docker-compose up -d
        fi
    fi
    
    print_info "服务启动完成"
}

# 检查服务状态
check_services() {
    print_info "检查服务状态..."
    sleep 5
    
    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
}

# 显示访问信息
show_access_info() {
    echo ""
    print_info "========================================="
    print_info "部署完成！"
    print_info "========================================="
    echo ""
    print_info "前端访问地址: http://localhost"
    print_info "后端 API 地址: http://localhost:3003/api"
    print_info "健康检查: http://localhost:3003/api/health"
    echo ""
    print_info "查看日志: docker-compose logs -f"
    print_info "停止服务: docker-compose down"
    print_info "重启服务: docker-compose restart"
    echo ""
}

# 主函数
main() {
    local db_type=${1:-sqlite}
    
    print_info "开始 Todify3 Docker 部署..."
    echo ""
    
    check_docker
    check_env_file
    create_directories
    build_images
    start_services "$db_type"
    check_services
    show_access_info
}

# 解析参数
case "${1:-}" in
    postgres|pg)
        main "postgres"
        ;;
    sqlite|sql|"")
        main "sqlite"
        ;;
    help|-h|--help)
        echo "用法: $0 [选项]"
        echo ""
        echo "选项:"
        echo "  sqlite (默认)  使用 SQLite 数据库"
        echo "  postgres       使用 PostgreSQL 数据库"
        echo "  help           显示此帮助信息"
        echo ""
        echo "示例:"
        echo "  $0              # 使用 SQLite 部署"
        echo "  $0 postgres     # 使用 PostgreSQL 部署"
        exit 0
        ;;
    *)
        print_error "未知选项: $1"
        echo "使用 '$0 help' 查看帮助信息"
        exit 1
        ;;
esac
