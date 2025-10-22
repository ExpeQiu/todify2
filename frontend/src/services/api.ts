import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒超时
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
  user?: string
): Promise<WorkflowResponse> => {
  try {
    const response = await fetch(`${config.apiUrl}/workflows/run`, {
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
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: { 
        result: data.data?.outputs?.answer || data.data?.outputs?.text || '', 
        ...data 
      },
    };
  } catch (error) {
    console.error('Dify Workflow API call error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Dify Workflow API调用失败',
    };
  }
};

export const workflowAPI = {
  // AI问答 - 支持自定义Dify配置
  aiSearch: async (query: string, inputs: any = {}, difyConfig?: DifyAPIConfig): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify API
    if (difyConfig) {
      return await callDifyAPI(difyConfig, query, inputs);
    }
    
    // 否则使用原有的后端API
    try {
      const response = await api.post('/workflow/ai-search', { 
        query,
        inputs 
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
  techPackage: async (searchResults: any, template?: string, difyConfig?: DifyAPIConfig): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify Workflow API
    if (difyConfig) {
      // 使用workflow方式（智能工作流配置）
      const query = typeof searchResults === 'string' ? searchResults : JSON.stringify(searchResults);
      
      console.log('Dify Workflow API查询内容:', query.substring(0, 200) + '...');
      
      // 使用workflow API，传递正确的输入参数
      const inputs = {
        input1: query, // 使用input1作为主要输入参数
        query: query,
        searchResults: query,
        template: template || 'default'
      };
      
      console.log('Dify Workflow API输入参数:', inputs);
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
      
      const response = await api.post('/workflow/tech-package', { 
        inputs: inputs
      });
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
  techStrategy: async (techPackage: any, difyConfig?: DifyAPIConfig): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify Workflow API
    if (difyConfig) {
      // 使用workflow方式（智能工作流配置）
      const query = typeof techPackage === 'string' ? techPackage : JSON.stringify(techPackage);
      
      console.log('Dify Workflow API查询内容:', query.substring(0, 200) + '...');
      
      // 使用workflow API，传递正确的输入参数
      const inputs = {
        input1: query, // 使用input1作为主要输入参数
        input2: query, // 添加input2参数
        query: query,
        techPackage: query,
        template: 'default'
      };
      
      console.log('Dify Workflow API输入参数:', inputs);
      return await callDifyWorkflowAPI(difyConfig, inputs);
    }
    
    // 否则使用原有的后端API
    try {
      const response = await api.post('/workflow/tech-strategy', { 
        inputs: { techPackage }
      });
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
  coreDraft: async (promotionStrategy: any, difyConfig?: DifyAPIConfig): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify Workflow API
    if (difyConfig) {
      const query = typeof promotionStrategy === 'string' ? promotionStrategy : JSON.stringify(promotionStrategy);
      
      console.log('Dify Workflow API查询内容:', query.substring(0, 200) + '...');
      
      const inputs = {
        input1: query,
        input2: query, // 添加input2参数
        query: query,
        promotionStrategy: query,
        template: 'default'
      };
      
      console.log('Dify Workflow API输入参数:', inputs);
      return await callDifyWorkflowAPI(difyConfig, inputs);
    }
    
    // 否则使用原有的后端API
    try {
      const response = await api.post('/workflow/core-draft', { 
        inputs: { promotionStrategy }
      });
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
  speechGeneration: async (coreDraft: any, difyConfig?: DifyAPIConfig): Promise<WorkflowResponse> => {
    // 如果提供了自定义Dify配置，使用Dify Workflow API
    if (difyConfig) {
      const query = typeof coreDraft === 'string' ? coreDraft : JSON.stringify(coreDraft);
      
      console.log('Dify Workflow API查询内容:', query.substring(0, 200) + '...');
      
      const inputs = {
        input1: query,
        input2: query, // 添加input2参数
        query: query,
        coreDraft: query,
        template: 'default'
      };
      
      console.log('Dify Workflow API输入参数:', inputs);
      return await callDifyWorkflowAPI(difyConfig, inputs);
    }
    
    // 否则使用原有的后端API
    try {
      const response = await api.post('/workflow/speech-generation', { 
        inputs: { coreDraft }
      });
      return response.data;
    } catch (error) {
      console.error('Speech generation API error:', error);
      return {
        success: false,
        error: '发布会演讲稿请求失败'
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