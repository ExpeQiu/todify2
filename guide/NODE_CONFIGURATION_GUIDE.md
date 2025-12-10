# 项目节点配置指南

本文档详细说明了项目中需要配置AI角色的所有节点及其配置方法。

## 一、需要配置的节点分类

### 1. 独立页面节点（5个）

这些节点在独立页面模式下使用，需要创建source为"independent-page"的AI角色。

| 节点类型 | 节点名称 | 路径 | 匹配规则 |
|---------|---------|------|---------|
| `ai-search` | AI问答 | `/node/ai-search` | 匹配ID/名称/描述包含"ai-search"、"ai问答"、"智能搜索"等 |
| `tech-package` | 技术包装 | `/node/tech-package` | 匹配ID/名称/描述包含"tech-package"、"技术包装"等 |
| `promotion-strategy` | 技术策略 | `/node/promotion-strategy` | 匹配ID/名称/描述包含"promotion-strategy"、"tech-strategy"、"技术策略"等 |
| `core-draft` | 技术通稿 | `/node/core-draft` | 匹配ID/名称/描述包含"core-draft"、"tech-article"、"技术通稿"等 |
| `speech` | 发布会演讲稿 | `/node/speech` | 匹配ID/名称/描述包含"speech"、"发布会"、"演讲稿"等 |

**配置方法**：
1. 在AI角色管理页面创建新角色
2. 设置source为"independent-page"
3. 角色ID、名称或描述需要匹配上述规则
4. 系统会自动匹配并应用

### 2. 工作流Agent节点

在工作流编辑器中创建的Agent节点，需要为每个节点配置agentId。

**配置方法**：
1. 进入工作流编辑器（`/agent-workflow`）
2. 创建或编辑工作流
3. 添加Agent节点
4. 在节点配置中选择对应的AI角色（agentId）
5. 注意：工作流中的Agent节点只支持Dify类型的角色，不支持Direct Agent类型

**相关代码位置**：
- `backend/src/services/AgentWorkflowService.ts` - `executeAgentNode()`方法
- `frontend/src/components/WorkflowEditor/AgentNode.tsx` - Agent节点组件

### 3. 字段映射功能对象（8个）

在字段映射配置中，可以为每个功能对象配置专属的agentId或workflowId。

| 功能类型 | 功能名称 | 配置位置 |
|---------|---------|---------|
| `five-view-analysis` | 技术转译（五看） | 字段映射管理页面 |
| `three-fix-analysis` | 用户场景挖掘（三定） | 字段映射管理页面 |
| `tech-matrix` | 技术矩阵 | 字段映射管理页面 |
| `propagation-strategy` | 传播策略 | 字段映射管理页面 |
| `exhibition-video` | 展具与视频 | 字段映射管理页面 |
| `translation` | 翻译 | 字段映射管理页面 |
| `ppt-outline` | 技术讲稿 | 字段映射管理页面 |
| `script` | 脚本 | 字段映射管理页面 |

**配置方法**：
1. 进入字段映射管理页面（`/field-mapping-management`）
2. 选择对应的工作流
3. 在功能对象配置中，为每个功能对象设置agentId
4. agentId可以是AI角色ID（以`role_`或`ai-role-`开头）或工作流ID（以`wf_`开头）

**相关代码位置**：
- `backend/src/modules/ai-search/application/useCases/TriggerAgent.usecase.ts` - 触发Agent逻辑
- `frontend/src/pages/FieldMappingManagementPage.tsx` - 字段映射管理页面

## 二、配置优先级

### 1. 独立页面节点匹配优先级

系统按以下优先级匹配AI角色：

1. **优先级1**：source === 'independent-page' 且ID精确匹配
2. **优先级2**：source === 'independent-page' 且名称匹配
3. **优先级3**：source === 'independent-page' 且描述匹配
4. **优先级4**：回退到任意source的匹配（用于兼容性）

### 2. 字段映射功能对象配置优先级

在触发子Agent时，系统按以下优先级选择：

1. **优先级1**：功能对象配置的agentId（如果存在且不同于当前工作流ID）
2. **优先级2**：功能对象配置的workflowId（如果存在且不同于当前工作流ID）
3. **优先级3**：回退到当前工作流ID

## 三、配置检查

### 1. 自动检查

在AI角色管理页面（`/ai-roles`）的信息框中，系统会自动检查：

- ✅ 独立页面节点的配置状态
- ⚠️ 工作流Agent节点的配置提示
- ⚠️ 字段映射功能对象的配置提示

### 2. 手动检查

可以通过以下方式手动检查配置：

1. **检查独立页面节点**：
   - 访问对应的节点页面（如`/node/ai-search`）
   - 如果未配置，页面会显示错误提示

2. **检查工作流Agent节点**：
   - 进入工作流编辑器
   - 查看Agent节点的配置状态
   - 未配置的节点会显示错误

3. **检查字段映射配置**：
   - 进入字段映射管理页面
   - 查看功能对象的agentId配置
   - 未配置的功能对象会使用默认工作流

## 四、配置示例

### 示例1：配置独立页面节点

```typescript
// 创建AI角色
const role: AIRoleConfig = {
  id: 'ai-search-role-001',
  name: 'AI问答助手',
  description: '智能问答和搜索功能',
  source: 'independent-page',  // 关键：设置为independent-page
  provider: 'dify',
  enabled: true,
  // ... 其他配置
};
```

### 示例2：配置工作流Agent节点

```json
// 工作流节点配置
{
  "id": "agent-node-1",
  "type": "agent",
  "data": {
    "agentId": "role_123456",  // 关键：配置AI角色ID
    "label": "AI助手"
  }
}
```

### 示例3：配置字段映射功能对象

```typescript
// 字段映射配置
const fieldMappingConfig: FieldMappingConfig = {
  workflowId: 'wf_main',
  featureObjects: [
    {
      featureType: 'five-view-analysis',
      agentId: 'role_123456',  // 关键：配置专属AI角色ID
      label: '技术转译',
      // ... 其他配置
    }
  ],
  // ... 其他配置
};
```

## 五、常见问题

### Q1: 为什么独立页面节点找不到AI角色？

**A**: 检查以下几点：
1. AI角色的source是否为"independent-page"
2. 角色ID、名称或描述是否匹配节点类型的匹配规则
3. 角色是否已启用（enabled === true）

### Q2: 工作流中的Agent节点可以使用Direct Agent类型吗？

**A**: 不可以。工作流中的Agent节点只支持Dify类型的角色。Direct Agent类型只能在独立页面或直接调用时使用。

### Q3: 字段映射功能对象可以不配置agentId吗？

**A**: 可以。如果不配置agentId，系统会使用当前工作流的默认配置。配置专属agentId可以实现功能对象的独立AI角色配置。

### Q4: 如何查看节点的配置状态？

**A**: 在AI角色管理页面（`/ai-roles`）的信息框中，可以查看所有节点的配置状态。绿色表示已配置，橙色表示未配置。

## 六、相关文件

### 核心文件

- `frontend/src/utils/nodeRoleMapping.ts` - 节点角色映射工具
- `frontend/src/components/AIRoleConfigInfoBox.tsx` - 配置信息框组件
- `backend/src/services/AgentWorkflowService.ts` - 工作流Agent节点执行
- `backend/src/modules/ai-search/application/useCases/TriggerAgent.usecase.ts` - 触发Agent逻辑

### 配置文件

- `frontend/src/config/workflowNodes.ts` - 工作流节点定义
- `frontend/src/types/aiRole.ts` - AI角色类型定义
- `frontend/src/types/aiSearch.ts` - 字段映射类型定义

## 七、总结

项目中共有**14个**需要配置AI角色的节点：

- **5个**独立页面节点
- **N个**工作流Agent节点（动态，取决于工作流设计）
- **8个**字段映射功能对象

所有配置都可以在AI角色管理页面的信息框中查看和管理。
