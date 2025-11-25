#!/bin/bash

# Todify3 云端部署删除脚本
# 用于完全删除云端部署的todify3服务

set -e

echo "🗑️  删除 Todify3 云端部署..."
echo ""

# 确认操作
read -p "⚠️  确认要删除todify3服务吗？(yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ 操作已取消"
    exit 0
fi

# 1. 停止并删除PM2服务
echo "1️⃣ 停止并删除PM2服务..."
pm2 stop todify3-backend todify3-frontend 2>/dev/null || true
pm2 delete todify3-backend todify3-frontend 2>/dev/null || true
pm2 save
echo "✅ PM2服务已删除"
echo ""

# 2. 删除Nginx配置
echo "2️⃣ 删除Nginx配置..."
if [ -f /etc/nginx/sites-enabled/todify3 ]; then
    rm -f /etc/nginx/sites-enabled/todify3
    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        echo "✅ Nginx配置已删除并重载"
    else
        echo "⚠️  Nginx配置删除，但重载失败，请手动检查"
    fi
else
    echo "ℹ️  Nginx配置不存在"
fi
echo ""

# 3. 确认是否删除项目目录
read -p "是否删除项目目录 /root/todify3？(yes/no): " delete_dir
if [ "$delete_dir" == "yes" ]; then
    echo "3️⃣ 删除项目目录..."
    if [ -d /root/todify3 ]; then
        rm -rf /root/todify3
        echo "✅ 项目目录已删除"
    else
        echo "ℹ️  项目目录不存在"
    fi
else
    echo "ℹ️  保留项目目录 /root/todify3"
fi
echo ""

# 4. 验证删除结果
echo "4️⃣ 验证删除结果..."
echo "PM2服务列表:"
pm2 list | grep todify3 || echo "  ✅ 未找到todify3服务"
echo ""

echo "端口监听状态:"
if ss -tulnp | grep -q ":2201\|:2203"; then
    echo "  ⚠️  仍有端口在监听:"
    ss -tulnp | grep ":2201\|:2203"
else
    echo "  ✅ 端口已释放"
fi
echo ""

echo "Nginx配置:"
if [ -f /etc/nginx/sites-enabled/todify3 ]; then
    echo "  ⚠️  Nginx配置仍存在"
else
    echo "  ✅ Nginx配置已删除"
fi
echo ""

echo "=========================================="
echo "✅ Todify3 云端部署删除完成！"
echo "=========================================="

