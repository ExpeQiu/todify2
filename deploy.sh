#!/bin/bash

# Todify2 生产环境部署脚本
# 用于在阿里云服务器上部署项目

echo "🚀 开始部署 Todify2 到生产环境..."

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查 Node.js 和 npm
check_dependencies() {
    echo "🔍 检查依赖..."
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 Node.js，请先安装 Node.js${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 npm，请先安装 npm${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js 和 npm 已安装${NC}"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装依赖..."
    
    # 安装后端依赖
    echo "📥 安装后端依赖..."
    cd "$SCRIPT_DIR/backend"
    npm install --production
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 后端依赖安装失败${NC}"
        exit 1
    fi
    
    # 安装前端依赖
    echo "📥 安装前端依赖..."
    cd "$SCRIPT_DIR/frontend"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 前端依赖安装失败${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 构建前端
build_frontend() {
    echo "🏗️  构建前端..."
    cd "$SCRIPT_DIR/frontend"
    
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 前端构建失败${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 前端构建完成${NC}"
}

# 检查端口
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  警告: 端口 $port 已被占用${NC}"
        echo "正在尝试停止占用端口的进程..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# 启动服务
start_service() {
    echo "🎯 启动服务..."
    
    # 检查端口
    check_port 8088
    
    # 启动后端服务
    echo "🔧 启动后端服务 (端口: 8088)..."
    cd "$SCRIPT_DIR/backend"
    
    # 使用 PM2 或直接启动
    if command -v pm2 &> /dev/null; then
        echo "使用 PM2 启动服务..."
        pm2 start src/index.ts --name "todify2-backend" --interpreter ts-node
    else
        echo "直接启动服务..."
        nohup npm run dev > ../backend.log 2>&1 &
        echo $! > ../backend.pid
    fi
    
    # 等待服务启动
    sleep 5
    
    # 检查服务是否启动成功
    if curl -s http://localhost:8088/api/health > /dev/null; then
        echo -e "${GREEN}✅ 服务启动成功${NC}"
        echo -e "${GREEN}🌐 访问地址: http://47.113.225.93:8088/static/index.html${NC}"
    else
        echo -e "${RED}❌ 服务启动失败${NC}"
        exit 1
    fi
}

# 主函数
main() {
    check_dependencies
    install_dependencies
    build_frontend
    start_service
    
    echo ""
    echo -e "${GREEN}🎉 Todify2 部署完成!${NC}"
    echo -e "${GREEN}📱 前端地址: http://47.113.225.93:8088/static/index.html${NC}"
    echo -e "${GREEN}🔧 API 地址: http://47.113.225.93:8088/api/health${NC}"
    echo ""
    echo "📋 服务管理命令:"
    echo "  查看日志: tail -f backend.log"
    echo "  停止服务: kill \$(cat backend.pid)"
    echo "  重启服务: ./deploy.sh"
}

# 执行主函数
main "$@"
