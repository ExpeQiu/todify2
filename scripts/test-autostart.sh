#!/bin/bash

# Todify3 自动启动测试脚本
# 用于测试自动启动功能是否正常工作

set -e

echo "🧪 测试 Todify3 自动启动功能..."
echo ""

# 检查PM2服务状态
echo "1️⃣ 检查PM2 systemd服务状态:"
systemctl status pm2-root.service --no-pager | head -5
echo ""

# 检查服务是否启用
if systemctl is-enabled pm2-root.service > /dev/null 2>&1; then
    echo "✅ systemd服务已启用"
else
    echo "❌ systemd服务未启用"
    exit 1
fi
echo ""

# 检查PM2进程列表
echo "2️⃣ 检查PM2进程列表:"
pm2 list
echo ""

# 检查保存的进程列表
echo "3️⃣ 检查保存的进程列表:"
if [ -f "/root/.pm2/dump.pm2" ]; then
    echo "✅ PM2进程列表已保存: /root/.pm2/dump.pm2"
    echo "   包含的服务:"
    cat /root/.pm2/dump.pm2 | jq -r '.[] | "   - \(.name)"' 2>/dev/null || echo "   (无法解析JSON)"
else
    echo "❌ PM2进程列表未保存"
    exit 1
fi
echo ""

# 检查端口监听
echo "4️⃣ 检查端口监听状态:"
if ss -tulnp | grep -q ":2201"; then
    echo "✅ 前端服务端口 2201 正在监听"
else
    echo "❌ 前端服务端口 2201 未监听"
fi

if ss -tulnp | grep -q ":2203"; then
    echo "✅ 后端服务端口 2203 正在监听"
else
    echo "❌ 后端服务端口 2203 未监听"
fi
echo ""

# 测试服务响应
echo "5️⃣ 测试服务响应:"
if curl -s http://localhost:2201/ > /dev/null 2>&1; then
    echo "✅ 前端服务响应正常"
else
    echo "❌ 前端服务无响应"
fi

if curl -s http://localhost:2203/api/v1/ai-roles > /dev/null 2>&1; then
    echo "✅ 后端服务响应正常"
else
    echo "❌ 后端服务无响应"
fi
echo ""

echo "=========================================="
echo "✅ 自动启动测试完成！"
echo "=========================================="
echo ""
echo "💡 完整测试（需要重启服务器）:"
echo "   1. 运行: reboot"
echo "   2. 等待服务器重启"
echo "   3. SSH登录后运行: pm2 list"
echo "   4. 检查服务是否自动启动"
echo ""

