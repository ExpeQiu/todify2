# Todify3 部署说明

## 部署配置

- **服务名**: todify3
- **对外端口**: 8089 (通过 Nginx 反向代理)
- **前端本地端口**: 2201
- **后端本地端口**: 2203 (使用 PM2 管理)
- **服务器**: 47.113.225.93

## 快速部署

### 完整部署（首次部署或更新代码）

运行完整部署脚本，会自动完成以下操作：
1. 构建前端
2. 上传项目文件到服务器
3. 同步数据库和配置文件
4. 安装依赖
5. 配置 PM2 启动后端服务
6. 配置前端服务
7. 配置 Nginx 反向代理

```bash
cd /Volumes/Lexar/git/03T/todify3
./scripts/deploy-todify3.sh
```

### 仅同步数据库（不重新部署代码）

如果只需要同步本地数据库到云端，可以使用数据库同步脚本：

```bash
cd /Volumes/Lexar/git/03T/todify3
./scripts/sync-database-to-cloud.sh
```

此脚本会：
1. 备份云端现有数据库
2. 同步本地数据库文件到云端
3. 同步 .env 配置文件
4. 同步上传文件目录
5. 可选：重启服务以应用更改

## 服务管理

### 查看服务状态

```bash
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'pm2 status'
```

### 查看服务日志

```bash
# 后端日志
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'pm2 logs todify3-backend'

# 前端日志
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'pm2 logs todify3-frontend'
```

### 重启服务

```bash
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'pm2 restart todify3-backend todify3-frontend'
```

### 停止服务

```bash
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'pm2 stop todify3-backend todify3-frontend'
```

### 查看 Nginx 状态

```bash
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'systemctl status nginx'
```

### 重载 Nginx 配置

```bash
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'nginx -t && systemctl reload nginx'
```

## 访问地址

- **前端访问**: http://47.113.225.93:8089
- **API 健康检查**: http://47.113.225.93:8089/api/health
- **Metrics 端点**: http://47.113.225.93:8089/metrics

## 注意事项

1. **不影响现有服务**: 部署脚本只会操作 `todify3` 相关的服务，不会影响其他正在运行的服务。

2. **数据库备份**: 每次同步数据库前，脚本会自动备份云端现有数据库到 `backend/data/backup/` 目录。

3. **端口冲突**: 确保服务器上的端口 2201、2203 和 8089 没有被其他服务占用。

4. **环境变量**: 部署脚本会自动更新 `.env` 文件中的端口配置为 2203，并设置 `NODE_ENV=production`。

5. **PM2 开机自启**: 部署脚本会自动配置 PM2 开机自启，确保服务在服务器重启后自动启动。

## 故障排查

### 服务无法启动

1. 检查端口是否被占用：
```bash
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'netstat -tlnp | grep -E ":2201|:2203|:8089"'
```

2. 查看 PM2 日志：
```bash
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'pm2 logs todify3-backend --lines 50'
```

3. 检查数据库连接：
```bash
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'ls -lh /root/todify3/backend/data/'
```

### Nginx 配置问题

1. 测试 Nginx 配置：
```bash
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'nginx -t'
```

2. 查看 Nginx 错误日志：
```bash
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'tail -f /var/log/nginx/error.log'
```

### 数据库同步问题

1. 检查本地数据库文件是否存在：
```bash
ls -lh backend/data/*.db
```

2. 检查云端数据库文件：
```bash
sshpass -p 'Qb89100820' ssh -o StrictHostKeyChecking=no root@47.113.225.93 'ls -lh /root/todify3/backend/data/'
```

## 文件结构

部署后的服务器文件结构：

```
/root/todify3/
├── backend/
│   ├── data/
│   │   ├── todify3.db          # 数据库文件
│   │   └── backup/              # 数据库备份目录
│   ├── uploads/                 # 上传文件目录
│   ├── .env                     # 环境变量配置
│   ├── dist/                    # 编译后的后端代码（如果构建成功）
│   └── ...
├── frontend/
│   └── dist/                    # 前端构建产物
├── logs/                        # PM2 日志目录
└── ecosystem.config.js          # PM2 配置文件
```

## 更新部署

如果需要更新代码：

1. 在本地修改代码
2. 运行完整部署脚本：`./scripts/deploy-todify3.sh`
3. 脚本会自动停止旧服务、上传新代码、重启服务

如果需要只更新数据库：

1. 在本地更新数据库
2. 运行数据库同步脚本：`./scripts/sync-database-to-cloud.sh`
3. 选择是否重启服务

