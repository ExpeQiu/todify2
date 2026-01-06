

# TPD2 项目部署总结与异常处理指南

  

本文档总结了 TPD2 项目通过堡垒机部署到阿里云服务器的完整过程，包括所有遇到的异常问题及解决方案。

  
---

  

## 📋 项目部署架构

  

### 技术栈

- **前端**: React + Vite + Nginx

- **后端**: Node.js + TypeScript + Express

- **数据库**: PostgreSQL 16

- **容器化**: Docker + Docker Compose

- **部署方式**: 离线部署（镜像打包 + 文件传输）

  

### 部署环境

- **本地环境**: macOS

- **目标服务器**: 阿里云 CentOS 7

- **连接方式**: 堡垒机（WindTerm）

  

---

  

## 🚀 完整部署流程

  

### 第一阶段：本地准备

  

#### 1.1 修改前端配置（关键步骤）

  

```bash

cd /Volumes/Lexar/git/03T/TPD2

  

# 修改 nginx 配置：将 backend 改为 tpd2-backend

sed -i '' 's|http://backend:3003|http://tpd2-backend:3003|g' frontend/nginx.conf

  

# 验证修改

grep "proxy_pass" frontend/nginx.conf

# 应该输出：proxy_pass http://tpd2-backend:3003;

```

  

**原因**: Docker Compose 使用服务名（`backend`），但手动启动容器时使用容器名（`tpd2-backend`）

  

#### 1.2 清理 macOS 隐藏文件

  

```bash

# 清理扩展属性文件，避免 Docker 构建错误

find frontend -name "._*" -type f -delete

find backend -name "._*" -type f -delete

```

  

#### 1.3 构建 Docker 镜像

  

```bash

# 使用构建脚本（推荐）

./build-and-export.sh v1.0

  

# 或手动构建

docker build --platform linux/amd64 --no-cache -t tpd2-backend:latest -f backend/Dockerfile backend

docker build --platform linux/amd64 --no-cache -t tpd2-frontend:latest -f frontend/Dockerfile frontend

docker pull --platform linux/amd64 postgres:16-alpine

  

# 打标签

docker tag tpd2-backend:latest tpd2-backend:v1.0

docker tag tpd2-frontend:latest tpd2-frontend:v1.0

docker tag postgres:16-alpine tpd2-postgres:v1.0

  

# 导出合并包

docker save -o tpd2-all-v1.0.tar \

tpd2-backend:v1.0 \

tpd2-frontend:v1.0 \

tpd2-postgres:v1.0

```

  

#### 1.4 导出本地数据

  

```bash

# 导出 SQLite 数据为 PostgreSQL 格式

cd backend

DB_TYPE=sqlite SQLITE_DB_PATH=./data/todify2.db npx ts-node export-sqlite-to-postgres.ts

cd ..

  

# 创建最新导入文件链接

LATEST_SQL=$(ls -t exports/sqlite-to-postgres-*.sql | head -1)

ln -sf "$(basename "$LATEST_SQL")" exports/latest-import.sql

```

  

### 第二阶段：文件上传

  

通过 WindTerm 上传到服务器 `/root/` 目录：

- `tpd2-all-v1.0.tar`（或分别上传三个镜像）

- `sqlite-to-postgres-*.sql`（数据文件）

  

### 第三阶段：服务器部署

  

#### 3.1 清理旧部署

  

```bash

# 停止并删除容器

docker stop tpd2-frontend tpd2-backend tpd2-postgres

docker rm tpd2-frontend tpd2-backend tpd2-postgres

  

# 删除网络（可选）

docker network rm tpd2-network

  

# 清理悬空镜像

docker image prune -f

```

  

#### 3.2 加载镜像

  

```bash

# 加载镜像包

docker load -i /root/tpd2-all-v1.0.tar

  

# 验证镜像

docker images | grep tpd2

```

  

#### 3.3 创建网络和数据卷

  

```bash

# 创建网络

docker network create tpd2-network

  

# 创建数据卷

docker volume create postgres_data

docker volume create backend_uploads

docker volume create backend_data

docker volume create backend_logs

```

  

#### 3.4 启动 PostgreSQL

  

```bash

# 设置密码（请使用强密码）

export PG_PASSWORD="your_strong_password_here"

  

# 启动 PostgreSQL

docker run -d \

--name tpd2-postgres \

--network tpd2-network \

--restart unless-stopped \

-e POSTGRES_USER=postgres \

-e POSTGRES_PASSWORD="${PG_PASSWORD}" \

-e POSTGRES_DB=todify2 \

-e PGDATA=/var/lib/postgresql/data/pgdata \

-v postgres_data:/var/lib/postgresql/data \

-p 5432:5432 \

tpd2-postgres:v1.0

  

# 等待启动

sleep 10

  

# 验证

docker exec tpd2-postgres pg_isready -U postgres

```

  

#### 3.5 启动后端服务

  

```bash

# 设置 JWT 密钥

export JWT_SECRET="your_jwt_secret_key_change_in_production"

  

# 启动后端（注意端口映射：8000:3003）

docker run -d \

--name tpd2-backend \

--network tpd2-network \

--restart unless-stopped \

-e NODE_ENV=production \

-e PORT=3003 \

-e DB_TYPE=postgresql \

-e PG_HOST=tpd2-postgres \

-e PG_PORT=5432 \

-e PG_USER=postgres \

-e PG_PASSWORD="${PG_PASSWORD}" \

-e PG_DATABASE=todify2 \

-e AUTO_INIT_DB=true \

-e AUTO_IMPORT_DATA=false \

-e JWT_SECRET="${JWT_SECRET}" \

-v backend_uploads:/app/uploads \

-v backend_data:/app/data \

-v backend_logs:/app/logs \

-p 8000:3003 \

tpd2-backend:v1.0

  

# 等待启动

sleep 30

  

# 验证

curl http://localhost:8000/health

```

  

**关键点**：

- 端口映射：`-p 8000:3003`（主机8000 → 容器3003）

- 容器名：`tpd2-backend`（不是 `backend`）

- 数据库主机：`tpd2-postgres`（不是 `postgres`）

  

#### 3.6 导入数据

  

```bash

# 复制 SQL 文件到容器

docker cp /root/sqlite-to-postgres-*.sql tpd2-postgres:/tmp/import-data.sql

  

# 导入数据

docker exec tpd2-postgres psql -U postgres -d todify2 -f /tmp/import-data.sql 2>&1 | \

grep -v 'violates foreign key constraint' | \

grep -v 'already exists' | \

tail -30

  

# 验证数据

docker exec tpd2-postgres psql -U postgres -d todify2 -c "\dt"

```

  

#### 3.7 启动前端服务

  

```bash

# 启动前端

docker run -d \

--name tpd2-frontend \

--network tpd2-network \

--restart unless-stopped \

-p 80:80 \

tpd2-frontend:v1.0

  

# 验证

docker logs --tail 10 tpd2-frontend

curl -I http://localhost

```

  

---

  

## ⚠️ 异常问题与解决方案

  

### 异常 1：Docker 容器删除卡住

  

**现象**：

```bash

Error response from daemon: removal of container tpd2-frontend is already in progress

```

  

**原因**：容器删除进程卡住或状态异常

  

**解决方案**：

```bash

# 方法 1：重启 Docker 服务

systemctl restart docker

  

# 方法 2：等待后重试

sleep 5

docker rm -f tpd2-frontend tpd2-postgres

  

# 方法 3：清理所有停止的容器

docker container prune -f

```

  

---

  

### 异常 2：前端容器持续重启

  

**现象**：

```bash

docker ps

# tpd2-frontend: Restarting (1) 3 seconds ago

```

  

**原因**：nginx 配置中使用了 `backend` 主机名，但容器名是 `tpd2-backend`

  

**解决方案**：

1. 在本地修改 `frontend/nginx.conf`：

```bash

sed -i '' 's|http://backend:3003|http://tpd2-backend:3003|g' frontend/nginx.conf

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

--name tpd2-postgres \

-e POSTGRES_PASSWORD=postgres123456 \

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

1. `PG_HOST` 环境变量错误（使用了 `postgres` 而不是 `tpd2-postgres`）

2. 容器不在同一网络

3. PostgreSQL 容器未启动

  

**解决方案**：

```bash

# 1. 检查网络

docker network inspect tpd2-network

  

# 2. 检查容器是否在同一网络

docker inspect tpd2-backend | grep -A 10 "Networks"

docker inspect tpd2-postgres | grep -A 10 "Networks"

  

# 3. 确保使用正确的容器名

-e PG_HOST=tpd2-postgres # 不是 postgres

  

# 4. 测试网络连通性

docker exec tpd2-backend ping -c 2 tpd2-postgres

```

  

---

  

### 异常 5：端口映射错误

  

**现象**：

```bash

curl http://localhost:8000/health

# curl: (56) Recv failure: Connection reset by peer

```

  

**原因**：端口映射不匹配

- 容器内应用监听 3003 端口

- 但映射为 `-p 8000:8000`（错误）

  

**解决方案**：

```bash

# 正确的端口映射

-p 8000:3003 # 主机8000 → 容器3003

  

# 验证端口映射

docker port tpd2-backend

# 应该输出：8000/tcp -> 0.0.0.0:8000

  

# 验证容器内监听

docker exec tpd2-backend netstat -tlnp | grep 3003

```

  

---

  

### 异常 6：数据库初始化错误

  

**现象**：

```bash

❌ 执行SQL失败: error: relation "tech_points" does not exist

```

  

**原因**：数据库表创建顺序问题，依赖表未创建

  

**解决方案**：

```bash

# 方法 1：设置 AUTO_INIT_DB=false，手动初始化

-e AUTO_INIT_DB=false

  

# 然后手动执行初始化

docker exec tpd2-backend node dist/config/init-db.js

  

# 方法 2：忽略初始化错误（如果表已存在）

# 这些错误通常是正常的，因为表可能已存在

```

  

**注意**：如果看到 "✅ 数据库迁移完成" 和 "🚀 TPD2 Backend Server is running"，说明服务已正常启动，初始化错误可以忽略

  

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

  

# 在 .dockerignore 中添加排除规则

echo "._*" >> frontend/.dockerignore

echo ".DS_Store" >> frontend/.dockerignore

```

  

---

  

### 异常 8：SQL 参数绑定错误

  

**现象**：

```bash

ERROR: bind message supplies 2 parameters, but prepared statement "" requires 1

```

  

**原因**：PostgreSQL 中同一个参数可以重复使用，但代码传入了多个参数

  

**解决方案**：

- 代码已修复：`backend/src/models/promotion/Technology.ts` 中正确处理了参数

- 如果仍有问题，需要重新构建后端镜像

  

---

  

### 异常 9：前端无法访问后端 API

  

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

docker exec tpd2-frontend cat /etc/nginx/conf.d/default.conf | grep backend

  

# 2. 测试容器间网络

docker exec tpd2-frontend ping -c 2 tpd2-backend

  

# 3. 检查后端服务

curl http://localhost:8000/health

  

# 4. 查看前端日志

docker logs tpd2-frontend | tail -20

```

  

---

  

## 📝 最佳实践

  

### 1. 配置管理

  

**环境变量设置**：

- 在命令中直接指定密码，避免环境变量传递问题

- 使用强密码和密钥

- 生产环境不要使用默认值

  

**容器命名**：

- 使用一致的命名规则：`tpd2-{service}`

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

- 使用命名卷持久化数据

- 定期备份数据卷

- 删除容器前确认数据已备份

  

**数据导入**：

- 先初始化数据库结构

- 再导入数据

- 过滤外键约束错误（正常现象）

  

### 4. 镜像构建

  

**平台指定**：

- 始终使用 `--platform linux/amd64`

- 避免架构不匹配问题

  

**清理构建**：

- 使用 `--no-cache` 避免缓存问题

- 清理 macOS 隐藏文件

- 验证镜像架构

  

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

docker network inspect <network>

  

# 端口监听

ss -tlnp | grep <port>

```

  

**连接测试**：

```bash

# 容器间网络

docker exec <container1> ping -c 2 <container2>

  

# 服务健康检查

curl http://localhost:<port>/health

```

  

---

  

## 🔄 快速部署检查清单

  

### 本地准备

- [ ] 修改前端 nginx 配置（backend → tpd2-backend）

- [ ] 清理 macOS 隐藏文件

- [ ] 构建 Docker 镜像（指定平台 linux/amd64）

- [ ] 导出镜像为 tar 包

- [ ] 导出本地数据为 SQL 文件

  

### 文件上传

- [ ] 通过 WindTerm 上传镜像包

- [ ] 上传数据 SQL 文件

  

### 服务器部署

- [ ] 清理旧部署

- [ ] 加载镜像

- [ ] 创建网络和数据卷

- [ ] 启动 PostgreSQL（设置密码）

- [ ] 启动后端（注意端口映射和容器名）

- [ ] 导入数据

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

```

  

### 网络管理

```bash

# 创建网络

docker network create <network>

  

# 查看网络

docker network inspect <network>

  

# 删除网络

docker network rm <network>

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

```

  

### 数据库操作

```bash

# 连接数据库

docker exec -it tpd2-postgres psql -U postgres -d todify2

  

# 执行 SQL 文件

docker exec tpd2-postgres psql -U postgres -d todify2 -f /tmp/file.sql

  

# 查看表

docker exec tpd2-postgres psql -U postgres -d todify2 -c "\dt"

```

  

---

  

## 🎯 关键要点总结

  

1. **容器命名一致性**：所有配置使用容器名 `tpd2-*`，不是服务名

2. **端口映射正确性**：`-p 主机端口:容器端口`，注意容器内实际监听端口

3. **网络配置**：所有容器必须在同一 Docker 网络中

4. **密码设置**：直接在命令中指定，避免环境变量问题

5. **平台指定**：构建时始终指定 `--platform linux/amd64`

6. **macOS 清理**：构建前清理 `._*` 文件

7. **数据导入**：先初始化结构，再导入数据，过滤正常错误

  

---

  

## 📞 故障排查流程

  

1. **查看容器状态**：`docker ps -a`

2. **查看日志**：`docker logs <container>`

3. **检查网络**：`docker network inspect <network>`

4. **测试连接**：`docker exec <container> ping <target>`

5. **验证端口**：`docker port <container>` 和 `ss -tlnp`

6. **检查配置**：环境变量、端口映射、网络设置

7. **查看文档**：参考本文档的异常处理部分

  

---

  

**文档版本**: v1.0

**最后更新**: 2025-12-28

**维护者**: TPD2 项目组