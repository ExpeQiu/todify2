## 目标
- 在现有“工作流方式进行配置”的基础上，新增“LangGraph 模式”编排与执行能力。
- 前端可视化仍沿用 React Flow 的编辑体验，后端通过适配器将节点/边转换为 LangGraph 图并运行。
- 与现有执行/历史记录/模板体系保持兼容，支持逐步增量上线。

## 总体架构
- 双引擎：`NativeDAGEngine`（现有）与`LangGraphEngine`（新增）。
- 适配层：`WorkflowLangGraphAdapter`，将前端 DSL（`nodes/edges`）映射到 LangGraph 的`StateGraph`/`Runnable`节点与条件边。
- 统一服务入口：在后端的工作流服务中按“编排模式”路由到不同引擎，统一返回结构化的`outputs/shared_context/node_results`。

## 后端改造
- 依赖与基础
  - 新增依赖：`@langchain/langgraph` 与必要的模型客户端（视现有模型接入而定，优先复用当前 DifyGateway 的对话/工作流能力）。
  - 新增目录：`backend/src/services/workflow/langgraph/`，包含：
    - `LangGraphEngine.ts`：图构建与执行（`buildGraph()`, `executeGraph()`）。
    - `WorkflowLangGraphAdapter.ts`：DSL → LangGraph 的节点/边映射与校验。
    - `nodes/*.ts`：节点实现（Input/Agent/Output/Condition/Assign/Transform/Merge/Memory 的`Runnable`封装）。
- 服务层路由
  - 在`AgentWorkflowService`新增“编排模式”分发：若为`langgraph`，则走`LangGraphEngine`；否则沿用现有拓扑执行。
  - 保持执行记录结构一致：写入`workflow_executions`并记录`engine=langgraph`、`node_results`、`shared_context`、`tokens/duration`等。
- API 扩展
  - `POST /api/v1/agent-workflows/:id/compile?engine=langgraph`：返回编译诊断（节点校验、未连接端口、类型不匹配、循环检测）。
  - `POST /api/v1/agent-workflows/:id/execute`：支持`engine`参数或从工作流配置读取默认引擎。
  - 执行详情：保持现有`GET /api/v1/executions/:id`格式不变。

## 前端改造
- 模式选择
  - 在`AgentWorkflowPage`增加“编排模式”切换（`native`/`langgraph`），保存到工作流配置。
  - `agentWorkflowService.execute(workflowId, { engine })`支持显式传参。
- 编译与诊断
  - 在画布右侧添加“编译检查（LangGraph）”按钮，显示未绑定输入/未命中输出/类型冲突/不可达节点等诊断列表。
- 兼容与提示
  - 对当前仅后端支持的节点类型（现状仅`input/agent/output`执行），在`langgraph`模式下逐步开放`condition/assign/transform/merge/memory`，不支持的节点在 UI 显示受限提示与替代建议。
- 执行与历史
  - 执行弹窗增加`engine`选择；历史列表与详情增加引擎标识与编排图快照。

## 类型与数据模型
- Workflow 元数据增加`engine`或`orchestrator`字段（默认`native`）。
- `WorkflowExecution`记录增加`engine='langgraph'`、`graph_version`与`graph_digest`（用于回溯）。
- 前端`agentWorkflow`类型补充`engine`枚举；服务层响应增加引擎信息。

## 映射与节点语义（Phase 1 → Phase 2）
- Phase 1（与现有后端能力对齐）
  - Input：初始化`state`，校验必填与默认值。
  - Agent：封装为`Runnable`，内部复用`DifyGateway`的角色对话/工作流调用，输出统一的`{ text, answer, content, tool_calls }`。
  - Output：聚合并规范化最终输出（优先 Output 节点的指定字段，其次 Agent 节点的常见字段）。
- Phase 2（扩展前端已有节点能力到后端）
  - Condition：在 LangGraph 中以条件边实现（表达式求值→路由）。
  - Assign/Transform：`Runnable`更新`state`，支持表达式、字段映射与简单 JS 变换。
  - Merge：多上游并行收敛，支持策略（覆盖/合并/优先级）。
  - Memory：与现有会话/向量存储集成，提供读写接口。

## 执行与历史一致性
- 统一拓扑快照：保存执行时的`nodes/edges/engine`与关键配置片段，便于审计与复现。
- 统一节点结果：每个节点写入`node_results[id] = { status, inputs, outputs, error, duration, tokens }`。
- 统一错误处理：`Agent`与`Condition`节点失败可配置为“中止/跳过/兜底路径”。

## 测试与验证
- 单元测试：
  - Adapter 映射测试（各节点的入/出端校验与条件边解析）。
  - Engine 执行测试（Input→Agent→Output 的串行；多 Agent 并行与收敛）。
- 集成测试：
  - `POST /execute?engine=langgraph`端到端，使用 Mock 的 DifyGateway。
  - 执行历史一致性与输出规范化验证。
- 前端 E2E：
  - 模式切换、编译诊断提示、执行结果展示与历史细节。

## 增量里程碑
- M1：后端引擎骨架与 Adapter（支持 Input/Agent/Output）、API 路由与执行记录打通；前端模式切换与基础执行。
- M2：条件与赋值/变换节点的 LangGraph 化；编译诊断完善；更多输出规范化与兜底策略。
- M3：Merge/Memory 节点、并行与收敛策略；前端历史快照与可视化回放；性能与并发压测。

## 注意事项
- 复用现有安全与凭证管理（不在日志中暴露密钥）。
- 打包体积与运行环境评估：后端优先落地，前端仅做编译诊断，不在浏览器运行 LangGraph。
- 通过`metadata`保留引擎相关可选配置（并发、重试、超时、容错策略）。