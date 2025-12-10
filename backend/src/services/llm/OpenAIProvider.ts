import axios, { AxiosError } from 'axios';
import { ILLMProvider, ChatMessage, LLMConfig, LLMResponse, Tool, ToolCall } from './types';

/**
 * OpenAI Provider 实现
 */
export class OpenAIProvider implements ILLMProvider {
  private apiKey: string;
  private apiBaseUrl: string;
  private timeout: number = 180000; // 180秒超时（对于复杂任务和工具调用场景，支持多轮工具调用）
  private maxRetries: number = 3;

  constructor(apiKey: string, apiBaseUrl?: string) {
    this.apiKey = apiKey;
    this.apiBaseUrl = apiBaseUrl || 'https://api.openai.com/v1';
  }

  /**
   * 发送聊天请求
   */
  async chat(messages: ChatMessage[], config: LLMConfig, tools?: Tool[]): Promise<LLMResponse> {
    const url = `${this.apiBaseUrl}/chat/completions`;
    
    // Check if model requires max_completion_tokens (e.g., o1 series, gpt-5.1)
    const isReasoningModel = config.model.startsWith('o1') || config.model.startsWith('o3') || config.model === 'gpt-5.1';

    const requestBody: any = {
      model: config.model,
      messages: this.formatMessages(messages),
      temperature: config.temperature,
    };

    if (isReasoningModel) {
      requestBody.max_completion_tokens = config.maxTokens;
    } else {
      requestBody.max_tokens = config.maxTokens;
    }

    if (config.topP !== undefined) {
      requestBody.top_p = config.topP;
    }

    // 添加工具定义（如果提供）
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
    }

    let lastError: Error | null = null;
    
    // 重试逻辑
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await axios.post(url, requestBody, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        });

        return this.parseResponse(response.data);
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
        provider: 'openai',
        apiKey: this.apiKey,
        apiBaseUrl: this.apiBaseUrl,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 10,
      };

      await this.chat([testMessage], testConfig);
      return true;
    } catch (error) {
      console.error('OpenAI连接测试失败:', error);
      return false;
    }
  }

  /**
   * 格式化消息（OpenAI格式）
   */
  private formatMessages(messages: ChatMessage[]): any[] {
    return messages.map(msg => {
      const formatted: any = {
        role: msg.role,
        content: msg.content,
      };

      // 如果是 tool 消息，需要添加 name 和 tool_call_id
      if (msg.role === 'tool') {
        formatted.name = msg.name;
        formatted.tool_call_id = msg.tool_call_id;
      }

      // 如果是 assistant 消息且包含 tool_calls，需要特殊处理
      if (msg.role === 'assistant' && msg.name) {
        formatted.name = msg.name;
      }

      return formatted;
    });
  }

  /**
   * 解析响应
   */
  private parseResponse(data: any): LLMResponse {
    const choice = data.choices[0];
    const message = choice.message;

    const response: LLMResponse = {
      content: message.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      model: data.model,
      finishReason: this.mapFinishReason(choice.finish_reason),
    };

    // 解析工具调用
    if (message.tool_calls && message.tool_calls.length > 0) {
      response.toolCalls = message.tool_calls.map((tc: any) => ({
        id: tc.id,
        type: tc.type,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      }));
    }

    return response;
  }

  /**
   * 映射完成原因
   */
  private mapFinishReason(reason: string): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'tool_calls':
        return 'tool_calls';
      case 'content_filter':
        return 'content_filter';
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
            return new Error('OpenAI服务暂时不可用，请稍后重试');
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

