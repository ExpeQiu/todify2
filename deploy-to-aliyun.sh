#!/bin/bash

# Todify2 部署到阿里云服务器脚本

echo "🚀 开始部署 Todify2 到阿里云服务器..."

# 服务器信息（请根据实际情况修改）
SERVER_IP="47.113.225.93"
SERVER_USER="root"
DEPLOY_PATH="/root/todify2-deploy"

# 检查是否有未提交的更改
echo "📋 检查Git状态..."
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  有未提交的更改，请先提交或暂存"
    read -p "是否继续部署？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 构建前端
echo "📦 构建前端..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi
cd ..

# 准备部署文件
echo "📦 准备部署文件..."
mkdir -p deploy-temp
cp -r backend deploy-temp/
cp -r frontend/dist deploy-temp/frontend-dist
cp start.sh deploy-temp/

# 复制必要的配置文件
cp production.env deploy-temp/backend/.env.production

# 创建启动脚本
cat > deploy-temp/start-production.sh << 'EOF'
#!/bin/bash
echo "🚀 启动生产环境服务..."

cd /root/todify2-deploy/backend

# 启动后端服务（端口3003）
pm2 start npm --name "todify2-backend" -- run dev:prod

# 启动前端服务（端口3001）
cd /root/todify2-deploy/frontend
pm2 start npm --name "todify2-frontend" -- run preview

echo "✅ 服务已启动"
pm2 status
EOF

chmod +x deploy-temp/start-production.sh

# 打包部署文件
echo "📦 打包部署文件..."
tar -czf deploy.tar.gz -C deploy-temp .
rm -rf deploy-temp

# 传输到服务器
echo "📤 上传文件到服务器..."
scp deploy.tar.gz $SERVER_USER@$SERVER_IP:/root/

# 在服务器上部署
echo "🔧 在服务器上部署..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    echo "📦 解压部署文件..."
    cd /root
    tar -xzf deploy.tar.gz
    
    echo "📥 安装依赖..."
    cd /root/backend
    npm install --production
    
    echo "🔄 停止旧服务..."
    pm2 stop todify2-backend todify2-frontend 2>/dev/null || true
    pm2 delete todify2-backend todify2-frontend 2>/dev/null || true
    
    echo "🚀 启动新服务..."
    cd /root
    chmod +x start-production.sh
    ./start-production.sh
    
    echo "📊 查看服务状态..."
    pm2 status
    pm2 logs --lines 50
ENDSSH

# 清理临时文件
rm deploy.tar.gz

echo ""
echo "✅ 部署完成！"
echo "🌐 访问地址: http://47.113.225.93:8088"
echo "🔍 查看日志: ssh $SERVER_USER@$SERVER_IP 'pm2 logs'"
echo "📊 服务状态: ssh $SERVER_USER@$SERVER_IP 'pm2 status'"

