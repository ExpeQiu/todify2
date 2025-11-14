# 智能工作流统计系统部署指南

## 🚀 快速部署

### 1. 环境准备

确保已安装以下环境：
- Node.js 16+
- npm 或 yarn
- SQLite3

### 2. 数据库初始化

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 初始化统计数据库表
npx ts-node src/scripts/init-workflow-stats.ts
```

### 3. 启动服务

```bash
# 启动后端服务（终端1）
cd backend
npm run dev

# 启动前端服务（终端2）
cd frontend
npm run dev
```

### 4. 访问系统

- **统计页面**: http://localhost:3000/workflow-stats
- **API接口**: http://localhost:3001/api/workflow-stats
- **健康检查**: http://localhost:3001/api/health

## 📊 功能验证

### 1. 检查数据库表

```bash
# 进入后端目录
cd backend

# 检查表是否创建成功
npx ts-node -e "
import { DatabaseManager } from './src/config/database';
const db = new DatabaseManager();
db.query('SELECT name FROM sqlite_master WHERE type=\"table\" AND name LIKE \"%workflow%\"')
  .then(result => console.log('统计表:', result))
  .catch(err => console.error(err));
"
```

### 2. 测试API接口

```bash
# 测试统计概览接口
curl http://localhost:3001/api/workflow-stats/overview

# 测试健康检查接口
curl http://localhost:3001/api/health
```

### 3. 验证前端页面

访问 http://localhost:3000/workflow-stats 查看统计页面是否正常显示。

## 🔧 配置说明

### 环境变量配置

在 `backend/.env` 文件中配置：

```env
# 数据库配置
DB_TYPE=sqlite
SQLITE_DB_PATH=./data/unified.db

# API配置
PORT=3001
NODE_ENV=development

# 统计配置
STATS_ENABLED=true
STATS_RETENTION_DAYS=90
```

### 前端配置

在 `frontend/.env` 文件中配置：

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_STATS_ENABLED=true
```

## 📈 集成现有节点

### 1. 在节点组件中添加统计收集

```typescript
import { statsCollector } from '../utils/statsCollector';

const MyNodeComponent = () => {
  useEffect(() => {
    // 记录节点开始使用
    statsCollector.recordNodeStart('ai_qa', 'AI问答', 'ai_qa');
  }, []);

  const handleExecute = async (data: any) => {
    const startTime = Date.now();
    
    try {
      // 执行节点逻辑
      const result = await executeNodeLogic(data);
      
      // 记录响应时间
      const responseTime = (Date.now() - startTime) / 1000;
      await statsCollector.recordNodeResponseTime('ai_qa', 'AI问答', 'ai_qa', responseTime);
      
      return result;
    } catch (error) {
      console.error('节点执行失败:', error);
      throw error;
    }
  };
};
```

### 2. 使用装饰器快速集成

```typescript
import { withStatsTracking } from '../utils/statsCollector';

const EnhancedNodeComponent = withStatsTracking(
  MyNodeComponent,
  'ai_qa',
  'AI问答',
  'ai_qa'
);
```

### 3. 记录用户交互

```typescript
const handleLike = async (messageId: string) => {
  await statsCollector.recordFeedback(
    'ai_qa',
    messageId,
    'like',
    5,
    responseTime,
    contentLength
  );
};
```

## 🎯 使用指南

### 1. 查看统计概览

访问统计页面查看：
- 总使用次数
- 总会话数
- 完成率
- 平均满意度

### 2. 分析节点使用情况

在"节点统计"标签页查看：
- 各节点使用次数
- 响应时间统计
- 用户交互数据
- 采纳率分析

### 3. 工作流分析

在"工作流分析"标签页查看：
- 工作流完成率
- 常见退出点
- 路径效率分析
- 会话时长统计

### 4. 实时监控

在"实时监控"标签页查看：
- 活跃用户数
- 实时使用统计
- 系统状态
- 热门节点

### 5. 数据导出

在"数据导出"标签页：
- 选择导出格式（JSON/CSV）
- 选择导出内容
- 下载统计数据

## 🔍 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查数据库文件是否存在
ls -la backend/data/

# 检查数据库权限
chmod 644 backend/data/unified.db
```

#### 2. API接口无响应
```bash
# 检查后端服务状态
curl http://localhost:3001/api/health

# 查看后端日志
cd backend
npm run dev
```

#### 3. 前端页面空白
```bash
# 检查前端服务状态
curl http://localhost:3000

# 查看前端日志
cd frontend
npm run dev
```

#### 4. 统计数据不显示
- 检查数据库表是否创建成功
- 验证API接口是否正常
- 确认数据是否正确插入

### 调试模式

启用调试模式查看详细日志：

```bash
# 后端调试
cd backend
DEBUG=* npm run dev

# 前端调试
cd frontend
REACT_APP_DEBUG=true npm run dev
```

## 📊 性能优化

### 数据库优化

1. **索引优化**
```sql
-- 检查索引使用情况
EXPLAIN QUERY PLAN SELECT * FROM workflow_node_usage WHERE node_id = 'ai_qa';
```

2. **查询优化**
```sql
-- 使用LIMIT限制结果集
SELECT * FROM workflow_node_usage ORDER BY created_at DESC LIMIT 100;
```

3. **数据清理**
```sql
-- 清理30天前的统计数据
DELETE FROM workflow_node_usage WHERE created_at < datetime('now', '-30 days');
```

### 前端优化

1. **数据缓存**
```typescript
// 使用缓存减少API调用
const cachedData = localStorage.getItem('stats-data');
if (cachedData) {
  return JSON.parse(cachedData);
}
```

2. **虚拟滚动**
```typescript
// 使用虚拟滚动处理大量数据
import { FixedSizeList as List } from 'react-window';
```

3. **懒加载**
```typescript
// 懒加载图表组件
const Chart = lazy(() => import('./Chart'));
```

## 🔒 安全配置

### 数据保护

1. **用户隐私**
```typescript
// 使用匿名用户ID
const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
```

2. **数据加密**
```typescript
// 敏感数据加密存储
const encryptedData = encrypt(sensitiveData);
```

3. **访问控制**
```typescript
// API访问权限控制
if (!hasPermission(userId, 'stats:read')) {
  throw new Error('Access denied');
}
```

## 📈 监控和维护

### 系统监控

1. **性能监控**
```bash
# 监控API响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/workflow-stats/overview
```

2. **错误监控**
```bash
# 检查错误日志
tail -f backend/logs/error.log
```

3. **资源监控**
```bash
# 监控内存使用
ps aux | grep node
```

### 定期维护

1. **数据备份**
```bash
# 备份数据库
cp backend/data/unified.db backend/data/backup/unified_$(date +%Y%m%d).db
```

2. **数据清理**
```bash
# 清理过期数据
npx ts-node src/scripts/cleanup-old-stats.ts
```

3. **性能优化**
```bash
# 重建索引
npx ts-node src/scripts/rebuild-indexes.ts
```

## 🎉 部署完成

恭喜！智能工作流统计系统已成功部署。

### 下一步操作

1. **功能验证** - 测试所有统计功能
2. **数据收集** - 在现有节点中集成统计收集
3. **数据分析** - 使用统计数据进行产品优化
4. **持续监控** - 定期查看系统状态和性能

### 支持资源

- 📚 完整文档：`WORKFLOW_STATS_README.md`
- 📊 系统概览：`WORKFLOW_STATS_SUMMARY.md`
- 🔧 API文档：后端控制器文件
- 💡 使用示例：各组件文件注释

---

**部署状态**: ✅ 完成  
**系统状态**: 🟢 运行正常  
**下一步**: 开始收集统计数据
