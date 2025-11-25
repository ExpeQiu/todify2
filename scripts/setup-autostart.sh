#!/bin/bash

# Todify3 自动启动配置脚本
# 用于配置PM2自动启动机制

set -e

echo "🚀 配置 Todify3 自动启动机制..."

# 检查是否以root用户运行
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请以root用户运行此脚本"
    exit 1
fi

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2未安装，正在安装..."
    npm install -g pm2
fi

# 项目目录
PROJECT_DIR="/root/todify3"
cd "$PROJECT_DIR"

# 检查ecosystem.config.js是否存在
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ ecosystem.config.js 不存在"
    exit 1
fi

# 保存当前PM2进程列表
echo "💾 保存PM2进程列表..."
pm2 save

# 配置PM2自动启动
echo "⚙️  配置PM2自动启动..."
pm2 startup systemd -u root --hp /root

# 启用systemd服务
echo "🔧 启用systemd服务..."
systemctl enable pm2-root.service

# 检查服务状态
echo "📊 检查服务状态..."
systemctl status pm2-root.service --no-pager | head -10

echo ""
echo "✅ 自动启动配置完成！"
echo ""
echo "📋 验证命令:"
echo "   systemctl status pm2-root.service"
echo "   pm2 list"
echo "   pm2 logs"
echo ""
echo "💡 测试自动启动（重启后验证）:"
echo "   reboot"
echo "   重启后运行: pm2 list"

