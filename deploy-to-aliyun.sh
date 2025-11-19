#!/bin/bash

# Todify3 部署到阿里云服务器脚本
# 使用sshpass自动输入密码进行SSH连接

set -e  # 遇到错误立即退出

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
DEPLOY_PATH="/root/todify3-deploy"
EXTERNAL_PORT="5678"  # 对外访问端口
FRONTEND_PORT="3001"  # 前端服务端口
BACKEND_PORT="3003"   # 后端服务端口

log_info "开始部署 Todify3 到阿里云服务器..."

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

# 检查sshpass
check_sshpass

# 检查是否有未提交的更改
log_info "检查Git状态..."
if ! git diff-index --quiet HEAD --; then
    log_warning "有未提交的更改，请先提交或暂存"
    read -p "是否继续部署？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 构建前端
log_info "构建前端..."
cd frontend
if ! npm run build; then
    log_error "前端构建失败"
    exit 1
fi
log_success "前端构建完成"
cd ..

# 准备部署文件
log_info "准备部署文件..."
mkdir -p deploy-temp
cp -r backend deploy-temp/
# 复制整个frontend目录，因为需要node_modules和package.json来运行preview
cp -r frontend deploy-temp/
cp start.sh deploy-temp/ 2>/dev/null || true

# 复制必要的配置文件（如果存在）
if [ -f production.env ]; then
    cp production.env deploy-temp/backend/.env.production
fi

# 创建启动脚本
log_info "创建启动脚本..."
cat > deploy-temp/start-production.sh << EOF
#!/bin/bash
set -e

echo "🚀 启动生产环境服务..."

# 启动后端服务（端口${BACKEND_PORT}）
cd ${DEPLOY_PATH}/backend
if command -v pm2 &> /dev/null; then
    pm2 start npm --name "todify3-backend" -- run dev:prod || pm2 restart todify3-backend
else
    nohup npm run dev > backend.log 2>&1 &
fi

# 启动前端服务（端口${FRONTEND_PORT}）
cd ${DEPLOY_PATH}/frontend
if command -v pm2 &> /dev/null; then
    pm2 start npm --name "todify3-frontend" -- run preview || pm2 restart todify3-frontend
else
    nohup npm run preview -- --host 0.0.0.0 --port ${FRONTEND_PORT} > frontend.log 2>&1 &
fi

echo "✅ 服务已启动"
if command -v pm2 &> /dev/null; then
    pm2 status
fi
EOF

chmod +x deploy-temp/start-production.sh

# 创建Nginx配置文件
log_info "创建Nginx配置文件..."
cat > deploy-temp/nginx-todify3.conf << EOF
server {
    listen ${EXTERNAL_PORT};
    server_name ${SERVER_IP};

    # 前端代理到${FRONTEND_PORT}端口
    location / {
        proxy_pass http://localhost:${FRONTEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 超时设置
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # API代理到${BACKEND_PORT}端口
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
}
EOF

# 打包部署文件
log_info "打包部署文件..."
tar -czf deploy.tar.gz -C deploy-temp .
rm -rf deploy-temp
log_success "部署文件打包完成"

# 传输到服务器
log_info "上传文件到服务器..."
if ! sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null deploy.tar.gz $SERVER_USER@$SERVER_IP:/root/; then
    log_error "文件上传失败"
    exit 1
fi
log_success "文件上传成功"

# 在服务器上部署
log_info "在服务器上部署..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $SERVER_USER@$SERVER_IP << ENDSSH
set -e

echo "📦 解压部署文件..."
cd /root
if [ -d "${DEPLOY_PATH}" ]; then
    echo "备份现有部署..."
    mv ${DEPLOY_PATH} ${DEPLOY_PATH}.backup.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
fi
mkdir -p ${DEPLOY_PATH}
tar -xzf deploy.tar.gz -C ${DEPLOY_PATH}
rm -f deploy.tar.gz

echo "📥 安装依赖..."
cd ${DEPLOY_PATH}/backend
if [ ! -d "node_modules" ]; then
    npm install --production
else
    npm install --production
fi

cd ${DEPLOY_PATH}/frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    npm install
fi

echo "🔄 停止旧服务..."
if command -v pm2 &> /dev/null; then
    pm2 stop todify3-backend todify3-frontend 2>/dev/null || true
    pm2 delete todify3-backend todify3-frontend 2>/dev/null || true
else
    pkill -f "node.*backend" 2>/dev/null || true
    pkill -f "node.*frontend" 2>/dev/null || true
    pkill -f "vite.*preview" 2>/dev/null || true
fi
sleep 2

echo "🔧 配置Nginx..."
if [ -f ${DEPLOY_PATH}/nginx-todify3.conf ]; then
    sudo cp ${DEPLOY_PATH}/nginx-todify3.conf /etc/nginx/sites-available/todify3
    if [ ! -f /etc/nginx/sites-enabled/todify3 ]; then
        sudo ln -s /etc/nginx/sites-available/todify3 /etc/nginx/sites-enabled/todify3
    fi
    sudo nginx -t && sudo systemctl reload nginx || echo "Nginx配置失败，请手动检查"
fi

echo "🚀 启动新服务..."
cd ${DEPLOY_PATH}
chmod +x start-production.sh
./start-production.sh

echo "⏳ 等待服务启动..."
sleep 5

echo "📊 查看服务状态..."
if command -v pm2 &> /dev/null; then
    pm2 status
    pm2 logs --lines 20 --nostream
else
    netstat -tulnp | grep -E ':(3001|3003)' || echo "端口监听检查"
fi

echo "✅ 部署完成"
ENDSSH

if [ $? -ne 0 ]; then
    log_error "服务器部署失败"
    exit 1
fi
# 清理临时文件
log_info "清理临时文件..."
rm -f deploy.tar.gz

echo ""
log_success "部署完成！"
echo ""
echo "=========================================="
echo "📋 部署信息"
echo "=========================================="
echo "🌐 访问地址: http://${SERVER_IP}:${EXTERNAL_PORT}"
echo "🔧 后端API: http://${SERVER_IP}:${EXTERNAL_PORT}/api/health"
echo ""
echo "📋 管理命令:"
echo "  查看日志: sshpass -p '${SERVER_PASSWORD}' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} 'pm2 logs'"
echo "  服务状态: sshpass -p '${SERVER_PASSWORD}' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} 'pm2 status'"
echo "  重启服务: sshpass -p '${SERVER_PASSWORD}' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} 'cd ${DEPLOY_PATH} && ./start-production.sh'"
echo "=========================================="

