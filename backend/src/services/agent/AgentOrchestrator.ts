import { aiRoleModel } from '../../models';
import { DirectAgentConfig, ToolConfig } from '../../models/AIRole';
import { PromptManager } from './PromptManager';
import { ContextManager } from './ContextManager';
import { ToolExecutor } from './ToolExecutor';
import { ILLMProvider, ChatMessage, LLMConfig, LLMResponse, Tool } from '../llm/types';
import { OpenAIProvider } from '../llm/OpenAIProvider';
import { ChatMessageService } from '../ChatMessageService';
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
    const startTime = Date.now();
    const MAX_EXECUTION_TIME = 360000; // 6分钟总体超时（留出缓冲给前端7分钟超时）
    
    // 检查超时的辅助函数
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_EXECUTION_TIME) {
        throw new Error(`Agent执行超时：已执行 ${Math.round(elapsed / 1000)} 秒，超过最大执行时间 ${MAX_EXECUTION_TIME / 1000} 秒`);
      }
    };
    
    // 1. 获取 Agent 配置
    checkTimeout();
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

    // 3. 渲染 System Prompt
    const systemPrompt = this.promptManager.renderPrompt(
      config.prompt.systemPrompt,
      config.prompt.variables || [],
      context
    );

    // 4. 获取上下文消息
    checkTimeout();
    const contextMessages = await this.contextManager.getContextMessages(
      finalConversationId,
      config.contextStrategy,
      query
    );

    // 5. 构建完整消息列表
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
    let response = await this.executeWithTools(provider, messages, config.llm, tools, config.tools || [], checkTimeout);

    // 9. 保存消息历史
    await this.saveMessages(finalConversationId, query, response, roleId);

    // 10. 返回结果
    return {
      content: response.content,
      conversationId: finalConversationId,
      usage: response.usage,
      metadata: {
        model: response.model,
        finishReason: response.finishReason,
        toolCalls: response.toolCalls?.length || 0
      }
    };
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
    checkTimeout?: () => void
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
      const toolResults = await this.executeTools(response.toolCalls, toolConfigs, checkTimeout);

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
   * 执行多个工具调用
   */
  private async executeTools(
    toolCalls: any[],
    toolConfigs: ToolConfig[],
    checkTimeout?: () => void
  ): Promise<Array<{ toolCallId: string; toolName: string; content: string }>> {
    const results = [];
    const TOOL_TIMEOUT = 60000; // 每个工具调用60秒超时

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

      try {
        // 使用 ToolExecutor 执行工具，添加超时控制
        const result = await Promise.race([
          this.toolExecutor.executeTool(toolCall, config),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error(`工具调用超时: ${toolCall.function.name} (${TOOL_TIMEOUT / 1000}秒)`)), TOOL_TIMEOUT)
          )
        ]);
        results.push({
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          content: result
        });
      } catch (error) {
        console.error(`工具执行失败: ${toolCall.function.name}`, error);
        results.push({
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          content: JSON.stringify({ 
            error: error instanceof Error ? error.message : '工具执行失败' 
          })
        });
      }
    }

    return results;
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
   * 根据配置获取 LLM Provider
   */
  private getProvider(llmConfig: LLMConfig): ILLMProvider {
    switch (llmConfig.provider) {
      case 'openai':
        return new OpenAIProvider(llmConfig.apiKey, llmConfig.apiBaseUrl);
      
      // TODO: 其他 Provider（Phase 5）
      default:
        throw new Error(`不支持的 LLM Provider: ${llmConfig.provider}`);
    }
  }

  /**
   * 保存消息历史
   */
  private async saveMessages(
    conversationId: string,
    userQuery: string,
    response: LLMResponse,
    roleId: string
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
}

