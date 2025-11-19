# Todify3 部署问题解决知识库

## 🚨 紧急问题快速解决

### 1. 服务无法启动

#### 问题现象
- 端口无法监听
- 进程启动失败
- 服务无响应

#### 快速诊断
```bash
# 检查端口占用
lsof -i :3001
lsof -i :3003
lsof -i :8088

# 检查进程状态
ps aux | grep node
ps aux | grep nginx

# 检查日志
tail -f /root/todify2-deploy/backend/backend.log
tail -f /root/todify2-deploy/frontend/frontend.log
```

#### 解决方案
1. **端口冲突**: 杀死占用进程或更换端口
2. **权限问题**: 检查文件权限和用户权限
3. **依赖缺失**: 重新安装npm依赖
4. **配置错误**: 检查.env文件和配置文件

### 2. API 404错误

#### 问题现象
- `Failed to load resource: 404`
- API端点无法访问
- 代理路由失效

#### 快速诊断
```bash
# 检查路由注册
curl http://localhost:3003/api/health
curl http://47.113.225.93:8088/api/health

# 检查Nginx配置
nginx -t
systemctl status nginx

# 检查后端路由
grep -r "app.use" /root/todify2-deploy/backend/src/
```

#### 解决方案
1. **路由未注册**: 检查`index.ts`中的路由注册
2. **Nginx配置错误**: 检查代理配置
3. **路径错误**: 检查API路径配置
4. **服务未启动**: 重启相关服务

### 3. CORS错误

#### 问题现象
- `Access to fetch at ... has been blocked by CORS policy`
- 跨域请求失败
- API调用被阻止

#### 快速诊断
```bash
# 检查前端API配置
grep -r "apiUrl" /root/todify2-deploy/frontend/src/services/

# 检查后端CORS配置
grep -r "cors" /root/todify2-deploy/backend/src/

# 测试直接API调用
curl -X POST http://47.113.225.93:9999/v1/chat-messages \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}'
```

#### 解决方案
1. **使用代理**: 前端通过后端代理调用API
2. **CORS配置**: 检查后端CORS中间件
3. **URL配置**: 确保API URL指向代理地址
4. **头部设置**: 检查请求头配置

### 4. 超时错误

#### 问题现象
- `Request timeout after 30000ms`
- `fetchError: Request timeout`
- API调用超时

#### 快速诊断
```bash
# 测试Dify服务响应时间
time curl -X POST http://47.113.225.93:9999/v1/chat-messages \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}'

# 检查网络连接
ping 47.113.225.93
telnet 47.113.225.93 9999
```

#### 解决方案
1. **增加超时时间**: 调整前端超时设置
2. **网络优化**: 检查网络连接质量
3. **服务优化**: 优化Dify服务性能
4. **重试机制**: 实现请求重试

## 🔧 配置问题解决

### 1. 环境变量问题

#### 常见错误
- `PORT is not defined`
- `API key is missing`
- `Database connection failed`

#### 解决方案
```bash
# 检查环境变量文件
cat /root/todify2-deploy/backend/.env

# 重新加载环境变量
cd /root/todify2-deploy/backend
source .env
npm run dev
```

### 2. 数据库问题

#### 常见错误
- `SQLITE_ERROR: no such table`
- `Database connection failed`
- `Permission denied`

#### 解决方案
```bash
# 检查数据库文件
ls -la /root/todify2-deploy/backend/data/

# 重新创建数据库表
cd /root/todify2-deploy/backend
node create-stats-tables.js

# 检查文件权限
chmod 644 /root/todify2-deploy/backend/data/todify3.db
```

### 3. Nginx配置问题

#### 常见错误
- `nginx: configuration file test failed`
- `502 Bad Gateway`
- `504 Gateway Timeout`

#### 解决方案
```bash
# 测试Nginx配置
nginx -t

# 检查配置文件
cat /etc/nginx/sites-available/todify2

# 重载Nginx配置
systemctl reload nginx

# 检查Nginx日志
tail -f /var/log/nginx/error.log
```

## 📊 性能问题解决

### 1. 响应慢

#### 诊断方法
```bash
# 检查服务响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://47.113.225.93:8088/api/health

# 检查系统资源
top
free -h
df -h

# 检查网络延迟
ping 47.113.225.93
```

#### 优化方案
1. **前端优化**: 启用压缩、缓存
2. **后端优化**: 优化数据库查询
3. **网络优化**: 使用CDN、优化路由
4. **服务优化**: 调整超时设置

### 2. 内存泄漏

#### 诊断方法
```bash
# 监控内存使用
watch -n 1 'ps aux --sort=-%mem | head -10'

# 检查Node.js进程
ps aux | grep node

# 重启服务释放内存
/root/todify2-deploy/manage-service.sh restart
```

#### 解决方案
1. **定期重启**: 设置定时重启服务
2. **内存监控**: 实现内存使用监控
3. **代码优化**: 修复内存泄漏代码
4. **资源限制**: 设置进程资源限制

## 🔄 服务管理问题

### 1. 服务自动重启

#### 问题现象
- 服务频繁重启
- 进程异常退出
- 日志中出现重启记录

#### 解决方案
```bash
# 检查自动启动脚本
cat /root/todify2-deploy/auto-start.sh

# 检查crontab
crontab -l

# 手动测试启动脚本
/root/todify2-deploy/auto-start.sh
```

### 2. 日志管理

#### 问题现象
- 日志文件过大
- 日志文件丢失
- 日志内容异常

#### 解决方案
```bash
# 检查日志文件大小
du -h /root/todify2-deploy/*/backend.log
du -h /root/todify2-deploy/*/frontend.log

# 清理旧日志
find /root/todify2-deploy -name "*.log" -mtime +7 -delete

# 设置日志轮转
logrotate -f /etc/logrotate.d/todify2
```

## 🛠️ 维护工具

### 1. 服务状态检查脚本
```bash
#!/bin/bash
# 服务状态检查脚本

echo "=== Todify3 服务状态检查 ==="
echo "时间: $(date)"
echo ""

echo "1. 端口监听状态:"
netstat -tulnp | grep -E ':(3001|3003|8088)'
echo ""

echo "2. 进程状态:"
ps aux | grep -E 'node.*backend|node.*frontend|nginx' | grep -v grep
echo ""

echo "3. API健康检查:"
curl -s http://localhost:3003/api/health || echo "后端API异常"
curl -s http://47.113.225.93:8088/api/health || echo "Nginx代理异常"
echo ""

echo "4. 系统资源:"
echo "CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "内存使用率: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "磁盘使用率: $(df -h / | awk 'NR==2{printf "%s", $5}')"
echo ""

echo "5. 最近错误日志:"
tail -5 /root/todify2-deploy/backend/backend.log 2>/dev/null || echo "无后端日志"
tail -5 /root/todify2-deploy/frontend/frontend.log 2>/dev/null || echo "无前端日志"
```

### 2. 快速修复脚本
```bash
#!/bin/bash
# 快速修复脚本

echo "=== Todify3 快速修复 ==="

# 停止所有服务
echo "1. 停止服务..."
pkill -f "node.*backend"
pkill -f "node.*frontend"
sleep 2

# 清理端口
echo "2. 清理端口..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3003 | xargs kill -9 2>/dev/null || true

# 重新安装依赖
echo "3. 重新安装依赖..."
cd /root/todify2-deploy/frontend && npm install
cd /root/todify2-deploy/backend && npm install

# 重新构建
echo "4. 重新构建前端..."
cd /root/todify2-deploy/frontend && npm run build

# 启动服务
echo "5. 启动服务..."
cd /root/todify2-deploy/backend && npm run dev > backend.log 2>&1 &
cd /root/todify2-deploy/frontend && npm run dev > frontend.log 2>&1 &

# 等待启动
sleep 5

# 检查状态
echo "6. 检查状态..."
netstat -tulnp | grep -E ':(3001|3003|8088)'

echo "修复完成！"
```

## 📞 紧急联系

### 技术支持
- **开发团队**: 内部技术支持
- **运维团队**: 服务器运维支持
- **Dify服务**: 外部AI服务支持

### 应急流程
1. **立即响应**: 5分钟内响应问题
2. **快速诊断**: 使用诊断脚本快速定位问题
3. **紧急修复**: 使用快速修复脚本
4. **服务恢复**: 确保服务正常运行
5. **问题记录**: 记录问题原因和解决方案

---

**最后更新**: 2025-10-24
**维护人员**: 开发团队
