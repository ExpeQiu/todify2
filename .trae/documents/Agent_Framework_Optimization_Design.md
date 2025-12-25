# Agent 设计框架优化方案

## 1. 现状分析 (Current State Analysis)

### 1.1 核心架构
目前系统采用**混合式双引擎架构**：
1.  **外部引擎 (Dify)**: 用于处理复杂的、预定义的业务流程（如 `ExecuteTechStrategy`），依赖 Dify 平台的 API。
2.  **内部引擎 (LangGraphEngine)**: 用于处理自定义的 Agent 工作流。
    -   **实现机制**: 基于拓扑排序 (Topological Sort) 的 DAG (有向无环图) 执行器。
    -   **局限性**: 
        -   不支持循环 (Cycles)：无法实现 "生成 -> 检查 -> 修改 -> 再检查" 的迭代优化流程。
        -   节点扩展性差：`executeNode` 方法中使用硬编码的 `switch-case`，难以动态扩展新节点类型。
        -   状态管理简单：仅依靠 `sharedContext` 透传，缺乏完善的状态机机制。

### 1.2 业务场景匹配度
从代码库中的业务线（如 `tech-strategy` (技术策略), `speech-generation` (演讲稿生成), `public-knowledge` (公共知识库)）来看，业务场景具有以下特征：
-   **长流程**: 需要多步推理和生成。
-   **需迭代**: 高质量的内容生成往往需要反复打磨（Review-Revise Loop）。
-   **多模态/多工具**: 涉及搜索、数据库查询、文本生成等。

**当前架构痛点**: 内部引擎无法支持复杂的迭代优化场景（因为不支持环），限制了 Agent 的智能上限。

## 2. 架构优化建议 (Architectural Optimization Proposal)

### 2.1 核心目标
将内部引擎从 **"DAG 执行器"** 升级为 **"图状态机 (Graph State Machine) 执行器"**，使其真正具备 LangGraph 的核心能力（循环、持久化、人机交互）。

### 2.2 详细设计

#### A. 引擎层重构 (Engine Refactoring)
放弃拓扑排序，改用 **事件驱动或指针驱动** 的执行模型。

*   **当前模型**: `Layer 1 -> Layer 2 -> Layer 3` (线性/分层)
*   **新模型**: `CurrentNode -> Execute -> Evaluate Edges -> NextNode` (状态跳转)

**新引擎伪代码逻辑**:
```typescript
class GraphEngine {
  async execute(state: WorkflowState) {
    let currentNode = this.startNode;
    while (currentNode && !this.isTerminated(state)) {
      // 1. 执行当前节点
      const result = await this.nodeExecutor.execute(currentNode, state);
      
      // 2. 更新状态
      state.update(result);
      
      // 3. 边评估与跳转 (支持条件分支)
      const nextNodeId = this.evaluateNextNode(currentNode, state);
      currentNode = this.getNode(nextNodeId);
      
      // 4. 循环检测与最大步数限制 (防止死循环)
      if (state.steps > MAX_STEPS) break;
    }
    return state;
  }
}
```

#### B. 节点扩展性 (Node Extensibility)
引入 **策略模式 (Strategy Pattern)** 解耦节点逻辑。

*   定义统一接口 `INodeExecutor`。
*   建立 `NodeRegistry` 进行注册。

```typescript
interface INodeExecutor {
  type: string;
  execute(node: NodeConfig, context: Context): Promise<NodeResult>;
}

// 注册表
class NodeExecutorRegistry {
  register('agent', new AgentNodeExecutor());
  register('tool', new ToolNodeExecutor());
  // 轻松扩展新类型
  register('human_review', new HumanReviewNodeExecutor()); 
}
```

#### C. 统一接口层 (Unified Interface)
屏蔽 Dify 和 内部引擎的差异，对外提供统一的 `WorkflowRunner`。

```typescript
interface IWorkflowRunner {
  run(workflowId: string, inputs: any): Promise<ExecutionResult>;
}

class HybridWorkflowRunner implements IWorkflowRunner {
  run(...) {
    if (isDifyWorkflow(id)) return difyRunner.run(...);
    return internalGraphRunner.run(...);
  }
}
```

## 3. 实施路径 (Implementation Roadmap)

1.  **Phase 1: 基础重构**
    -   定义 `INodeExecutor` 接口。
    -   将现有的 `executeNode` 中的 switch-case 拆分为独立的 Executor 类。
    -   保持现有的拓扑排序逻辑不变，先完成代码结构的解耦。

2.  **Phase 2: 引入图执行引擎**
    -   实现基于指针跳转的新版 `GraphEngine`。
    -   在 `AgentWorkflowService` 中放开对 "环" 的检测限制。
    -   支持 `Loop` 场景的测试。

3.  **Phase 3: 增强能力**
    -   添加 `HumanInTheLoop` 节点（人工确认）。
    -   增强状态持久化（支持断点续传）。

## 4. 预期收益
-   **能力提升**: 支持 Self-Reflection (自反思) 和 Iterative Refinement (迭代优化) 的 Agent 模式。
-   **维护性**: 新增节点类型无需修改引擎核心代码。
-   **一致性**: 统一的执行接口，便于前端监控和日志记录。
