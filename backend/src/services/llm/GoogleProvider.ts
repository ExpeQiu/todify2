import axios, { AxiosError } from 'axios';
import { ILLMProvider, ChatMessage, LLMConfig, LLMResponse, Tool } from './types';

/**
 * Google (Gemini) Provider 实现
 */
export class GoogleProvider implements ILLMProvider {
  private apiKey: string;
  private apiBaseUrl: string;
  private timeout: number = 180000; // 180秒超时
  private maxRetries: number = 3;

  constructor(apiKey: string, apiBaseUrl?: string) {
    this.apiKey = apiKey;
    this.apiBaseUrl = apiBaseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * 发送聊天请求
   */
  async chat(messages: ChatMessage[], config: LLMConfig, tools?: Tool[]): Promise<LLMResponse> {
    const url = `${this.apiBaseUrl}/models/${config.model}:generateContent?key=${this.apiKey}`;

    // 转换消息格式为 Gemini 格式
    const contents = messages
      .filter(msg => msg.role !== 'system') // Gemini 不支持 system 消息
      .map(msg => {
        if (msg.role === 'tool') {
          // Gemini 使用 function_response 处理工具响应
          return {
            role: 'model',
            parts: [{
              functionResponse: {
                name: msg.name,
                response: JSON.parse(msg.content || '{}')
              }
            }]
          };
        }
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        };
      });

    // 添加 system instruction（作为第一条消息的指令）
    const systemMessages = messages.filter(m => m.role === 'system');
    let systemInstruction: string | undefined;
    if (systemMessages.length > 0) {
      systemInstruction = systemMessages.map(m => m.content).join('\n');
    }

    // 转换工具为 Gemini 格式
    let toolsConfig: any = undefined;
    if (tools && tools.length > 0) {
      toolsConfig = {
        function_declarations: tools.map(tool => ({
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters
        }))
      };
    }

    const requestBody: any = {
      contents
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const generationConfig: any = {
      maxOutputTokens: config.maxTokens,
    };

    if (config.temperature !== undefined) {
      generationConfig.temperature = config.temperature;
    }

    if (config.topP !== undefined) {
      generationConfig.topP = config.topP;
    }

    requestBody.generationConfig = generationConfig;

    if (toolsConfig) {
      requestBody.tools = [toolsConfig];
    }

    let lastError: Error | null = null;
    
    // 重试逻辑
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await axios.post(url, requestBody, {
          headers: {
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
        provider: 'google',
        apiKey: this.apiKey,
        apiBaseUrl: this.apiBaseUrl,
        model: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 10,
      };

      await this.chat([testMessage], testConfig);
      return true;
    } catch (error) {
      console.error('Google连接测试失败:', error);
      return false;
    }
  }

  /**
   * 解析响应
   */
  private parseResponse(data: any, model: string): LLMResponse {
    const candidate = data.candidates?.[0];
    const content = candidate?.content;
    const textPart = content?.parts?.find((part: any) => part.text);

    const response: LLMResponse = {
      content: textPart?.text || '',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      model: model,
      finishReason: this.mapFinishReason(candidate?.finishReason),
    };

    // 解析工具调用
    const functionCallPart = content?.parts?.find((part: any) => part.functionCall);
    if (functionCallPart?.functionCall) {
      const funcCall = functionCallPart.functionCall;
      response.toolCalls = [{
        id: funcCall.name,
        type: 'function' as const,
        function: {
          name: funcCall.name,
          arguments: JSON.stringify(funcCall.args || {})
        }
      }];
    }

    return response;
  }

  /**
   * 映射完成原因
   */
  private mapFinishReason(reason: string): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'FUNCTION_CALL':
        return 'tool_calls';
      case 'SAFETY':
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
            return new Error('Google服务暂时不可用，请稍后重试');
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

