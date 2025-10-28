## 历史记录数据来源分析
### 1. 智能工作流记录
这些记录来自 `WorkflowPage.tsx` 页面，包括：

- ai-search : AI智能搜索工作流
- tech-package : 技术包装工作流
- tech-strategy : 技术策略工作流
- tech-article : 技术文章工作流
- core-draft : 核心文章工作流
- tech-publish : 技术发布工作流
这些工作流通过 workflowAPI 调用后端的 `workflow.ts` ，并且 会传递 conversationId 参数 来维持会话连续性。

### 2. 单独页面记录
这些记录主要来自 `AIChatPage.tsx` 页面：

- 独立AI聊天 : 使用 workflowAPI.aiSearch() 但 不传递 conversationId
- 每次对话都会创建新的会话记录
- 同样使用 ai-search 作为 app_type
### 3. 数据保存机制差异
智能工作流 ：

- 通过 `saveDifyWorkflowResponse` 保存
- 传递 conversationId 参数，支持会话连续性
- 保存完整的工作流执行记录
单独页面 ：

- 同样通过后端API保存，但每次都是新会话
- 不传递 conversationId ，每次调用都创建新的对话记录
### 4. 历史显示逻辑
`SearchHistoryPage.tsx` 通过 `getUserConversations` 获取所有类型的历史记录：

- 不区分数据来源 ：所有 app_type 的记录都会显示
- 统一格式化 ：通过 `formatConversationsForHistory` 统一处理显示格式
- 按时间排序 ：所有记录按创建时间倒序显示
## 结论
您的系统设计是 混合模式 ：

- ✅ 智能工作流记录 ：支持多步骤、有状态的工作流程
- ✅ 单独页面记录 ：支持独立的AI对话会话
- ✅ 统一历史显示 ：两种类型的记录都在同一个历史页面中展示
这种设计既满足了复杂工作流的需求，也支持了简单AI对话的场景，为用户提供了完整的历史记录查看体验。