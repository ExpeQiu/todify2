#!/bin/bash

# 准备部署包脚本
# 用于打包项目文件，排除不必要的文件

echo "📦 准备 Todify3 部署包..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 创建部署包目录
DEPLOY_DIR="todify3-deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

echo "📁 复制项目文件..."

# 复制必要文件
cp -r backend "$DEPLOY_DIR/"
cp -r frontend "$DEPLOY_DIR/"
cp deploy.sh "$DEPLOY_DIR/"
cp init-database.sh "$DEPLOY_DIR/"
cp DEPLOYMENT_GUIDE.md "$DEPLOY_DIR/"
cp README.md "$DEPLOY_DIR/"

# 清理不必要的文件
echo "🧹 清理不必要的文件..."

# 删除开发依赖
rm -rf "$DEPLOY_DIR/backend/node_modules"
rm -rf "$DEPLOY_DIR/frontend/node_modules"
rm -rf "$DEPLOY_DIR/backend/dist"
rm -rf "$DEPLOY_DIR/frontend/dist"

# 删除日志文件
rm -f "$DEPLOY_DIR/backend.log"
rm -f "$DEPLOY_DIR/backend.pid"

# 删除测试文件
rm -rf "$DEPLOY_DIR/backend/test-*.js"
rm -rf "$DEPLOY_DIR/archive"
rm -rf "$DEPLOY_DIR/tests"
rm -rf "$DEPLOY_DIR/guide"

# 设置权限
chmod +x "$DEPLOY_DIR/deploy.sh"
chmod +x "$DEPLOY_DIR/init-database.sh"

echo "✅ 部署包准备完成"
echo "📁 部署包位置: $SCRIPT_DIR/$DEPLOY_DIR"
echo ""
echo "🚀 上传到服务器:"
echo "scp -r $DEPLOY_DIR root@47.113.225.93:/root/"
echo ""
echo "📋 服务器部署命令:"
echo "cd /root/$DEPLOY_DIR && ./deploy.sh"
