#!/bin/bash

# Todify2 自动化部署脚本（使用 sshpass）
# 非 Docker 部署方案（PM2）

set -e  # 遇到错误立即退出

# 配置信息
SSH_USER="root"
SSH_HOST="47.113.225.93"
SSH_PASSWORD="Qb89100820"
SSH_OPTIONS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
REMOTE_DIR="/root/todify2-deploy"
BACKEND_PORT="3003"
FRONTEND_PORT="3001"
EXTERNAL_PORT="5678"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 检查依赖
check_dependencies() {
    log_info "检查本地依赖..."
    
    # 检查 sshpass
    if ! command -v sshpass &> /dev/null; then
        log_error "未找到 sshpass，请先安装: brew install hudochenkov/sshpass/sshpass (macOS) 或 apt-get install sshpass (Linux)"
        exit 1
    fi
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "未找到 Node.js，请先安装 Node.js"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "未找到 npm，请先安装 npm"
        exit 1
    fi
    
    log_success "本地依赖检查完成"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 本地构建
build_local() {
    log_info "开始本地构建..."
    
    # 构建前端
    log_info "构建前端..."
    cd "$SCRIPT_DIR/frontend"
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        npm install
    fi
    npm run build
    if [ $? -ne 0 ]; then
        log_error "前端构建失败"
        exit 1
    fi
    log_success "前端构建完成"
    
    # 构建后端
    log_info "构建后端..."
    cd "$SCRIPT_DIR/backend"
    if [ ! -d "node_modules" ]; then
        log_info "安装后端依赖..."
        npm install
    fi
    npm run build
    if [ $? -ne 0 ]; then
        log_error "后端构建失败"
        exit 1
    fi
    log_success "后端构建完成"
    
    cd "$SCRIPT_DIR"
}

# 打包文件
package_files() {
    log_info "打包部署文件..."
    
    DEPLOY_PACKAGE="todify2-deploy-$(date +%Y%m%d_%H%M%S).tar.gz"
    TEMP_DIR="deploy-temp"
    
    # 清理旧的临时目录
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    
    # 复制后端文件
    log_info "复制后端文件..."
    mkdir -p "$TEMP_DIR/backend"
    cp -r backend/dist "$TEMP_DIR/backend/"
    cp -r backend/src "$TEMP_DIR/backend/" 2>/dev/null || true
    cp backend/package.json "$TEMP_DIR/backend/"
    cp backend/package-lock.json "$TEMP_DIR/backend/" 2>/dev/null || true
    cp backend/tsconfig.json "$TEMP_DIR/backend/" 2>/dev/null || true
    cp backend/database.db "$TEMP_DIR/backend/" 2>/dev/null || true
    
    # 复制前端构建产物
    log_info "复制前端构建产物..."
    mkdir -p "$TEMP_DIR/frontend"
    cp -r frontend/dist "$TEMP_DIR/frontend/"
    cp frontend/package.json "$TEMP_DIR/frontend/"
    cp frontend/package-lock.json "$TEMP_DIR/frontend/" 2>/dev/null || true
    
    # 创建服务器端部署脚本
    log_info "创建服务器端部署脚本..."
    cat > "$TEMP_DIR/deploy-server.sh" << EOF
#!/bin/bash
set -e

REMOTE_DIR="$REMOTE_DIR"
BACKEND_PORT="$BACKEND_PORT"
FRONTEND_PORT="$FRONTEND_PORT"

echo "🚀 开始服务器端部署..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，正在安装..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

cd "$REMOTE_DIR"

# 安装后端依赖
echo "📥 安装后端依赖..."
cd backend
npm install --production

# 安装并运行 tsc-alias 来修复路径别名
echo "🔧 修复路径别名..."
if [ ! -d "node_modules/tsc-alias" ]; then
    npm install tsc-alias --save-dev
fi
npx tsc-alias -p tsconfig.json

# 安装前端依赖（需要开发依赖，因为 vite preview 需要 vite）
echo "📥 安装前端依赖..."
cd ../frontend
npm install

# 停止旧服务
echo "🛑 停止旧服务..."
pm2 stop todify2-backend todify2-frontend 2>/dev/null || true
pm2 delete todify2-backend todify2-frontend 2>/dev/null || true

# 停止可能占用端口的旧进程
pkill -f "node.*3003" 2>/dev/null || true
pkill -f "vite.*3001" 2>/dev/null || true
sleep 2

# 启动后端服务
echo "🚀 启动后端服务..."
cd "$REMOTE_DIR/backend"

# 检查是否安装了 tsconfig-paths
if [ ! -d "node_modules/tsconfig-paths" ]; then
    echo "📦 安装 tsconfig-paths..."
    npm install tsconfig-paths --save
fi

# 使用 tsconfig-paths 启动服务
pm2 start node --name "todify2-backend" -- \
    -r tsconfig-paths/register \
    dist/index.js \
    PORT=$BACKEND_PORT

# 启动前端服务
echo "🚀 启动前端服务..."
cd "$REMOTE_DIR/frontend"
pm2 start npm --name "todify2-frontend" -- run preview -- --host 0.0.0.0 --port $FRONTEND_PORT

# 保存 PM2 配置
pm2 save

# 设置 PM2 开机自启
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# 等待服务启动
sleep 3

# 检查服务状态
echo "📊 服务状态:"
pm2 status

# 检查服务是否正常运行
if pm2 list | grep -q "todify2-backend.*online"; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败，查看日志:"
    pm2 logs todify2-backend --lines 20 --nostream
    exit 1
fi

if pm2 list | grep -q "todify2-frontend.*online"; then
    echo "✅ 前端服务启动成功"
else
    echo "⚠️  前端服务启动失败，查看日志:"
    pm2 logs todify2-frontend --lines 20 --nostream
fi

echo "✅ 部署完成"
EOF
    
    chmod +x "$TEMP_DIR/deploy-server.sh"
    
    # 创建 tar.gz 包
    log_info "创建压缩包..."
    cd "$TEMP_DIR"
    tar -czf "../$DEPLOY_PACKAGE" .
    cd "$SCRIPT_DIR"
    
    log_success "打包完成: $DEPLOY_PACKAGE"
    echo "$DEPLOY_PACKAGE"
}

# 上传到服务器
upload_to_server() {
    local package_file=$1
    
    log_info "上传文件到服务器: $package_file"
    
    # 确保文件存在
    if [ ! -f "$package_file" ]; then
        log_error "文件不存在: $package_file"
        exit 1
    fi
    
    # 使用绝对路径
    local abs_path=$(cd "$(dirname "$package_file")" && pwd)/$(basename "$package_file")
    
    # 使用 sshpass 和 scp 上传
    sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$abs_path" "$SSH_USER@$SSH_HOST:/tmp/deploy.tar.gz"
    
    if [ $? -ne 0 ]; then
        log_error "文件上传失败"
        exit 1
    fi
    
    log_success "文件上传成功"
}

# 在服务器上执行部署
deploy_on_server() {
    log_info "在服务器上执行部署..."
    
    # 使用 sshpass 执行远程命令
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$SSH_USER@$SSH_HOST" bash << EOF
set -e

REMOTE_DIR="$REMOTE_DIR"
BACKEND_PORT="$BACKEND_PORT"

echo "📦 解压部署文件..."
# 创建部署目录
mkdir -p \$REMOTE_DIR

# 备份旧版本（如果存在）
if [ -d "\$REMOTE_DIR" ] && [ "\$(ls -A \$REMOTE_DIR)" ]; then
    echo "📦 备份旧版本..."
    mv \$REMOTE_DIR \${REMOTE_DIR}.backup.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
fi

mkdir -p \$REMOTE_DIR
cd \$REMOTE_DIR

# 解压文件
tar -xzf /tmp/deploy.tar.gz
rm -f /tmp/deploy.tar.gz

# 执行部署脚本
chmod +x deploy-server.sh
./deploy-server.sh

EOF

    if [ $? -ne 0 ]; then
        log_error "服务器端部署失败"
        exit 1
    fi
    
    log_success "服务器端部署完成"
}

# 清理临时文件
cleanup() {
    log_info "清理临时文件..."
    rm -rf deploy-temp
    rm -f todify2-deploy-*.tar.gz
    log_success "清理完成"
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    echo "🚀 Todify2 自动化部署（PM2 方案）"
    echo "=========================================="
    echo ""
    
    check_dependencies
    build_local
    PACKAGE_FILE=$(package_files 2>/dev/null | tail -1)
    if [ -z "$PACKAGE_FILE" ] || [ ! -f "$PACKAGE_FILE" ]; then
        log_error "打包文件失败或文件不存在"
        exit 1
    fi
    upload_to_server "$PACKAGE_FILE"
    deploy_on_server
    cleanup
    
    echo ""
    echo "=========================================="
    log_success "部署完成！"
    echo "=========================================="
    echo ""
    echo "📋 部署信息:"
    echo "  🌐 外部访问地址: http://$SSH_HOST:$EXTERNAL_PORT"
    echo "  🔧 API 地址: http://$SSH_HOST:$EXTERNAL_PORT/api/health"
    echo "  📦 后端服务端口: $BACKEND_PORT"
    echo "  🎨 前端服务端口: $FRONTEND_PORT"
    echo ""
    echo "📋 服务管理命令:"
    echo "  sshpass -p '$SSH_PASSWORD' ssh $SSH_OPTIONS $SSH_USER@$SSH_HOST 'pm2 status'"
    echo "  sshpass -p '$SSH_PASSWORD' ssh $SSH_OPTIONS $SSH_USER@$SSH_HOST 'pm2 logs todify2-backend'"
    echo "  sshpass -p '$SSH_PASSWORD' ssh $SSH_OPTIONS $SSH_USER@$SSH_HOST 'pm2 restart todify2-backend'"
    echo "  sshpass -p '$SSH_PASSWORD' ssh $SSH_OPTIONS $SSH_USER@$SSH_HOST 'pm2 restart todify2-frontend'"
    echo ""
}

# 执行主函数
main "$@"

