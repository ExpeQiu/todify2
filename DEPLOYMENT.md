# Todify2 部署指南

## 📋 目录
- [环境要求](#环境要求)
- [本地开发环境](#本地开发环境)
- [生产环境部署](#生产环境部署)
- [Docker 部署](#docker-部署)
- [云服务部署](#云服务部署)
- [常见问题](#常见问题)

## 🔧 环境要求

### 基础环境
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **数据库**: SQLite3 (开发) / PostgreSQL (生产推荐)

### 系统要求
- **内存**: 最少 2GB RAM
- **存储**: 最少 1GB 可用空间
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

## 🚀 本地开发环境

### 快速启动

#### 方法一：使用启动脚本（推荐）

**Linux/macOS:**
```bash
# 克隆项目
git clone <repository-url>
cd todify2

# 运行启动脚本
./start.sh
```

**Windows:**
```cmd
# 克隆项目
git clone <repository-url>
cd todify2

# 运行启动脚本
start.bat
```

#### 方法二：手动启动

1. **安装依赖**
```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

2. **配置环境变量**
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
```

3. **启动服务**
```bash
# 启动后端 (终端1)
cd backend
npm run dev

# 启动前端 (终端2)
cd frontend
npm run dev
```

### 访问地址
- **前端**: http://localhost:5173
- **后端API**: http://localhost:3000

## 🌐 生产环境部署

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2 (进程管理器)
sudo npm install -g pm2

# 安装 Nginx (可选，用于反向代理)
sudo apt install nginx -y
```

### 2. 项目部署

```bash
# 克隆项目
git clone <repository-url>
cd todify2

# 安装依赖
cd backend && npm install --production
cd ../frontend && npm install

# 构建前端
npm run build
```

### 3. 环境配置

创建生产环境配置文件：

```bash
# backend/.env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/todify2
CORS_ORIGIN=https://yourdomain.com
```

### 4. 使用 PM2 启动

```bash
# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'todify2-backend',
    script: './backend/src/index.ts',
    interpreter: 'node',
    interpreter_args: '-r ts-node/register',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster'
  }]
}
EOF

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Nginx 配置（可选）

```nginx
# /etc/nginx/sites-available/todify2
server {
    listen 80;
    server_name yourdomain.com;

    # 前端静态文件
    location / {
        root /path/to/todify2/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/todify2 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🐳 Docker 部署

### 1. 创建 Dockerfile

**后端 Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**前端 Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/todify2
    depends_on:
      - db
    volumes:
      - ./backend/data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=todify2
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 3. 启动 Docker 服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## ☁️ 云服务部署

### Vercel (前端)

1. **连接 GitHub 仓库**
2. **配置构建设置**:
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
3. **环境变量**:
   - `VITE_API_URL`: 后端 API 地址

### Railway/Render (后端)

1. **连接 GitHub 仓库**
2. **配置构建设置**:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
3. **环境变量**:
   - `NODE_ENV`: production
   - `DATABASE_URL`: 数据库连接字符串

### AWS/阿里云 (完整部署)

参考各云服务商的 Node.js 应用部署文档。

## 🔍 常见问题

### Q: 端口被占用怎么办？
```bash
# 查看端口占用
lsof -i :3000
lsof -i :5173

# 杀死进程
kill -9 <PID>
```

### Q: 数据库连接失败？
1. 检查数据库服务是否启动
2. 验证连接字符串格式
3. 确认防火墙设置

### Q: 前端无法访问后端 API？
1. 检查 CORS 配置
2. 验证 API 地址配置
3. 确认后端服务正常运行

### Q: PM2 进程异常退出？
```bash
# 查看日志
pm2 logs todify2-backend

# 重启应用
pm2 restart todify2-backend

# 查看进程状态
pm2 status
```

### Q: 构建失败？
1. 清理缓存: `npm cache clean --force`
2. 删除 node_modules: `rm -rf node_modules && npm install`
3. 检查 Node.js 版本兼容性

## 📞 技术支持

如遇到部署问题，请：
1. 查看相关日志文件
2. 检查环境配置
3. 参考项目文档
4. 提交 Issue 到项目仓库

---

**最后更新**: 2024年1月
**维护者**: Todify2 开发团队