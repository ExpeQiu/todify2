#!/bin/bash

# Todify3 完整部署脚本
# 服务配置：
# - 服务名：todify3
# - 对外端口：8089（Nginx）
# - 前端本地端口：2201
# - 后端本地端口：2203（PM2）

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
DEPLOY_PATH="/root/todify3"
BACKEND_PATH="${DEPLOY_PATH}/backend"
FRONTEND_PATH="${DEPLOY_PATH}/frontend"
SSH_OPTIONS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

# 端口配置
EXTERNAL_PORT="8089"
FRONTEND_PORT="2201"
BACKEND_PORT="2203"
SERVICE_NAME="todify3"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

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
    
    if ! command -v node &> /dev/null; then
        log_error "未找到 Node.js"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "未找到 npm"
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
    
    if ! sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP "echo '连接成功'" &>/dev/null; then
        log_error "无法连接到服务器"
        exit 1
    fi
    
    log_success "服务器连接正常"
}

# 在服务器上安装必要工具
install_server_tools() {
    log_info "检查并安装服务器工具..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        set -e
        
        # 检查 Node.js
        if ! command -v node &> /dev/null; then
            echo "📦 安装 Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
        else
            echo "✅ Node.js 已安装: \$(node --version)"
        fi
        
        # 检查 PM2
        if ! command -v pm2 &> /dev/null; then
            echo "📦 安装 PM2..."
            npm install -g pm2
        else
            echo "✅ PM2 已安装: \$(pm2 --version)"
        fi
        
        # 检查 Nginx
        if ! command -v nginx &> /dev/null; then
            echo "📦 安装 Nginx..."
            apt-get update
            apt-get install -y nginx
        else
            echo "✅ Nginx 已安装"
        fi
        
        # 确保部署目录存在
        mkdir -p ${DEPLOY_PATH}
        mkdir -p ${BACKEND_PATH}/data
        mkdir -p ${BACKEND_PATH}/uploads
        mkdir -p ${FRONTEND_PATH}
ENDSSH
    
    log_success "服务器工具检查完成"
}

# 上传项目文件
upload_project() {
    log_info "上传项目文件到服务器..."
    
    # 创建临时目录用于打包
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf $TEMP_DIR" EXIT
    
    log_info "准备上传文件..."
    
    # 复制后端文件（排除 node_modules）
    rsync -av --exclude 'node_modules' --exclude '*.log' \
        "$PROJECT_ROOT/backend/" "$TEMP_DIR/backend/"
    
    # 复制前端 dist 目录
    cp -r "$PROJECT_ROOT/frontend/dist" "$TEMP_DIR/frontend-dist"
    
    # 复制必要的配置文件
    if [ -f "$PROJECT_ROOT/backend/.env" ]; then
        cp "$PROJECT_ROOT/backend/.env" "$TEMP_DIR/backend.env"
    fi
    
    # 打包
    cd "$TEMP_DIR"
    tar -czf deploy.tar.gz backend/ frontend-dist/ backend.env 2>/dev/null || tar -czf deploy.tar.gz backend/ frontend-dist/
    
    # 上传到服务器
    log_info "上传文件..."
    sshpass -p "$SERVER_PASSWORD" scp $SSH_OPTIONS \
        deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/
    
    # 在服务器上解压
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        cd ${DEPLOY_PATH}
        
        # 备份现有文件（如果存在）
        if [ -d "backend" ] || [ -d "frontend" ]; then
            echo "📦 备份现有文件..."
            BACKUP_DIR="backup_\$(date +%Y%m%d_%H%M%S)"
            mkdir -p ../\$BACKUP_DIR
            [ -d "backend" ] && mv backend ../\$BACKUP_DIR/ 2>/dev/null || true
            [ -d "frontend" ] && mv frontend ../\$BACKUP_DIR/ 2>/dev/null || true
        fi
        
        # 解压新文件
        echo "📦 解压新文件..."
        cd /tmp
        tar -xzf deploy.tar.gz -C ${DEPLOY_PATH}
        
        # 创建 frontend 目录并移动前端 dist
        mkdir -p ${FRONTEND_PATH}
        if [ -d "${DEPLOY_PATH}/frontend-dist" ]; then
            # 如果 frontend-dist 是目录，移动其内容
            if [ -d "${DEPLOY_PATH}/frontend-dist/dist" ]; then
                mv ${DEPLOY_PATH}/frontend-dist/dist/* ${FRONTEND_PATH}/ 2>/dev/null || true
            else
                mv ${DEPLOY_PATH}/frontend-dist/* ${FRONTEND_PATH}/ 2>/dev/null || true
            fi
            rm -rf ${DEPLOY_PATH}/frontend-dist
        fi
        
        # 验证前端 dist 目录
        if [ ! -d "${FRONTEND_PATH}/dist" ] && [ -f "${FRONTEND_PATH}/index.html" ]; then
            # 如果 index.html 在 frontend 根目录，说明 dist 内容已经在 frontend 目录
            echo "✅ 前端文件已正确放置"
        elif [ -d "${FRONTEND_PATH}/dist" ]; then
            # 如果 dist 目录存在，移动其内容到 frontend 根目录
            mv ${FRONTEND_PATH}/dist/* ${FRONTEND_PATH}/ 2>/dev/null || true
            rmdir ${FRONTEND_PATH}/dist 2>/dev/null || true
        fi
        
        # 恢复 .env 文件并更新端口配置
        if [ -f "${DEPLOY_PATH}/backend.env" ]; then
            mv ${DEPLOY_PATH}/backend.env ${BACKEND_PATH}/.env
        fi
        
        # 更新 .env 文件中的端口和数据库配置
        if [ -f "${BACKEND_PATH}/.env" ]; then
            # 更新端口
            sed -i "s/^PORT=.*/PORT=${BACKEND_PORT}/" ${BACKEND_PATH}/.env
            # 更新环境为生产环境
            sed -i "s/^NODE_ENV=.*/NODE_ENV=production/" ${BACKEND_PATH}/.env
            # 确保数据库路径正确
            if ! grep -q "SQLITE_DB_PATH" ${BACKEND_PATH}/.env; then
                echo "SQLITE_DB_PATH=./data/todify3.db" >> ${BACKEND_PATH}/.env
            else
                sed -i "s|^SQLITE_DB_PATH=.*|SQLITE_DB_PATH=./data/todify3.db|" ${BACKEND_PATH}/.env
            fi
        else
            # 创建默认 .env 文件
            cat > ${BACKEND_PATH}/.env << EOFENV
PORT=${BACKEND_PORT}
NODE_ENV=production
DB_TYPE=sqlite
SQLITE_DB_PATH=./data/todify3.db
EOFENV
        fi
        
        # 清理
        rm -f /tmp/deploy.tar.gz
        
        echo "✅ 文件解压完成"
ENDSSH
    
    log_success "项目文件上传完成"
}

# 同步数据库和配置文件
sync_database_and_config() {
    log_info "同步数据库和配置文件..."
    
    # 备份云端数据库
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        cd ${BACKEND_PATH}
        
        # 创建备份目录
        mkdir -p data/backup
        
        # 备份现有数据库
        for db_file in data/*.db; do
            if [ -f "\$db_file" ]; then
                backup_file="data/backup/\$(basename \$db_file).backup.\$(date +%Y%m%d_%H%M%S)"
                cp "\$db_file" "\$backup_file"
                echo "✅ 已备份: \$backup_file"
            fi
        done
ENDSSH
    
    # 同步本地数据库文件
    if [ -d "$PROJECT_ROOT/backend/data" ]; then
        log_info "同步数据库文件..."
        sshpass -p "$SERVER_PASSWORD" scp -r $SSH_OPTIONS \
            "$PROJECT_ROOT/backend/data"/*.db \
            $SERVER_USER@$SERVER_IP:${BACKEND_PATH}/data/ 2>/dev/null || log_warning "部分数据库文件可能不存在"
    fi
    
    # 同步上传文件
    if [ -d "$PROJECT_ROOT/backend/uploads" ]; then
        log_info "同步上传文件..."
        sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP \
            "mkdir -p ${BACKEND_PATH}/uploads"
        sshpass -p "$SERVER_PASSWORD" scp -r $SSH_OPTIONS \
            "$PROJECT_ROOT/backend/uploads"/* \
            $SERVER_USER@$SERVER_IP:${BACKEND_PATH}/uploads/ 2>/dev/null || log_warning "上传文件目录可能为空"
    fi
    
    log_success "数据库和配置文件同步完成"
}

# 在服务器上安装依赖
install_server_dependencies() {
    log_info "在服务器上安装依赖..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        set -e
        
        # 安装后端依赖
        echo "📥 安装后端依赖..."
        cd ${BACKEND_PATH}
        npm install --production
        
        # 构建后端（如果需要）
        if [ -f "tsconfig.json" ]; then
            echo "🔧 构建后端..."
            npm run build || echo "⚠️  构建失败，将使用开发模式"
        fi
        
        echo "✅ 依赖安装完成"
ENDSSH
    
    log_success "服务器依赖安装完成"
}

# 配置 PM2
setup_pm2() {
    log_info "配置 PM2..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        set -e
        
        cd ${BACKEND_PATH}
        
        # 停止旧服务（如果存在，只停止 todify3 相关服务）
        pm2 stop ${SERVICE_NAME}-backend 2>/dev/null || true
        pm2 delete ${SERVICE_NAME}-backend 2>/dev/null || true
        
        # 确保不会影响其他服务
        echo "✅ 已停止旧服务（仅 todify3 相关）"
        
        # 创建 PM2 配置文件
        cat > ${DEPLOY_PATH}/ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'todify3-backend',
    script: './backend/dist/index.js',
    cwd: '/root/todify3',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 2203
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    // 如果 dist 不存在，使用开发模式
    interpreter: 'node',
    interpreter_args: ''
  }]
};
EOFPM2
        
        # 如果 dist 不存在，使用 ts-node-dev 启动
        if [ ! -f "${BACKEND_PATH}/dist/index.js" ]; then
            echo "⚠️  dist 目录不存在，使用开发模式启动..."
            cat > ${DEPLOY_PATH}/ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'todify3-backend',
    script: 'npm',
    args: 'run dev',
    cwd: '/root/todify3/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 2203
    },
    error_file: '/root/todify3/logs/backend-error.log',
    out_file: '/root/todify3/logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOFPM2
        fi
        
        # 创建日志目录
        mkdir -p ${DEPLOY_PATH}/logs
        
        # 启动后端服务
        echo "🚀 启动后端服务..."
        cd ${DEPLOY_PATH}
        pm2 start ecosystem.config.js
        
        # 等待服务启动
        sleep 3
        
        # 检查服务状态
        pm2 status
        
        # 保存 PM2 配置
        pm2 save
        
        # 设置开机自启
        pm2 startup systemd -u root --hp /root 2>/dev/null || true
        
        echo "✅ PM2 配置完成"
ENDSSH
    
    log_success "PM2 配置完成"
}

# 配置前端服务
setup_frontend() {
    log_info "配置前端服务..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        set -e
        
        # 停止旧的前端服务（如果存在，只停止 todify3 相关服务）
        pm2 stop ${SERVICE_NAME}-frontend 2>/dev/null || true
        pm2 delete ${SERVICE_NAME}-frontend 2>/dev/null || true
        
        # 确保不会影响其他服务
        echo "✅ 已停止旧前端服务（仅 todify3 相关）"
        
        # 检查前端文件（index.html 应该在 frontend 目录根目录）
        if [ ! -f "${FRONTEND_PATH}/index.html" ]; then
            echo "❌ 前端 index.html 文件不存在，检查目录结构..."
            ls -la ${FRONTEND_PATH}/
            exit 1
        fi
        
        # 安装 serve 或使用 vite preview
        if ! command -v serve &> /dev/null; then
            echo "📦 安装 serve..."
            npm install -g serve
        fi
        
        # 使用 serve 启动前端（更简单可靠）
        echo "🚀 启动前端服务..."
        pm2 start serve --name "${SERVICE_NAME}-frontend" \
            -- -s ${FRONTEND_PATH} -l ${FRONTEND_PORT} -n
        
        # 等待服务启动
        sleep 2
        
        # 保存 PM2 配置
        pm2 save
        
        echo "✅ 前端服务配置完成"
ENDSSH
    
    log_success "前端服务配置完成"
}

# 配置 Nginx
setup_nginx() {
    log_info "配置 Nginx..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        set -e
        
        # 创建 Nginx 配置
        cat > /etc/nginx/sites-available/${SERVICE_NAME} << EOFNGINX
server {
    listen ${EXTERNAL_PORT};
    server_name ${SERVER_IP};
    
    # 前端代理
    location / {
        proxy_pass http://localhost:${FRONTEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 超时设置
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # API 代理到后端
    location /api/ {
        proxy_pass http://localhost:${BACKEND_PORT}/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 超时设置
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # Metrics 端点
    location /metrics {
        proxy_pass http://localhost:${BACKEND_PORT}/metrics;
        proxy_set_header Host \$host;
    }
}
EOFNGINX
        
        # 创建符号链接
        ln -sf /etc/nginx/sites-available/${SERVICE_NAME} /etc/nginx/sites-enabled/${SERVICE_NAME}
        
        # 测试 Nginx 配置
        nginx -t
        
        # 重载 Nginx
        systemctl reload nginx || service nginx reload
        
        echo "✅ Nginx 配置完成"
ENDSSH
    
    log_success "Nginx 配置完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTIONS $SERVER_USER@$SERVER_IP << ENDSSH
        echo "=== PM2 服务状态 ==="
        pm2 status
        
        echo ""
        echo "=== 端口监听状态 ==="
        netstat -tlnp | grep -E ":${EXTERNAL_PORT}|:${FRONTEND_PORT}|:${BACKEND_PORT}" || ss -tlnp | grep -E ":${EXTERNAL_PORT}|:${FRONTEND_PORT}|:${BACKEND_PORT}"
        
        echo ""
        echo "=== 服务健康检查 ==="
        sleep 2
        curl -s http://localhost:${BACKEND_PORT}/api/health | head -5 || echo "⚠️  后端服务可能还在启动中"
        
        echo ""
        echo "=== Nginx 状态 ==="
        systemctl status nginx --no-pager -l | head -10 || service nginx status | head -10
ENDSSH
    
    log_success "部署验证完成"
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    echo "🚀 Todify3 完整部署脚本"
    echo "=========================================="
    echo ""
    echo "服务配置："
    echo "  - 服务名: ${SERVICE_NAME}"
    echo "  - 对外端口: ${EXTERNAL_PORT}"
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
    install_server_tools
    upload_project
    sync_database_and_config
    install_server_dependencies
    setup_pm2
    setup_frontend
    setup_nginx
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
    echo "    sshpass -p '${SERVER_PASSWORD}' ssh ${SSH_OPTIONS} ${SERVER_USER}@${SERVER_IP} 'pm2 status'"
    echo ""
    echo "  查看日志:"
    echo "    sshpass -p '${SERVER_PASSWORD}' ssh ${SSH_OPTIONS} ${SERVER_USER}@${SERVER_IP} 'pm2 logs ${SERVICE_NAME}-backend'"
    echo ""
    echo "  重启服务:"
    echo "    sshpass -p '${SERVER_PASSWORD}' ssh ${SSH_OPTIONS} ${SERVER_USER}@${SERVER_IP} 'pm2 restart ${SERVICE_NAME}-backend ${SERVICE_NAME}-frontend'"
    echo ""
}

# 执行主函数
main "$@"

