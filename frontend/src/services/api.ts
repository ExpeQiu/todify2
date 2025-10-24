import axios from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60秒超时，与后端保持一致
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface WorkflowResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface DifyAPIConfig {
  id: string;
  name: string;
  description: string;
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 通用Dify API调用函数
const callDifyAPI = async (
  config: DifyAPIConfig,
  query: string,
  inputs: any = {},
  conversationId?: string
): Promise<WorkflowResponse> => {
  try {
    const response = await fetch(`${config.apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs,
        query,
        response_mode: 'blocking',
        conversation_id: conversationId || '',
        user: 'user-' + Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        result: data.answer,
        conversationId: data.conversation_id,
        messageId: data.message_id,
        metadata: data.metadata,
      }
    };
  } catch (error) {
    console.error('Dify API call error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Dify API调用失败'
    };
  }
};

// Dify Workflow API调用函数
const callDifyWorkflowAPI = async (
  config: DifyAPIConfig,
  inputs: any = {},
  user?: string,
  retryCount: number = 3
): Promise<WorkflowResponse> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      // 构建正确的API URL - workflow API统一使用 /workflows/run 端点
      let apiUrl: string;
      
      if (config.apiUrl.includes('/workflows/run')) {
        // 如果URL已经包含workflows/run，直接使用
        apiUrl = config.apiUrl;
      } else {
        // 否则拼接workflows/run端点
        const baseUrl = config.apiUrl.replace(/\/+$/, ''); // 移除末尾的斜杠
        apiUrl = `${baseUrl}/workflows/run`;
      }
      
      console.log(`Dify Workflow API URL (尝试 ${attempt}/${retryCount}):`, apiUrl);
      console.log('Dify Workflow API inputs:', inputs);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90秒超时，给后端更多处理时间
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs,
          response_mode: 'blocking',
          user: user || 'user-' + Date.now(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`Dify Workflow API error response (尝试 ${attempt}):`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        
        // 对于某些错误状态码，不进行重试
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const contentLength = response.headers.get('content-length');
      console.log(`响应内容长度: ${contentLength} bytes`);
      
      const data = await response.json();
      console.log('Dify Workflow API response:', data);
      
      return {
        success: true,
        data: { 
          result: data.data?.outputs?.answer || data.data?.outputs?.text || data.data?.outputs?.text3 || '', 
          ...data 
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.error(`Dify Workflow API call error (尝试 ${attempt}/${retryCount}):`, {
        message: lastError.message,
        name: lastError.name,
        stack: lastError.stack
      });
      
      // 如果是网络错误或超时错误，且还有重试次数，则等待后重试
      if (attempt < retryCount && (
        lastError.name === 'AbortError' || 
        lastError.message.includes('Failed to fetch') ||
        lastError.message.includes('ERR_CONTENT_LENGTH_MISMATCH') ||
        lastError.message.includes('network') ||
        lastError.message.includes('timeout')
      )) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 指数退避，最大5秒
        console.log(`等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // 如果是最后一次尝试或不可重试的错误，直接抛出
      if (attempt === retryCount) {
        break;
      }
    }
  }
  
  return {
    success: false,
    error: lastError ? `API调用失败 (${retryCount}次尝试): ${lastError.message}` : 'Dify Workflow API调用失败',
  };
};

export const workflowAPI = {
  // AI问答 - 支持自定义Dify配置
  aiSearch: async (query: string, inputs: any = {}, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify API
    if (difyConfig) {
      return await callDifyAPI(difyConfig, query, inputs, conversationId);
    }
    
    // 否则使用原有的后端API
    try {
      const response = await api.post('/workflow/ai-search', { 
        query,
        inputs,
        conversation_id: conversationId
      });
      return response.data;
    } catch (error) {
      console.error('AI search API error:', error);
      return {
        success: false,
        error: 'AI问答请求失败'
      };
    }
  },

  // 智能搜索 - 支持自定义Dify配置
  smartSearch: async (query: string, difyConfig?: DifyAPIConfig): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify API
    if (difyConfig) {
      return await callDifyAPI(difyConfig, query);
    }
    
    // 否则使用原有的后端API
    try {
      const response = await api.post('/workflow/smart-search', { query });
      return response.data;
    } catch (error) {
      console.error('Smart search API error:', error);
      return {
        success: false,
        error: '智能搜索请求失败'
      };
    }
  },

  // 技术包装 - 支持自定义Dify配置
  techPackage: async (searchResults: any, template?: string, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify Workflow API
    if (difyConfig) {
      // 技术包装使用Workflow API
      const query = typeof searchResults === 'string' ? searchResults : JSON.stringify(searchResults);
      
      console.log('Dify Workflow API查询内容:', query.substring(0, 200) + '...');
      
      // 使用workflow API，传递正确的输入参数
      const inputs = {
        input1: query, // 技术包装使用input1作为输入
        query: query,
        searchResults: query,
        template: template || 'default'
      };
      
      console.log('Dify Workflow API输入参数:', inputs);
      
      // 使用API Key作为workflow ID（去掉app-前缀）
      // 注意：Dify Workflow API不需要在URL中指定workflow ID，API Key已包含应用信息
      
      return await callDifyWorkflowAPI(difyConfig, inputs);
    }
    
    // 否则使用原有的后端API
    try {
      // 兼容两种调用方式：
      // 1. WorkflowPage: techPackage(stepData.smartSearch, template)
      // 2. TechPackageNode: techPackage({ query, selectedKnowledgePoints })
      let inputs: any;
      
      if (searchResults && typeof searchResults === 'object' && searchResults.query) {
        // TechPackageNode调用方式
        inputs = {
          query: searchResults.query,
          selectedKnowledgePoints: searchResults.selectedKnowledgePoints
        };
      } else {
        // WorkflowPage调用方式
        inputs = {
          searchResults: searchResults,
          template: template
        };
      }
      
      // 添加conversationId到请求中
      const requestData: any = { inputs: inputs };
      if (conversationId) {
        requestData.conversation_id = conversationId;
      }
      
      const response = await api.post('/workflow/tech-package', requestData);
      return response.data;
    } catch (error) {
      console.error('Tech package API error:', error);
      return {
        success: false,
        error: '技术包装请求失败'
      };
    }
  },

  // 技术策略 - 支持自定义Dify配置
  techStrategy: async (techPackage: any, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify Workflow API
    if (difyConfig) {
      // 技术策略使用Workflow API
      const query = typeof techPackage === 'string' ? techPackage : JSON.stringify(techPackage);
      
      console.log('Dify Workflow API查询内容:', query.substring(0, 200) + '...');
      
      // 使用workflow API，传递正确的输入参数
      const inputs = {
        input2: query, // 技术策略使用input2作为输入
        query: query,
        techPackage: query,
        template: 'default'
      };
      
      console.log('Dify Workflow API输入参数:', inputs);
      
      // 使用API Key作为workflow ID（去掉app-前缀）
      // 注意：Dify Workflow API不需要在URL中指定workflow ID，API Key已包含应用信息
      
      return await callDifyWorkflowAPI(difyConfig, inputs);
    }
    
    // 否则使用原有的后端API
    try {
      const requestData: any = { 
        inputs: { techPackage }
      };
      if (conversationId) {
        requestData.conversation_id = conversationId;
      }
      
      const response = await api.post('/workflow/tech-strategy', requestData);
      return response.data;
    } catch (error) {
      console.error('Tech strategy API error:', error);
      return {
        success: false,
        error: '技术策略请求失败'
      };
    }
  },

  // 推广策略 - 支持自定义Dify配置
  promotionStrategy: async (techStrategy: any, difyConfig?: DifyAPIConfig): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify API
    if (difyConfig) {
      const query = typeof techStrategy === 'string' ? techStrategy : JSON.stringify(techStrategy);
      return await callDifyAPI(difyConfig, query, { techStrategy });
    }
    
    // 否则使用原有的后端API
    try {
      const response = await api.post('/workflow/promotion-strategy', { 
        inputs: { techStrategy }
      });
      return response.data;
    } catch (error) {
      console.error('Promotion strategy API error:', error);
      return {
        success: false,
        error: '推广策略请求失败'
      };
    }
  },

  // 技术通稿 - 支持自定义Dify配置
  coreDraft: async (promotionStrategy: any, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify Workflow API
    if (difyConfig) {
      // 技术通稿使用Workflow API
      const query = typeof promotionStrategy === 'string' ? promotionStrategy : JSON.stringify(promotionStrategy);
      
      console.log('Dify Workflow API查询内容:', query.substring(0, 200) + '...');
      
      // 使用workflow API，传递正确的输入参数
      const inputs = {
        input3: query, // 技术通稿使用input3作为输入
        query: query,
        promotionStrategy: query,
        template: 'default'
      };
      
      console.log('Dify Workflow API输入参数:', inputs);
      
      // 使用API Key作为workflow ID（去掉app-前缀）
      // 注意：Dify Workflow API不需要在URL中指定workflow ID，API Key已包含应用信息
      
      return await callDifyWorkflowAPI(difyConfig, inputs);
    }
    
    // 否则使用原有的后端API
    try {
      const requestData: any = { 
        inputs: { promotionStrategy }
      };
      if (conversationId) {
        requestData.conversation_id = conversationId;
      }
      
      const response = await api.post('/workflow/core-draft', requestData);
      return response.data;
    } catch (error) {
      console.error('Core draft API error:', error);
      return {
        success: false,
        error: '技术通稿请求失败'
      };
    }
  },

  // 发布会演讲稿 - 支持自定义Dify配置
  speechGeneration: async (coreDraft: any, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify Workflow API
    if (difyConfig) {
      // 演讲稿生成使用Workflow API
      const query = typeof coreDraft === 'string' ? coreDraft : JSON.stringify(coreDraft);
      
      console.log('Dify Workflow API查询内容:', query.substring(0, 200) + '...');
      
      // 使用workflow API，传递正确的输入参数
      const inputs = {
        input4: query, // 发布会稿使用input4作为输入
        query: query,
        coreDraft: query,
        template: 'default'
      };
      
      console.log('Dify Workflow API输入参数:', inputs);
      
      // 使用API Key作为workflow ID（去掉app-前缀）
      // 注意：Dify Workflow API不需要在URL中指定workflow ID，API Key已包含应用信息
      
      return await callDifyWorkflowAPI(difyConfig, inputs);
    }
    
    // 否则使用原有的后端API
    try {
      const requestData: any = { 
        inputs: { coreDraft }
      };
      if (conversationId) {
        requestData.conversation_id = conversationId;
      }
      
      const response = await api.post('/workflow/speech-generation', requestData);
      return response.data;
    } catch (error) {
      console.error('Speech generation API error:', error);
      return {
        success: false,
        error: '演讲稿生成请求失败'
      };
    }
  },

  // 演讲稿 - 支持自定义Dify配置
  speech: async (coreDraft: any, difyConfig?: DifyAPIConfig): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify API
    if (difyConfig) {
      const query = typeof coreDraft === 'string' ? coreDraft : JSON.stringify(coreDraft);
      return await callDifyAPI(difyConfig, query, { coreDraft });
    }
    
    // 否则使用原有的后端API
    try {
      const response = await api.post('/workflow/tech-publish', { 
        inputs: { coreDraft }
      });
      return response.data;
    } catch (error) {
      console.error('Speech API error:', error);
      return {
        success: false,
        error: '演讲稿请求失败'
      };
    }
  },
};

export default api;