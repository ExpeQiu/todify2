#!/bin/bash
# Todify4 项目更新脚本 - 增量更新，保留数据
# 用法: ./update.sh [新版本号]
# 示例: ./update.sh latest

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 如果从部署包内执行，使用部署包目录
if [ -f "${SCRIPT_DIR}/../config/.env" ]; then
  CONFIG_DIR="${SCRIPT_DIR}/../config"
  IMAGES_DIR="${SCRIPT_DIR}/../images"
else
  CONFIG_DIR="${DEPLOY_DIR}/docker"
  IMAGES_DIR="${DEPLOY_DIR}"
fi

NEW_VERSION=${1:-latest}
PROJECT_NAME="todify4"

echo "=== Todify4 项目更新脚本 ==="
echo "新版本: ${NEW_VERSION}"
echo ""

# 1. 加载当前配置
if [ -f "${CONFIG_DIR}/.env" ]; then
  source "${CONFIG_DIR}/.env"
else
  echo "错误: 未找到配置文件 .env"
  exit 1
fi

CURRENT_VERSION=${VERSION:-unknown}
echo "当前版本: ${CURRENT_VERSION}"
echo "目标版本: ${NEW_VERSION}"
echo ""

# 2. 检查当前服务状态
echo ">>> 检查当前服务状态..."
CONTAINERS=("${PROJECT_NAME}-backend" "${PROJECT_NAME}-frontend")
if [ "$DB_TYPE" = "postgresql" ]; then
  CONTAINERS+=("${PROJECT_NAME}-postgres")
fi
if [ -n "${NGINX_PORT}" ] && [ "${NGINX_PORT}" != "0" ]; then
  CONTAINERS+=("${PROJECT_NAME}-nginx")
fi

RUNNING_CONTAINERS=0
for container in "${CONTAINERS[@]}"; do
  if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    RUNNING_CONTAINERS=$((RUNNING_CONTAINERS + 1))
    echo "  ✓ ${container}: 运行中"
  else
    echo "  ⚠ ${container}: 未运行"
  fi
done

if [ $RUNNING_CONTAINERS -eq 0 ]; then
  echo ""
  echo "警告: 没有运行中的容器，将执行全新部署"
  echo "建议: 如果这是首次部署，请使用 ./deploy.sh"
  read -p "是否继续？(y/n): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
  fi
fi

echo ""

# 3. 备份当前数据（重要）
echo ">>> 备份当前数据..."
BACKUP_DIR="${DEPLOY_DIR}/backups/$(date '+%Y%m%d_%H%M%S')"
mkdir -p "${BACKUP_DIR}"

# 备份数据库文件（如果容器运行中）
if docker ps --format '{{.Names}}' | grep -q "^${PROJECT_NAME}-backend$"; then
  echo "  备份数据库..."
  docker cp "${PROJECT_NAME}-backend:/app/data/todify2.db" "${BACKUP_DIR}/todify2.db" 2>/dev/null || true
  docker cp "${PROJECT_NAME}-backend:/app/data/config-database.db" "${BACKUP_DIR}/config-database.db" 2>/dev/null || true
  
  if [ -f "${BACKUP_DIR}/todify2.db" ]; then
    echo "  ✓ 主数据库备份完成"
  fi
  if [ -f "${BACKUP_DIR}/config-database.db" ]; then
    echo "  ✓ 配置数据库备份完成"
  fi
fi

# 备份配置文件
if [ -f "${CONFIG_DIR}/.env" ]; then
  cp "${CONFIG_DIR}/.env" "${BACKUP_DIR}/.env.backup"
  echo "  ✓ 配置文件已备份"
fi

echo ""

# 4. 加载新镜像
echo ">>> 加载新版本镜像..."
if [ ! -d "${IMAGES_DIR}" ]; then
  echo "错误: 镜像目录不存在: ${IMAGES_DIR}"
  exit 1
fi

IMAGE_FILES=(
  "${PROJECT_NAME}-backend-${NEW_VERSION}.tar"
  "${PROJECT_NAME}-frontend-${NEW_VERSION}.tar"
)

for img_file in "${IMAGE_FILES[@]}"; do
  img_path="${IMAGES_DIR}/${img_file}"
  if [ -f "${img_path}" ]; then
    echo "  加载镜像: ${img_file}"
    docker load -i "${img_path}"
  else
    alt_file=$(find "${IMAGES_DIR}" -name "*${img_file}*" -o -name "*$(basename ${img_file} .tar)*" | head -1)
    if [ -n "${alt_file}" ]; then
      echo "  加载镜像: $(basename ${alt_file})"
      docker load -i "${alt_file}"
    else
      echo "  ⚠ 未找到镜像文件: ${img_file}"
    fi
  fi
done

echo ""

# 5. 停止并删除旧容器（保留数据卷）
echo ">>> 停止并删除旧容器..."
for container in "${CONTAINERS[@]}"; do
  if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    echo "  停止 ${container}..."
    docker stop "${container}" >/dev/null 2>&1 || true
  fi
  if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
    echo "  删除 ${container}..."
    docker rm "${container}" >/dev/null 2>&1 || true
  fi
done

sleep 2

# 6. 检测网络
echo ">>> 配置 Docker 网络..."
NETWORK_NAME=""
if docker network ls --format '{{.Name}}' | grep -q "^unified-deploy_geely-net$"; then
  NETWORK_NAME="unified-deploy_geely-net"
elif docker network ls --format '{{.Name}}' | grep -q "^geely-net$"; then
  NETWORK_NAME="geely-net"
elif docker network ls --format '{{.Name}}' | grep -q "^${PROJECT_NAME}-network$"; then
  NETWORK_NAME="${PROJECT_NAME}-network"
else
  NETWORK_NAME="${PROJECT_NAME}-network"
  docker network create "${NETWORK_NAME}" >/dev/null 2>&1 || true
fi

echo "  使用网络: ${NETWORK_NAME}"

# 7. 启动新版本容器（使用相同的数据卷和配置）
echo ""
echo ">>> 启动新版本容器..."

# 启动数据库（如果使用 PostgreSQL）
if [ "$DB_TYPE" = "postgresql" ]; then
  echo "  启动数据库..."
  docker run -d \
    --name "${PROJECT_NAME}-postgres" \
    --network "${NETWORK_NAME}" \
    --restart always \
    -e POSTGRES_USER="${PG_USER:-postgres}" \
    -e POSTGRES_PASSWORD="${PG_PASSWORD:-postgres}" \
    -e POSTGRES_DB="${PG_DATABASE:-todify4}" \
    -v "${PROJECT_NAME}-postgres-data:/var/lib/postgresql/data" \
    -p "${PG_PORT:-5434}:5432" \
    postgres:15-alpine >/dev/null 2>&1
  
  echo "  等待数据库启动..."
  sleep 5
fi

# 启动后端（使用现有数据卷）
echo "  启动后端..."
BACKEND_ENV_ARGS=(
  -e NODE_ENV=production
  -e PORT=8113
  -e DB_TYPE="${DB_TYPE:-sqlite}"
  -e SQLITE_DB_PATH=./data/todify2.db
  -e INIT_DATABASE=0
)

if [ "$DB_TYPE" = "postgresql" ]; then
  BACKEND_ENV_ARGS+=(
    -e PG_HOST="${PROJECT_NAME}-postgres"
    -e PG_PORT=5432
    -e PG_USER="${PG_USER:-postgres}"
    -e PG_PASSWORD="${PG_PASSWORD:-postgres}"
    -e PG_DATABASE="${PG_DATABASE:-todify4}"
  )
fi

docker run -d \
  --name "${PROJECT_NAME}-backend" \
  --network "${NETWORK_NAME}" \
  --restart always \
  -p "${BACKEND_PORT:-8280}:8113" \
  "${BACKEND_ENV_ARGS[@]}" \
  -v /opt/docker-data/${PROJECT_NAME}/data:/app/data \
  -v /opt/docker-data/${PROJECT_NAME}/uploads:/app/uploads \
  "${PROJECT_NAME}-backend:${NEW_VERSION}" >/dev/null 2>&1

echo "  等待后端启动..."
sleep 5

# 启动前端
echo "  启动前端..."
docker run -d \
  --name "${PROJECT_NAME}-frontend" \
  --network "${NETWORK_NAME}" \
  --restart always \
  -p "${FRONTEND_PORT:-8281}:80" \
  "${PROJECT_NAME}-frontend:${NEW_VERSION}" >/dev/null 2>&1

# 启动 Nginx（如果配置了）
if [ -n "${NGINX_PORT}" ] && [ "${NGINX_PORT}" != "0" ]; then
  echo "  启动 Nginx..."
  NGINX_CONF_DIR="/opt/docker-data/${PROJECT_NAME}/nginx"
  mkdir -p "${NGINX_CONF_DIR}"
  
  cat > "${NGINX_CONF_DIR}/default.conf" <<EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://${PROJECT_NAME}-frontend:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
    
    location /api/ {
        proxy_pass http://${PROJECT_NAME}-backend:8113/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

  docker run -d \
    --name "${PROJECT_NAME}-nginx" \
    --network "${NETWORK_NAME}" \
    --restart always \
    -p "${NGINX_PORT}:80" \
    -v "${NGINX_CONF_DIR}/default.conf:/etc/nginx/conf.d/default.conf:ro" \
    nginx:alpine >/dev/null 2>&1
fi

echo ""

# 8. 更新配置文件版本号
if [ -f "${CONFIG_DIR}/.env" ]; then
  sed -i.bak "s/^VERSION=.*/VERSION=${NEW_VERSION}/" "${CONFIG_DIR}/.env" 2>/dev/null || \
  echo "VERSION=${NEW_VERSION}" >> "${CONFIG_DIR}/.env"
  echo "  ✓ 配置文件版本已更新"
fi

# 9. 验证更新
echo ""
echo ">>> 验证更新..."
sleep 5

# 检查容器状态
ALL_RUNNING=true
for container in "${CONTAINERS[@]}"; do
  if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    STATUS=$(docker ps --filter "name=${container}" --format "{{.Status}}")
    echo "  ✓ ${container}: ${STATUS}"
  else
    echo "  ✗ ${container}: 未运行"
    ALL_RUNNING=false
  fi
done

# 测试服务
if [ "$ALL_RUNNING" = true ]; then
  echo ""
  echo ">>> 测试服务..."
  
  # 测试后端
  sleep 3
  if curl -sf "http://localhost:${BACKEND_PORT:-8280}/health" >/dev/null 2>&1 || \
     curl -sf "http://localhost:${BACKEND_PORT:-8280}/api/health" >/dev/null 2>&1; then
    echo "  ✓ 后端服务正常"
  else
    echo "  ⚠ 后端服务未响应，请检查日志: docker logs ${PROJECT_NAME}-backend"
  fi
  
  # 测试前端
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${FRONTEND_PORT:-8281}" 2>/dev/null || echo "000")
  if [ "${HTTP_CODE}" = "200" ]; then
    echo "  ✓ 前端服务正常"
  else
    echo "  ⚠ 前端服务返回 HTTP ${HTTP_CODE}"
  fi
fi

echo ""
echo "=== 更新完成 ==="
echo ""
echo "版本信息:"
echo "  旧版本: ${CURRENT_VERSION}"
echo "  新版本: ${NEW_VERSION}"
echo ""
echo "备份位置: ${BACKUP_DIR}"
echo ""
echo "如果更新失败，可以回滚:"
echo "  1. 停止新容器: docker stop ${PROJECT_NAME}-backend ${PROJECT_NAME}-frontend"
echo "  2. 恢复备份: 参考 ${BACKUP_DIR}/ 目录"
echo "  3. 使用旧版本重新部署"
echo ""
echo "验证命令:"
echo "  ./scripts/verify.sh"
echo "  docker ps --filter 'name=${PROJECT_NAME}'"
