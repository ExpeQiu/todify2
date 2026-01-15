#!/bin/bash
# Todify4 网络修复脚本 - 将容器加入到 Unified Portal 网络
# 用法: ./fix-network.sh

set -e

PROJECT_NAME="todify4"

echo "=== Todify4 网络修复脚本 ==="
echo ""

# 自动检测 Unified Portal 网络名称（支持 geely-net 和 unified-deploy_geely-net）
NETWORK_NAME=""
if docker network ls --format '{{.Name}}' | grep -q "^unified-deploy_geely-net$"; then
  NETWORK_NAME="unified-deploy_geely-net"
elif docker network ls --format '{{.Name}}' | grep -q "^geely-net$"; then
  NETWORK_NAME="geely-net"
else
  echo "错误: 未找到 Unified Portal 网络"
  echo "请先启动 Unified Portal 服务"
  exit 1
fi

echo ">>> 检测到 Unified Portal 网络: ${NETWORK_NAME}"
echo ""

# 检查容器是否存在（根据配置可能包含 postgres 和 nginx）
CONTAINERS=("${PROJECT_NAME}-backend" "${PROJECT_NAME}-frontend")
# 检查是否有 postgres 容器
if docker ps -a --format '{{.Names}}' | grep -q "^${PROJECT_NAME}-postgres$"; then
  CONTAINERS+=("${PROJECT_NAME}-postgres")
fi
# 检查是否有 nginx 容器
if docker ps -a --format '{{.Names}}' | grep -q "^${PROJECT_NAME}-nginx$"; then
  CONTAINERS+=("${PROJECT_NAME}-nginx")
fi

for container in "${CONTAINERS[@]}"; do
  if ! docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
    echo "警告: 容器 ${container} 不存在，跳过"
    continue
  fi
  
  # 检查容器是否已经在 Unified Portal 网络中
  if docker inspect "${container}" --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}}{{end}}' 2>/dev/null | grep -q "${NETWORK_NAME}"; then
    echo "  ✓ ${container} 已在 ${NETWORK_NAME} 网络中"
  else
    echo "  >>> 将 ${container} 加入到 ${NETWORK_NAME} 网络..."
    # 停止容器（如果正在运行）
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
      echo "    停止容器..."
      docker stop "${container}" >/dev/null 2>&1 || true
    fi
    
    # 断开旧网络连接（如果有）
    OLD_NETWORKS=$(docker inspect "${container}" --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}' 2>/dev/null || echo "")
    for old_net in ${OLD_NETWORKS}; do
      if [ -n "${old_net}" ] && [ "${old_net}" != "${NETWORK_NAME}" ]; then
        echo "    断开旧网络: ${old_net}"
        docker network disconnect "${old_net}" "${container}" >/dev/null 2>&1 || true
      fi
    done
    
    # 连接到 Unified Portal 网络
    docker network connect "${NETWORK_NAME}" "${container}" >/dev/null 2>&1 || {
      echo "    错误: 无法连接到 ${NETWORK_NAME} 网络"
      continue
    }
    
    # 重新启动容器（如果之前是运行状态）
    if [ -n "${OLD_NETWORKS}" ]; then
      echo "    重启容器..."
      docker start "${container}" >/dev/null 2>&1 || true
      sleep 2
    fi
    
    echo "  ✓ ${container} 已加入到 ${NETWORK_NAME} 网络"
  fi
done

echo ""
echo "=== 网络修复完成 ==="
echo ""

# 重载网关配置
if docker ps --format '{{.Names}}' | grep -q "^geely-gateway$"; then
  echo ">>> 重载网关配置..."
  docker exec geely-gateway nginx -t >/dev/null 2>&1 && {
    docker exec geely-gateway nginx -s reload
    echo "  ✓ 网关配置已重载"
  } || echo "  ⚠ 网关配置检查失败，请手动检查"
fi

echo ""
echo "验证网络连接:"
docker network inspect "${NETWORK_NAME}" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | grep -o "${PROJECT_NAME}-[a-z]*" | sed 's/^/  ✓ /' || echo "  未找到 Todify4 容器"

echo ""
echo "容器状态:"
docker ps --filter "name=${PROJECT_NAME}" --format "  {{.Names}}: {{.Status}}"

echo ""
echo "下一步: 访问 http://10.133.23.136/todify/ 验证"
