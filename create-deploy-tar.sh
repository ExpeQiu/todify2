#!/bin/bash

# Docker 部署打包脚本
# 用于创建部署到云服务器的 tar 文件

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 打印消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAR_NAME="todify4-docker-deploy-$(date +%Y%m%d-%H%M%S).tar"
TEMP_DIR=$(mktemp -d)

print_info "项目根目录: $PROJECT_ROOT"
print_info "临时目录: $TEMP_DIR"
print_info "打包文件名: $TAR_NAME"

# 清理函数
cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
        print_info "已清理临时目录"
    fi
}
trap cleanup EXIT

# 创建目录结构
print_info "创建目录结构..."
mkdir -p "$TEMP_DIR/todify4/backend"
mkdir -p "$TEMP_DIR/todify4/frontend"
mkdir -p "$TEMP_DIR/todify4/docker"

# 清理 macOS 隐藏文件（参考 TPD2 部署指南）
print_info "清理 macOS 隐藏文件..."
find "$PROJECT_ROOT/backend" -name "._*" -type f -delete 2>/dev/null || true
find "$PROJECT_ROOT/frontend" -name "._*" -type f -delete 2>/dev/null || true
find "$PROJECT_ROOT/docker" -name "._*" -type f -delete 2>/dev/null || true

# 复制后端文件
print_info "复制后端文件..."
rsync -av \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '*.db' \
    --exclude '*.sqlite' \
    --exclude '*.sqlite3' \
    --exclude 'data/' \
    --exclude '*.log' \
    --exclude '*.tsbuildinfo' \
    --exclude 'coverage' \
    --exclude '.nyc_output' \
    --exclude '._*' \
    --exclude '.DS_Store' \
    "$PROJECT_ROOT/backend/" "$TEMP_DIR/todify4/backend/"

# 复制前端文件
print_info "复制前端文件..."
rsync -av \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '*.log' \
    --exclude '*.tsbuildinfo' \
    --exclude 'coverage' \
    --exclude '.nyc_output' \
    --exclude '.cache' \
    --exclude '._*' \
    --exclude '.DS_Store' \
    "$PROJECT_ROOT/frontend/" "$TEMP_DIR/todify4/frontend/"

# 复制 docker 目录内容（保留 docker-deploy.sh 等脚本）
print_info "复制 Docker 配置..."
mkdir -p "$TEMP_DIR/todify4/docker"
# 只复制 docker-deploy.sh（如果有其他需要保留的文件）
if [ -f "$PROJECT_ROOT/docker/docker-deploy.sh" ]; then
    cp "$PROJECT_ROOT/docker/docker-deploy.sh" "$TEMP_DIR/todify4/docker/"
fi

# 将 docker-compose.yml 复制到项目根目录（路径已经配置为 ./backend 和 ./frontend）
print_info "复制 Docker Compose 配置文件到项目根目录..."
if [ -f "$PROJECT_ROOT/docker/docker-compose.yml" ]; then
    cp "$PROJECT_ROOT/docker/docker-compose.yml" "$TEMP_DIR/todify4/docker-compose.yml"
    # 修改 docker-compose.yml 使用 CentOS 7 兼容的 Dockerfile
    # 注意：macOS 的 sed 需要 -i ''，Linux 使用 -i，这里使用兼容的方式
    sed -i.bak 's|dockerfile: Dockerfile$|dockerfile: Dockerfile.centos7|g' "$TEMP_DIR/todify4/docker-compose.yml"
    rm -f "$TEMP_DIR/todify4/docker-compose.yml.bak" 2>/dev/null || true
fi
if [ -f "$PROJECT_ROOT/docker/docker-compose.postgres.yml" ]; then
    cp "$PROJECT_ROOT/docker/docker-compose.postgres.yml" "$TEMP_DIR/todify4/docker-compose.postgres.yml"
fi

# 复制 CentOS 7 兼容的 Dockerfile
print_info "复制 CentOS 7 兼容的 Dockerfile..."
if [ -f "$PROJECT_ROOT/backend/Dockerfile.centos7" ]; then
    cp "$PROJECT_ROOT/backend/Dockerfile.centos7" "$TEMP_DIR/todify4/backend/"
fi
if [ -f "$PROJECT_ROOT/frontend/Dockerfile.centos7" ]; then
    cp "$PROJECT_ROOT/frontend/Dockerfile.centos7" "$TEMP_DIR/todify4/frontend/"
fi

# 复制 .env 文件（如果存在）
if [ -f "$PROJECT_ROOT/.env" ]; then
    print_info "复制 .env 文件..."
    cp "$PROJECT_ROOT/.env" "$TEMP_DIR/todify4/.env"
else
    print_warn ".env 文件不存在，将在服务器上创建"
fi

# 复制 README.md（如果存在）
if [ -f "$PROJECT_ROOT/README.md" ]; then
    cp "$PROJECT_ROOT/README.md" "$TEMP_DIR/todify4/"
fi

# 创建部署说明文件
print_info "创建部署说明文件..."
cat > "$TEMP_DIR/todify4/DEPLOY.md" << 'EOF'
# Todify4 Docker 部署说明

## 系统要求

- CentOS 7+
- Docker 1.13.1+ (已安装)
- Docker Compose 1.x (注意：必须使用 `docker-compose` 命令，不是 `docker compose`)

## 重要提示

本部署包已针对 CentOS 7 和 Docker 1.13.1 进行了兼容性调整：
- 使用单阶段 Dockerfile（Docker 1.13.1 不支持多阶段构建）
- docker-compose.yml 使用 version: '3.0'
- 所有命令使用 `docker-compose`（不是 `docker compose`）
- 前端 nginx 配置使用容器名 `todify3-backend`（不是服务名 `backend`）
- PostgreSQL 配置使用容器名 `todify3-postgres`（不是服务名 `postgres`）
- 已清理 macOS 隐藏文件（`._*`）

## 部署步骤

### 1. 解压文件

```bash
tar -xf todify4-docker-deploy-*.tar
cd todify4
```

### 2. 配置环境变量

```bash
# 如果 .env 文件不存在，请创建并配置
cp .env.example .env  # 如果有示例文件
# 或者直接编辑 .env 文件
vi .env
```

### 3. 创建必要目录

```bash
mkdir -p backend/data backend/uploads
```

### 4. 使用 Docker Compose 部署

#### SQLite 数据库（默认）

```bash
# 注意：必须使用 docker-compose（带连字符），不是 docker compose
docker-compose up -d --build
```

#### PostgreSQL 数据库

```bash
docker-compose -f docker-compose.yml -f docker-compose.postgres.yml up -d --build
```

### 5. 查看服务状态

```bash
docker-compose ps
```

### 6. 查看日志

```bash
docker-compose logs -f
```

## 服务访问

- 前端: http://服务器IP
- 后端 API: http://服务器IP:3003/api
- 健康检查: http://服务器IP:3003/api/health

## 常用命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 进入容器
docker-compose exec backend sh
docker-compose exec frontend sh
```

## 注意事项

1. **Docker 版本**：本部署包针对 Docker 1.13.1 优化，使用单阶段构建
2. **命令格式**：必须使用 `docker-compose`（带连字符），不是 `docker compose`
3. **容器命名**：所有配置使用容器名（`todify3-backend`、`todify3-frontend`、`todify3-postgres`），确保一致性
4. 确保 Docker 服务已启动: `systemctl start docker`
5. 确保端口 80 和 3003 未被占用
6. 首次部署会自动初始化数据库
7. 数据文件保存在 `backend/data` 目录
8. 上传文件保存在 `backend/uploads` 目录
9. **架构兼容性**：已配置为 linux/amd64 架构（CentOS 7 x86_64）
10. **macOS 构建**：已清理 macOS 隐藏文件（`._*` 和 `.DS_Store`），避免构建错误

## 故障排查

### 前端无法访问后端 API

如果前端页面加载但 API 调用失败：

```bash
# 1. 检查前端 nginx 配置
docker exec todify3-frontend cat /etc/nginx/conf.d/default.conf | grep backend
# 应该显示：proxy_pass http://todify3-backend:3003/api/;

# 2. 测试容器间网络
docker exec todify3-frontend ping -c 2 todify3-backend

# 3. 检查后端服务
curl http://localhost:3003/api/health

# 4. 查看前端日志
docker-compose logs frontend | tail -20
```

### 后端无法连接数据库

如果使用 PostgreSQL 且后端无法连接：

```bash
# 1. 检查环境变量（确保使用容器名）
docker exec todify3-backend env | grep PG_HOST
# 应该显示：PG_HOST=todify3-postgres

# 2. 检查网络
docker network inspect todify3-network

# 3. 测试网络连通性
docker exec todify3-backend ping -c 2 todify3-postgres
```
EOF

# 打包（不压缩，直接创建 tar 文件）
print_info "正在打包..."
cd "$TEMP_DIR"
tar -cf "$PROJECT_ROOT/$TAR_NAME" todify4/

# 显示文件信息
TAR_SIZE=$(du -h "$PROJECT_ROOT/$TAR_NAME" | cut -f1)
print_info "打包完成: $TAR_NAME"
print_info "文件大小: $TAR_SIZE"
print_info "文件位置: $PROJECT_ROOT/$TAR_NAME"

echo ""
print_info "=========================================="
print_info "打包完成！"
print_info "=========================================="
print_info "可以手动上传到服务器，然后在服务器上解压："
print_info "  tar -xf $TAR_NAME"
print_info "  cd todify4"
print_info "=========================================="

