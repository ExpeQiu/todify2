# AI/Agent 架构优化任务清单

> **创建时间**: 2026-01-12  
> **项目版本**: Todify4  
> **基于分析**: `AI_AGENT_COMPLETE_ANALYSIS.md`

---

## 📋 任务总览

| 优先级 | 任务数 | 总工作量 | 预计完成时间 |
|-------|-------|---------|------------|
| P1 (高) | 3 | 10天 | 2周 |
| P2 (中) | 3 | 5天 | 1周 |
| P3 (低) | 5 | 15天 | 3周 |
| **总计** | **11** | **30天** | **6周** |

---

## 🔴 P1: 高优先级任务

### T1: Mock模式增强

**任务描述**：为Direct Agent增加Mock模式，开发测试时节省成本

**当前状态**：
- ✅ Dify已有Mock降级
- ❌ Direct Agent缺少Mock模式

**实现方案**：
```typescript
// backend/src/services/agent/AgentOrchestrator.ts
async executeAgent(...) {
  if (process.env.AI_MOCK_MODE === 'true') {
    return this.getMockResponse(roleId, query);
  }
  // 正常执行
}

private getMockResponse(roleId: string, query: string): AgentExecutionResult {
  return {
    content: `这是对"${query}"的模拟响应（AI_MOCK_MODE=true）\n\n[模拟内容：基于角色${roleId}的配置生成]`,
    conversationId: `mock-${Date.now()}`,
    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    metadata: { model: 'mock', finishReason: 'stop', toolCalls: 0 }
  };
}
```

**验收标准**：
- ✅ 设置 `AI_MOCK_MODE=true` 后，Direct Agent返回模拟响应
- ✅ Mock响应格式与真实响应一致
- ✅ 不影响Dify Agent的正常调用

**工作量**：1天  
**负责人**：-  
**状态**：⏳ 待开始

---

### T2: 工具并行执行优化

**任务描述**：支持多个独立工具调用的并行执行，提升性能

**当前状态**：
- ❌ 工具调用为串行执行
- ❌ 多个search工具调用时性能低下

**实现方案**：
```typescript
// backend/src/services/agent/AgentOrchestrator.ts
private async executeTools(
  toolCalls: ToolCall[],
  toolConfigs: ToolConfig[],
  checkTimeout?: () => void
): Promise<Array<{ toolCallId: string; toolName: string; content: string }>> {
  // 判断是否可以并行执行
  const canParallel = this.canExecuteInParallel(toolCalls, toolConfigs);
  
  if (canParallel) {
    // 并行执行安全工具
    return Promise.all(toolCalls.map(toolCall => 
      this.executeSingleTool(toolCall, toolConfigs, checkTimeout)
    ));
  } else {
    // 串行执行（有依赖关系）
    const results = [];
    for (const toolCall of toolCalls) {
      const result = await this.executeSingleTool(toolCall, toolConfigs, checkTimeout);
      results.push(result);
    }
    return results;
  }
}

private canExecuteInParallel(toolCalls: ToolCall[], toolConfigs: ToolConfig[]): boolean {
  const parallelSafeTypes = ['search', 'calculation', 'time', 'api'];
  
  const types = toolCalls.map(tc => {
    const config = toolConfigs.find(c => c.name === tc.function.name);
    return config?.type;
  });
  
  return types.every(type => parallelSafeTypes.includes(type || ''));
}
```

**验收标准**：
- ✅ 多个search工具可以并行执行
- ✅ workflow和agent工具保持串行（有依赖关系）
- ✅ 错误处理正确（一个失败不影响其他）
- ✅ 性能提升明显（多个工具时，总耗时减少50%+）

**工作量**：2天  
**负责人**：-  
**状态**：⏳ 待开始

---

### T3: 执行追踪与可观测性

**任务描述**：为Agent执行增加详细的执行日志和性能追踪

**当前状态**：
- ❌ 缺少详细的执行日志
- ❌ 无法追踪Agent执行过程
- ❌ 无法分析性能瓶颈

**实现方案**：

1. **创建执行追踪服务**
```typescript
// backend/src/services/agent/ExecutionTracer.ts
export interface ExecutionStep {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ExecutionTrace {
  executionId: string;
  roleId: string;
  steps: ExecutionStep[];
  totalDuration: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls: number;
}

export class ExecutionTracer {
  private steps: ExecutionStep[] = [];
  private currentStep: ExecutionStep | null = null;
  
  startStep(name: string, metadata?: Record<string, any>) {
    if (this.currentStep) {
      this.endStep();
    }
    this.currentStep = {
      name,
      startTime: Date.now(),
      metadata
    };
  }
  
  endStep() {
    if (this.currentStep) {
      this.currentStep.endTime = Date.now();
      this.currentStep.duration = this.currentStep.endTime - this.currentStep.startTime;
      this.steps.push(this.currentStep);
      this.currentStep = null;
    }
  }
  
  getTrace(): ExecutionTrace {
    return {
      steps: this.steps,
      totalDuration: this.steps.reduce((sum, s) => sum + (s.duration || 0), 0),
      // ... 其他字段
    };
  }
}
```

2. **在AgentOrchestrator中集成**
```typescript
async executeAgent(...) {
  const tracer = new ExecutionTracer();
  
  tracer.startStep('loadConfig');
  const agent = await aiRoleModel.getById(roleId);
  tracer.endStep();
  
  tracer.startStep('renderPrompt');
  const systemPrompt = await promptManager.renderPrompt(...);
  tracer.endStep();
  
  // ... 其他步骤
  
  // 保存追踪记录
  await executionTraceModel.create(tracer.getTrace());
  
  return { ...result, trace: tracer.getTrace() };
}
```

3. **数据库模型**
```sql
CREATE TABLE execution_traces (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  steps TEXT NOT NULL, -- JSON
  total_duration INTEGER,
  token_usage TEXT, -- JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**验收标准**：
- ✅ 记录每个执行步骤的耗时
- ✅ 记录Token使用量
- ✅ 前端可以查看执行过程
- ✅ 支持性能分析

**工作量**：3天  
**负责人**：-  
**状态**：⏳ 待开始

---

## 🟡 P2: 中优先级任务

### T4: 多Provider支持

**任务描述**：实现多种LLM Provider支持（Azure OpenAI, Anthropic, Qwen, Ernie）

**当前状态**：
- ✅ Provider类型已定义
- ❌ 实际实现主要依赖OpenAI

**实现方案**：

1. **创建LLM Provider工厂**
```typescript
// backend/src/services/llm/LLMProviderFactory.ts
export interface ILLMProvider {
  chat(messages: ChatMessage[], config: LLMConfig, tools?: Tool[]): Promise<LLMResponse>;
}

export class LLMProviderFactory {
  static create(config: LLMConfig): ILLMProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'azure-openai':
        return new AzureOpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'qwen':
        return new QwenProvider(config);
      case 'ernie':
        return new ErnieProvider(config);
      default:
        throw new Error(`不支持的Provider: ${config.provider}`);
    }
  }
}
```

2. **实现各Provider**
- Azure OpenAI Provider（1天）
- Anthropic Provider（1天）
- Qwen Provider（1天）
- Ernie Provider（1天）

**验收标准**：
- ✅ 支持5种Provider类型
- ✅ 每种Provider有完整的错误处理
- ✅ 支持Function Calling（如果Provider支持）
- ✅ 统一的接口和响应格式

**工作量**：5天  
**负责人**：-  
**状态**：⏳ 待开始

---

### T5: 上下文消息查询优化

**任务描述**：优化上下文消息查询，数据库层面限制查询数量

**当前状态**：
- ❌ 每次全量查询历史消息后截取
- ❌ 数据库查询效率低

**实现方案**：
```typescript
// backend/src/services/agent/ContextManager.ts
async getContextMessages(conversationId: string, strategy: ContextStrategy) {
  // 根据策略提前计算需要的消息数量
  const limit = this.calculateMessageLimit(strategy);
  
  // 数据库层面限制查询数量
  const sql = `
    SELECT * FROM chat_messages 
    WHERE conversation_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `;
  const messages = await db.query(sql, [conversationId, limit]);
  
  // 反转顺序（从旧到新）
  return messages.reverse();
}

private calculateMessageLimit(strategy: ContextStrategy): number {
  switch (strategy.type) {
    case 'window':
      return strategy.maxMessages || 10;
    case 'summary':
      return strategy.maxMessages || 20; // 需要更多消息用于摘要
    case 'hybrid':
      return strategy.maxMessages || 15;
    default:
      return 10;
  }
}
```

**验收标准**：
- ✅ 数据库查询使用LIMIT限制
- ✅ 查询性能提升30%+
- ✅ 不影响功能正确性

**工作量**：2天  
**负责人**：-  
**状态**：⏳ 待开始

---

### T6: 统一错误处理

**任务描述**：统一错误返回格式，便于前端解析和处理

**当前状态**：
- ❌ 错误返回格式不统一
- ❌ 前端难以解析和处理

**实现方案**：
```typescript
// backend/src/services/agent/types.ts
export enum AgentErrorCode {
  TIMEOUT = 'TIMEOUT',
  TOOL_ERROR = 'TOOL_ERROR',
  LLM_ERROR = 'LLM_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export interface AgentError {
  code: AgentErrorCode;
  message: string;
  details?: any;
  recoverable: boolean;
  timestamp: number;
  stack?: string;
}

export class AgentErrorHandler {
  static normalizeError(error: any): AgentError {
    if (error instanceof AgentError) {
      return error;
    }
    
    // 根据错误类型分类
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return {
        code: AgentErrorCode.TIMEOUT,
        message: '请求超时',
        details: error,
        recoverable: true,
        timestamp: Date.now()
      };
    }
    
    // ... 其他错误类型
    
    return {
      code: AgentErrorCode.LLM_ERROR,
      message: error.message || '未知错误',
      details: error,
      recoverable: false,
      timestamp: Date.now(),
      stack: error.stack
    };
  }
}
```

**验收标准**：
- ✅ 所有错误统一格式
- ✅ 前端可以正确解析和处理
- ✅ 错误信息友好易懂

**工作量**：2天  
**负责人**：-  
**状态**：⏳ 待开始

---

## 🟢 P3: 低优先级任务

### T7: 工作流循环增强

**任务描述**：完善LoopNodeExecutor的循环逻辑

**当前状态**：
- ✅ LoopNodeExecutor已注册
- ❌ 循环逻辑不完善

**工作量**：3天  
**状态**：⏳ 待开始

---

### T8: 性能监控面板

**任务描述**：构建Token使用统计、耗时分析的前端面板

**工作量**：4天  
**状态**：⏳ 待开始

---

### T9: 配置动态化

**任务描述**：Dify API Key从数据库读取，支持动态配置

**工作量**：2天  
**状态**：⏳ 待开始

---

### T10: Agent配置缓存

**任务描述**：减少数据库查询，增加Agent配置缓存层

**工作量**：1天  
**状态**：⏳ 待开始

---

### T11: 流式响应支持

**任务描述**：支持SSE流式输出，提升用户体验

**工作量**：5天  
**状态**：⏳ 待开始

---

## 📊 进度跟踪

### Phase 1: 核心增强（1周）
- [ ] T1: Mock模式增强 (1天)
- [ ] T2: 工具并行执行 (2天)
- [ ] T3: 执行追踪 (3天)
- [ ] T6: 统一错误处理 (2天)

### Phase 2: Provider扩展（1周）
- [ ] T4: 多Provider支持 (5天)

### Phase 3: 性能优化（1周）
- [ ] T5: 上下文查询优化 (2天)
- [ ] T10: Agent配置缓存 (1天)
- [ ] T8: 性能监控面板 (4天)

### Phase 4: 生态完善（2周）
- [ ] T7: 工作流循环增强 (3天)
- [ ] T9: 配置动态化 (2天)
- [ ] T11: 流式响应支持 (5天)

---

**文档维护者**: AI Assistant  
**最后更新**: 2026-01-12  
**文档版本**: v1.0
