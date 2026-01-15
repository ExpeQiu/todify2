#!/bin/bash
# Todify4 本地数据导出脚本
# 用法: ./export-local-data.sh [输出目录]
# 示例: ./export-local-data.sh ./exports

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${1:-${PROJECT_ROOT}/exports}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
EXPORT_FILE="${OUTPUT_DIR}/todify4-export-${TIMESTAMP}.sql"

echo "=== Todify4 本地数据导出 ==="
echo "输出目录: ${OUTPUT_DIR}"
echo ""

# 创建输出目录
mkdir -p "${OUTPUT_DIR}"

# 1. 检查 SQLite 数据库文件（可能有多个）
SQLITE_DB="${PROJECT_ROOT}/backend/data/todify2.db"
CONFIG_DB=$(find "${PROJECT_ROOT}/backend/data" -name "config-database-*.db" -type f | head -1)

DATA_EXPORTED=false

# 优先导出主数据库
if [ -f "${SQLITE_DB}" ]; then
  echo "✓ 找到主数据库: ${SQLITE_DB}"
  echo ""
  echo ">>> 导出主数据库..."
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "${SQLITE_DB}" .dump > "${EXPORT_FILE}" 2>/dev/null || {
      echo "错误: SQLite 数据导出失败"
      exit 1
    }
    echo "✓ 数据已导出: $(basename ${EXPORT_FILE})"
    echo "  文件大小: $(du -h "${EXPORT_FILE}" | cut -f1)"
    DATA_EXPORTED=true
  fi
fi

# 导出配置数据库（如果存在）
if [ -n "${CONFIG_DB}" ] && [ -f "${CONFIG_DB}" ]; then
  echo ""
  echo "✓ 找到配置数据库: $(basename ${CONFIG_DB})"
  CONFIG_EXPORT="${OUTPUT_DIR}/todify4-config-db-${TIMESTAMP}.sql"
  echo ">>> 导出配置数据库..."
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "${CONFIG_DB}" .dump > "${CONFIG_EXPORT}" 2>/dev/null && {
      echo "✓ 配置数据库已导出: $(basename ${CONFIG_EXPORT})"
      echo "  文件大小: $(du -h "${CONFIG_EXPORT}" | cut -f1)"
    }
  fi
fi

if [ "$DATA_EXPORTED" = false ]; then
  echo "⚠  SQLite 数据库文件不存在"
  echo "   数据可能通过 Docker Volume 存储，或数据库尚未创建"
  echo ""
  echo "   如果数据在 Docker 容器中，可以："
  echo "   1. 从运行中的容器导出: docker exec todify4-backend sqlite3 /app/data/todify2.db .dump > ${EXPORT_FILE}"
  echo "   2. 或直接复制数据库文件: docker cp todify4-backend:/app/data/todify2.db ${OUTPUT_DIR}/"
  echo ""
  touch "${OUTPUT_DIR}/.gitkeep"
fi

# 2. 导出配置文件
echo ""
echo ">>> 导出配置文件..."
CONFIG_EXPORT="${OUTPUT_DIR}/todify4-config-${TIMESTAMP}.env"

cat > "${CONFIG_EXPORT}" <<EOF
# Todify4 配置导出
# 导出时间: $(date '+%Y-%m-%d %H:%M:%S')

# 数据库配置
DB_TYPE=sqlite
SQLITE_DB_PATH=./data/todify2.db

# 端口配置
FRONTEND_PORT=8281
BACKEND_PORT=8280
NGINX_PORT=8288

# PostgreSQL 配置（如果使用）
# DB_TYPE=postgresql
# PG_USER=postgres
# PG_PASSWORD=postgres
# PG_DATABASE=todify4
EOF

echo "✓ 配置文件已导出: $(basename ${CONFIG_EXPORT})"

# 3. 创建导入说明
echo ""
echo ">>> 创建导入说明..."
cat > "${OUTPUT_DIR}/IMPORT_README.md" <<EOF
# Todify4 数据导入说明

## 导出信息
- 导出时间: $(date '+%Y-%m-%d %H:%M:%S')
- 数据文件: $(basename ${EXPORT_FILE})
- 配置文件: $(basename ${CONFIG_EXPORT})

## 数据存储方式

Todify4 使用 SQLite 数据库，数据通过 Docker Volume 持久化。

## 导入方式

### 方式1: 通过 Docker Volume（推荐）

数据会自动持久化在 Docker Volume 中，无需手动导入。

### 方式2: 导入 SQL 文件（如果需要恢复数据）

\`\`\`bash
# 在服务器上执行
cd /root/todify4-deploy-*/

# 复制 SQL 文件到容器
docker cp data/init-data.sql todify4-backend:/tmp/import-data.sql

# 导入数据
docker exec todify4-backend sqlite3 /app/data/todify2.db < /tmp/import-data.sql
\`\`\`

### 方式3: 直接复制数据库文件

\`\`\`bash
# 从本地复制数据库文件到服务器
# 然后挂载到容器
docker run -v /path/to/todify2.db:/app/data/todify2.db ...
\`\`\`

## 注意事项

1. **数据持久化**: Todify4 数据通过 Docker Volume 自动持久化，重启容器不会丢失数据
2. **备份建议**: 定期备份 Docker Volume 或导出 SQL 文件
3. **配置数据库**: 如果存在 config-database-*.db，也需要一并导出和导入

EOF

echo "✓ 导入说明已创建: IMPORT_README.md"

echo ""
echo "=== 导出完成 ==="
echo ""
echo "导出文件:"
if [ "$DATA_EXPORTED" = true ]; then
  echo "  数据文件: ${EXPORT_FILE}"
  echo "  文件大小: $(du -h "${EXPORT_FILE}" | cut -f1)"
fi
echo "  配置文件: ${CONFIG_EXPORT}"
echo ""
echo "下一步:"
echo "  1. 检查导出文件: ls -lh ${OUTPUT_DIR}/"
echo "  2. 上传到服务器部署包的 data/ 目录（如果需要）"
echo "  3. 参考 ${OUTPUT_DIR}/IMPORT_README.md 进行导入"
