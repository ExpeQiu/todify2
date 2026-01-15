#!/bin/bash
# Todify4 清理脚本 - 停止并删除旧服务
# 用法: ./cleanup.sh [--volumes] [--images]

set -e

PROJECT_NAME="todify4"
CONTAINERS=("${PROJECT_NAME}-backend" "${PROJECT_NAME}-frontend" "${PROJECT_NAME}-nginx" "${PROJECT_NAME}-postgres")
NETWORK="${PROJECT_NAME}-network"

echo "=== Todify4 清理脚本 ==="
echo "项目名称: ${PROJECT_NAME}"

# 解析参数
REMOVE_VOLUMES=false
REMOVE_IMAGES=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --volumes)
      REMOVE_VOLUMES=true
      shift
      ;;
    --images)
      REMOVE_IMAGES=true
      shift
      ;;
    *)
      echo "未知参数: $1"
      echo "用法: $0 [--volumes] [--images]"
      exit 1
      ;;
  esac
done

# 1. 停止容器
echo ">>> 停止容器..."
for container in "${CONTAINERS[@]}"; do
  if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
    echo "  停止容器: ${container}"
    docker stop "${container}" 2>/dev/null || true
  else
    echo "  容器不存在: ${container}"
  fi
done

# 2. 删除容器
echo ">>> 删除容器..."
for container in "${CONTAINERS[@]}"; do
  if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
    echo "  删除容器: ${container}"
    docker rm "${container}" 2>/dev/null || true
  fi
done

# 3. 删除网络
echo ">>> 删除网络..."
if docker network ls --format '{{.Name}}' | grep -q "^${NETWORK}$"; then
  echo "  删除网络: ${NETWORK}"
  docker network rm "${NETWORK}" 2>/dev/null || true
else
  echo "  网络不存在: ${NETWORK}"
fi

# 4. 删除数据卷（可选）
if [ "$REMOVE_VOLUMES" = true ]; then
  echo ">>> 删除数据卷..."
  VOLUMES=(
    "${PROJECT_NAME}-postgres-data"
  )
  
  for volume in "${VOLUMES[@]}"; do
    if docker volume ls --format '{{.Name}}' | grep -q "^${volume}$"; then
      echo "  删除数据卷: ${volume}"
      docker volume rm "${volume}" 2>/dev/null || true
    fi
  done
else
  echo ">>> 保留数据卷（使用 --volumes 参数可删除）"
fi

# 5. 删除镜像（可选）
if [ "$REMOVE_IMAGES" = true ]; then
  echo ">>> 删除镜像..."
  IMAGES=(
    "${PROJECT_NAME}-backend:latest"
    "${PROJECT_NAME}-frontend:latest"
  )
  
  for image in "${IMAGES[@]}"; do
    if docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${image}$"; then
      echo "  删除镜像: ${image}"
      docker rmi "${image}" 2>/dev/null || true
    fi
  done
else
  echo ">>> 保留镜像（使用 --images 参数可删除）"
fi

echo "=== 清理完成 ==="
