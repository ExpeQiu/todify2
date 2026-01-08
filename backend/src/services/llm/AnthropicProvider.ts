import axios, { AxiosError } from 'axios';
import { ILLMProvider, ChatMessage, LLMConfig, LLMResponse, Tool, ToolCall } from './types';

/**
 * Anthropic (Claude) Provider 实现
 */
export class AnthropicProvider implements ILLMProvider {
  private apiKey: string;
  private apiBaseUrl: string;
  private timeout: number = 180000; // 180秒超时
  private maxRetries: number = 3;

  constructor(apiKey: string, apiBaseUrl?: string) {
    this.apiKey = apiKey;
    this.apiBaseUrl = apiBaseUrl || 'https://api.anthropic.com/v1';
  }

  /**
   * 发送聊天请求
   */
  async chat(messages: ChatMessage[], config: LLMConfig, tools?: Tool[]): Promise<LLMResponse> {
    const url = `${this.apiBaseUrl}/messages`;

    // Anthropic API 要求 system 消息单独传递
    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');
    const system = systemMessages.length > 0 
      ? systemMessages.map(m => m.content).join('\n')
      : undefined;

    // 转换消息格式为 Anthropic 格式
    const anthropicMessages = conversationMessages.map(msg => {
      if (msg.role === 'tool') {
        // Anthropic 使用 assistant 消息类型处理 tool 响应
        return {
          role: 'assistant' as const,
          content: `Tool ${msg.name} (${msg.tool_call_id}) returned: ${msg.content}`
        };
      }
      return {
        role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: msg.content
      };
    });

    // 转换工具为 Anthropic 格式
    let toolsConfig: any = undefined;
    if (tools && tools.length > 0) {
      toolsConfig = {
        tools: tools.map(tool => ({
          name: tool.function.name,
          description: tool.function.description,
          input_schema: tool.function.parameters
        }))
      };
    }

    const requestBody: any = {
      model: config.model,
      max_tokens: config.maxTokens,
      messages: anthropicMessages
    };

    if (system) {
      requestBody.system = system;
    }

    if (config.temperature !== undefined) {
      requestBody.temperature = config.temperature;
    }

    if (toolsConfig) {
      requestBody.tools = toolsConfig.tools;
      requestBody.tool_choice = { type: 'auto' };
    }

    let lastError: Error | null = null;
    
    // 重试逻辑
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await axios.post(url, requestBody, {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        });

        return this.parseResponse(response.data, config.model);
      } catch (error) {
        lastError = error as Error;
        
        // 如果是网络错误或超时，重试
        if (this.isRetryableError(error)) {
          if (attempt < this.maxRetries - 1) {
            // 指数退避
            await this.sleep(Math.pow(2, attempt) * 1000);
            continue;
          }
        }
        
        // 如果是客户端错误（4xx），不重试
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          if (axiosError.response && axiosError.response.status >= 400 && axiosError.response.status < 500) {
            throw this.handleError(error);
          }
        }
      }
    }

    throw this.handleError(lastError || new Error('未知错误'));
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const testMessage: ChatMessage = {
        role: 'user',
        content: 'Hello',
      };

      const testConfig: LLMConfig = {
        provider: 'anthropic',
        apiKey: this.apiKey,
        apiBaseUrl: this.apiBaseUrl,
        model: 'claude-3-haiku-20240307',
        temperature: 0.7,
        maxTokens: 10,
      };

      await this.chat([testMessage], testConfig);
      return true;
    } catch (error) {
      console.error('Anthropic连接测试失败:', error);
      return false;
    }
  }

  /**
   * 解析响应
   */
  private parseResponse(data: any, model: string): LLMResponse {
    const response: LLMResponse = {
      content: '',
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
      model: model,
      finishReason: this.mapFinishReason(data.stop_reason),
    };

    // 解析内容
    if (data.content && Array.isArray(data.content)) {
      const textContent = data.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join('');
      response.content = textContent;

      // 解析工具调用
      const toolUseItems = data.content.filter((item: any) => item.type === 'tool_use');
      if (toolUseItems.length > 0) {
        response.toolCalls = toolUseItems.map((item: any) => ({
          id: item.id,
          type: 'function' as const,
          function: {
            name: item.name,
            arguments: JSON.stringify(item.input)
          }
        }));
      }
    }

    return response;
  }

  /**
   * 映射完成原因
   */
  private mapFinishReason(reason: string): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
    switch (reason) {
      case 'end_turn':
      case 'stop_sequence':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'tool_use':
        return 'tool_calls';
      default:
        return 'stop';
    }
  }

  /**
   * 判断错误是否可重试
   */
  private isRetryableError(error: any): boolean {
    if (axios.isAxiosError(error)) {
      // 网络错误、超时、5xx错误可重试
      if (!error.response) {
        return true; // 网络错误
      }
      const status = error.response.status;
      return status >= 500 || status === 429; // 5xx 或限流
    }
    return false;
  }

  /**
   * 处理错误
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        switch (status) {
          case 401:
            return new Error('API密钥无效');
          case 429:
            return new Error('请求频率过高，请稍后重试');
          case 500:
          case 502:
          case 503:
            return new Error('Anthropic服务暂时不可用，请稍后重试');
          default:
            return new Error(data?.error?.message || `API请求失败: ${status}`);
        }
      }
      if (axiosError.code === 'ECONNABORTED') {
        return new Error('请求超时，请稍后重试');
      }
      return new Error('网络错误，请检查网络连接');
    }
    return error instanceof Error ? error : new Error('未知错误');
  }

  /**
   * 睡眠函数（用于重试延迟）
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

