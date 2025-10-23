#!/bin/bash

# Todify2 数据库优化脚本
# 执行阶段1和阶段2的数据库优化

echo "🚀 Todify2 数据库优化开始..."
echo "====================================="

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查TypeScript环境
if ! command -v npx &> /dev/null; then
    echo "❌ npx 未安装，请先安装 npm"
    exit 1
fi

# 进入backend目录
cd "$(dirname "$0")"

echo "📋 阶段1: 数据库统一"
echo "-------------------------------------"

# 更新数据库配置
echo "1️⃣ 更新数据库配置..."
npx ts-node src/scripts/update-database-config.ts

if [ $? -eq 0 ]; then
    echo "✅ 数据库配置更新完成"
else
    echo "❌ 数据库配置更新失败"
    exit 1
fi

# 执行数据库迁移
echo "2️⃣ 执行数据库迁移..."
npx ts-node src/scripts/migrate-to-unified-database.ts

if [ $? -eq 0 ]; then
    echo "✅ 数据库迁移完成"
else
    echo "❌ 数据库迁移失败"
    exit 1
fi

echo ""
echo "⚡ 阶段2: 性能优化"
echo "-------------------------------------"

# 执行性能优化
echo "1️⃣ 执行性能优化..."
npx ts-node src/scripts/performance-optimization.ts

if [ $? -eq 0 ]; then
    echo "✅ 性能优化完成"
else
    echo "❌ 性能优化失败"
    exit 1
fi

echo ""
echo "🎉 数据库优化完成！"
echo "====================================="

echo "📊 优化总结:"
echo "  ✅ 阶段1 - 数据库统一: 完成"
echo "  ✅ 阶段2 - 性能优化: 完成"
echo ""
echo "🎯 下一步建议:"
echo "  1. 运行应用测试验证功能"
echo "  2. 监控数据库性能指标"
echo "  3. 根据使用情况调优配置"
echo "  4. 定期备份和维护数据库"
echo ""
echo "📁 相关文件:"
echo "  - 统一数据库: data/unified.db"
echo "  - 迁移报告: data/migration-report.json"
echo "  - 性能报告: data/performance-report.json"
echo "  - 缓存配置: data/cache-config.json"
echo "  - 备份目录: data/backup/"
