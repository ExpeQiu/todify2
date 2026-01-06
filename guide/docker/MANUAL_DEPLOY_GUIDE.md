# Todify4 项目手动部署指南

本文档详细说明 Todify4 项目通过手动方式部署到 CentOS 7 服务器的完整过程，包括所有步骤、异常处理及最佳实践。

---

## 📋 项目部署架构

### 技术栈

- **前端**: React + Vite + Nginx
- **后端**: Node.js + TypeScript + Express
- **数据库**: SQLite（默认）或 PostgreSQL 15
- **容器化**: Docker（手动部署，不使用 Docker Compose）
- **部署方式**: 离线部署（镜像打包 + 文件传输）

### 部署环境

- **本地环境**: macOS
- **目标服务器**: CentOS 7 (x86_64 / linux/amd64)
- **Docker 版本**: 1.13.1
- **连接方式**: SSH / 堡垒机

---

## 🚀 完整部署流程

### 第一阶段：本地准备

#### 1.1 验证前端配置（关键步骤）

```bash
cd /Volumes/Lexar/git/02JLwork/todify4

# 验证 nginx 配置：应使用容器名 todify3-backend
grep "proxy_pass" frontend/nginx.conf
# 应该输出：proxy_pass http://todify3-backend:3003/api/;

# 如果不是，需要修改
sed -i '' 's|http://backend:3003|http://todify3-backend:3003|g' frontend/nginx.conf
```

**原因**: 手动启动容器时使用容器名（`todify3-backend`），不是服务名（`backend`）

#### 1.2 清理 macOS 隐藏文件

```bash
# 清理扩展属性文件，避免 Docker 构建错误
find frontend -name "._*" -type f -delete
find backend -name "._*" -type f -delete
find docker -name "._*" -type f -delete

# 验证清理结果
find frontend backend docker -name "._*" 2>/dev/null
# 应该没有输出
```

#### 1.3 构建 Docker 镜像

**注意**: 使用 `Dockerfile.centos7`（单阶段构建，兼容 Docker 1.13.1）

```bash
# 设置版本标签
VERSION="v1.0"

# 构建后端镜像（使用 CentOS 7 兼容的 Dockerfile）
docker build --platform linux/amd64 --no-cache \
  -t todify3-backend:latest \
  -f backend/Dockerfile.centos7 \
  backend

# 构建前端镜像（使用 CentOS 7 兼容的 Dockerfile）
docker build --platform linux/amd64 --no-cache \
  -t todify3-frontend:latest \
  -f frontend/Dockerfile.centos7 \
  frontend

# 如果使用 PostgreSQL，拉取镜像
docker pull --platform linux/amd64 postgres:15-alpine

# 打标签
docker tag todify3-backend:latest todify3-backend:$VERSION
docker tag todify3-frontend:latest todify3-frontend:$VERSION
docker tag postgres:15-alpine todify3-postgres:$VERSION

# 验证镜像
docker images | grep todify3
```

#### 1.4 导出 Docker 镜像

**方式一：合并导出（推荐）**

```bash
# 导出所有镜像到一个文件
docker save -o todify4-all-$VERSION.tar \
  todify3-backend:$VERSION \
  todify3-frontend:$VERSION \
  todify3-postgres:$VERSION

# 查看文件大小
ls -lh todify4-all-$VERSION.tar
```

**方式二：分别导出**

```bash
docker save -o todify3-backend-$VERSION.tar todify3-backend:$VERSION
docker save -o todify3-frontend-$VERSION.tar todify3-frontend:$VERSION
docker save -o todify3-postgres-$VERSION.tar todify3-postgres:$VERSION
```

#### 1.5 准备配置文件

```bash
# 复制 .env 文件到部署目录
cp .env deploy/.env.deploy

# 检查配置（根据需要修改）
cat deploy/.env.deploy
```

---

### 第二阶段：文件上传

通过 SSH 或 WindTerm 等工具上传到服务器 `/root/` 目录：

- `todify4-all-v1.0.tar`（或分别上传三个镜像文件）
- `.env.deploy`（配置文件，可选）
- `backend/init-data/*.sql`（初始化数据，可选）

---

### 第三阶段：服务器部署

#### 3.1 清理旧部署

```bash
# 停止并删除旧容器
docker stop todify3-frontend todify3-backend todify3-postgres 2>/dev/null || true
docker rm todify3-frontend todify3-backend todify3-postgres 2>/dev/null || true

# 删除旧网络
docker network rm todify3-network 2>/dev/null || true

# 清理悬空镜像
docker image prune -f
```

#### 3.2 加载镜像

```bash
# 如果使用合并包
docker load -i /root/todify4-all-v1.0.tar

# 或分别加载
docker load -i /root/todify3-backend-v1.0.tar
docker load -i /root/todify3-frontend-v1.0.tar
docker load -i /root/todify3-postgres-v1.0.tar

# 验证镜像
docker images | grep todify3
```

#### 3.3 创建网络和数据卷

```bash
# 创建网络
docker network create todify3-network

# 创建数据卷（如果使用 PostgreSQL）
docker volume create postgres_data

# 创建数据目录
mkdir -p /root/todify4/backend/data
mkdir -p /root/todify4/backend/uploads
mkdir -p /root/todify4/backend/init-data

# 复制初始化数据（如果有）
# cp /root/*.sql /root/todify4/backend/init-data/ 2>/dev/null || true
```

#### 3.4 启动服务（SQLite 方式）

##### 4.1 启动后端服务

```bash
# 设置环境变量（从 .env 文件或直接指定）
export NODE_ENV=production
export PORT=3003
export DB_TYPE=sqlite
export SQLITE_DB_PATH=./data/todify3.db
export INIT_DATABASE=1
export FORCE_INIT=0

# Dify API 配置
export DIFY_BASE_URL=http://47.113.225.93:9999/v1
export DIFY_WORKFLOW_BASE_URL=http://47.113.225.93:9999/v1
export AI_SEARCH_API_KEY=app-t1X4eu8B4eucyO6IfrTbw1t2
export TECH_PACKAGE_API_KEY=app-YDVb91faDHwTqIei4WWSNaTM
export TECH_STRATEGY_API_KEY=app-awRZf7tKfvC73DEVANAGGNr8
export TECH_ARTICLE_API_KEY=app-3TK9U2F3WwFP7vOoq0Ut84KA
export TECH_PUBLISH_API_KEY=app-iAiKRQ7h8zCwkz2TBkezgtGs

# 博查 API 配置
export BOCHA_API_KEY=sk-c2d92b6a8b8c4d929f15cea2af541a03

# 启动后端容器
docker run -d \
  --name todify3-backend \
  --network todify3-network \
  --restart unless-stopped \
  -e NODE_ENV="$NODE_ENV" \
  -e PORT="$PORT" \
  -e DB_TYPE="$DB_TYPE" \
  -e SQLITE_DB_PATH="$SQLITE_DB_PATH" \
  -e INIT_DATABASE="$INIT_DATABASE" \
  -e FORCE_INIT="$FORCE_INIT" \
  -e DATA_DIR=/app/data \
  -e INIT_DATA_DIR=/app/init-data \
  -e DIFY_BASE_URL="$DIFY_BASE_URL" \
  -e DIFY_WORKFLOW_BASE_URL="$DIFY_WORKFLOW_BASE_URL" \
  -e AI_SEARCH_API_KEY="$AI_SEARCH_API_KEY" \
  -e TECH_PACKAGE_API_KEY="$TECH_PACKAGE_API_KEY" \
  -e TECH_STRATEGY_API_KEY="$TECH_STRATEGY_API_KEY" \
  -e TECH_ARTICLE_API_KEY="$TECH_ARTICLE_API_KEY" \
  -e TECH_PUBLISH_API_KEY="$TECH_PUBLISH_API_KEY" \
  -e BOCHA_API_KEY="$BOCHA_API_KEY" \
  -v /root/todify4/backend/data:/app/data \
  -v /root/todify4/backend/uploads:/app/uploads \
  -v /root/todify4/backend/init-data:/app/init-data:ro \
  -p 3003:3003 \
  todify3-backend:v1.0

# 等待启动
sleep 30

# 验证后端服务
curl http://localhost:3003/api/health
```

##### 4.2 启动前端服务

```bash
# 启动前端容器
docker run -d \
  --name todify3-frontend \
  --network todify3-network \
  --restart unless-stopped \
  -p 80:80 \
  todify3-frontend:v1.0

# 等待启动
sleep 10

# 验证前端服务
curl -I http://localhost
docker logs --tail 20 todify3-frontend
```

#### 3.5 启动服务（PostgreSQL 方式）

##### 5.1 启动 PostgreSQL

```bash
# 设置密码（请使用强密码）
export PG_PASSWORD="your_strong_password_here"

# 启动 PostgreSQL 容器
docker run -d \
  --name todify3-postgres \
  --network todify3-network \
  --restart unless-stopped \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD="$PG_PASSWORD" \
  -e POSTGRES_DB=todify3 \
  -e PGDATA=/var/lib/postgresql/data/pgdata \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  todify3-postgres:v1.0

# 等待启动
sleep 15

# 验证 PostgreSQL
docker exec todify3-postgres pg_isready -U postgres
```

##### 5.2 启动后端服务（PostgreSQL）

```bash
# 设置环境变量
export NODE_ENV=production
export PORT=3003
export DB_TYPE=postgresql
export PG_HOST=todify3-postgres
export PG_PORT=5432
export PG_USER=postgres
export PG_PASSWORD="$PG_PASSWORD"
export PG_DATABASE=todify3

# ... (其他环境变量同 SQLite 方式)

# 启动后端容器
docker run -d \
  --name todify3-backend \
  --network todify3-network \
  --restart unless-stopped \
  -e NODE_ENV="$NODE_ENV" \
  -e PORT="$PORT" \
  -e DB_TYPE="$DB_TYPE" \
  -e PG_HOST="$PG_HOST" \
  -e PG_PORT="$PG_PORT" \
  -e PG_USER="$PG_USER" \
  -e PG_PASSWORD="$PG_PASSWORD" \
  -e PG_DATABASE="$PG_DATABASE" \
  -e INIT_DATABASE=1 \
  -e FORCE_INIT=0 \
  -e DATA_DIR=/app/data \
  -e INIT_DATA_DIR=/app/init-data \
  -e DIFY_BASE_URL="$DIFY_BASE_URL" \
  -e DIFY_WORKFLOW_BASE_URL="$DIFY_WORKFLOW_BASE_URL" \
  -e AI_SEARCH_API_KEY="$AI_SEARCH_API_KEY" \
  -e TECH_PACKAGE_API_KEY="$TECH_PACKAGE_API_KEY" \
  -e TECH_STRATEGY_API_KEY="$TECH_STRATEGY_API_KEY" \
  -e TECH_ARTICLE_API_KEY="$TECH_ARTICLE_API_KEY" \
  -e TECH_PUBLISH_API_KEY="$TECH_PUBLISH_API_KEY" \
  -e BOCHA_API_KEY="$BOCHA_API_KEY" \
  -v /root/todify4/backend/data:/app/data \
  -v /root/todify4/backend/uploads:/app/uploads \
  -v /root/todify4/backend/init-data:/app/init-data:ro \
  -p 3003:3003 \
  todify3-backend:v1.0

# 等待启动
sleep 30

# 验证后端服务
curl http://localhost:3003/api/health
```

##### 5.3 启动前端服务（同 SQLite 方式）

```bash
docker run -d \
  --name todify3-frontend \
  --network todify3-network \
  --restart unless-stopped \
  -p 80:80 \
  todify3-frontend:v1.0
```

---

## ⚠️ 异常问题与解决方案

### 异常 1：Docker 容器删除卡住

**现象**：
```bash
Error response from daemon: removal of container todify3-frontend is already in progress
```

**原因**：容器删除进程卡住或状态异常

**解决方案**：
```bash
# 方法 1：重启 Docker 服务
systemctl restart docker

# 方法 2：强制删除
docker rm -f todify3-frontend todify3-backend todify3-postgres

# 方法 3：清理所有停止的容器
docker container prune -f
```

---

### 异常 2：前端容器持续重启

**现象**：
```bash
docker ps
# todify3-frontend: Restarting (1) 3 seconds ago
```

**原因**：nginx 配置中使用了错误的主机名（`backend` 而不是 `todify3-backend`）

**解决方案**：
1. 在本地修改 `frontend/nginx.conf`：
   ```bash
   sed -i '' 's|http://backend:3003|http://todify3-backend:3003|g' frontend/nginx.conf
   ```
2. 重新构建前端镜像
3. 重新部署

---

### 异常 3：PostgreSQL 密码未设置

**现象**：
```bash
Error: Database is uninitialized and superuser password is not specified.
```

**原因**：`POSTGRES_PASSWORD` 环境变量为空或未传递

**解决方案**：
```bash
# 直接在 docker run 命令中指定密码（不使用环境变量）
docker run -d \
  --name todify3-postgres \
  -e POSTGRES_PASSWORD=your_strong_password_here \
  ...
```

**最佳实践**：始终在命令中直接指定密码，避免环境变量传递问题

---

### 异常 4：后端无法连接数据库

**现象**：
```bash
⏳ PostgreSQL 未就绪，等待中...
```

**原因**：
1. `PG_HOST` 环境变量错误（使用了 `postgres` 而不是 `todify3-postgres`）
2. 容器不在同一网络
3. PostgreSQL 容器未启动

**解决方案**：
```bash
# 1. 检查网络
docker network inspect todify3-network

# 2. 检查容器是否在同一网络
docker inspect todify3-backend | grep -A 10 "Networks"
docker inspect todify3-postgres | grep -A 10 "Networks"

# 3. 确保使用正确的容器名
# PG_HOST=todify3-postgres # 不是 postgres

# 4. 测试网络连通性
docker exec todify3-backend ping -c 2 todify3-postgres
```

---

### 异常 5：端口映射错误

**现象**：
```bash
curl http://localhost:3003/health
# curl: (56) Recv failure: Connection reset by peer
```

**原因**：端口映射不匹配
- 容器内应用监听 3003 端口
- 但映射为 `-p 8000:8000`（错误）

**解决方案**：
```bash
# 正确的端口映射
-p 3003:3003 # 主机3003 → 容器3003

# 验证端口映射
docker port todify3-backend
# 应该输出：3003/tcp -> 0.0.0.0:3003

# 验证容器内监听
docker exec todify3-backend netstat -tlnp | grep 3003
```

---

### 异常 6：前端无法访问后端 API

**现象**：
- 前端页面加载但 API 调用失败
- 浏览器控制台显示网络错误

**原因**：
1. nginx 配置中主机名错误
2. 后端容器未启动
3. 网络配置问题

**解决方案**：
```bash
# 1. 检查前端 nginx 配置
docker exec todify3-frontend cat /etc/nginx/conf.d/default.conf | grep backend
# 应该显示：proxy_pass http://todify3-backend:3003/api/;

# 2. 测试容器间网络
docker exec todify3-frontend ping -c 2 todify3-backend

# 3. 检查后端服务
curl http://localhost:3003/api/health

# 4. 查看前端日志
docker logs todify3-frontend | tail -20
```

---

### 异常 7：macOS Docker 构建错误

**现象**：
```bash
ERROR: failed to xattr frontend/._nginx.conf: operation not permitted
```

**原因**：macOS 扩展属性文件（`._*`）导致构建失败

**解决方案**：
```bash
# 清理扩展属性文件
find frontend -name "._*" -type f -delete
find backend -name "._*" -type f -delete

# 或使用 dot_clean
dot_clean -m frontend
dot_clean -m backend
```

---

### 异常 8：镜像架构不匹配

**现象**：
```bash
standard_init_linux.go:195: exec user process caused "exec format error"
```

**原因**：在 macOS (ARM) 上构建的镜像在 Linux (x86_64) 服务器上无法运行

**解决方案**：
```bash
# 构建时指定平台
docker build --platform linux/amd64 --no-cache -t todify3-backend:latest -f backend/Dockerfile.centos7 backend
```

---

## 📝 最佳实践

### 1. 配置管理

**环境变量设置**：
- 在命令中直接指定密码，避免环境变量传递问题
- 使用强密码和密钥
- 生产环境不要使用默认值

**容器命名**：
- 使用一致的命名规则：`todify3-{service}`
- 确保所有配置使用容器名，不是服务名

### 2. 网络配置

**网络创建**：
- 先创建网络，再启动容器
- 所有容器使用同一网络
- 使用容器名进行服务发现

**端口映射**：
- 明确容器内端口和应用端口
- 使用 `-p 主机端口:容器端口` 格式
- 验证端口映射：`docker port <container>`

### 3. 数据管理

**数据卷**：
- 使用命名卷持久化数据（PostgreSQL）
- 使用目录挂载（SQLite，便于备份）
- 定期备份数据卷/目录
- 删除容器前确认数据已备份

### 4. 镜像构建

**平台指定**：
- 始终使用 `--platform linux/amd64`
- 避免架构不匹配问题

**清理构建**：
- 使用 `--no-cache` 避免缓存问题
- 清理 macOS 隐藏文件
- 验证镜像架构：`docker image inspect <image> | grep Architecture`

### 5. 故障排查

**日志查看**：
```bash
# 查看容器日志
docker logs -f <container>

# 查看最后 N 行
docker logs --tail 50 <container>

# 过滤关键信息
docker logs <container> | grep -E "(Error|ERROR|error)"
```

**状态检查**：
```bash
# 容器状态
docker ps -a

# 网络状态
docker network inspect todify3-network

# 端口监听
ss -tlnp | grep <port>
```

**连接测试**：
```bash
# 容器间网络
docker exec <container1> ping -c 2 <container2>

# 服务健康检查
curl http://localhost:<port>/api/health
```

---

## 🔄 快速部署检查清单

### 本地准备
- [ ] 验证前端 nginx 配置（使用 `todify3-backend`）
- [ ] 清理 macOS 隐藏文件（`._*`）
- [ ] 构建 Docker 镜像（指定 `--platform linux/amd64`）
- [ ] 使用 `Dockerfile.centos7`（单阶段构建）
- [ ] 导出镜像为 tar 包
- [ ] 准备配置文件（`.env`）

### 文件上传
- [ ] 上传镜像包到服务器
- [ ] 上传配置文件（如需要）
- [ ] 上传初始化数据（如需要）

### 服务器部署
- [ ] 清理旧部署
- [ ] 加载镜像
- [ ] 创建网络和数据卷/目录
- [ ] 启动 PostgreSQL（如使用）
- [ ] 启动后端（注意端口映射和容器名）
- [ ] 启动前端
- [ ] 验证所有服务

### 验证测试
- [ ] 容器状态正常
- [ ] 网络连通性
- [ ] 后端健康检查
- [ ] 前端访问
- [ ] 数据完整性

---

## 📚 常用命令速查

### 容器管理

```bash
# 启动/停止/重启
docker start/stop/restart <container>

# 删除容器
docker rm -f <container>

# 查看日志
docker logs -f <container>

# 进入容器
docker exec -it <container> sh
```

### 网络管理

```bash
# 创建网络
docker network create todify3-network

# 查看网络
docker network inspect todify3-network

# 删除网络
docker network rm todify3-network
```

### 数据卷管理

```bash
# 创建卷
docker volume create <volume>

# 查看卷
docker volume ls

# 删除卷（⚠️ 会删除数据）
docker volume rm <volume>
```

### 镜像管理

```bash
# 加载镜像
docker load -i <tar-file>

# 导出镜像
docker save -o <tar-file> <image>

# 查看镜像
docker images

# 查看镜像详情
docker image inspect <image>
```

### 数据库操作（PostgreSQL）

```bash
# 连接数据库
docker exec -it todify3-postgres psql -U postgres -d todify3

# 执行 SQL 文件
docker exec todify3-postgres psql -U postgres -d todify3 -f /tmp/file.sql

# 查看表
docker exec todify3-postgres psql -U postgres -d todify3 -c "\dt"
```

---

## 🎯 关键要点总结

1. **容器命名一致性**：所有配置使用容器名 `todify3-*`，不是服务名
2. **端口映射正确性**：`-p 主机端口:容器端口`，注意容器内实际监听端口
3. **网络配置**：所有容器必须在同一 Docker 网络中
4. **密码设置**：直接在命令中指定，避免环境变量问题
5. **平台指定**：构建时始终指定 `--platform linux/amd64`
6. **macOS 清理**：构建前清理 `._*` 文件
7. **Dockerfile 选择**：使用 `Dockerfile.centos7`（单阶段构建，兼容 Docker 1.13.1）

---

## 📞 故障排查流程

1. **查看容器状态**：`docker ps -a`
2. **查看日志**：`docker logs <container>`
3. **检查网络**：`docker network inspect todify3-network`
4. **测试连接**：`docker exec <container> ping <target>`
5. **验证端口**：`docker port <container>` 和 `ss -tlnp`
6. **检查配置**：环境变量、端口映射、网络设置
7. **查看文档**：参考本文档的异常处理部分

---

**文档版本**: v1.0  
**最后更新**: 2025-12-29  
**维护者**: Todify4 项目组



