import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface WorkflowResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const workflowAPI = {
  // AI问答
  aiSearch: async (query: string, inputs: any = {}): Promise<WorkflowResponse> => {
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

  // 智能搜索
  smartSearch: async (query: string): Promise<WorkflowResponse> => {
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

  // 技术包装
  techPackage: async (searchResults: any, template?: string): Promise<WorkflowResponse> => {
    try {
      const response = await api.post('/workflow/tech-package', { 
        inputs: { searchResults, template }
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

  // 推广策略
  promotionStrategy: async (techPackage: any): Promise<WorkflowResponse> => {
    try {
      const response = await api.post('/workflow/tech-strategy', { 
        inputs: { techPackage }
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

  // 核心稿件
  coreDraft: async (promotionStrategy: any, techPackage: any): Promise<WorkflowResponse> => {
    try {
      const response = await api.post('/workflow/tech-article', { 
        inputs: { promotionStrategy, techPackage }
      });
      return response.data;
    } catch (error) {
      console.error('Core draft API error:', error);
      return {
        success: false,
        error: '核心稿件请求失败'
      };
    }
  },

  // 演讲稿
  speech: async (coreDraft: any): Promise<WorkflowResponse> => {
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