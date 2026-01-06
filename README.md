# Todify4 - 智能文档生成平台

## 项目简介

Todify4 是一个基于 AI 的智能文档生成平台，支持多种文档类型和工作流配置。平台集成了 Dify AI 工作流，提供技术IP挖掘、技术通稿撰写、发布会演讲稿撰写等核心功能。

## 核心功能

- **AI角色管理**: 创建和管理AI对话角色，关联Dify工作流配置
- **Agent工作流**: 基于AI角色进行流程编排，创建智能工作流
- **多窗口对话**: 创建AI对话窗口，支持多窗口并发对话
- **公开页面配置**: 配置公开访问的AI对话页面
- **项目管理**: 项目级的内容管理和来源追踪
- **技术点管理**: 技术知识点的创建、管理和关联

## 快速开始

### 本地开发

```bash
# 使用启动脚本（推荐）
./start.sh

# 或手动启动
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

详细部署指南请参考 [部署文档](guide/docs/DEPLOYMENT_STANDARD_GUIDE.md)

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

详细说明请参考 [自动启动指南](guide/docs/AUTOSTART_GUIDE.md)

## 项目结构

```
todify4/
├── backend/              # 后端服务 (Express + TypeScript)
│   ├── src/             # 源代码
│   │   ├── controllers/ # 控制器层
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # 路由定义
│   │   ├── services/    # 业务逻辑层
│   │   └── modules/     # 功能模块
│   ├── data/            # 数据库文件
│   └── uploads/         # 上传文件存储
├── frontend/            # 前端应用 (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/  # UI组件
│   │   ├── pages/       # 页面组件
│   │   ├── services/    # API服务
│   │   └── features/    # 功能模块
│   └── public/          # 静态资源
├── guide/               # 项目文档
│   ├── docs/           # 使用文档
│   ├── architecture-guide/ # 架构文档
│   ├── database/        # 数据库设计
│   └── workflow/        # 工作流配置
├── scripts/             # 脚本文件
│   ├── start-services.sh    # 服务管理脚本
│   ├── backup-database.sh   # 数据库备份脚本
│   └── check-logs.sh        # 日志检查脚本
├── archive/             # 归档文件
│   ├── development-plans/   # 开发计划文件
│   ├── duplicate-docs/      # 重复文档
│   └── deployment-packages/  # 部署包
├── docker/              # Docker配置
├── deploy/              # 部署相关
└── start.sh             # 本地启动脚本
```

## 服务端口

- **前端**: 2201 (本地开发: 3001)
- **后端**: 2203 (本地开发: 3003)
- **对外访问**: 8089 (通过Nginx代理)

## 相关文档

### 使用文档
- [自动启动配置指南](guide/docs/AUTOSTART_GUIDE.md)
- [部署标准指南](guide/docs/DEPLOYMENT_STANDARD_GUIDE.md)
- [故障排查指南](guide/docs/TROUBLESHOOTING_KNOWLEDGE_BASE.md)
- [API文档](guide/docs/API_DOCUMENTATION.md)

### 架构文档
- [系统架构](guide/architecture-guide/system-architecture.md)
- [数据库设计](guide/database/database-design-v2.md)
- [Agent架构分析](guide/AGENT_ARCHITECTURE_ANALYSIS.md)

### 开发文档
- [项目文件结构](guide/项目文件结构详解.md)
- [工作流配置](guide/workflow/)

## 许可证

MIT
