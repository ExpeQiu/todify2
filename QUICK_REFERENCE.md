# Todify2 快速参考指南

## 🚀 快速开始

### 启动服务
```bash
# 启动后端（3000端口）
cd backend && npm start

# 启动前端（3001端口）
cd frontend && npm run dev
```

### 访问地址
- 前端界面：http://localhost:3001
- 后端API：http://localhost:3000
- 统一管理：http://localhost:3001/ai-management

## 📋 核心功能路径

| 功能 | 路径 | 说明 |
|------|------|------|
| 🏠 首页 | `/` | 工作流页面 |
| ✨ AI管理 | `/ai-management` | 统一入口 |
| 🤖 AI角色 | `/ai-roles` | 角色管理 |
| 🔄 工作流 | `/agent-workflow` | 流程编排 |
| 💬 多窗口对话 | `/ai-chat-multi` | 测试对话 |
| 🔗 公开页面 | `/public-page-configs` | 配置管理 |

## 🎯 四层架构

```
AI-Roles (基础层)
    ↓
Agent Workflow (编排层)
    ↓
Multi-Chat (应用层)
    ↓
Public Page (发布层)
```

## 🔧 常用操作

### 1️⃣ 创建AI角色
```
路径：/ai-roles
操作：点击"创建角色" → 填写信息 → 关联Dify工作流 → 启用
```

### 2️⃣ 设计工作流
```
路径：/agent-workflow
操作：点击"创建工作流" → 拖拽节点 → 配置连接 → 保存
```

### 3️⃣ 测试对话
```
路径：/ai-chat-multi
操作：选择配置模式 → 添加对话窗口 → 发送消息 → 执行测试
```

### 4️⃣ 公开发布
```
路径：/public-page-configs
操作：创建配置 → 设置显示模式 → 生成链接 → 分享访问
```

## 📊 数据库表

| 表名 | 用途 | 主键 |
|------|------|------|
| `ai_roles` | AI角色配置 | id |
| `agent_workflows` | 工作流定义 | id |
| `workflow_executions` | 执行记录 | id |
| `workflow_templates` | 流程模板 | id |
| `public_page_configs` | 公开配置 | id |

## 🔗 API接口

### AI角色
- `GET /api/v1/ai-roles` - 获取所有角色
- `POST /api/v1/ai-roles` - 创建角色
- `PUT /api/v1/ai-roles/:id` - 更新角色
- `DELETE /api/v1/ai-roles/:id` - 删除角色

### 工作流
- `GET /api/v1/agent-workflows` - 获取所有工作流
- `POST /api/v1/agent-workflows` - 创建工作流
- `PUT /api/v1/agent-workflows/:id` - 更新工作流
- `POST /api/v1/agent-workflows/:id/execute` - 执行工作流

### 公开配置
- `GET /api/v1/public-config/:configId` - 获取配置
- `GET /api/v1/public-page-configs` - 获取所有配置
- `POST /api/v1/public-page-configs` - 创建配置

## 🎨 组件架构

```
App.tsx
├── TopNavigation (顶部导航)
├── Routes
│   ├── /ai-management → AIUnifiedManagementPage
│   ├── /ai-roles → AIRoleManagementPage
│   ├── /agent-workflow → AgentWorkflowPage
│   ├── /ai-chat-multi → MultiChatContainer
│   └── /public-page-configs → PublicPageConfigManagementPage
└── MultiChatContainer
    ├── WorkflowExecutionView (执行视图)
    └── ChatWindow (对话窗口)
```

## 📝 配置文件

| 文件 | 用途 |
|------|------|
| `backend/src/config/database.ts` | 数据库配置 |
| `frontend/src/config/workflowNodes.ts` | 节点配置 |
| `.env` | 环境变量 |

## 🛠️ 开发工具

### 构建
```bash
frontend: npm run build
backend: npm run build
```

### 类型检查
```bash
frontend: npx tsc --noEmit
backend: npx tsc --noEmit
```

### 数据库
```bash
位置：backend/data/todify2.db
查看：sqlite3 backend/data/todify2.db
```

## 🐛 故障排查

### 后端无法启动
```bash
检查端口占用：lsof -i :3000
检查依赖：cd backend && npm install
```

### 前端编译错误
```bash
清除缓存：rm -rf node_modules/.vite
重新安装：npm install
```

### 数据库错误
```bash
检查表结构：sqlite3 backend/data/todify2.db ".schema"
初始化数据：node backend/src/scripts/init-independent-page-roles.ts
```

## 📚 相关文档

- `PROJECT_COMPLETION_SUMMARY.md` - 项目完成总结
- `FINAL_ARCHITECTURE_VISUAL.md` - 架构可视化
- `NAVIGATION_CLEANUP_SUMMARY.md` - 导航优化
- `FOUR_LAYER_ARCHITECTURE_IMPLEMENTATION.md` - 架构实施

## ⚡ 快捷方式

### 键盘
- `⌘+K` / `Ctrl+K` - 搜索功能
- `⌘+R` / `Ctrl+R` - 刷新页面
- `Esc` - 关闭弹窗

### 链接
- 直接访问：在URL输入配置ID
- 预览模式：添加`?preview=true`
- 调试模式：添加`?debug=true`

## 🔐 安全提醒

- ✅ 定期备份数据库
- ✅ 检查配置文件权限
- ✅ 监控API访问日志
- ✅ 及时更新依赖

## 📞 支持

### 日志查看
```bash
后端日志：backend/logs/
前端日志：浏览器Console
```

### 常见问题
查看 `guide/TROUBLESHOOTING_KNOWLEDGE_BASE.md`

---

**🎉 祝您使用愉快！**

