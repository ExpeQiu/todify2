import { ILLMProvider, LLMConfig } from './types';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { GoogleProvider } from './GoogleProvider';
import { LocalProvider } from './LocalProvider';

/**
 * LLM Provider 工厂
 * 根据配置创建不同的 Provider 实例
 */
export class LLMProviderFactory {
  /**
   * 根据配置创建 Provider 实例
   */
  static create(llmConfig: LLMConfig): ILLMProvider {
    switch (llmConfig.provider) {
      case 'openai':
        return new OpenAIProvider(llmConfig.apiKey, llmConfig.apiBaseUrl);
      
      case 'anthropic':
        return new AnthropicProvider(llmConfig.apiKey, llmConfig.apiBaseUrl);
      
      case 'google':
        return new GoogleProvider(llmConfig.apiKey, llmConfig.apiBaseUrl);
      
      case 'local':
        return new LocalProvider(llmConfig.apiBaseUrl || 'http://localhost:11434/v1');
      
      default:
        throw new Error(`不支持的 LLM Provider: ${llmConfig.provider}`);
    }
  }

  /**
   * 获取支持的 Provider 列表
   */
  static getSupportedProviders(): string[] {
    return ['openai', 'anthropic', 'google', 'local'];
  }
}

