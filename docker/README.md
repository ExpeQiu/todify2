# Todify4 Docker 部署指南

## 概述

本项目支持使用 Docker 和 Docker Compose 进行容器化部署。

## 端口配置

- **对外端口**: 8118 (Nginx 反向代理)
- **前端端口**: 8111 (容器内部 80)
- **后端端口**: 8113

## 快速开始

### 本地部署

1. 确保已安装 Docker 和 Docker Compose
2. 进入 `docker` 目录
3. 配置环境变量（复制 `.env.example` 到 `.env` 并修改）
4. 运行部署脚本：

```bash
cd docker
../deploy/docker/docker-deploy.sh
```

### 远程部署到阿里云

使用 Docker 部署脚本：

```bash
./deploy/deploy-todify4-docker.sh
```

该脚本会：
1. 构建前端
2. 构建 Docker 镜像
3. 上传文件到服务器
4. 在服务器上启动 Docker 服务

## 服务管理

### 查看服务状态

```bash
cd /root/todify4/docker
docker compose ps
```

### 查看日志

```bash
# 所有服务日志
docker compose logs -f

# 特定服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

### 重启服务

```bash
docker compose restart
```

### 停止服务

```bash
docker compose down
```

### 更新服务

```bash
# 停止服务
docker compose down

# 重新构建镜像
docker compose build

# 启动服务
docker compose up -d
```

## 目录结构

```
/root/todify4/
├── docker/
│   ├── docker-compose.yml    # Docker Compose 配置
│   ├── nginx.conf            # Nginx 反向代理配置
│   └── README.md             # 本文档
├── backend/
│   ├── data/                 # 数据库文件（挂载）
│   ├── uploads/              # 上传文件（挂载）
│   └── .env                  # 环境变量配置
└── frontend/
    └── dist/                 # 前端构建产物
```

## 环境变量

主要环境变量配置在 `backend/.env` 文件中：

- `PORT`: 后端服务端口（默认 8113）
- `NODE_ENV`: 运行环境（production）
- `DB_TYPE`: 数据库类型（sqlite/postgres）
- `SQLITE_DB_PATH`: SQLite 数据库路径
- `DIFY_BASE_URL`: Dify API 地址
- `AI_SEARCH_API_KEY`: AI 搜索 API Key
- 等等...

## 数据持久化

以下目录通过 Docker volumes 挂载，数据会持久化：

- `backend/data/`: 数据库文件
- `backend/uploads/`: 上传的文件

## 健康检查

所有服务都配置了健康检查：

- **后端**: `http://localhost:8113/api/health`
- **前端**: `http://localhost/`
- **Nginx**: `http://localhost/`

## 故障排查

### 服务无法启动

1. 检查 Docker 日志：
   ```bash
   docker compose logs
   ```

2. 检查端口占用：
   ```bash
   netstat -tlnp | grep -E "8118|8111|8113"
   ```

3. 检查环境变量配置是否正确

### 数据库连接问题

1. 检查数据库文件权限
2. 检查 `SQLITE_DB_PATH` 配置
3. 查看后端容器日志

### 前端无法访问后端 API

1. 检查 Nginx 配置
2. 检查后端服务是否正常运行
3. 检查网络连接（`todify4-network`）

## 备份和恢复

### 备份数据库

```bash
# 在服务器上执行
cd /root/todify4/backend
cp -r data/ data-backup-$(date +%Y%m%d)/
```

### 恢复数据库

```bash
# 停止服务
docker compose down

# 恢复数据库文件
cp -r data-backup-YYYYMMDD/* data/

# 启动服务
docker compose up -d
```

## 性能优化

1. **使用多阶段构建**：减少镜像大小
2. **健康检查**：自动重启不健康的容器
3. **资源限制**：可以在 `docker-compose.yml` 中添加资源限制
4. **日志管理**：配置日志轮转避免磁盘满

## 安全建议

1. 不要在 `.env` 文件中提交敏感信息到 Git
2. 定期更新 Docker 镜像和依赖
3. 配置防火墙规则限制端口访问
4. 使用 HTTPS（需要配置 SSL 证书）
