import axios from 'axios';
import { AIRoleConfig } from '../types/aiRole';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120_000, // 增加到120秒（2分钟），适应AI请求的较长响应时间
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface AIRoleResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface AIRoleUsageLocation {
  type: 'independent-page' | 'agent-workflow' | 'multi-chat' | 'workflow-editor';
  name: string;
  path?: string;
  description?: string;
  nodeId?: string;
}

export interface AIRoleUsage {
  roleId: string;
  roleName: string;
  locations: AIRoleUsageLocation[];
  totalUsageCount: number;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    answer?: string;
    result?: string;
    conversation_id?: string;
    metadata?: any;
  };
  message?: string;
  error?: string;
}

/**
 * AI角色服务
 */
class AIRoleService {
  /**
   * 获取所有AI角色
   */
  async getAIRoles(): Promise<AIRoleConfig[]> {
    try {
      const response = await api.get('/ai-roles');
      if (response.data.success && response.data.data) {
        return response.data.data.map((role: any) => ({
          ...role,
          createdAt: new Date(role.createdAt),
          updatedAt: new Date(role.updatedAt),
        }));
      }
      return [];
    } catch (error: any) {
      const errorStatus = error?.response?.status || 'N/A';
      const errorCode = error?.code;
      
      // 对于404、500错误或连接错误（后端未运行），静默处理，不输出任何日志
      // 这是正常情况，不需要记录
      if (errorStatus === 404 || errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        // 静默失败，返回空数组
        return [];
      }
      
      // 其他错误才输出详细信息
      const errorMessage = error?.response?.data?.message || error?.message || '未知错误';
      const errorUrl = error?.config?.url || error?.request?.responseURL;
      const errorBaseURL = error?.config?.baseURL;
      console.error('🔴 [aiRoleService] 获取AI角色列表失败');
      console.error('错误消息:', errorMessage);
      console.error('HTTP状态码:', errorStatus);
      console.error('请求URL:', errorUrl);
      console.error('Base URL:', errorBaseURL);
      
      throw error;
    }
  }

  /**
   * 获取单个AI角色
   */
  async getAIRole(id: string): Promise<AIRoleConfig | null> {
    try {
      const response = await api.get(`/ai-roles/${id}`);
      if (response.data.success && response.data.data) {
        const role = response.data.data;
        return {
          ...role,
          createdAt: new Date(role.createdAt),
          updatedAt: new Date(role.updatedAt),
        };
      }
      return null;
    } catch (error) {
      console.error('获取AI角色失败:', error);
      return null;
    }
  }

  /**
   * 创建AI角色
   */
  async createAIRole(config: Omit<AIRoleConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIRoleResponse> {
    try {
      const response = await api.post('/ai-roles', config);
      return response.data;
    } catch (error) {
      console.error('创建AI角色失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建AI角色失败',
      };
    }
  }

  /**
   * 更新AI角色
   */
  async updateAIRole(id: string, updates: Partial<AIRoleConfig>): Promise<AIRoleResponse> {
    try {
      const response = await api.put(`/ai-roles/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('更新AI角色失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新AI角色失败',
      };
    }
  }

  /**
   * 删除AI角色
   */
  async deleteAIRole(id: string): Promise<AIRoleResponse> {
    try {
      const response = await api.delete(`/ai-roles/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除AI角色失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除AI角色失败',
      };
    }
  }

  /**
   * 与AI角色对话
   */
  async chatWithRole(
    roleId: string,
    query: string,
    inputs: any = {},
    conversationId?: string
  ): Promise<ChatResponse> {
    try {
      const response = await api.post(`/ai-roles/${roleId}/chat`, {
        query,
        inputs,
        conversationId,
      }, {
        timeout: 420_000, // AI对话请求使用7分钟超时（独立Agent可能需要多轮工具调用，留出缓冲）
      });
      return response.data;
    } catch (error) {
      console.error('AI角色对话失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI角色对话失败',
      };
    }
  }

  /**
   * 测试AI角色连接
   */
  async testConnection(roleId: string): Promise<any> {
    try {
      const response = await api.post(`/ai-roles/${roleId}/test`);
      return response.data;
    } catch (error) {
      console.error('AI角色连接测试失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI角色连接测试失败',
      };
    }
  }

  /**
   * 获取AI角色的使用情况
   */
  async getRoleUsage(roleId: string): Promise<AIRoleUsage | null> {
    try {
      const response = await api.get(`/ai-roles/${roleId}/usage`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('获取AI角色使用情况失败:', error);
      return null;
    }
  }

  /**
   * 查找重复的AI角色
   */
  async findDuplicates(): Promise<{
    duplicates: Array<{
      key: string;
      roles: AIRoleConfig[];
      keep: AIRoleConfig;
      remove: AIRoleConfig[];
    }>;
    totalDuplicates: number;
  } | null> {
    try {
      const response = await api.get('/ai-roles/duplicates');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      const errorStatus = error?.response?.status || 'N/A';
      const errorCode = error?.code;
      
      // 对于404、500错误或连接错误（后端未运行或接口不存在），静默处理
      if (errorStatus === 404 || errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        return null;
      }
      
      // 其他错误才输出日志
      const errorMessage = error?.response?.data?.message || error?.message || '未知错误';
      console.error('查找重复角色失败:', errorMessage);
      return null;
    }
  }

  /**
   * 清除重复的AI角色
   */
  async removeDuplicates(): Promise<AIRoleResponse> {
    try {
      const response = await api.delete('/ai-roles/duplicates', {
        data: { confirm: true },
      });
      return response.data;
    } catch (error) {
      console.error('清除重复角色失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '清除重复角色失败',
      };
    }
  }
}

// 创建单例实例
export const aiRoleService = new AIRoleService();
export default aiRoleService;

