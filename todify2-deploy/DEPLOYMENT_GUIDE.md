# Todify2 阿里云部署指南

## 部署信息
- **服务器**: 阿里云 ECS
- **IP地址**: 47.113.225.93
- **用户**: root
- **访问地址**: http://47.113.225.93:8088/static/index.html

## 部署步骤

### 1. 上传项目文件到服务器

```bash
# 使用 scp 上传整个项目目录
scp -r /path/to/todify2 root@47.113.225.93:/root/

# 或者使用 rsync 同步文件
rsync -avz --exclude 'node_modules' /path/to/todify2/ root@47.113.225.93:/root/todify2/
```

### 2. 登录服务器

```bash
ssh root@47.113.225.93
```

### 3. 安装 Node.js (如果未安装)

```bash
# 使用 NodeSource 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 4. 进入项目目录并执行部署

```bash
cd /root/todify2
chmod +x deploy.sh
chmod +x init-database.sh

# 执行部署脚本
./deploy.sh
```

### 5. 验证部署

访问以下地址验证部署是否成功：
- **前端页面**: http://47.113.225.93:8088/static/index.html
- **API健康检查**: http://47.113.225.93:8088/api/health

## 项目结构

```
todify2/
├── backend/                 # 后端服务
│   ├── src/                # 源代码
│   ├── data/               # 数据库文件
│   ├── package.json        # 后端依赖
│   └── tsconfig.json       # TypeScript配置
├── frontend/               # 前端应用
│   ├── src/                # 源代码
│   ├── dist/               # 构建输出
│   ├── package.json        # 前端依赖
│   └── vite.config.ts      # Vite配置
├── deploy.sh               # 部署脚本
├── init-database.sh        # 数据库初始化脚本
└── README.md               # 项目说明
```

## 服务管理

### 查看服务状态
```bash
# 查看进程
ps aux | grep node

# 查看端口占用
netstat -tlnp | grep 8088
```

### 查看日志
```bash
# 查看后端日志
tail -f backend.log

# 查看系统日志
journalctl -u todify2 -f
```

### 停止服务
```bash
# 如果使用 PID 文件
kill $(cat backend.pid)

# 或者直接杀死进程
pkill -f "node.*index"
```

### 重启服务
```bash
# 重新运行部署脚本
./deploy.sh
```

## 配置说明

### 端口配置
- **后端服务**: 8088
- **前端访问**: /static/index.html

### 环境变量
创建 `.env` 文件（可选）：
```bash
PORT=8088
NODE_ENV=production
```

### 数据库配置
- **数据库类型**: SQLite
- **数据库文件**: backend/data/database.db
- **自动初始化**: 部署脚本会自动创建数据库文件

## 故障排除

### 1. 端口被占用
```bash
# 查看端口占用
lsof -i :8088

# 杀死占用进程
kill -9 <PID>
```

### 2. 权限问题
```bash
# 设置文件权限
chmod +x deploy.sh
chmod +x init-database.sh
chmod 664 backend/data/database.db
```

### 3. 依赖安装失败
```bash
# 清理缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 4. 前端构建失败
```bash
# 检查 Node.js 版本
node --version

# 重新构建
cd frontend
npm run build
```

## 安全建议

1. **防火墙配置**
   ```bash
   # 开放 8088 端口
   ufw allow 8088
   ```

2. **进程管理**
   - 建议使用 PM2 管理 Node.js 进程
   - 设置自动重启和日志管理

3. **数据备份**
   - 定期备份数据库文件
   - 设置自动备份脚本

## 更新部署

当需要更新代码时：

1. 上传新代码到服务器
2. 运行部署脚本：`./deploy.sh`
3. 验证服务是否正常

## 联系信息

如有问题，请联系开发团队。
