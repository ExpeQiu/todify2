# Todify2 部署检查清单

## 部署前检查 ✅

- [ ] 确认服务器信息：47.113.225.93
- [ ] 确认用户权限：root
- [ ] 确认端口：8088
- [ ] 确认访问地址：http://47.113.225.93:8088/static/index.html

## 文件准备 ✅

- [x] 修改前端配置 (vite.config.ts)
- [x] 修改后端配置 (index.ts)
- [x] 创建部署脚本 (deploy.sh)
- [x] 创建数据库初始化脚本 (init-database.sh)
- [x] 创建部署指南 (DEPLOYMENT_GUIDE.md)
- [x] 创建部署包准备脚本 (prepare-deploy.sh)
- [x] 创建生产环境配置 (production.env)

## 部署步骤

### 1. 本地准备
```bash
# 运行部署包准备脚本
./prepare-deploy.sh
```

### 2. 上传到服务器
```bash
# 上传部署包
scp -r todify2-deploy root@47.113.225.93:/root/
```

### 3. 服务器部署
```bash
# 登录服务器
ssh root@47.113.225.93

# 进入项目目录
cd /root/todify2-deploy

# 执行部署
./deploy.sh
```

### 4. 验证部署
- [ ] 访问 http://47.113.225.93:8088/api/health
- [ ] 访问 http://47.113.225.93:8088/static/index.html
- [ ] 检查服务日志
- [ ] 测试主要功能

## 配置说明

### 端口配置
- 后端服务：8088
- 前端静态文件：/static/
- API 接口：/api/v1/

### 文件结构
```
todify2-deploy/
├── backend/           # 后端服务
├── frontend/          # 前端应用
├── deploy.sh          # 部署脚本
├── init-database.sh   # 数据库初始化
├── production.env     # 生产环境配置
└── DEPLOYMENT_GUIDE.md # 部署指南
```

## 故障排除

### 常见问题
1. **端口被占用**：检查并杀死占用进程
2. **权限问题**：设置正确的文件权限
3. **依赖安装失败**：清理缓存重新安装
4. **前端构建失败**：检查 Node.js 版本

### 日志查看
```bash
# 查看服务日志
tail -f backend.log

# 查看系统日志
journalctl -u todify2 -f
```

## 服务管理

### 启动服务
```bash
./deploy.sh
```

### 停止服务
```bash
kill $(cat backend.pid)
# 或
pkill -f "node.*index"
```

### 重启服务
```bash
./deploy.sh
```

## 完成确认

- [ ] 服务正常启动
- [ ] 前端页面可访问
- [ ] API 接口正常响应
- [ ] 数据库连接正常
- [ ] 日志输出正常

## 联系信息

如有问题，请参考 DEPLOYMENT_GUIDE.md 或联系开发团队。
