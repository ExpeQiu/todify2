# 🚀 Todify2

一个现代化的全栈 Web 应用程序，基于 React + TypeScript + Node.js + Express 构建。

## ✨ 特性

- 🎨 **现代化 UI**: 基于 React 18 + TypeScript + Tailwind CSS
- ⚡ **高性能**: Vite 构建工具，快速开发体验
- 🔧 **RESTful API**: Express.js 后端，支持 CORS
- 💾 **数据持久化**: SQLite3 数据库支持
- 📱 **响应式设计**: 适配各种设备屏幕
- 🔒 **类型安全**: 全面的 TypeScript 支持

## 🏗️ 项目结构

```
todify2/
├── frontend/          # React 前端应用
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── pages/        # 页面组件
│   │   ├── hooks/        # 自定义 Hooks
│   │   ├── services/     # API 服务
│   │   ├── types/        # TypeScript 类型定义
│   │   └── styles/       # 样式文件
│   ├── public/           # 静态资源
│   └── dist/            # 构建输出
├── backend/           # Node.js 后端应用
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # 路由定义
│   │   ├── services/    # 业务逻辑
│   │   ├── utils/       # 工具函数
│   │   └── types/       # 类型定义
│   └── data/           # 数据库文件
├── guide/             # 项目文档
├── archive/           # 归档文件
├── start.sh          # Linux/macOS 启动脚本
├── start.bat         # Windows 启动脚本
└── DEPLOYMENT.md     # 部署指南
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 一键启动（推荐）

**Linux/macOS:**
```bash
git clone <repository-url>
cd todify2
./start.sh
```

**Windows:**
```cmd
git clone <repository-url>
cd todify2
start.bat
```

### 手动启动

1. **克隆项目**
```bash
git clone <repository-url>
cd todify2
```

2. **安装依赖**
```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

3. **启动开发服务器**
```bash
# 启动后端 (终端1)
cd backend
npm run dev

# 启动前端 (终端2)
cd frontend
npm run dev
```

4. **访问应用**
- 前端: http://localhost:5173
- 后端API: http://localhost:3000

## 🛠️ 开发指南

### 技术栈

**前端:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React (图标)

**后端:**
- Node.js
- Express.js
- TypeScript
- SQLite3
- CORS
- dotenv

### 开发命令

**前端:**
```bash
cd frontend
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
npm run lint     # 代码检查
```

**后端:**
```bash
cd backend
npm run dev      # 启动开发服务器 (热重载)
npm start        # 启动生产服务器
```

### 代码规范

- 使用 ESLint 进行代码检查
- 使用 TypeScript 严格模式
- 遵循 React Hooks 最佳实践
- 使用函数式组件

## 📦 构建部署

### 生产构建

```bash
# 构建前端
cd frontend
npm run build

# 后端无需构建，直接使用 TypeScript 运行时编译
```

### 部署选项

1. **传统服务器部署** - 参考 [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Docker 部署** - 使用提供的 Docker 配置
3. **云服务部署** - 支持 Vercel、Railway、Render 等

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📁 项目文件说明

### 核心文件
- `start.sh` / `start.bat` - 一键启动脚本
- `DEPLOYMENT.md` - 详细部署指南
- `package.json` - 根目录依赖配置

### 归档文件
- `archive/` - 已归档的非必要文件
  - `legacy-files/` - 旧版本文件
  - `root-node-modules/` - 根目录依赖（已移除）

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持

如果您遇到问题或有疑问：

1. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 部署指南
2. 检查 [Issues](../../issues) 中的已知问题
3. 创建新的 [Issue](../../issues/new) 报告问题

## 📊 项目状态

- ✅ 基础架构完成
- ✅ 前后端分离
- ✅ 开发环境配置
- ✅ 构建部署流程
- 🔄 功能开发中...

---

**开发团队**: Todify2 Team  
**最后更新**: 2024年1月