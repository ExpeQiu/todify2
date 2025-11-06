import axios from 'axios';
import { 
  AgentWorkflow, 
  WorkflowExecution, 
  WorkflowTemplate,
  AgentWorkflowNode,
  AgentWorkflowEdge 
} from '../types/agentWorkflow';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Agent工作流服务
 */
class AgentWorkflowService {
  /**
   * 获取所有工作流
   */
  async getAllWorkflows(): Promise<AgentWorkflow[]> {
    try {
      const response = await api.get('/agent-workflows');
      if (response.data.success && response.data.data) {
        return response.data.data.map((wf: any) => ({
          ...wf,
          nodes: typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : wf.nodes,
          edges: typeof wf.edges === 'string' ? JSON.parse(wf.edges) : wf.edges,
          metadata: wf.metadata ? (typeof wf.metadata === 'string' ? JSON.parse(wf.metadata) : wf.metadata) : undefined,
          published: wf.published === 1 || wf.published === true,
        }));
      }
      return [];
    } catch (error: any) {
      const errorStatus = error?.response?.status || 'N/A';
      const errorCode = error?.code;
      
      // 对于500错误或连接错误（后端未运行），静默处理，返回空数组
      if (errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        return [];
      }
      
      console.error('获取工作流列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取工作流
   */
  async getWorkflowById(id: string): Promise<AgentWorkflow | null> {
    try {
      const response = await api.get(`/agent-workflows/${id}`);
      if (response.data.success && response.data.data) {
        const wf = response.data.data;
        return {
          ...wf,
          nodes: typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : wf.nodes,
          edges: typeof wf.edges === 'string' ? JSON.parse(wf.edges) : wf.edges,
          metadata: wf.metadata ? (typeof wf.metadata === 'string' ? JSON.parse(wf.metadata) : wf.metadata) : undefined,
          published: wf.published === 1 || wf.published === true,
        };
      }
      return null;
    } catch (error) {
      console.error('获取工作流失败:', error);
      return null;
    }
  }

  /**
   * 创建工作流
   */
  async createWorkflow(data: {
    name: string;
    description?: string;
    version?: string;
    nodes: AgentWorkflowNode[];
    edges: AgentWorkflowEdge[];
    metadata?: Record<string, any>;
  }): Promise<AgentWorkflow> {
    try {
      const response = await api.post('/agent-workflows', data);
      if (response.data.success && response.data.data) {
        const wf = response.data.data;
        return {
          ...wf,
          nodes: typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : wf.nodes,
          edges: typeof wf.edges === 'string' ? JSON.parse(wf.edges) : wf.edges,
          metadata: wf.metadata ? (typeof wf.metadata === 'string' ? JSON.parse(wf.metadata) : wf.metadata) : undefined,
          published: wf.published === 1 || wf.published === true,
        };
      }
      throw new Error(response.data.error || '创建工作流失败');
    } catch (error: any) {
      const errorStatus = error?.response?.status || 'N/A';
      const errorCode = error?.code;
      
      // 对于500错误或连接错误（后端未运行），提供更友好的错误信息
      if (errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        const friendlyError = new Error('后端服务器未运行，请启动后端服务器后重试');
        // 完全静默处理，不输出任何日志
        throw friendlyError;
      }
      
      console.error('创建工作流失败:', error);
      throw error;
    }
  }

  /**
   * 更新工作流
   */
  async updateWorkflow(id: string, data: Partial<AgentWorkflow>): Promise<AgentWorkflow> {
    try {
      const response = await api.put(`/agent-workflows/${id}`, data);
      if (response.data.success && response.data.data) {
        const wf = response.data.data;
        return {
          ...wf,
          nodes: typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : wf.nodes,
          edges: typeof wf.edges === 'string' ? JSON.parse(wf.edges) : wf.edges,
          metadata: wf.metadata ? (typeof wf.metadata === 'string' ? JSON.parse(wf.metadata) : wf.metadata) : undefined,
          published: wf.published === 1 || wf.published === true,
        };
      }
      throw new Error(response.data.error || '更新工作流失败');
    } catch (error: any) {
      const errorStatus = error?.response?.status || 'N/A';
      const errorCode = error?.code;
      
      // 对于500错误或连接错误（后端未运行），提供更友好的错误信息
      if (errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        const friendlyError = new Error('后端服务器未运行，请启动后端服务器后重试');
        // 完全静默处理，不输出任何日志
        throw friendlyError;
      }
      
      console.error('更新工作流失败:', error);
      throw error;
    }
  }

  /**
   * 删除工作流
   */
  async deleteWorkflow(id: string): Promise<boolean> {
    try {
      const response = await api.delete(`/agent-workflows/${id}`);
      return response.data.success;
    } catch (error) {
      console.error('删除工作流失败:', error);
      return false;
    }
  }

  /**
   * 搜索工作流
   */
  async searchWorkflows(query: string): Promise<AgentWorkflow[]> {
    try {
      const response = await api.get('/agent-workflows/search', {
        params: { q: query }
      });
      if (response.data.success && response.data.data) {
        return response.data.data.map((wf: any) => ({
          ...wf,
          nodes: typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : wf.nodes,
          edges: typeof wf.edges === 'string' ? JSON.parse(wf.edges) : wf.edges,
          metadata: wf.metadata ? (typeof wf.metadata === 'string' ? JSON.parse(wf.metadata) : wf.metadata) : undefined,
          published: wf.published === 1 || wf.published === true,
        }));
      }
      return [];
    } catch (error) {
      console.error('搜索工作流失败:', error);
      return [];
    }
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(id: string, input?: any): Promise<{ executionId: string; message: string }> {
    try {
      const response = await api.post(`/agent-workflows/${id}/execute`, { input });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || '执行工作流失败');
    } catch (error) {
      console.error('执行工作流失败:', error);
      throw error;
    }
  }

  /**
   * 获取执行历史
   */
  async getExecutionHistory(workflowId: string): Promise<WorkflowExecution[]> {
    try {
      const response = await api.get(`/agent-workflows/${workflowId}/executions`);
      if (response.data.success && response.data.data) {
        return response.data.data.map((exec: any) => ({
          ...exec,
          sharedContext: typeof exec.shared_context === 'string' ? JSON.parse(exec.shared_context) : exec.shared_context,
          nodeResults: typeof exec.node_results === 'string' ? JSON.parse(exec.node_results) : exec.node_results,
          error: exec.error ? (typeof exec.error === 'string' ? JSON.parse(exec.error) : exec.error) : undefined,
          metadata: exec.metadata ? (typeof exec.metadata === 'string' ? JSON.parse(exec.metadata) : exec.metadata) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('获取执行历史失败:', error);
      return [];
    }
  }

  /**
   * 获取执行详情
   */
  async getExecutionById(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const response = await api.get(`/executions/${executionId}`);
      if (response.data.success && response.data.data) {
        const exec = response.data.data;
        return {
          ...exec,
          sharedContext: typeof exec.shared_context === 'string' ? JSON.parse(exec.shared_context) : exec.shared_context,
          nodeResults: typeof exec.node_results === 'string' ? JSON.parse(exec.node_results) : exec.node_results,
          error: exec.error ? (typeof exec.error === 'string' ? JSON.parse(exec.error) : exec.error) : undefined,
          metadata: exec.metadata ? (typeof exec.metadata === 'string' ? JSON.parse(exec.metadata) : exec.metadata) : undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('获取执行详情失败:', error);
      return null;
    }
  }
}

/**
 * 模板服务
 */
class WorkflowTemplateService {
  /**
   * 获取所有模板
   */
  async getAllTemplates(category?: string): Promise<WorkflowTemplate[]> {
    try {
      const response = await api.get('/workflow-templates', {
        params: category ? { category } : {}
      });
      if (response.data.success && response.data.data) {
        return response.data.data.map((tpl: any) => ({
          ...tpl,
          workflowStructure: typeof tpl.workflow_structure === 'string' 
            ? JSON.parse(tpl.workflow_structure) 
            : tpl.workflow_structure,
          metadata: tpl.metadata ? (typeof tpl.metadata === 'string' ? JSON.parse(tpl.metadata) : tpl.metadata) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('获取模板列表失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取模板
   */
  async getTemplateById(id: string): Promise<WorkflowTemplate | null> {
    try {
      const response = await api.get(`/workflow-templates/${id}`);
      if (response.data.success && response.data.data) {
        const tpl = response.data.data;
        return {
          ...tpl,
          workflowStructure: typeof tpl.workflow_structure === 'string' 
            ? JSON.parse(tpl.workflow_structure) 
            : tpl.workflow_structure,
          metadata: tpl.metadata ? (typeof tpl.metadata === 'string' ? JSON.parse(tpl.metadata) : tpl.metadata) : undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('获取模板失败:', error);
      return null;
    }
  }

  /**
   * 创建模板
   */
  async createTemplate(data: {
    name: string;
    description: string;
    category: string;
    thumbnail?: string;
    workflowStructure: any;
    metadata?: Record<string, any>;
    isPublic?: boolean;
  }): Promise<WorkflowTemplate> {
    try {
      console.log('发送创建模板请求:', {
        name: data.name,
        category: data.category,
        workflowStructure: data.workflowStructure,
        workflowStructureType: typeof data.workflowStructure,
        workflowStructureKeys: data.workflowStructure ? Object.keys(data.workflowStructure) : null,
      });
      
      const response = await api.post('/workflow-templates', data);
      if (response.data.success && response.data.data) {
        const tpl = response.data.data;
        return {
          ...tpl,
          workflowStructure: typeof tpl.workflow_structure === 'string' 
            ? JSON.parse(tpl.workflow_structure) 
            : tpl.workflow_structure,
          metadata: tpl.metadata ? (typeof tpl.metadata === 'string' ? JSON.parse(tpl.metadata) : tpl.metadata) : undefined,
        };
      }
      throw new Error(response.data.error || '创建模板失败');
    } catch (error: any) {
      console.error('创建模板失败:', error);
      console.error('错误详情:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
      });
      throw error;
    }
  }

  /**
   * 从模板创建工作流
   */
  async createWorkflowFromTemplate(
    templateId: string, 
    options: {
      name: string;
      description?: string;
      agentMappings?: Record<string, string>;
    }
  ): Promise<AgentWorkflow> {
    try {
      const response = await api.post(`/workflow-templates/${templateId}/create-workflow`, options);
      if (response.data.success && response.data.data) {
        const wf = response.data.data;
        return {
          ...wf,
          nodes: typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : wf.nodes,
          edges: typeof wf.edges === 'string' ? JSON.parse(wf.edges) : wf.edges,
          metadata: wf.metadata ? (typeof wf.metadata === 'string' ? JSON.parse(wf.metadata) : wf.metadata) : undefined,
          published: wf.published === 1 || wf.published === true,
        };
      }
      throw new Error(response.data.error || '从模板创建工作流失败');
    } catch (error) {
      console.error('从模板创建工作流失败:', error);
      throw error;
    }
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const response = await api.delete(`/workflow-templates/${id}`);
      return response.data.success;
    } catch (error) {
      console.error('删除模板失败:', error);
      return false;
    }
  }
}

// 创建服务实例
export const agentWorkflowService = new AgentWorkflowService();
export const workflowTemplateService = new WorkflowTemplateService();

export default agentWorkflowService;

