# 项目AI/Agent调用节点完整识别

本文档完整识别了todify3项目中所有的AI/Agent调用节点。

## 一、后端服务层调用节点

### 1. AgentOrchestrator（Agent编排器）
**位置**: `backend/src/services/agent/AgentOrchestrator.ts`
- **功能**: 执行Direct Agent类型的AI角色
- **调用方法**: `executeAgent(roleId, query, conversationId, context)`
- **特点**: 
  - 支持工具调用（Function Calling）
  - 支持多轮对话
  - 支持上下文管理
  - 支持Prompt变量替换
- **使用场景**: Direct Agent类型的AI角色对话

### 2. AgentWorkflowService（Agent工作流服务）
**位置**: `backend/src/services/AgentWorkflowService.ts`
- **调用节点1**: `executeRole(roleId, input)` - 直接执行AI角色
  - 支持Dify类型和Direct Agent类型
  - 根据provider类型选择不同的执行方式
  
- **调用节点2**: `executeWorkflow(workflowId, options)` - 执行工作流
  - 支持拓扑排序执行节点
  - 支持并行执行同一层节点
  
- **调用节点3**: `executeAgentNode(node, sharedContext)` - 执行工作流中的Agent节点
  - 支持Dify Chatflow模式
  - 支持Dify Workflow模式
  - 支持多轮对话（conversationId传递）

### 3. DifyClient（Dify客户端）
**位置**: `backend/src/services/DifyClient.ts`
- **调用节点1**: `aiSearch(query, inputs, conversationId)` - AI搜索
- **调用节点2**: `techPackage(inputs)` - 技术包装
- **调用节点3**: `techStrategy(inputs)` - 技术策略
- **调用节点4**: `techArticle(inputs)` - 技术通稿
- **调用节点5**: `coreDraft(inputs)` - 核心稿件
- **调用节点6**: `techPublish(inputs, conversationId)` - 技术发布
- **调用节点7**: `callApp(appType, inputs, responseMode, user)` - 通用应用调用
- **调用节点8**: `runWorkflow(appType, inputs, responseMode, user)` - 工作流调用

### 4. TriggerAgentUseCase（触发Agent用例）
**位置**: `backend/src/modules/ai-search/application/useCases/TriggerAgent.usecase.ts`
- **功能**: 触发子Agent执行（五看、三定、技术矩阵等）
- **调用方式**: 
  - 通过`agentWorkflowService.executeRole()`直接调用AI角色
  - 通过`agentWorkflowService.executeWorkflow()`调用工作流
- **支持的功能类型**:
  - `five-view-analysis` - 技术转译（五看）
  - `three-fix-analysis` - 用户场景挖掘（三定）
  - `tech-matrix` - 技术矩阵
  - `propagation-strategy` - 传播策略
  - `exhibition-video` - 展具与视频
  - `translation` - 翻译
  - `ppt-outline` - 技术讲稿
  - `script` - 脚本

### 5. ToolExecutor（工具执行器）
**位置**: `backend/src/services/agent/ToolExecutor.ts`
- **调用节点**: `executeTool(toolCall, toolConfig)` - 执行工具调用
- **支持的工具类型**:
  - `search` - 搜索工具
  - `calculation` - 计算工具
  - `time` - 时间工具
  - `api` - API调用工具
  - `workflow` - 工作流调用工具
  - `agent` - Agent调用工具（嵌套Agent调用）

## 二、前端服务层调用节点

### 1. workflowAPI（工作流API）
**位置**: `frontend/src/services/api.ts`
- **调用节点1**: `aiSearch(query, inputs, difyConfig, conversationId)` - AI搜索
- **调用节点2**: `smartSearch(query, difyConfig, conversationId)` - 智能搜索
- **调用节点3**: `techPackage(inputs, difyConfig)` - 技术包装
- **调用节点4**: `techStrategy(inputs, difyConfig)` - 技术策略
- **调用节点5**: `techArticle(inputs, difyConfig)` - 技术通稿
- **调用节点6**: `coreDraft(inputs, difyConfig)` - 核心稿件

### 2. aiRoleService（AI角色服务）
**位置**: `frontend/src/services/aiRoleService.ts`
- **调用节点**: `chatWithRole(roleId, query, inputs)` - 与AI角色对话
  - 支持Dify类型和Direct Agent类型
  - 自动根据角色配置选择调用方式

### 3. aiSearchService（AI搜索服务）
**位置**: `frontend/src/services/aiSearchService.ts`
- **调用节点**: `triggerFeatureAgent(conversationId, payload)` - 触发功能Agent
  - 用于触发子Agent（五看、三定等）
  - 支持上下文窗口大小配置

### 4. WorkflowEngine（工作流引擎）
**位置**: `frontend/src/services/workflowEngine.ts`
- **调用节点**: `callAgent(agent, input)` - 调用Agent
  - 通过`aiRoleService.chatWithRole()`调用
  - 用于前端工作流执行

## 三、前端页面/组件层调用节点

### 1. BaseAISearchPage（基础AI搜索页面）
**位置**: `frontend/src/components/ai-search/BaseAISearchPage.tsx`
- **调用节点**: `handleTriggerFeature(featureType)` - 触发功能Agent
  - 调用`aiSearchService.triggerFeatureAgent()`
  - 支持的功能类型：五看、三定、技术矩阵、传播策略等

### 2. AIChatPage（AI聊天页面）
**位置**: `frontend/src/pages/AIChatPage.tsx`
- **调用节点**: `handleSendMessage()` - 发送消息
  - 调用`workflowAPI.aiSearch()`
  - 支持多轮对话

### 3. ProjectResourcesPage（项目资源页面）
**位置**: `frontend/src/pages/ProjectResourcesPage.tsx`
- **调用节点**: `handleAISendMessage()` - AI问答发送消息
  - 调用`workflowAPI.aiSearch()`
  - 支持项目资源上下文

### 4. AiSearchComponent（AI搜索组件）
**位置**: `frontend/src/components/AiSearchComponent.tsx`
- **调用节点**: `handleAiSearch()` - AI搜索
  - 调用`workflowAPI.aiSearch()`

### 5. 独立节点组件
以下节点组件都包含AI调用：

#### AiSearchNode（AI搜索节点）
**位置**: `frontend/src/components/nodes/AiSearchNode.tsx`
- 调用`workflowAPI.aiSearch()`

#### TechPackageNode（技术包装节点）
**位置**: `frontend/src/components/nodes/TechPackageNode.tsx`
- 调用`workflowAPI.techPackage()`

#### CoreDraftNode（核心稿件节点）
**位置**: `frontend/src/components/nodes/CoreDraftNode.tsx`
- 调用`workflowAPI.coreDraft()`

#### PromotionStrategyNode（推广策略节点）
**位置**: `frontend/src/components/nodes/PromotionStrategyNode.tsx`
- 调用`workflowAPI.techStrategy()`

#### PressReleaseNode（新闻稿节点）
**位置**: `frontend/src/components/nodes/PressReleaseNode.tsx`
- 调用相关AI服务

#### TechNewsletterNode（技术通讯节点）
**位置**: `frontend/src/components/nodes/TechNewsletterNode.tsx`
- 调用相关AI服务

## 四、后端API路由层调用节点

### 1. AI角色路由
**位置**: `backend/src/routes/aiRole.ts`
- **路由**: `POST /api/v1/ai-roles/:id/chat`
  - 根据provider类型调用：
    - Direct Agent: `AgentOrchestrator.executeAgent()`
    - Dify: `DifyGateway.executeChat()` 或 `DifyGateway.executeWorkflow()`

### 2. AI搜索路由
**位置**: `backend/src/modules/ai-search/api/aiSearch.routes.ts`
- **路由1**: `POST /api/v1/ai-search/conversations/:id/messages` - 发送消息
  - 调用`SendMessageUseCase.execute()`
  
- **路由2**: `POST /api/v1/ai-search/conversations/:id/agents` - 触发子Agent
  - 调用`TriggerAgentUseCase.execute()`

### 3. 工作流路由
**位置**: `backend/src/routes/agentWorkflow.ts`
- **路由1**: `POST /api/v1/agent-workflows/:id/execute` - 执行工作流
  - 调用`agentWorkflowService.executeWorkflow()`
  
- **路由2**: `POST /api/v1/agent-workflows/roles/:id/execute` - 执行AI角色
  - 调用`agentWorkflowService.executeRole()`

### 4. 工作流API路由
**位置**: `backend/src/modules/workflow/api/workflow.routes.ts`
- **路由**: `POST /api/v1/workflow/ai-search` - AI搜索
  - 调用`ExecuteAiSearchUseCase.execute()`

## 五、工作流节点类型

### 1. Agent节点（工作流编辑器）
**位置**: `frontend/src/components/WorkflowEditor/AgentNode.tsx`
- **类型**: `agent`
- **功能**: 在工作流中调用AI角色
- **执行**: 通过后端`AgentWorkflowService.executeAgentNode()`执行

### 2. 其他工作流节点类型
- `input` - 输入节点
- `output` - 输出节点
- `condition` - 条件判断节点
- `assign` - 变量赋值节点
- `merge` - 数据合并节点
- `transform` - 数据转换节点
- `memory` - 文本记忆节点

## 六、调用链路总结

### 链路1: 前端页面 → 前端服务 → 后端API → 后端服务 → Dify/LLM
```
前端页面组件
  ↓
前端服务层 (workflowAPI/aiRoleService/aiSearchService)
  ↓
后端API路由层
  ↓
后端服务层 (AgentWorkflowService/DifyClient/AgentOrchestrator)
  ↓
Dify Gateway / LLM Provider
```

### 链路2: 工作流执行 → Agent节点 → AI角色
```
工作流执行
  ↓
Agent节点
  ↓
AgentWorkflowService.executeAgentNode()
  ↓
AI角色配置 (Dify/Direct Agent)
  ↓
Dify Gateway / AgentOrchestrator
```

### 链路3: 工具调用 → Agent嵌套调用
```
LLM工具调用
  ↓
ToolExecutor.executeTool()
  ↓
Agent工具类型
  ↓
AgentOrchestrator.executeAgent() (嵌套调用)
```

## 七、AI/Agent调用节点统计

### 后端调用节点（共15个）
1. AgentOrchestrator.executeAgent()
2. AgentWorkflowService.executeRole()
3. AgentWorkflowService.executeWorkflow()
4. AgentWorkflowService.executeAgentNode()
5. DifyClient.aiSearch()
6. DifyClient.techPackage()
7. DifyClient.techStrategy()
8. DifyClient.techArticle()
9. DifyClient.coreDraft()
10. DifyClient.techPublish()
11. DifyClient.callApp()
12. DifyClient.runWorkflow()
13. TriggerAgentUseCase.execute()
14. ToolExecutor.executeTool() (agent类型)
15. SendMessageUseCase.execute()

### 前端调用节点（共10个）
1. workflowAPI.aiSearch()
2. workflowAPI.smartSearch()
3. workflowAPI.techPackage()
4. workflowAPI.techStrategy()
5. workflowAPI.techArticle()
6. workflowAPI.coreDraft()
7. aiRoleService.chatWithRole()
8. aiSearchService.triggerFeatureAgent()
9. WorkflowEngine.callAgent()
10. 各节点组件的AI调用方法

### 页面/组件调用节点（共8个）
1. BaseAISearchPage.handleTriggerFeature()
2. AIChatPage.handleSendMessage()
3. ProjectResourcesPage.handleAISendMessage()
4. AiSearchComponent.handleAiSearch()
5. AiSearchNode的AI调用
6. TechPackageNode的AI调用
7. CoreDraftNode的AI调用
8. PromotionStrategyNode的AI调用

### API路由调用节点（共4个）
1. POST /api/v1/ai-roles/:id/chat
2. POST /api/v1/ai-search/conversations/:id/messages
3. POST /api/v1/ai-search/conversations/:id/agents
4. POST /api/v1/agent-workflows/:id/execute

## 八、关键特性

1. **多Provider支持**: 支持Dify和Direct Agent两种类型
2. **多轮对话**: 支持conversationId传递，实现多轮对话
3. **工具调用**: 支持Function Calling，包括嵌套Agent调用
4. **工作流编排**: 支持复杂的工作流编排，Agent节点可嵌入工作流
5. **上下文管理**: 支持多种上下文管理策略（窗口、摘要等）
6. **字段映射**: 支持输入输出字段映射配置
7. **超时控制**: 支持执行超时控制
8. **错误重试**: 支持错误重试机制

## 九、总结

本项目共有**37个**主要的AI/Agent调用节点，分布在：
- 后端服务层：15个
- 前端服务层：10个
- 页面/组件层：8个
- API路由层：4个

这些调用节点形成了一个完整的AI/Agent调用体系，支持多种使用场景和调用方式。
