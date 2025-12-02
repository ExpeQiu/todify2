# 智能工作流功能使用数据统计系统

## 📋 系统概述

智能工作流功能使用数据统计系统是一个全面的数据分析平台，用于收集、分析和展示智能工作流的使用情况。系统提供了详细的功能使用统计、用户交互分析、性能监控和数据可视化功能。

## 🎯 主要功能

### 1. 各功能使用数据统计
- **节点使用统计**: 记录每个工作流节点的使用次数、访问时间、用户数量
- **会话统计**: 跟踪用户会话的完整生命周期
- **响应时间统计**: 监控各节点的平均响应时间
- **成功率统计**: 统计各功能的成功率和失败率

### 2. AI问答评价指标
- **点赞/点踩**: 用户对AI回答的满意度反馈
- **采纳率**: 用户直接使用AI生成内容的比例
- **重新生成**: 用户请求重新生成内容的次数
- **编辑率**: 用户修改AI生成内容的比例

### 3. 性能指标统计
- **平均响应时间**: 各节点的响应时间统计
- **内容长度统计**: AI生成内容的平均长度
- **处理时间**: 内容处理所需的时间

### 4. 工作流完整性分析
- **完整工作流使用率**: 完成整个工作流的用户比例
- **常见跳出节点**: 用户最常退出的节点位置
- **路径效率**: 用户完成工作流的效率分析

### 5. 内容采纳分析
- **直接采纳**: 用户直接使用生成内容的比例
- **编辑后采纳**: 用户编辑后使用内容的比例
- **放弃率**: 用户放弃使用生成内容的比例

## 🏗️ 系统架构

### 后端架构
```
backend/src/
├── models/
│   └── WorkflowStats.ts              # 统计数据模型
├── controllers/
│   └── WorkflowStatsController.ts    # 统计API控制器
├── routes/
│   └── workflowStats.ts              # 统计API路由
└── scripts/
    ├── workflow-stats-schema.sql     # 数据库表结构
    ├── create-workflow-stats-tables.ts  # 表创建脚本
    └── init-workflow-stats.ts        # 初始化脚本
```

### 前端架构
```
frontend/src/
├── services/
│   └── workflowStatsService.ts       # 统计服务
├── pages/
│   ├── WorkflowStatsPage.tsx         # 统计页面
│   └── EnhancedWorkflowStatsPage.tsx # 增强统计页面
├── components/
│   ├── charts/
│   │   └── WorkflowStatsCharts.tsx   # 图表组件
│   └── RealTimeStats.tsx             # 实时统计组件
├── hooks/
│   └── useWorkflowStats.ts           # 统计钩子
└── utils/
    └── statsCollector.ts             # 统计数据收集器
```

## 📊 数据库设计

### 核心表结构

#### 1. 工作流节点使用统计表 (workflow_node_usage)
```sql
CREATE TABLE workflow_node_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL,                    -- 节点ID
    node_name TEXT NOT NULL,                  -- 节点名称
    node_type TEXT NOT NULL,                  -- 节点类型
    session_id TEXT NOT NULL,                 -- 会话ID
    user_id TEXT,                             -- 用户ID
    usage_count INTEGER DEFAULT 1,            -- 使用次数
    total_time_spent REAL DEFAULT 0,          -- 总耗时
    avg_response_time REAL DEFAULT 0,         -- 平均响应时间
    success_count INTEGER DEFAULT 0,          -- 成功次数
    failure_count INTEGER DEFAULT 0,          -- 失败次数
    total_characters INTEGER DEFAULT 0,       -- 总字符数
    avg_characters INTEGER DEFAULT 0,         -- 平均字符数
    content_quality_score REAL DEFAULT 0,     -- 内容质量评分
    likes_count INTEGER DEFAULT 0,            -- 点赞次数
    dislikes_count INTEGER DEFAULT 0,         -- 点踩次数
    regenerations_count INTEGER DEFAULT 0,    -- 重新生成次数
    adoptions_count INTEGER DEFAULT 0,        -- 采纳次数
    edits_count INTEGER DEFAULT 0,            -- 编辑次数
    is_workflow_mode BOOLEAN DEFAULT FALSE,   -- 是否在工作流模式
    is_standalone_mode BOOLEAN DEFAULT FALSE, -- 是否在独立模式
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. AI问答评价表 (ai_qa_feedback)
```sql
CREATE TABLE ai_qa_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,                 -- 消息ID
    node_id TEXT NOT NULL,                    -- 节点ID
    session_id TEXT NOT NULL,                 -- 会话ID
    user_id TEXT,                             -- 用户ID
    feedback_type TEXT NOT NULL,              -- 评价类型
    feedback_value INTEGER DEFAULT 0,         -- 评价分值
    feedback_comment TEXT,                    -- 评价备注
    response_time REAL,                       -- 响应时间
    content_length INTEGER,                   -- 内容长度
    content_quality_score REAL,               -- 内容质量评分
    query_text TEXT,                          -- 查询文本
    response_text TEXT,                       -- 响应文本
    context_data TEXT,                        -- 上下文数据
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. 工作流会话统计表 (workflow_session_stats)
```sql
CREATE TABLE workflow_session_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,          -- 会话ID
    user_id TEXT,                             -- 用户ID
    session_start_time DATETIME,              -- 会话开始时间
    session_end_time DATETIME,                -- 会话结束时间
    session_duration REAL DEFAULT 0,          -- 会话持续时间
    total_nodes_visited INTEGER DEFAULT 0,    -- 访问的节点总数
    completed_nodes INTEGER DEFAULT 0,        -- 完成的节点数
    skipped_nodes INTEGER DEFAULT 0,          -- 跳过的节点数
    node_visit_sequence TEXT,                 -- 节点访问序列
    node_completion_status TEXT,              -- 节点完成状态
    exit_node_id TEXT,                        -- 退出节点ID
    exit_reason TEXT,                         -- 退出原因
    exit_time DATETIME,                       -- 退出时间
    workflow_path TEXT,                       -- 工作流路径
    path_efficiency_score REAL DEFAULT 0,     -- 路径效率评分
    overall_satisfaction_score REAL,          -- 整体满意度评分
    user_feedback TEXT,                       -- 用户反馈
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. 节点内容处理统计表 (node_content_processing)
```sql
CREATE TABLE node_content_processing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL,                    -- 节点ID
    session_id TEXT NOT NULL,                 -- 会话ID
    message_id TEXT,                          -- 消息ID
    processing_type TEXT NOT NULL,            -- 处理类型
    processing_time REAL,                     -- 处理时间
    original_content_length INTEGER,          -- 原始内容长度
    final_content_length INTEGER,             -- 最终内容长度
    edit_ratio REAL DEFAULT 0,                -- 编辑比例
    edit_count INTEGER DEFAULT 0,             -- 编辑次数
    edit_types TEXT,                          -- 编辑类型
    edit_duration REAL DEFAULT 0,             -- 编辑耗时
    user_satisfaction_score REAL,             -- 用户满意度评分
    user_behavior_data TEXT,                  -- 用户行为数据
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. 实时统计汇总表 (workflow_stats_summary)
```sql
CREATE TABLE workflow_stats_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL,                  -- 统计日期
    node_id TEXT NOT NULL,                    -- 节点ID
    total_usage_count INTEGER DEFAULT 0,      -- 总使用次数
    unique_users INTEGER DEFAULT 0,           -- 独立用户数
    avg_response_time REAL DEFAULT 0,         -- 平均响应时间
    success_rate REAL DEFAULT 0,              -- 成功率
    total_characters INTEGER DEFAULT 0,       -- 总字符数
    avg_characters INTEGER DEFAULT 0,         -- 平均字符数
    avg_content_quality REAL DEFAULT 0,       -- 平均内容质量
    total_likes INTEGER DEFAULT 0,            -- 总点赞数
    total_dislikes INTEGER DEFAULT 0,         -- 总点踩数
    total_regenerations INTEGER DEFAULT 0,    -- 总重新生成数
    total_adoptions INTEGER DEFAULT 0,        -- 总采纳数
    total_edits INTEGER DEFAULT 0,            -- 总编辑数
    direct_adoption_rate REAL DEFAULT 0,      -- 直接采纳率
    edit_adoption_rate REAL DEFAULT 0,        -- 编辑后采纳率
    abandonment_rate REAL DEFAULT 0,          -- 放弃率
    workflow_completion_rate REAL DEFAULT 0,  -- 工作流完成率
    avg_session_duration REAL DEFAULT 0,      -- 平均会话时长
    common_exit_points TEXT,                  -- 常见退出点
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stat_date, node_id)
);
```

## 🚀 快速开始

### 1. 初始化系统

```bash
# 进入后端目录
cd backend

# 运行初始化脚本
npx ts-node src/scripts/init-workflow-stats.ts
```

### 2. 启动服务

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd frontend
npm run dev
```

### 3. 访问统计页面

- **基础统计页面**: http://localhost:3000/workflow-stats
- **增强统计页面**: http://localhost:3000/enhanced-workflow-stats
- **API接口**: http://localhost:3001/api/workflow-stats

## 📈 API接口文档

### 统计概览接口

#### 获取综合统计概览
```http
GET /api/workflow-stats/overview?days=7
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsage": 1250,
      "totalSessions": 156,
      "completionRate": 78.5,
      "avgSatisfaction": 4.2
    },
    "nodeStats": [...],
    "nodeAdoptionRates": [...],
    "workflowStats": {...},
    "commonExitPoints": [...],
    "contentProcessingDistribution": {...}
  }
}
```

#### 获取节点使用统计
```http
GET /api/workflow-stats/node-usage/overview?nodeId=ai_qa&days=7
```

#### 获取工作流完成率统计
```http
GET /api/workflow-stats/session/completion?days=7
```

#### 获取内容采纳率统计
```http
GET /api/workflow-stats/content-processing/adoption?days=7
```

### 数据记录接口

#### 记录节点使用统计
```http
POST /api/workflow-stats/node-usage
Content-Type: application/json

{
  "node_id": "ai_qa",
  "node_name": "AI问答",
  "node_type": "ai_qa",
  "session_id": "session_123",
  "user_id": "user_456",
  "usage_count": 1,
  "avg_response_time": 3.2,
  "total_characters": 150,
  "is_workflow_mode": true
}
```

#### 记录用户反馈
```http
POST /api/workflow-stats/feedback
Content-Type: application/json

{
  "message_id": "msg_789",
  "node_id": "ai_qa",
  "session_id": "session_123",
  "user_id": "user_456",
  "feedback_type": "like",
  "feedback_value": 5,
  "response_time": 3.2,
  "content_length": 150
}
```

## 🔧 集成指南

### 在现有节点组件中集成统计功能

#### 1. 使用统计数据收集器

```typescript
import { statsCollector } from '../utils/statsCollector';

// 在组件中使用
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
      
      // 记录内容长度
      if (result.content) {
        await statsCollector.recordContentLength('ai_qa', 'AI问答', 'ai_qa', result.content.length);
      }
      
      return result;
    } catch (error) {
      // 记录错误
      console.error('节点执行失败:', error);
      throw error;
    }
  };
};
```

#### 2. 使用装饰器快速集成

```typescript
import { withStatsTracking, withResponseTimeTracking } from '../utils/statsCollector';

// 使用装饰器包装组件
const EnhancedNodeComponent = withStatsTracking(
  withResponseTimeTracking(MyNodeComponent, 'ai_qa', 'AI问答', 'ai_qa'),
  'ai_qa',
  'AI问答', 
  'ai_qa'
);
```

#### 3. 使用统计钩子

```typescript
import { useWorkflowStats } from '../hooks/useWorkflowStats';

const MyNodeComponent = () => {
  const { recordNodeUsage, recordFeedback } = useWorkflowStats();

  const handleLike = async (messageId: string) => {
    await recordFeedback({
      message_id: messageId,
      node_id: 'ai_qa',
      feedback_type: 'like',
      feedback_value: 5
    });
  };

  return (
    <div>
      {/* 组件内容 */}
      <button onClick={() => handleLike('msg_123')}>点赞</button>
    </div>
  );
};
```

## 📊 数据可视化

### 图表组件使用

```typescript
import { BarChart, PieChart, LineChart } from '../components/charts/WorkflowStatsCharts';

const StatsDashboard = () => {
  const nodeUsageData = [
    { name: 'AI问答', value: 450 },
    { name: '技术包装', value: 320 },
    { name: '推广策略', value: 280 }
  ];

  return (
    <div>
      <BarChart
        data={nodeUsageData}
        title="节点使用统计"
        xKey="name"
        yKey="value"
        color="#3B82F6"
      />
      
      <PieChart
        data={adoptionData}
        title="内容采纳率"
        labelKey="name"
        valueKey="value"
        colors={['#10B981', '#F59E0B', '#EF4444']}
      />
    </div>
  );
};
```

## 🔍 实时监控

### 实时统计组件

```typescript
import RealTimeStats from '../components/RealTimeStats';

const Dashboard = () => {
  return (
    <div>
      <RealTimeStats 
        refreshInterval={30000} // 30秒刷新一次
      />
    </div>
  );
};
```

## 📤 数据导出

### 导出统计数据

```typescript
import { workflowStatsService } from '../services/workflowStatsService';

const handleExport = async () => {
  try {
    // 导出JSON格式数据
    await workflowStatsService.downloadStats(7, 'json');
    
    // 导出CSV格式数据
    await workflowStatsService.downloadStats(7, 'csv');
  } catch (error) {
    console.error('导出失败:', error);
  }
};
```

## 🛠️ 自定义和扩展

### 添加新的统计指标

1. **扩展数据模型**: 在 `WorkflowStats.ts` 中添加新的接口
2. **更新数据库表**: 在 `workflow-stats-schema.sql` 中添加新字段
3. **实现API接口**: 在 `WorkflowStatsController.ts` 中添加新的方法
4. **更新前端服务**: 在 `workflowStatsService.ts` 中添加新的方法
5. **创建可视化组件**: 在图表组件中添加新的图表类型

### 自定义图表组件

```typescript
import React from 'react';

export const CustomChart: React.FC<ChartProps> = ({ data, title }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {/* 自定义图表实现 */}
    </div>
  );
};
```

## 🔒 安全和隐私

### 数据保护
- 用户ID使用匿名标识符
- 敏感内容不直接存储
- 统计数据定期清理
- 访问权限控制

### 隐私设置
- 用户可以选择是否参与统计
- 统计数据可以匿名化
- 支持数据删除请求

## 📈 性能优化

### 数据库优化
- 使用索引提升查询性能
- 定期清理历史数据
- 使用触发器自动更新汇总数据
- 实施数据分区策略

### 前端优化
- 使用虚拟滚动处理大量数据
- 实施数据缓存策略
- 使用懒加载减少初始加载时间
- 优化图表渲染性能

## 🐛 故障排除

### 常见问题

#### 1. 统计数据不显示
- 检查数据库连接
- 验证API接口状态
- 确认数据是否正确插入

#### 2. 图表不渲染
- 检查数据格式是否正确
- 验证图表组件配置
- 确认样式文件是否加载

#### 3. 实时数据不更新
- 检查WebSocket连接
- 验证定时器设置
- 确认数据刷新逻辑

### 调试工具

```typescript
// 启用调试模式
localStorage.setItem('debug', 'workflow-stats');

// 查看统计数据
console.log(await workflowStatsService.getOverallStats());
```

## 📚 相关文档

- [数据库设计文档](./guide/database/database-design.md)
- [API接口文档](./backend/src/controllers/WorkflowStatsController.ts)
- [前端组件文档](./frontend/src/components/charts/WorkflowStatsCharts.tsx)
- [统计钩子文档](./frontend/src/hooks/useWorkflowStats.ts)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](./LICENSE) 文件。

---

**注意**: 本系统需要与现有的智能工作流系统集成使用。请确保在集成前已正确配置数据库和后端服务。
