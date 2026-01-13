import { aiRoleModel, executionTraceModel, performanceMetricModel } from '../../models';
import { DirectAgentConfig, ToolConfig } from '../../models/AIRole';
import { PromptManager } from './PromptManager';
import { ContextManager } from './ContextManager';
import { ToolExecutor } from './ToolExecutor';
import { ILLMProvider, ChatMessage, LLMConfig, LLMResponse, Tool } from '../llm/types';
import { LLMProviderFactory } from '../llm/ProviderFactory';
import { ChatMessageService } from '../ChatMessageService';
import { AgentError, AgentErrorHandler, AgentErrorCode } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent 执行结果
 */
export interface AgentExecutionResult {
  content: string;
  conversationId: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: any;
}

/**
 * Agent 编排服务
 * 负责执行完整的 Agent 流程
 */
export class AgentOrchestrator {
  private promptManager: PromptManager;
  private contextManager: ContextManager;
  private toolExecutor: ToolExecutor;
  private maxToolCallIterations: number = 10; // 防止无限循环
  private currentExecutionId: string = '';
  private currentAgentId: string = '';
  private currentConversationId: string = ''; // 当前对话ID，用于工具调用事件
  private toolCallsHistory: Array<{ toolName: string; status: string; error?: string }> = []; // 工具调用历史

  constructor() {
    this.promptManager = new PromptManager();
    this.contextManager = new ContextManager();
    this.toolExecutor = new ToolExecutor();
  }

  /**
   * 执行 Agent（核心方法）
   * @param roleId 角色ID
   * @param query 用户查询
   * @param conversationId 对话ID（可选，如果不存在会生成新的）
   * @param context 上下文数据（用于变量替换）
   * @returns 执行结果
   */
  async executeAgent(
    roleId: string,
    query: string,
    conversationId: string = '',
    context: Record<string, any> = {}
  ): Promise<AgentExecutionResult> {
    // 生成执行ID（用于追踪）
    const executionId = context.executionId || `exec-${Date.now()}-${uuidv4()}`;
    this.currentExecutionId = executionId;
    this.currentAgentId = roleId;

    // Mock模式检查
    if (process.env.AI_MOCK_MODE === 'true') {
      const mockResult = await this.getMockResponse(roleId, query, context);
      await this.logStep(executionId, 'mock_response', {
        type: 'mock',
        input: { query, context },
        output: { content: mockResult.content },
        duration: 0,
        status: 'success'
      });
      return mockResult;
    }

    const startTime = Date.now();
    const MAX_EXECUTION_TIME = 360000; // 6分钟总体超时（留出缓冲给前端7分钟超时）
    
    // 检查超时的辅助函数
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_EXECUTION_TIME) {
        throw new Error(`Agent执行超时：已执行 ${Math.round(elapsed / 1000)} 秒，超过最大执行时间 ${MAX_EXECUTION_TIME / 1000} 秒`);
      }
    };
    
    try {
      // 1. 获取 Agent 配置
      checkTimeout();
      await this.logStep(executionId, 'load_config', {
        type: 'config',
        input: { roleId },
        output: null,
        duration: 0,
        status: 'success'
      });

      const role = await aiRoleModel.getById(roleId);
      if (!role) {
        throw new Error(`AI角色不存在: ${roleId}`);
      }

      if (!role.agentConfig) {
        throw new Error(`Agent配置不存在: ${roleId}`);
      }

      const config = role.agentConfig;

      // 2. 生成或使用 conversationId
      const finalConversationId = conversationId || this.generateConversationId();
      this.currentConversationId = finalConversationId; // 保存当前对话ID
      this.toolCallsHistory = []; // 重置工具调用历史

      // 3. 检查 prompt 配置
      if (!config.prompt) {
        throw new Error(`Agent prompt配置不存在: ${roleId}`);
      }

      if (!config.prompt.systemPrompt) {
        throw new Error(`Agent systemPrompt配置不存在: ${roleId}`);
      }

      // 4. 渲染 System Prompt
      const promptStartTime = Date.now();
      const systemPrompt = this.promptManager.renderPrompt(
        config.prompt.systemPrompt,
        config.prompt.variables || [],
        context
      );
      await this.logStep(executionId, 'render_prompt', {
        type: 'prompt',
        input: { systemPrompt: config.prompt.systemPrompt, variables: config.prompt.variables, context },
        output: { systemPrompt },
        duration: Date.now() - promptStartTime,
        status: 'success'
      });

      // 4. 获取上下文消息
      checkTimeout();
      const contextStartTime = Date.now();
      const contextMessages = await this.contextManager.getContextMessages(
        finalConversationId,
        config.contextStrategy,
        query
      );
      await this.logStep(executionId, 'load_context', {
        type: 'context',
        input: { conversationId: finalConversationId, strategy: config.contextStrategy, query },
        output: { messageCount: contextMessages.length },
        duration: Date.now() - contextStartTime,
        status: 'success'
      });

      // 5. 检查 contextStrategy 配置
      if (!config.contextStrategy) {
        throw new Error(`Agent contextStrategy配置不存在: ${roleId}`);
      }

      // 6. 构建完整消息列表
      const messages: ChatMessage[] = [];
      
      // 根据策略决定是否包含 system prompt
      if (config.contextStrategy.includeSystemPrompt || contextMessages.length === 0) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }

      messages.push(...contextMessages);
      messages.push({
        role: 'user',
        content: query
      });

      // 6. 准备工具定义（Function Calling）
      const tools = this.prepareTools(config.tools || []);

      // 7. 获取 LLM Provider
      const provider = this.getProvider(config.llm);

      // 8. 调用 LLM（可能包含多轮工具调用）
      checkTimeout();
      const llmStartTime = Date.now();
      let response = await this.executeWithTools(provider, messages, config.llm, tools, config.tools || [], checkTimeout, executionId);
      const llmDuration = Date.now() - llmStartTime;
      
      // 记录性能指标
      await this.recordPerformanceMetrics(executionId, 'llm_call', llmDuration, response.usage);
      
      await this.logStep(executionId, 'llm_call', {
        type: 'llm',
        input: { messageCount: messages.length, toolCount: tools.length },
        output: { content: response.content, toolCalls: response.toolCalls?.length || 0 },
        duration: llmDuration,
        status: 'success'
      });

      // 9. 保存消息历史
      await this.saveMessages(finalConversationId, query, response, roleId, this.toolCallsHistory);

      // 10. 返回结果
      const totalDuration = Date.now() - startTime;
      
      // 记录总体执行时间
      await this.recordPerformanceMetrics(executionId, 'execution_time', totalDuration, { 
        roleId, 
        toolCalls: response.toolCalls?.length || 0 
      });
      
      await this.logStep(executionId, 'complete', {
        type: 'complete',
        input: { query },
        output: { content: response.content },
        duration: totalDuration,
        status: 'success'
      });

      return {
        content: response.content,
        conversationId: finalConversationId,
        usage: response.usage,
        metadata: {
          model: response.model,
          finishReason: response.finishReason,
          toolCalls: response.toolCalls?.length || 0,
          executionId,
          toolCallsHistory: this.toolCallsHistory.length > 0 ? this.toolCallsHistory : undefined
        }
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      
      // 标准化错误处理
      const agentError = AgentErrorHandler.normalizeError(error, {
        roleId,
        executionId,
        step: 'executeAgent'
      });
      
      await this.logStep(executionId, 'error', {
        type: 'error',
        input: { query, context },
        output: null,
        duration: totalDuration,
        status: 'failed',
        error: agentError.message,
        errorCode: agentError.code,
        errorDetails: agentError.details
      });
      
      // 抛出标准化的错误
      throw agentError;
    } finally {
      this.currentExecutionId = '';
      this.currentAgentId = '';
      this.currentConversationId = '';
    }
  }

  /**
   * 执行带工具调用的 LLM 请求（可能多轮）
   */
  private async executeWithTools(
    provider: ILLMProvider,
    messages: ChatMessage[],
    llmConfig: LLMConfig,
    tools: Tool[],
    toolConfigs: ToolConfig[],
    checkTimeout?: () => void,
    executionId?: string
  ): Promise<LLMResponse> {
    let iteration = 0;
    let currentMessages = [...messages];
    let lastResponse: LLMResponse;

    while (iteration < this.maxToolCallIterations) {
      // 检查超时
      if (checkTimeout) {
        checkTimeout();
      }
      
      // 调用 LLM
      const response = await provider.chat(currentMessages, llmConfig, tools.length > 0 ? tools : undefined);
      lastResponse = response;

      // LLM 调用后检查超时
      if (checkTimeout) {
        checkTimeout();
      }

      // 如果没有工具调用，直接返回
      if (!response.toolCalls || response.toolCalls.length === 0) {
        return response;
      }

      // 将 assistant 的回复添加到消息历史
      currentMessages.push({
        role: 'assistant',
        content: response.content || ''
      });

      // 执行工具调用（检查超时）
      if (checkTimeout) {
        checkTimeout();
      }
      const toolStartTime = Date.now();
      
      // 记录工具调用开始
      const toolCallsInThisIteration = response.toolCalls.map((tc: any) => ({
        toolName: tc.function.name,
        status: 'running'
      }));
      this.toolCallsHistory.push(...toolCallsInThisIteration);
      
      const toolResults = await this.executeTools(
        response.toolCalls, 
        toolConfigs, 
        checkTimeout, 
        executionId,
        this.currentConversationId
      );
      
      // 更新工具调用状态
      toolResults.forEach((result, index) => {
        const toolCall = this.toolCallsHistory.find(tc => tc.toolName === response.toolCalls[index]?.function.name);
        if (toolCall) {
          try {
            const resultData = JSON.parse(result.content);
            if (resultData.error) {
              toolCall.status = 'error';
              toolCall.error = resultData.error;
            } else {
              toolCall.status = 'complete';
            }
          } catch {
            toolCall.status = 'complete';
          }
        }
      });
      
      if (executionId) {
        await this.logStep(executionId, `tool_execution_${iteration}`, {
          type: 'tool',
          input: { toolCalls: response.toolCalls },
          output: { results: toolResults },
          duration: Date.now() - toolStartTime,
          status: 'success'
        });
      }

      // 工具执行后检查超时
      if (checkTimeout) {
        checkTimeout();
      }

      // 将工具调用结果添加到消息历史
      for (const result of toolResults) {
        currentMessages.push({
          role: 'tool',
          content: result.content,
          name: result.toolName,
          tool_call_id: result.toolCallId
        });
      }

      iteration++;
    }

    // 如果达到最大迭代次数，返回最后一次响应
    if (iteration >= this.maxToolCallIterations) {
      console.warn(`工具调用达到最大迭代次数: ${this.maxToolCallIterations}`);
    }

    return lastResponse!;
  }

  /**
   * 判断工具是否可以并行执行
   */
  private canExecuteInParallel(toolCalls: any[], toolConfigs: ToolConfig[]): boolean {
    // 如果只有一个工具调用，不需要并行
    if (toolCalls.length <= 1) {
      return false;
    }

    // 获取所有工具类型
    const types = toolCalls.map(tc => {
      const config = toolConfigs.find(c => c.name === tc.function.name);
      return config?.type;
    });

    // 定义可以并行执行的安全工具类型
    // 这些工具类型不会相互影响，可以安全地并行执行
    const parallelSafeTypes = ['search', 'calculation', 'time', 'api'];
    
    // 只有当所有工具类型都在安全列表中时，才允许并行执行
    return types.every(type => parallelSafeTypes.includes(type || ''));
  }

  /**
   * 执行单个工具调用
   */
  private async executeSingleTool(
    toolCall: any,
    toolConfig: ToolConfig,
    checkTimeout?: () => void,
    executionId?: string,
    conversationId?: string
  ): Promise<{ toolCallId: string; toolName: string; content: string }> {
    const TOOL_TIMEOUT = 60000; // 每个工具调用60秒超时
    const toolCallStartTime = Date.now();

    try {
      if (checkTimeout) {
        checkTimeout();
      }

      const result = await Promise.race([
        this.toolExecutor.executeTool(toolCall, toolConfig, conversationId),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error(`工具调用超时: ${toolCall.function.name} (${TOOL_TIMEOUT / 1000}秒)`)), TOOL_TIMEOUT)
        )
      ]);
      const toolDuration = Date.now() - toolCallStartTime;
      
      if (executionId) {
        await this.logStep(executionId, `tool_${toolCall.function.name}`, {
          type: 'tool_call',
          input: { toolName: toolCall.function.name, arguments: toolCall.function.arguments },
          output: { result },
          duration: toolDuration,
          status: 'success'
        });
      }

      return {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        content: result
      };
    } catch (error) {
      const toolDuration = Date.now() - toolCallStartTime;
      
      // 标准化错误处理
      const agentError = AgentErrorHandler.normalizeError(error, {
        executionId,
        step: `tool_${toolCall.function.name}`
      });
      
      console.error(`工具执行失败: ${toolCall.function.name}`, agentError);
      
      if (executionId) {
        await this.logStep(executionId, `tool_${toolCall.function.name}_error`, {
          type: 'tool_call',
          input: { toolName: toolCall.function.name, arguments: toolCall.function.arguments },
          output: null,
          duration: toolDuration,
          status: 'failed',
          error: agentError.message,
          errorCode: agentError.code,
          errorDetails: agentError.details
        });
      }

      // 返回标准化的错误信息（不抛出异常，让LLM决定如何处理）
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        content: JSON.stringify({ 
          error: agentError.message,
          errorCode: agentError.code,
          recoverable: agentError.recoverable,
          toolName: toolCall.function.name,
          details: agentError.details
        })
      };
    }
  }

  /**
   * 执行多个工具调用（支持并行执行）
   */
  private async executeTools(
    toolCalls: any[],
    toolConfigs: ToolConfig[],
    checkTimeout?: () => void,
    executionId?: string,
    conversationId?: string
  ): Promise<Array<{ toolCallId: string; toolName: string; content: string }>> {
    // 判断是否可以并行执行
    const canParallel = this.canExecuteInParallel(toolCalls, toolConfigs);

    if (canParallel) {
      // 并行执行工具
      const promises = toolCalls.map(toolCall => {
        const config = toolConfigs.find(t => t.enabled && t.name === toolCall.function.name);
        
        if (!config) {
          return Promise.resolve({
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            content: JSON.stringify({ error: `工具不存在或已禁用: ${toolCall.function.name}` })
          });
        }

        return this.executeSingleTool(toolCall, config, checkTimeout, executionId, conversationId);
      });

      const results = await Promise.all(promises);
      return results;
    } else {
      // 串行执行工具（保证顺序，适用于workflow、agent等有依赖的工具）
      const results: Array<{ toolCallId: string; toolName: string; content: string }> = [];

      for (const toolCall of toolCalls) {
        // 在每个工具调用前检查超时
        if (checkTimeout) {
          checkTimeout();
        }
        
        const config = toolConfigs.find(t => t.enabled && t.name === toolCall.function.name);
        
        if (!config) {
          results.push({
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            content: JSON.stringify({ error: `工具不存在或已禁用: ${toolCall.function.name}` })
          });
          continue;
        }

        // 使用executeSingleTool方法执行单个工具
        const result = await this.executeSingleTool(toolCall, config, checkTimeout, executionId, conversationId);
        results.push(result);
      }

      return results;
    }
  }


  /**
   * 准备工具定义（转换为 OpenAI Function 格式）
   */
  private prepareTools(toolConfigs: ToolConfig[]): Tool[] {
    return toolConfigs
      .filter(tool => tool.enabled)
      .map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: 'object',
            properties: this.buildToolProperties(tool.parameters),
            required: tool.parameters
              .filter(p => p.required)
              .map(p => p.name)
          }
        }
      }));
  }

  /**
   * 构建工具参数属性
   */
  private buildToolProperties(parameters: ToolConfig['parameters']): Record<string, any> {
    const properties: Record<string, any> = {};

    for (const param of parameters) {
      properties[param.name] = {
        type: param.type,
        description: param.description
      };

      if (param.enum) {
        properties[param.name].enum = param.enum;
      }

      if (param.default !== undefined) {
        properties[param.name].default = param.default;
      }
    }

    return properties;
  }

  /**
   * 根据配置获取 LLM Provider（使用工厂模式）
   */
  private getProvider(llmConfig: LLMConfig): ILLMProvider {
    return LLMProviderFactory.create(llmConfig);
  }

  /**
   * 保存消息历史
   */
  private async saveMessages(
    conversationId: string,
    userQuery: string,
    response: LLMResponse,
    roleId: string,
    toolCalls?: Array<{ toolName: string; status: string; error?: string }>
  ): Promise<void> {
    try {
      // 创建或更新对话会话
      await ChatMessageService.upsertConversation({
        conversation_id: conversationId,
        app_type: 'direct-agent',
        session_name: userQuery.substring(0, 50) + (userQuery.length > 50 ? '...' : ''),
        status: 'active'
      });

      // 保存用户消息
      const userMessageId = `user_${Date.now()}_${uuidv4()}`;
      await ChatMessageService.saveChatMessage({
        message_id: userMessageId,
        conversation_id: conversationId,
        message_type: 'user',
        content: userQuery,
        query: userQuery,
        app_type: 'direct-agent',
        status: 'completed'
      });

      // 保存助手回复
      const assistantMessageId = `assistant_${Date.now()}_${uuidv4()}`;
      await ChatMessageService.saveChatMessage({
        message_id: assistantMessageId,
        conversation_id: conversationId,
        message_type: 'assistant',
        content: response.content,
        app_type: 'direct-agent',
        prompt_tokens: response.usage.promptTokens,
        completion_tokens: response.usage.completionTokens,
        total_tokens: response.usage.totalTokens,
        status: 'completed'
      });
    } catch (error) {
      console.error('保存消息历史失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 生成对话ID
   */
  private generateConversationId(): string {
    return `conv-${Date.now()}-${uuidv4()}`;
  }

  /**
   * 记录性能指标
   */
  private async recordPerformanceMetrics(
    executionId: string, 
    metricType: string, 
    duration: number, 
    metadata?: any
  ): Promise<void> {
    try {
      await performanceMetricModel.create({
        execution_id: executionId,
        metric_type: metricType,
        metric_name: `${metricType}_${executionId}`,
        value: duration,
        unit: 'ms',
        metadata
      });

      // 如果有token使用信息，也记录
      if (metadata?.totalTokens) {
        await performanceMetricModel.create({
          execution_id: executionId,
          metric_type: 'token_usage',
          metric_name: `tokens_${executionId}`,
          value: metadata.totalTokens,
          unit: 'tokens',
          metadata
        });
      }
    } catch (error) {
      // 性能指标记录失败不应该影响主流程
      console.error('记录性能指标失败:', error);
    }
  }

  /**
   * 记录执行步骤
   */
  private async logStep(executionId: string, stepName: string, data: {
    type: string;
    input?: any;
    output?: any;
    duration: number;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
    errorCode?: string;
    errorDetails?: any;
  }): Promise<void> {
    try {
      await executionTraceModel.create({
        execution_id: executionId,
        agent_id: this.currentAgentId,
        step_name: stepName,
        step_type: data.type,
        input: data.input,
        output: data.output,
        duration: data.duration,
        status: data.status,
        error: data.error,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      // 日志记录失败不应该影响主流程
      console.error('记录执行步骤失败:', error);
    }
  }

  /**
   * 获取Mock响应（用于开发测试，节省成本）
   */
  private async getMockResponse(roleId: string, query: string, context: Record<string, any>): Promise<AgentExecutionResult> {
    try {
      const role = await aiRoleModel.getById(roleId);
      const roleName = role?.name || 'AI助手';
      const roleDescription = role?.description || '';

      // 生成高质量的模拟响应
      const mockContent = `[MOCK模式] 这是对"${query}"的模拟响应。

基于角色"${roleName}"的配置，我理解您的需求是：${query}

${roleDescription ? `角色描述：${roleDescription}\n\n` : ''}这是一个高质量的模拟回答，包含了合理的结构和内容：

1. **问题理解**：我理解您的问题是关于"${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"
2. **分析思路**：基于当前上下文，我会采用以下思路来分析...
3. **解决方案**：建议的解决方案包括...
4. **注意事项**：需要注意的是...

以上是Mock模式的模拟响应，实际使用时会调用真实的LLM服务。

上下文信息：${Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : '无'}`;

      return {
        content: mockContent,
        conversationId: `mock-${Date.now()}-${uuidv4()}`,
        usage: {
          promptTokens: 50,
          completionTokens: 100,
          totalTokens: 150
        },
        metadata: {
          model: 'mock',
          finishReason: 'stop',
          toolCalls: 0,
          isMock: true
        }
      };
    } catch (error) {
      // 如果获取角色失败，返回简单的Mock响应
      return {
        content: `[MOCK模式] 这是对"${query}"的模拟响应。\n\n基于您的问题，我理解您的需求是：${query}\n\n这是一个模拟回答，实际使用时会调用真实的LLM服务。`,
        conversationId: `mock-${Date.now()}-${uuidv4()}`,
        usage: {
          promptTokens: 10,
          completionTokens: 50,
          totalTokens: 60
        },
        metadata: {
          model: 'mock',
          finishReason: 'stop',
          toolCalls: 0,
          isMock: true
        }
      };
    }
  }
}

