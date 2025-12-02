#!/bin/bash

# 检查日志脚本
# 使用方法: ./check-logs.sh

LOG_FILE="backend/backend.log"

echo "🔍 检查后端日志..."
echo ""

# 检查日志文件是否存在
if [ ! -f "$LOG_FILE" ]; then
    echo "❌ 日志文件不存在: $LOG_FILE"
    echo ""
    echo "📝 请先运行以下命令将日志保存到文件:"
    echo "   cd backend"
    echo "   npm run dev 2>&1 | tee backend.log"
    echo ""
    echo "或者查看运行后端的终端窗口中的日志"
    exit 1
fi

echo "✅ 找到日志文件: $LOG_FILE"
echo ""

# 检查文件上传相关日志
echo "=== 📤 文件上传相关日志 ==="
grep -E "上传文件到 Dify|文件上传到 Dify 成功|文件上传完成|fileId" "$LOG_FILE" | tail -20
echo ""

# 检查 sources 相关日志
echo "=== 📎 Sources 相关日志 ==="
grep -E "从 inputs.sources 中提取文件|准备执行Agent节点|sourcesCount" "$LOG_FILE" | tail -15
echo ""

# 检查 Dify 请求日志
echo "=== 🌐 Dify 请求日志 ==="
grep -E "Dify 请求详情|Dify executeChat 请求体" "$LOG_FILE" | tail -5
echo ""

# 检查错误日志
echo "=== ❌ 错误日志 ==="
grep -E "上传文件到 Dify 失败|文件上传失败|error|Error" "$LOG_FILE" | tail -10
echo ""

echo "✅ 日志检查完成"
echo ""
echo "💡 提示: 使用 'tail -f $LOG_FILE' 可以实时查看日志"

