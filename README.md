# Todify3 - 智能文档生成平台

## 项目简介

Todify3 是一个基于 AI 的智能文档生成平台，支持多种文档类型和工作流配置。

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动后端服务
cd backend
npm install
npm run dev

# 启动前端服务
cd frontend
npm install
npm run dev
```

### 服务器部署

详细部署指南请参考 [部署文档](docs/DEPLOYMENT_STANDARD_GUIDE.md)

## 自动启动配置

项目已配置自动启动机制，服务器重启后服务会自动启动。

### 配置自动启动

```bash
# 在服务器上运行配置脚本
cd /root/todify3
./setup-autostart.sh
```

### 服务管理

```bash
# 使用PM2命令
pm2 list                    # 查看服务状态
pm2 logs                     # 查看日志
pm2 restart todify3-backend  # 重启后端
pm2 restart todify3-frontend # 重启前端

# 使用服务管理脚本
./scripts/start-services.sh start    # 启动服务
./scripts/start-services.sh stop     # 停止服务
./scripts/start-services.sh restart  # 重启服务
./scripts/start-services.sh status   # 查看状态
./scripts/start-services.sh logs     # 查看日志
```

### 测试自动启动

```bash
# 运行测试脚本
./scripts/test-autostart.sh

# 完整测试（需要重启服务器）
reboot
# 重启后检查
pm2 list
```

详细说明请参考 [自动启动指南](docs/AUTOSTART_GUIDE.md)

## 项目结构

```
todify3/
├── backend/          # 后端服务
├── frontend/         # 前端应用
├── scripts/          # 脚本文件
│   ├── start-services.sh    # 服务管理脚本
│   └── test-autostart.sh     # 自动启动测试脚本
├── docs/             # 文档
│   ├── AUTOSTART_GUIDE.md    # 自动启动指南
│   └── DEPLOYMENT_STANDARD_GUIDE.md  # 部署指南
├── setup-autostart.sh # 自动启动配置脚本
└── ecosystem.config.js # PM2配置文件
```

## 服务端口

- **前端**: 2201 (本地开发: 3001)
- **后端**: 2203 (本地开发: 3003)
- **对外访问**: 8089 (通过Nginx代理)

## 相关文档

- [自动启动配置指南](docs/AUTOSTART_GUIDE.md)
- [部署标准指南](docs/DEPLOYMENT_STANDARD_GUIDE.md)
- [故障排查指南](docs/TROUBLESHOOTING_KNOWLEDGE_BASE.md)

## 许可证

MIT
