#!/bin/bash

# Todify4 Docker 部署脚本
# 用于将项目 Docker 化部署到阿里云服务器

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
SSH_OPTIONS="-T -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

# 端口配置
EXTERNAL_PORT="8118"
FRONTEND_PORT="8111"
BACKEND_PORT="8113"
SERVICE_NAME="todify4"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="${PROJECT_ROOT}/docker"

# 检查本地工具
check_local_tools() {
    log_info "检查本地工具..."
    
    if ! command -v sshpass &> /dev/null; then
        log_error "未找到 sshpass 工具"
        echo "请安装 sshpass："
        echo "  macOS:   brew install hudochenkov/sshpass/sshpass"
        echo "  Ubuntu:  sudo apt-get install sshpass"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "未找到 Docker"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        log_error "未找到 Docker Compose"
        exit 1
    fi
    
    log_success "本地工具检查完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端..."
    cd "$PROJECT_ROOT/frontend"
    
    if [ ! -f "package.json" ]; then
        log_error "前端 package.json 不存在"
        exit 1
    fi
    
    log_info "安装前端依赖..."
    npm install
    
    log_info "构建前端生产版本..."
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "前端构建失败，dist 目录不存在"
        exit 1
    fi
    
    log_success "前端构建完成"
}

# 检查服务器连接
check_server_connection() {
    log_info "检查服务器连接..."
    
    # 尝试连接并捕获错误
    local ssh_output
    ssh_output=$(sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP "echo '连接成功'" 2>&1)
    local ssh_exit_code=$?
    
    if [ $ssh_exit_code -ne 0 ]; then
        log_warning "SSH 连接测试失败 (退出码: $ssh_exit_code)"
        log_warning "错误信息: $ssh_output"
        log_warning "继续尝试部署（某些环境可能限制 SSH 测试）..."
    else
        log_success "服务器连接正常"
    fi
}

# 在服务器上安装 Docker
install_docker_on_server() {
    log_info "检查并安装服务器 Docker 环境..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        set -e
        
        # 检查 Docker
        if ! command -v docker &> /dev/null; then
            echo "📦 安装 Docker..."
            # CentOS/RHEL
            if command -v yum &> /dev/null; then
                yum install -y yum-utils
                yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
                yum install -y docker-ce docker-ce-cli containerd.io
            # Ubuntu/Debian
            elif command -v apt-get &> /dev/null; then
                apt-get update
                apt-get install -y docker.io docker-compose
            fi
            systemctl enable docker
            systemctl start docker
        else
            echo "✅ Docker 已安装: \$(docker --version)"
        fi
        
        # 检查 Docker Compose
        if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
            echo "📦 安装 Docker Compose..."
            if command -v yum &> /dev/null; then
                curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
                chmod +x /usr/local/bin/docker-compose
            fi
        else
            echo "✅ Docker Compose 已安装"
        fi
        
        # 确保部署目录存在
        mkdir -p ${DEPLOY_PATH}
        mkdir -p ${DEPLOY_PATH}/backend/data
        mkdir -p ${DEPLOY_PATH}/backend/uploads
        mkdir -p ${DEPLOY_PATH}/docker
        
        echo "✅ Docker 环境检查完成"
ENDSSH
    
    log_success "服务器 Docker 环境检查完成"
}

# 构建 Docker 镜像（在服务器上构建）
build_docker_images() {
    log_info "将在服务器上构建 Docker 镜像..."
    log_success "镜像构建将在服务器上完成"
}

# 导出 Docker 镜像
export_docker_images() {
    local output_file=$1
    
    log_info "导出 Docker 镜像..."
    
    cd "$DOCKER_DIR"
    
    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf $TEMP_DIR" EXIT
    
    # 保存镜像
    log_info "保存镜像到文件..."
    docker save todify4-backend:latest todify4-frontend:latest -o "$TEMP_DIR/todify4-images.tar"
    
    # 压缩镜像文件
    log_info "压缩镜像文件..."
    gzip -f "$TEMP_DIR/todify4-images.tar"
    
    # 将文件路径写入输出文件
    echo "$TEMP_DIR/todify4-images.tar.gz" > "$output_file"
}

# 上传项目文件
upload_project() {
    log_info "上传项目文件到服务器..."
    
    # 创建临时目录用于打包
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf $TEMP_DIR" EXIT
    
    log_info "准备上传文件..."
    
    # 复制 Docker 相关文件
    cp -r "$DOCKER_DIR"/* "$TEMP_DIR/docker/" 2>/dev/null || true
    mkdir -p "$TEMP_DIR/docker"
    cp "$DOCKER_DIR/docker-compose.yml" "$TEMP_DIR/docker/"
    cp "$DOCKER_DIR/nginx.conf" "$TEMP_DIR/docker/"
    
    # 复制后端必要文件（包含 Dockerfile，不包含 node_modules 和 dist）
    mkdir -p "$TEMP_DIR/backend"
    rsync -av --exclude 'node_modules' --exclude 'dist' --exclude '*.log' \
        "$PROJECT_ROOT/backend/" "$TEMP_DIR/backend/"
    
    # 复制前端 dist 目录和 Dockerfile
    if [ -d "$PROJECT_ROOT/frontend/dist" ]; then
        cp -r "$PROJECT_ROOT/frontend/dist" "$TEMP_DIR/frontend-dist"
    fi
    mkdir -p "$TEMP_DIR/frontend"
    if [ -f "$PROJECT_ROOT/frontend/Dockerfile" ]; then
        cp "$PROJECT_ROOT/frontend/Dockerfile" "$TEMP_DIR/frontend/"
    fi
    if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
        cp "$PROJECT_ROOT/frontend/package.json" "$TEMP_DIR/frontend/"
    fi
    
    # 复制环境变量文件
    if [ -f "$PROJECT_ROOT/backend/.env" ]; then
        cp "$PROJECT_ROOT/backend/.env" "$TEMP_DIR/backend.env"
    fi
    
    # 打包
    cd "$TEMP_DIR"
    tar -czf deploy.tar.gz docker/ backend/ frontend-dist/ frontend/ backend.env 2>/dev/null || tar -czf deploy.tar.gz docker/ backend/ frontend-dist/ frontend/
    
    # 上传到服务器
    log_info "上传文件..."
    sshpass -p "$SERVER_PASSWORD" scp $SSH_OPTIONS \
        deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/
    
    # 在服务器上解压
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        cd ${DEPLOY_PATH}
        
        # 备份现有文件（如果存在）
        if [ -d "docker" ] || [ -d "backend" ] || [ -d "frontend" ]; then
            echo "📦 备份现有文件..."
            BACKUP_DIR="backup_\$(date +%Y%m%d_%H%M%S)"
            mkdir -p ../\$BACKUP_DIR
            [ -d "docker" ] && mv docker ../\$BACKUP_DIR/ 2>/dev/null || true
            [ -d "backend" ] && mv backend ../\$BACKUP_DIR/ 2>/dev/null || true
            [ -d "frontend" ] && mv frontend ../\$BACKUP_DIR/ 2>/dev/null || true
        fi
        
        # 解压新文件
        echo "📦 解压新文件..."
        cd /tmp
        tar -xzf deploy.tar.gz -C ${DEPLOY_PATH}
        
        # 恢复 .env 文件
        if [ -f "${DEPLOY_PATH}/backend.env" ]; then
            mkdir -p ${DEPLOY_PATH}/backend
            mv ${DEPLOY_PATH}/backend.env ${DEPLOY_PATH}/backend/.env
        fi
        
        # 确保数据目录存在
        mkdir -p ${DEPLOY_PATH}/backend/data
        mkdir -p ${DEPLOY_PATH}/backend/uploads
        
        # 清理
        rm -f /tmp/deploy.tar.gz
        
        echo "✅ 文件解压完成"
ENDSSH
    
    log_success "项目文件上传完成"
}

# 上传 Docker 镜像
upload_docker_images() {
    local image_file=$1
    
    if [ ! -f "$image_file" ]; then
        log_error "镜像文件不存在: $image_file"
        exit 1
    fi
    
    local file_size=$(du -h "$image_file" | cut -f1)
    log_info "上传 Docker 镜像到服务器... (文件大小: $file_size)"
    log_info "这可能需要几分钟时间，请耐心等待..."
    
    # 使用 rsync 上传，显示进度
    if command -v rsync &> /dev/null; then
        log_info "使用 rsync 上传（显示进度）..."
        sshpass -p "$SERVER_PASSWORD" rsync -avz --progress $SSH_OPTIONS \
            "$image_file" $SERVER_USER@$SERVER_IP:/tmp/todify4-images.tar.gz || {
            log_warning "rsync 上传失败，尝试使用 scp..."
            sshpass -p "$SERVER_PASSWORD" scp $SSH_OPTIONS \
                "$image_file" $SERVER_USER@$SERVER_IP:/tmp/todify4-images.tar.gz
        }
    else
        # 使用 scp 上传（不显示进度，但更兼容）
        sshpass -p "$SERVER_PASSWORD" scp $SSH_OPTIONS \
            "$image_file" $SERVER_USER@$SERVER_IP:/tmp/todify4-images.tar.gz
    fi
    
    log_success "Docker 镜像上传完成"
}

# 在服务器上构建镜像并启动服务
deploy_on_server() {
    log_info "在服务器上构建镜像并部署 Docker 服务..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        set -e
        
        cd ${DEPLOY_PATH}
        
        # 停止并删除旧容器
        echo "🛑 停止旧容器..."
        if [ -d "docker" ]; then
            cd docker
            if docker compose version &> /dev/null; then
                docker compose down 2>/dev/null || true
            else
                docker-compose down 2>/dev/null || true
            fi
            cd ..
        fi
        
        # 清理 macOS 扩展属性文件
        echo "🧹 清理 macOS 扩展属性文件..."
        find backend -type f -name "._*" -delete 2>/dev/null || true
        find frontend-dist -type f -name "._*" -delete 2>/dev/null || true
        
        # 构建 Docker 镜像
        echo "📦 构建 Docker 镜像..."
        cd ${DEPLOY_PATH}
        
        # 构建后端镜像
        echo "构建后端镜像..."
        cd backend
        docker build -t todify4-backend:latest -f Dockerfile . || {
            echo "⚠️  后端镜像构建失败，检查 Dockerfile..."
            if [ ! -f "Dockerfile" ]; then
                echo "❌ Dockerfile 不存在于 backend 目录"
                exit 1
            fi
            exit 1
        }
        cd ..
        
        # 构建前端镜像（使用已构建的 dist 目录）
        echo "构建前端镜像..."
        if [ -d "frontend-dist" ]; then
            # 创建临时前端目录结构
            mkdir -p frontend-temp/dist
            cp -r frontend-dist/* frontend-temp/dist/
            
            # 创建简化的 Dockerfile（直接使用 dist）
            cat > frontend-temp/Dockerfile << 'DOCKERFILE_EOF'
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
DOCKERFILE_EOF
            
            # 复制 nginx 配置
            if [ -f "frontend/nginx.conf" ]; then
                cp frontend/nginx.conf frontend-temp/
            elif [ -f "../frontend/nginx.conf" ]; then
                cp ../frontend/nginx.conf frontend-temp/
            else
                # 创建默认 nginx 配置
                cat > frontend-temp/nginx.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://todify4-backend:8113;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF
            fi
            
            cd frontend-temp
            docker build -t todify4-frontend:latest -f Dockerfile . || {
                echo "⚠️  前端镜像构建失败"
                exit 1
            }
            cd ..
            rm -rf frontend-temp
        else
            echo "⚠️  frontend-dist 目录不存在，跳过前端镜像构建"
        fi
        
        # 启动服务
        echo "🚀 启动 Docker 服务..."
        cd ${DEPLOY_PATH}/docker
        
        # 确保 docker-compose.yml 路径正确
        if [ ! -f "docker-compose.yml" ]; then
            echo "❌ docker-compose.yml 不存在"
            exit 1
        fi
        
        if docker compose version &> /dev/null; then
            docker compose up -d --build
        else
            docker-compose up -d --build
        fi
        
        # 等待服务启动
        sleep 5
        
        # 检查服务状态
        echo "📊 服务状态："
        if docker compose version &> /dev/null; then
            docker compose ps
        else
            docker-compose ps
        fi
        
        echo "✅ 部署完成"
ENDSSH
    
    log_success "Docker 服务部署完成"
}

# 同步数据库和上传文件
sync_data() {
    log_info "同步数据库和上传文件..."
    
    # 备份云端数据库
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        cd ${DEPLOY_PATH}/backend
        
        # 创建备份目录
        mkdir -p data/backups
        
        # 备份现有数据库（如果容器正在运行）
        if docker ps | grep -q todify4-backend; then
            echo "📦 备份现有数据库..."
            docker exec todify4-backend sh -c "cp -r /app/data/*.db /app/data/backups/ 2>/dev/null || true" || true
        fi
ENDSSH
    
    # 同步本地数据库文件
    if [ -d "$PROJECT_ROOT/backend/data" ]; then
        log_info "同步数据库文件..."
        sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP \
            "mkdir -p ${DEPLOY_PATH}/backend/data"
        sshpass -p "$SERVER_PASSWORD" scp -r $SSH_OPTIONS \
            "$PROJECT_ROOT/backend/data"/*.db \
            $SERVER_USER@$SERVER_IP:${DEPLOY_PATH}/backend/data/ 2>/dev/null || log_warning "部分数据库文件可能不存在"
    fi
    
    # 同步上传文件
    if [ -d "$PROJECT_ROOT/backend/uploads" ]; then
        log_info "同步上传文件..."
        sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP \
            "mkdir -p ${DEPLOY_PATH}/backend/uploads"
        sshpass -p "$SERVER_PASSWORD" scp -r $SSH_OPTIONS \
            "$PROJECT_ROOT/backend/uploads"/* \
            $SERVER_USER@$SERVER_IP:${DEPLOY_PATH}/backend/uploads/ 2>/dev/null || log_warning "上传文件目录可能为空"
    fi
    
    log_success "数据同步完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        echo "=== Docker 容器状态 ==="
        docker ps --filter "name=todify4" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        echo ""
        echo "=== 端口监听状态 ==="
        netstat -tlnp | grep -E ":${EXTERNAL_PORT}|:${FRONTEND_PORT}|:${BACKEND_PORT}" || ss -tlnp | grep -E ":${EXTERNAL_PORT}|:${FRONTEND_PORT}|:${BACKEND_PORT}"
        
        echo ""
        echo "=== 服务健康检查 ==="
        sleep 3
        curl -s http://localhost:${EXTERNAL_PORT}/api/health | head -5 || echo "⚠️  服务可能还在启动中"
        
        echo ""
        echo "=== Docker Compose 日志（最近 20 行） ==="
        cd ${DEPLOY_PATH}/docker
        if docker compose version &> /dev/null; then
            docker compose logs --tail=20
        else
            docker-compose logs --tail=20
        fi
ENDSSH
    
    log_success "部署验证完成"
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    echo "🚀 Todify4 Docker 部署脚本"
    echo "=========================================="
    echo ""
    echo "服务配置："
    echo "  - 服务名: ${SERVICE_NAME}"
    echo "  - 对外端口: ${EXTERNAL_PORT} (Nginx)"
    echo "  - 前端端口: ${FRONTEND_PORT}"
    echo "  - 后端端口: ${BACKEND_PORT}"
    echo "  - 服务器: ${SERVER_USER}@${SERVER_IP}"
    echo ""
    
    # 确认操作
    read -p "是否继续部署？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 执行部署步骤
    check_local_tools
    build_frontend
    check_server_connection
    install_docker_on_server
    build_docker_images
    
    upload_project
    sync_data
    deploy_on_server
    verify_deployment
    
    echo ""
    echo "=========================================="
    log_success "部署完成！"
    echo "=========================================="
    echo ""
    echo "🌐 访问地址: http://${SERVER_IP}:${EXTERNAL_PORT}"
    echo "🔧 API 地址: http://${SERVER_IP}:${EXTERNAL_PORT}/api/health"
    echo ""
    echo "📋 服务管理命令："
    echo "  查看服务状态:"
    echo "    sshpass -p '${SERVER_PASSWORD}' ssh ${SSH_OPTIONS} ${SERVER_USER}@${SERVER_IP} 'cd ${DEPLOY_PATH}/docker && docker compose ps'"
    echo ""
    echo "  查看日志:"
    echo "    sshpass -p '${SERVER_PASSWORD}' ssh ${SSH_OPTIONS} ${SERVER_USER}@${SERVER_IP} 'cd ${DEPLOY_PATH}/docker && docker compose logs -f'"
    echo ""
    echo "  重启服务:"
    echo "    sshpass -p '${SERVER_PASSWORD}' ssh ${SSH_OPTIONS} ${SERVER_USER}@${SERVER_IP} 'cd ${DEPLOY_PATH}/docker && docker compose restart'"
    echo ""
    echo "  停止服务:"
    echo "    sshpass -p '${SERVER_PASSWORD}' ssh ${SSH_OPTIONS} ${SERVER_USER}@${SERVER_IP} 'cd ${DEPLOY_PATH}/docker && docker compose down'"
    echo ""
}

# 执行主函数
main "$@"
