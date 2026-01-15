#!/bin/bash
# Todify4 一键部署脚本
# 用法: ./deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 如果从部署包内执行，使用部署包目录
if [ -f "${SCRIPT_DIR}/../config/.env" ]; then
  CONFIG_DIR="${SCRIPT_DIR}/../config"
  IMAGES_DIR="${SCRIPT_DIR}/../images"
  DATA_DIR="${SCRIPT_DIR}/../data"
else
  # 从项目根目录执行
  CONFIG_DIR="${DEPLOY_DIR}/docker"
  IMAGES_DIR="${DEPLOY_DIR}"
  DATA_DIR="${DEPLOY_DIR}/backend/data"
fi

echo "=== Todify4 快速部署脚本 v1.0 ==="
echo "部署目录: ${DEPLOY_DIR}"
echo "配置目录: ${CONFIG_DIR}"
echo "镜像目录: ${IMAGES_DIR}"

# 1. 加载配置
if [ -f "${CONFIG_DIR}/.env" ]; then
  echo ">>> 加载配置文件: ${CONFIG_DIR}/.env"
  source "${CONFIG_DIR}/.env"
else
  echo "警告: 未找到配置文件 .env，使用默认配置"
  PROJECT_NAME="todify4"
  VERSION="latest"
  FRONTEND_PORT=8281
  BACKEND_PORT=8280
  NGINX_PORT=8288
  PG_PORT=5434
  DB_TYPE="sqlite"
fi

# 设置默认值
PROJECT_NAME=${PROJECT_NAME:-todify4}
VERSION=${VERSION:-latest}
FRONTEND_PORT=${FRONTEND_PORT:-8281}
BACKEND_PORT=${BACKEND_PORT:-8280}
NGINX_PORT=${NGINX_PORT:-8288}
PG_PORT=${PG_PORT:-5434}
DB_TYPE=${DB_TYPE:-sqlite}
PG_USER=${PG_USER:-postgres}
PG_PASSWORD=${PG_PASSWORD:-postgres}
PG_DATABASE=${PG_DATABASE:-todify4}

# 2. 环境检查
echo ">>> 检查 Docker 环境..."
if ! docker info >/dev/null 2>&1; then
  echo "错误: Docker 未运行，请先启动 Docker"
  exit 1
fi
echo "  Docker 运行正常"

# 3. 加载镜像
echo ">>> 加载 Docker 镜像..."
if [ ! -d "${IMAGES_DIR}" ]; then
  echo "错误: 镜像目录不存在: ${IMAGES_DIR}"
  exit 1
fi

IMAGE_FILES=(
  "${PROJECT_NAME}-backend-${VERSION}.tar"
  "${PROJECT_NAME}-frontend-${VERSION}.tar"
)

# 尝试加载镜像（如果文件存在）
for img_file in "${IMAGE_FILES[@]}"; do
  img_path="${IMAGES_DIR}/${img_file}"
  if [ -f "${img_path}" ]; then
    echo "  加载镜像: ${img_file}"
    docker load -i "${img_path}"
  else
    # 尝试查找其他命名格式
    alt_file=$(find "${IMAGES_DIR}" -name "*${img_file}*" -o -name "*$(basename ${img_file} .tar)*" | head -1)
    if [ -n "${alt_file}" ]; then
      echo "  加载镜像: $(basename ${alt_file})"
      docker load -i "${alt_file}"
    else
      echo "  警告: 未找到镜像文件: ${img_file}"
    fi
  fi
done

# 验证镜像是否存在
echo ">>> 验证镜像..."
REQUIRED_IMAGES=(
  "${PROJECT_NAME}-backend:${VERSION}"
  "${PROJECT_NAME}-frontend:${VERSION}"
)

for image in "${REQUIRED_IMAGES[@]}"; do
  if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${image}$"; then
    echo "错误: 镜像不存在: ${image}"
    echo "请确保已正确加载镜像文件"
    exit 1
  fi
  echo "  ✓ ${image}"
done

# 4. 创建或使用现有网络
echo ">>> 配置 Docker 网络..."
# 检查是否存在 Unified Portal 的网络（geely-net）
if docker network ls --format '{{.Name}}' | grep -q "^geely-net$"; then
  NETWORK_NAME="geely-net"
  echo "  检测到 Unified Portal 网络，使用: ${NETWORK_NAME}"
else
  # 使用项目自己的网络
  NETWORK_NAME="${PROJECT_NAME}-network"
  if docker network ls --format '{{.Name}}' | grep -q "^${NETWORK_NAME}$"; then
    echo "  网络已存在: ${NETWORK_NAME}"
  else
    docker network create "${NETWORK_NAME}"
    echo "  网络创建成功: ${NETWORK_NAME}"
  fi
fi

# 5. 启动数据库（如果使用 PostgreSQL）
if [ "$DB_TYPE" = "postgresql" ]; then
  echo ">>> 启动 PostgreSQL 数据库容器..."
  docker run -d \
    --name "${PROJECT_NAME}-postgres" \
    --network "${NETWORK_NAME}" \
    --restart always \
    -e POSTGRES_USER="${PG_USER}" \
    -e POSTGRES_PASSWORD="${PG_PASSWORD}" \
    -e POSTGRES_DB="${PG_DATABASE}" \
    -v "${PROJECT_NAME}-postgres-data:/var/lib/postgresql/data" \
    -p "${PG_PORT}:5432" \
    postgres:15-alpine

  echo "  等待数据库启动..."
  sleep 5
else
  echo ">>> 使用 SQLite 数据库（无需单独容器）"
fi

# 6. 准备数据目录
echo ">>> 准备数据目录..."
mkdir -p /opt/docker-data/${PROJECT_NAME}/{data,uploads}
chmod -R 755 /opt/docker-data/${PROJECT_NAME}

# 7. 启动后端
echo ">>> 启动后端容器..."
BACKEND_ENV_ARGS=(
  -e NODE_ENV=production
  -e PORT=8113
  -e DB_TYPE="${DB_TYPE}"
  -e SQLITE_DB_PATH=./data/todify4.db
  -e INIT_DATABASE=1
)

if [ "$DB_TYPE" = "postgresql" ]; then
  BACKEND_ENV_ARGS+=(
    -e PG_HOST="${PROJECT_NAME}-postgres"
    -e PG_PORT=5432
    -e PG_USER="${PG_USER}"
    -e PG_PASSWORD="${PG_PASSWORD}"
    -e PG_DATABASE="${PG_DATABASE}"
  )
fi

docker run -d \
  --name "${PROJECT_NAME}-backend" \
  --network "${NETWORK_NAME}" \
  --restart always \
  -p "${BACKEND_PORT}:8113" \
  "${BACKEND_ENV_ARGS[@]}" \
  -v /opt/docker-data/${PROJECT_NAME}/data:/app/data \
  -v /opt/docker-data/${PROJECT_NAME}/uploads:/app/uploads \
  "${PROJECT_NAME}-backend:${VERSION}"

echo "  等待后端启动..."
sleep 5

# 8. 启动前端
echo ">>> 启动前端容器..."
docker run -d \
  --name "${PROJECT_NAME}-frontend" \
  --network "${NETWORK_NAME}" \
  --restart always \
  -p "${FRONTEND_PORT}:80" \
  "${PROJECT_NAME}-frontend:${VERSION}"

# 9. 启动 Nginx（可选）
if [ -n "${NGINX_PORT}" ] && [ "${NGINX_PORT}" != "0" ]; then
  echo ">>> 启动 Nginx 反向代理..."
  
  # 创建 Nginx 配置
  NGINX_CONF_DIR="/opt/docker-data/${PROJECT_NAME}/nginx"
  mkdir -p "${NGINX_CONF_DIR}"
  
  cat > "${NGINX_CONF_DIR}/default.conf" <<EOF
server {
    listen 80;
    server_name _;
    
    # 前端代理
    location / {
        proxy_pass http://${PROJECT_NAME}-frontend:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
    
    # API 代理到后端
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
    nginx:alpine
fi

echo ""
echo "=== 部署完成 ==="
echo ""
echo "服务信息:"
echo "  前端: http://$(hostname -I | awk '{print $1}'):${FRONTEND_PORT}"
echo "  后端: http://$(hostname -I | awk '{print $1}'):${BACKEND_PORT}"
if [ -n "${NGINX_PORT}" ] && [ "${NGINX_PORT}" != "0" ]; then
  echo "  Nginx: http://$(hostname -I | awk '{print $1}'):${NGINX_PORT}"
fi
if [ "$DB_TYPE" = "postgresql" ]; then
  echo "  数据库: localhost:${PG_PORT}"
fi
echo ""
echo "容器状态:"
docker ps --filter "name=${PROJECT_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "下一步: 运行 ./verify.sh 验证部署"
