#!/bin/bash
# Todify4 部署包构建脚本
# 用法: ./build-deploy-package.sh [版本号]
# 示例: ./build-deploy-package.sh latest

set -e

VERSION=${1:-latest}
PROJECT_NAME="todify4"
PACKAGE_NAME="${PROJECT_NAME}-deploy-${VERSION}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Todify4 部署包构建脚本 ==="
echo "版本: ${VERSION}"
echo "项目根目录: ${PROJECT_ROOT}"
echo ""
echo "本脚本将自动："
echo "  1. 构建 Docker 镜像"
echo "  2. 导出本地数据（如果存在）"
echo "  3. 打包部署文件"
echo "  4. 生成部署说明"
echo ""

# 1. 创建部署包目录结构
echo ">>> 创建部署包目录..."
PACKAGE_DIR="${PROJECT_ROOT}/${PACKAGE_NAME}"
rm -rf "${PACKAGE_DIR}"
mkdir -p "${PACKAGE_DIR}"/{images,data,config,scripts}

# 2. 构建 Docker 镜像（Mac M1/M2 需要指定平台）
echo ">>> 构建 Docker 镜像..."
cd "${PROJECT_ROOT}"

# 检查是否为 Mac ARM 架构
if [[ "$(uname -m)" == "arm64" ]] && [[ "$(uname)" == "Darwin" ]]; then
  BUILD_PLATFORM="--platform linux/amd64"
  echo "  检测到 Mac ARM 架构，使用 --platform linux/amd64"
else
  BUILD_PLATFORM=""
fi

# 构建后端镜像
echo "  构建后端镜像..."
cd "${PROJECT_ROOT}/backend"
docker buildx build ${BUILD_PLATFORM} -t "${PROJECT_NAME}-backend:${VERSION}" . --load

# 构建前端镜像
echo "  构建前端镜像..."
cd "${PROJECT_ROOT}/frontend"
docker buildx build ${BUILD_PLATFORM} -t "${PROJECT_NAME}-frontend:${VERSION}" . --load

# 3. 导出镜像
echo ">>> 导出 Docker 镜像..."
docker save "${PROJECT_NAME}-backend:${VERSION}" -o "${PACKAGE_DIR}/images/${PROJECT_NAME}-backend-${VERSION}.tar"
docker save "${PROJECT_NAME}-frontend:${VERSION}" -o "${PACKAGE_DIR}/images/${PROJECT_NAME}-frontend-${VERSION}.tar"

echo "  镜像导出完成:"
ls -lh "${PACKAGE_DIR}/images/"

# 4. 复制配置文件
echo ">>> 复制配置文件..."
# 创建生产环境配置模板
cat > "${PACKAGE_DIR}/config/.env" <<EOF
# Todify4 部署配置
PROJECT_NAME=${PROJECT_NAME}
VERSION=${VERSION}

# 端口配置
FRONTEND_PORT=8281
BACKEND_PORT=8280
NGINX_PORT=8288
PG_PORT=5434

# 数据库配置
DB_TYPE=sqlite
# 如果使用 PostgreSQL，取消下面的注释并配置
# DB_TYPE=postgresql
# PG_USER=postgres
# PG_PASSWORD=postgres
# PG_DATABASE=todify4
EOF

echo "  配置文件已创建"

# 5. 导出本地数据（如果存在）
echo ">>> 导出本地数据..."
DATA_EXPORTED=false

# 检查是否有导出脚本
if [ -f "${SCRIPT_DIR}/export-local-data.sh" ]; then
  echo "  使用导出脚本导出数据..."
  EXPORT_DIR="${PROJECT_ROOT}/exports"
  mkdir -p "${EXPORT_DIR}"
  
  # 执行导出脚本（静默模式）
  if bash "${SCRIPT_DIR}/export-local-data.sh" "${EXPORT_DIR}" >/dev/null 2>&1; then
    # 查找最新的导出文件
    LATEST_SQL=$(find "${EXPORT_DIR}" -name "todify4-export-*.sql" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    if [ -n "${LATEST_SQL}" ] && [ -f "${LATEST_SQL}" ]; then
      cp "${LATEST_SQL}" "${PACKAGE_DIR}/data/init-data.sql"
      echo "  ✓ 数据已导出并复制: $(basename ${LATEST_SQL})"
      DATA_EXPORTED=true
    fi
  fi
fi

# 如果导出脚本失败，尝试直接查找数据库文件
if [ "$DATA_EXPORTED" = false ]; then
  # 检查主数据库
  if [ -f "${PROJECT_ROOT}/backend/data/todify2.db" ]; then
    echo "  检测到 SQLite 数据库，尝试导出..."
    if command -v sqlite3 >/dev/null 2>&1; then
      sqlite3 "${PROJECT_ROOT}/backend/data/todify2.db" .dump > "${PACKAGE_DIR}/data/init-data.sql" 2>/dev/null && {
        echo "  ✓ SQLite 数据已导出"
        DATA_EXPORTED=true
      }
    fi
  fi
  
  # 检查配置数据库
  CONFIG_DB=$(find "${PROJECT_ROOT}/backend/data" -name "config-database-*.db" -type f | head -1)
  if [ -n "${CONFIG_DB}" ] && [ -f "${CONFIG_DB}" ]; then
    echo "  检测到配置数据库，导出..."
    if command -v sqlite3 >/dev/null 2>&1; then
      sqlite3 "${CONFIG_DB}" .dump > "${PACKAGE_DIR}/data/config-database.sql" 2>/dev/null && {
        echo "  ✓ 配置数据库已导出"
      }
    fi
  fi
fi

if [ "$DATA_EXPORTED" = false ]; then
  echo "  ⚠ 未找到数据文件，将创建空的数据目录"
  echo "  提示: Todify4 数据通过 Docker Volume 持久化，首次部署会自动创建数据库"
  touch "${PACKAGE_DIR}/data/.gitkeep"
fi

# 6. 复制部署脚本
echo ">>> 复制部署脚本..."
cp "${SCRIPT_DIR}/cleanup.sh" "${PACKAGE_DIR}/scripts/"
cp "${SCRIPT_DIR}/deploy.sh" "${PACKAGE_DIR}/scripts/"
cp "${SCRIPT_DIR}/verify.sh" "${PACKAGE_DIR}/scripts/"
if [ -f "${SCRIPT_DIR}/fix-network.sh" ]; then
  cp "${SCRIPT_DIR}/fix-network.sh" "${PACKAGE_DIR}/scripts/"
fi
if [ -f "${SCRIPT_DIR}/check-unified-portal.sh" ]; then
  cp "${SCRIPT_DIR}/check-unified-portal.sh" "${PACKAGE_DIR}/scripts/"
fi
if [ -f "${SCRIPT_DIR}/quick-fix.sh" ]; then
  cp "${SCRIPT_DIR}/quick-fix.sh" "${PACKAGE_DIR}/scripts/"
fi
if [ -f "${SCRIPT_DIR}/export-local-data.sh" ]; then
  cp "${SCRIPT_DIR}/export-local-data.sh" "${PACKAGE_DIR}/scripts/"
fi
if [ -f "${SCRIPT_DIR}/update.sh" ]; then
  cp "${SCRIPT_DIR}/update.sh" "${PACKAGE_DIR}/scripts/"
fi
chmod +x "${PACKAGE_DIR}/scripts"/*.sh
echo "  部署脚本已复制"

# 7. 创建 README
echo ">>> 创建部署说明..."
cat > "${PACKAGE_DIR}/README.md" <<EOF
# Todify4 部署包说明

版本: ${VERSION}
构建时间: $(date '+%Y-%m-%d %H:%M:%S')

## 目录结构

\`\`\`
${PACKAGE_NAME}/
├── images/              # Docker 镜像文件
│   ├── ${PROJECT_NAME}-backend-${VERSION}.tar
│   └── ${PROJECT_NAME}-frontend-${VERSION}.tar
├── data/                # 数据目录（通过 Volume 持久化）
├── config/               # 配置文件
│   └── .env             # 生产环境配置
├── scripts/              # 部署脚本
│   ├── cleanup.sh       # 清理旧服务
│   ├── deploy.sh        # 一键部署
│   ├── verify.sh        # 验证部署
│   ├── fix-network.sh   # 网络修复（Unified Portal 集成）
│   ├── update.sh        # 项目更新脚本（增量更新）
│   └── export-local-data.sh  # 数据导出脚本（参考）
└── README.md            # 本文件
\`\`\`

## 部署步骤

### 1. 上传部署包

使用 WindTerm 或其他 SFTP 工具将 \`${PACKAGE_NAME}.tar.gz\` 上传到服务器。

### 2. 解压部署包

\`\`\`bash
tar -xzf ${PACKAGE_NAME}.tar.gz
cd ${PACKAGE_NAME}
\`\`\`

### 3. 修改配置（可选）

\`\`\`bash
vi config/.env
\`\`\`

**重要配置项**:
- \`DB_TYPE\`: 数据库类型 (sqlite/postgresql)
- \`PG_PASSWORD\`: PostgreSQL 密码（如果使用 PostgreSQL）

### 4. 清理旧服务（如果存在）

\`\`\`bash
./scripts/cleanup.sh
\`\`\`

### 5. 执行部署

\`\`\`bash
./scripts/deploy.sh
\`\`\`

### 6. 验证部署

\`\`\`bash
./scripts/verify.sh
\`\`\`

### 7. 网络修复（如果通过 Unified Portal 访问出现 502 错误）

如果通过 Unified Portal 访问时出现 502 错误，运行网络修复脚本：

\`\`\`bash
./scripts/fix-network.sh
\`\`\`

该脚本会将 Todify4 容器加入到 Unified Portal 的网络中。

## 项目更新（增量更新）

当项目有新版本时，可以使用更新脚本进行增量更新，**保留所有数据**：

\`\`\`bash
# 1. 上传新版本的部署包
# 2. 解压新版本部署包
tar -xzf todify4-deploy-latest.tar.gz
cd todify4-deploy-latest

# 3. 运行更新脚本（自动备份数据，更新镜像，保留数据卷）
./scripts/update.sh latest

# 4. 验证更新
./scripts/verify.sh
\`\`\`

**更新脚本特性**：
- ✅ 自动备份当前数据
- ✅ 保留所有数据卷（数据不丢失）
- ✅ 更新 Docker 镜像
- ✅ 更新容器配置
- ✅ 自动验证更新结果
- ✅ 支持回滚（备份文件在 \`backups/\` 目录）

## 数据导入

### Todify4 数据导入

**自动导出**: 部署包构建时会自动导出本地 SQLite 数据到 \`data/init-data.sql\`（如果存在）。

**数据持久化**: Todify4 数据通过 Docker Volume 自动持久化，首次部署会自动创建数据库。

**手动导入数据**（如果需要恢复）:

\`\`\`bash
# 如果部署包包含数据文件
docker cp ../data/init-data.sql todify4-backend:/tmp/import-data.sql
docker exec todify4-backend sqlite3 /app/data/todify2.db < /tmp/import-data.sql

# 如果还有配置数据库
if [ -f "../data/config-database.sql" ]; then
  docker cp ../data/config-database.sql todify4-backend:/tmp/config-database.sql
  docker exec todify4-backend sqlite3 /app/data/config-database.db < /tmp/config-database.sql
fi
\`\`\`

## 访问地址

部署成功后，可通过以下地址访问：

- **前端**: http://服务器IP:8281
- **后端 API**: http://服务器IP:8280
- **Nginx**: http://服务器IP:8288
- **通过 Unified Portal**: http://10.133.23.136/todify/

## 端口配置

- 前端: 8281
- 后端: 8280
- Nginx: 8288
- PostgreSQL: 5434 (如果使用)

## 故障排查

### 查看容器日志

\`\`\`bash
docker logs ${PROJECT_NAME}-backend
docker logs ${PROJECT_NAME}-frontend
\`\`\`

### 检查容器状态

\`\`\`bash
docker ps --filter "name=${PROJECT_NAME}"
\`\`\`
EOF

echo "  部署说明已创建"

# 8. 打包
echo ">>> 打包部署包..."
cd "${PROJECT_ROOT}"
tar -czf "${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}/"
echo "  打包完成: ${PACKAGE_NAME}.tar.gz"
echo "  文件大小: $(du -h ${PACKAGE_NAME}.tar.gz | cut -f1)"

echo ""
echo "=== 构建完成 ==="
echo ""
echo "部署包位置: ${PROJECT_ROOT}/${PACKAGE_NAME}.tar.gz"
echo ""
echo "下一步:"
echo "  1. 使用 WindTerm 上传 ${PACKAGE_NAME}.tar.gz 到服务器"
echo ""
echo "首次部署:"
echo "  2. 在服务器上解压并执行部署脚本: ./scripts/deploy.sh"
echo ""
echo "增量更新（保留数据）:"
echo "  2. 在服务器上解压并执行更新脚本: ./scripts/update.sh ${VERSION}"
echo ""
