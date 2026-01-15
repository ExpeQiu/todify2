#!/bin/bash
# Todify4 验证脚本 - 检查部署是否成功
# 用法: ./verify.sh

set -e

PROJECT_NAME="todify4"

# 从配置文件读取端口（如果存在）
if [ -f "../config/.env" ] || [ -f "../docker/.env" ]; then
  if [ -f "../config/.env" ]; then
    source "../config/.env"
  else
    source "../docker/.env"
  fi
fi

FRONTEND_PORT=${FRONTEND_PORT:-8281}
BACKEND_PORT=${BACKEND_PORT:-8280}
NGINX_PORT=${NGINX_PORT:-8288}
DB_TYPE=${DB_TYPE:-sqlite}

echo "=== Todify4 部署验证 ==="
echo ""

# 1. 检查容器状态
echo ">>> 检查容器状态..."
CONTAINERS=("${PROJECT_NAME}-backend" "${PROJECT_NAME}-frontend")
if [ "$DB_TYPE" = "postgresql" ]; then
  CONTAINERS+=("${PROJECT_NAME}-postgres")
fi
if [ -n "${NGINX_PORT}" ] && [ "${NGINX_PORT}" != "0" ]; then
  CONTAINERS+=("${PROJECT_NAME}-nginx")
fi

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

if [ "$ALL_RUNNING" = false ]; then
  echo ""
  echo "错误: 部分容器未运行，请检查日志"
  exit 1
fi

echo ""

# 2. 检查数据库连接（如果使用 PostgreSQL）
if [ "$DB_TYPE" = "postgresql" ]; then
  echo ">>> 检查数据库连接..."
  if docker exec "${PROJECT_NAME}-postgres" pg_isready -U postgres >/dev/null 2>&1; then
    echo "  ✓ 数据库连接正常"
  else
    echo "  ✗ 数据库连接失败"
    exit 1
  fi
  echo ""
fi

# 3. 检查后端健康状态
echo ">>> 检查后端服务..."
MAX_RETRIES=10
RETRY_COUNT=0
BACKEND_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -sf "http://localhost:${BACKEND_PORT}/api/health" >/dev/null 2>&1; then
    BACKEND_HEALTHY=true
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  sleep 2
done

if [ "$BACKEND_HEALTHY" = true ]; then
  echo "  ✓ 后端健康检查通过"
else
  echo "  ✗ 后端健康检查失败"
  echo "    请检查日志: docker logs ${PROJECT_NAME}-backend"
  exit 1
fi

echo ""

# 4. 检查前端服务
echo ">>> 检查前端服务..."
if curl -sf "http://localhost:${FRONTEND_PORT}" >/dev/null 2>&1; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${FRONTEND_PORT}")
  if [ "${HTTP_CODE}" = "200" ]; then
    echo "  ✓ 前端服务正常 (HTTP ${HTTP_CODE})"
  else
    echo "  警告: 前端返回 HTTP ${HTTP_CODE}"
  fi
else
  echo "  ✗ 前端服务无法访问"
  echo "    请检查日志: docker logs ${PROJECT_NAME}-frontend"
  exit 1
fi

echo ""

# 5. 检查 Nginx（如果启用）
if [ -n "${NGINX_PORT}" ] && [ "${NGINX_PORT}" != "0" ]; then
  echo ">>> 检查 Nginx 服务..."
  if curl -sf "http://localhost:${NGINX_PORT}" >/dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${NGINX_PORT}")
    echo "  ✓ Nginx 服务正常 (HTTP ${HTTP_CODE})"
  else
    echo "  ✗ Nginx 服务无法访问"
    exit 1
  fi
  echo ""
fi

# 6. 检查网络连接
echo ">>> 检查容器间网络..."
if docker exec "${PROJECT_NAME}-backend" ping -c 1 "${PROJECT_NAME}-frontend" >/dev/null 2>&1; then
  echo "  ✓ 后端到前端网络正常"
else
  echo "  ✗ 后端到前端网络异常"
  exit 1
fi

echo ""

# 7. 检查端口占用
echo ">>> 检查端口占用..."
PORTS=("${FRONTEND_PORT}" "${BACKEND_PORT}")
if [ -n "${NGINX_PORT}" ] && [ "${NGINX_PORT}" != "0" ]; then
  PORTS+=("${NGINX_PORT}")
fi
for port in "${PORTS[@]}"; do
  if netstat -tuln 2>/dev/null | grep -q ":${port} " || ss -tuln 2>/dev/null | grep -q ":${port} "; then
    echo "  ✓ 端口 ${port} 已监听"
  else
    echo "  警告: 端口 ${port} 未监听"
  fi
done

echo ""
echo "=== 验证完成 ==="
echo ""
echo "访问地址:"
echo "  前端: http://$(hostname -I | awk '{print $1}'):${FRONTEND_PORT}"
echo "  后端 API: http://$(hostname -I | awk '{print $1}'):${BACKEND_PORT}"
if [ -n "${NGINX_PORT}" ] && [ "${NGINX_PORT}" != "0" ]; then
  echo "  Nginx: http://$(hostname -I | awk '{print $1}'):${NGINX_PORT}"
fi
echo ""
echo "如果通过 Unified Portal 访问，路径应为:"
echo "  http://10.133.23.136/todify/"
echo ""
