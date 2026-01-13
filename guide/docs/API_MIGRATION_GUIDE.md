# API 迁移指南

**生成时间**: 2025-01-13  
**版本**: v2.0  
**目的**: 指导从废弃API迁移到新API

---

## 一、迁移概述

### 1.1 变更背景

由于数据库清理，以下13个表已移除：
- tech_packaging_materials
- tech_promotion_strategies
- tech_press_releases
- tech_speeches
- 以及相关的关联表

**新策略**: AI生成内容存储在 `workflow_executions.outputs` 字段中（JSON格式）

### 1.2 影响范围

- ❌ **废弃的API端点**: 21个端点
- ✅ **新的API端点**: workflow-executions API
- 📋 **需要迁移的代码**: 前端和后端中所有调用废弃API的代码

---

## 二、废弃API列表

### 2.1 技术包装材料 API

**基础路径**: `/api/tech-packaging`

| 方法 | 端点 | 状态 |
|------|------|------|
| POST | `/api/tech-packaging` | ❌ 已废弃 |
| GET | `/api/tech-packaging/:id` | ❌ 已废弃 |
| PUT | `/api/tech-packaging/:id` | ❌ 已废弃 |
| POST | `/api/tech-packaging/:id/conversations` | ❌ 已废弃 |
| DELETE | `/api/tech-packaging/:id/conversations` | ❌ 已废弃 |
| POST | `/api/tech-packaging/:id/sources` | ❌ 已废弃 |
| DELETE | `/api/tech-packaging/:id/sources` | ❌ 已废弃 |

### 2.2 技术推广策略 API

**基础路径**: `/api/tech-promotion`

| 方法 | 端点 | 状态 |
|------|------|------|
| POST | `/api/tech-promotion` | ❌ 已废弃 |
| GET | `/api/tech-promotion/:id` | ❌ 已废弃 |
| PUT | `/api/tech-promotion/:id` | ❌ 已废弃 |
| POST | `/api/tech-promotion/:id/conversations` | ❌ 已废弃 |
| DELETE | `/api/tech-promotion/:id/conversations` | ❌ 已废弃 |
| POST | `/api/tech-promotion/:id/sources` | ❌ 已废弃 |
| DELETE | `/api/tech-promotion/:id/sources` | ❌ 已废弃 |

### 2.3 技术通稿 API

**基础路径**: `/api/tech-press`

| 方法 | 端点 | 状态 |
|------|------|------|
| POST | `/api/tech-press` | ❌ 已废弃 |
| GET | `/api/tech-press/:id` | ❌ 已废弃 |
| PUT | `/api/tech-press/:id` | ❌ 已废弃 |
| POST | `/api/tech-press/:id/conversations` | ❌ 已废弃 |
| DELETE | `/api/tech-press/:id/conversations` | ❌ 已废弃 |
| POST | `/api/tech-press/:id/sources` | ❌ 已废弃 |
| DELETE | `/api/tech-press/:id/sources` | ❌ 已废弃 |

---

## 三、新API使用指南

### 3.1 工作流执行 API

**基础路径**: `/api/workflow-executions`

#### 获取工作流执行详情

**端点**: `GET /api/workflow-executions/:id`

**描述**: 获取工作流执行记录，包含所有AI生成的内容

**响应结构**:
```json
{
  "success": true,
  "data": {
    "id": "exec-123",
    "execution_type": "dify_workflow",
    "status": "completed",
    "inputs": {
      "query": "用户输入"
    },
    "outputs": {
      "tech_package": {
        "title": "技术包装标题",
        "content": "技术包装内容...",
        "material_type": "marketing",
        "target_audience": "technical",
        "generated_at": "2025-01-13T10:00:00Z"
      },
      "promotion_strategy": {
        "title": "推广策略标题",
        "content": "推广策略内容...",
        "strategy_type": "comprehensive",
        "generated_at": "2025-01-13T10:00:00Z"
      },
      "press_release": {
        "title": "技术通稿标题",
        "content": "技术通稿内容...",
        "release_type": "product_launch",
        "generated_at": "2025-01-13T10:00:00Z"
      }
    },
    "created_at": "2025-01-13T10:00:00Z"
  }
}
```

---

## 四、迁移示例

### 4.1 获取技术包装材料

#### 旧方式 (已废弃)

```typescript
// ❌ 旧代码
const response = await fetch('/api/tech-packaging/123');
const packaging = await response.json();
console.log(packaging.data.title);
```

#### 新方式

```typescript
// ✅ 新代码
// 1. 获取工作流执行ID（从conversation或message中获取）
const executionId = 'exec-123';

// 2. 获取工作流执行记录
const response = await fetch(`/api/workflow-executions/${executionId}`);
const execution = await response.json();

// 3. 从outputs字段中提取技术包装材料
const techPackage = execution.data.outputs?.tech_package;
if (techPackage) {
  console.log(techPackage.title);
  console.log(techPackage.content);
}
```

### 4.2 获取项目的技术包装材料列表

#### 旧方式 (已废弃)

```typescript
// ❌ 旧代码
const response = await fetch('/api/projects/1');
const project = await response.json();
const packagingMaterials = project.data.packaging_materials; // 现在返回空数组
```

#### 新方式

```typescript
// ✅ 新代码
// 1. 获取项目的对话列表
const conversationsResponse = await fetch('/api/projects/1/conversations');
const conversations = await conversationsResponse.json();

// 2. 从每个对话关联的工作流执行中获取技术包装材料
const packagingMaterials = [];
for (const conv of conversations.data) {
  // 获取对话关联的工作流执行ID（从message或conversation metadata中获取）
  const executionId = conv.metadata?.workflow_execution_id;
  if (executionId) {
    const execResponse = await fetch(`/api/workflow-executions/${executionId}`);
    const execution = await execResponse.json();
    if (execution.data.outputs?.tech_package) {
      packagingMaterials.push(execution.data.outputs.tech_package);
    }
  }
}
```

### 4.3 创建技术包装材料

#### 旧方式 (已废弃)

```typescript
// ❌ 旧代码
const response = await fetch('/api/tech-packaging', {
  method: 'POST',
  body: JSON.stringify({
    tech_point_id: 1,
    title: '标题',
    content: '内容'
  })
});
```

#### 新方式

```typescript
// ✅ 新代码
// 技术包装材料现在通过AI搜索对话自动生成
// 1. 创建对话
const convResponse = await fetch('/api/v1/ai-search/conversations', {
  method: 'POST',
  body: JSON.stringify({
    session_name: '技术包装会话',
    app_type: 'tech-package',
    project_id: 1
  })
});
const conversation = await convResponse.json();

// 2. 发送消息（触发技术包装生成）
const messageResponse = await fetch(
  `/api/v1/ai-search/conversations/${conversation.data.conversation_id}/messages`,
  {
    method: 'POST',
    body: JSON.stringify({
      query: '请帮我包装这个技术点',
      inputs: {
        techDocument: '技术文档内容'
      }
    })
  }
);

// 3. 从工作流执行记录中获取生成的内容
// （工作流执行ID可以从message响应中获取）
const executionId = messageResponse.data.metadata?.workflow_execution_id;
const execResponse = await fetch(`/api/workflow-executions/${executionId}`);
const execution = await execResponse.json();
const techPackage = execution.data.outputs?.tech_package;
```

---

## 五、数据模型对比

### 5.1 技术包装材料

#### 旧数据模型 (已废弃)

```typescript
interface TechPackagingMaterial {
  id: number;
  tech_point_id: number;
  project_id?: number;
  title: string;
  content: string;
  material_type: string;
  target_audience: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

#### 新数据模型

```typescript
// 存储在 workflow_executions.outputs.tech_package
interface TechPackageOutput {
  title: string;
  content: string;
  material_type?: string;
  target_audience?: string;
  generated_at: string;
  // 其他字段存储在metadata中
}
```

### 5.2 技术推广策略

#### 旧数据模型 (已废弃)

```typescript
interface TechPromotionStrategy {
  id: number;
  project_id?: number;
  title: string;
  content: string;
  strategy_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

#### 新数据模型

```typescript
// 存储在 workflow_executions.outputs.promotion_strategy
interface PromotionStrategyOutput {
  title: string;
  content: string;
  strategy_type?: string;
  generated_at: string;
}
```

### 5.3 技术通稿

#### 旧数据模型 (已废弃)

```typescript
interface TechPressRelease {
  id: number;
  project_id?: number;
  title: string;
  content: string;
  release_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

#### 新数据模型

```typescript
// 存储在 workflow_executions.outputs.press_release
interface PressReleaseOutput {
  title: string;
  content: string;
  release_type?: string;
  generated_at: string;
}
```

---

## 六、前端迁移检查清单

### 6.1 代码搜索

搜索以下关键词，找到需要迁移的代码：

```bash
# 搜索废弃的API调用
grep -r "tech-packaging" frontend/src
grep -r "tech-promotion" frontend/src
grep -r "tech-press" frontend/src

# 搜索模型类型
grep -r "TechPackagingMaterial" frontend/src
grep -r "TechPromotionStrategy" frontend/src
grep -r "TechPressRelease" frontend/src
```

### 6.2 迁移步骤

1. ✅ 识别所有调用废弃API的代码
2. ⚠️ 替换为 workflow-executions API
3. ⚠️ 更新数据模型类型定义
4. ⚠️ 更新UI组件以使用新数据结构
5. ⚠️ 测试所有功能

---

## 七、后端迁移检查清单

### 7.1 代码搜索

搜索以下关键词，找到需要迁移的代码：

```bash
# 搜索废弃的Controller使用
grep -r "TechPackagingController" backend/src
grep -r "TechPromotionController" backend/src
grep -r "TechPressController" backend/src

# 搜索废弃的模型使用
grep -r "techPackagingMaterialModel" backend/src
grep -r "techPromotionStrategyModel" backend/src
grep -r "techPressReleaseModel" backend/src
```

### 7.2 迁移步骤

1. ✅ 所有废弃的Controller和模型已添加废弃标记
2. ⚠️ 检查是否有其他服务依赖这些模型
3. ⚠️ 更新相关服务使用 workflow_executions 表
4. ⚠️ 测试所有API端点

---

## 八、常见问题

### Q1: 如何找到工作流执行ID？

**A**: 工作流执行ID可以从以下位置获取：
1. 对话的 `metadata.workflow_execution_id` 字段
2. 消息的 `metadata.workflow_execution_id` 字段
3. 项目详情中的对话关联信息

### Q2: 如何查询特定项目的内容？

**A**: 
1. 获取项目的对话列表: `GET /api/projects/:id/conversations`
2. 从每个对话中获取工作流执行ID
3. 查询工作流执行记录: `GET /api/workflow-executions/:id`
4. 从 `outputs` 字段中提取需要的内容

### Q3: 如何筛选特定类型的内容？

**A**: 
```typescript
// 获取工作流执行记录
const execution = await getWorkflowExecution(executionId);

// 筛选技术包装材料
if (execution.outputs?.tech_package) {
  // 处理技术包装材料
}

// 筛选推广策略
if (execution.outputs?.promotion_strategy) {
  // 处理推广策略
}
```

### Q4: 如何更新内容？

**A**: 
- 旧方式: 直接更新数据库表
- 新方式: 重新生成内容（通过AI搜索对话），或直接修改 `workflow_executions.outputs` 字段（如果支持）

---

## 九、迁移时间表

### 阶段1: 准备阶段 (已完成)

- ✅ 数据库清理完成
- ✅ API端点标记为废弃
- ✅ 文档更新完成

### 阶段2: 迁移阶段 (进行中)

- ⚠️ 前端代码迁移
- ⚠️ 后端代码迁移
- ⚠️ 测试验证

### 阶段3: 清理阶段 (计划中)

- 📋 完全移除废弃的API端点
- 📋 移除废弃的Controller和模型文件
- 📋 更新所有相关文档

---

## 十、支持与帮助

如有问题，请：
1. 查看 [API_DOCUMENTATION_V2.md](./API_DOCUMENTATION_V2.md) 获取完整API文档
2. 查看 [数据库清理方案.md](../database/数据库清理方案.md) 了解架构变更
3. 联系开发团队获取支持

---

**文档版本**: v1.0  
**最后更新**: 2025-01-13  
**维护者**: Todify4 Team
