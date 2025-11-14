import api from './api';
import { agentWorkflowService } from './agentWorkflowService';
import { techPointService } from './techPointService';
import { knowledgePointService } from './knowledgePointService';
import {
  Conversation,
  Message,
  OutputContent,
  WorkflowConfig,
  FileUploadResponse,
  CreateConversationRequest,
  SendMessageRequest,
  ApiResponse,
  Source,
  FieldMappingConfig,
} from '../types/aiSearch';

/**
 * AI问答服务
 */
class AiSearchService {
  private normalizeMessage(raw: any): Message {
    return {
      ...raw,
      createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
    };
  }

  /**
   * 获取配置的工作流
   */
  async getWorkflowConfig(pageType?: 'tech-package' | 'press-release'): Promise<WorkflowConfig | null> {
    try {
      // 先尝试从API获取配置的工作流ID，传递pageType参数
      const params = pageType ? `?pageType=${pageType}` : '';
      const response = await api.get(`/ai-search/workflow${params}`);
      if (response.data.success && response.data.data) {
        const workflowId = response.data.data.workflowId;
        // 获取工作流详情
        const workflows = await agentWorkflowService.getAllWorkflows();
        const workflow = workflows.find((w) => w.id === workflowId);
        if (workflow) {
          return this.convertWorkflowToConfig(workflow);
        }
      }
      
      // 如果没有配置，尝试查找默认工作流（根据页面类型）
      const workflows = await agentWorkflowService.getAllWorkflows();
      const defaultWorkflowName = pageType === 'press-release' ? '发布会稿工作流' : '智能工作流';
      const defaultWorkflow = workflows.find((w) => w.name === defaultWorkflowName);
      if (defaultWorkflow) {
        return this.convertWorkflowToConfig(defaultWorkflow);
      }
      
      // 返回第一个工作流
      if (workflows.length > 0) {
        return this.convertWorkflowToConfig(workflows[0]);
      }
      
      return null;
    } catch (error) {
      console.error('获取工作流配置失败:', error);
      return null;
    }
  }

  /**
   * 转换工作流为配置格式
   */
  private convertWorkflowToConfig(workflow: any): WorkflowConfig {
    // 从工作流的输入节点和输出节点提取参数
    const inputNode = workflow.nodes.find((n: any) => n.type === 'input');
    const outputNode = workflow.nodes.find((n: any) => n.type === 'output');
    
    const inputParameters = inputNode?.data?.inputs || [];
    const outputParameters = outputNode?.data?.outputs || [];
    
    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      inputParameters: inputParameters.map((p: any) => ({
        name: p.name,
        type: p.type || 'string',
        required: p.required || false,
        description: p.description,
      })),
      outputParameters: outputParameters.map((p: any) => ({
        name: p.name,
        type: p.type || 'object',
        description: p.description,
      })),
    };
  }

  /**
   * 获取文件列表
   */
  async getFiles(options?: {
    category?: string;
    conversationId?: string;
    pageType?: 'tech-package' | 'press-release';
    limit?: number;
    offset?: number;
    excludeGarbled?: boolean; // 排除乱码文件名
  }): Promise<FileUploadResponse[]> {
    try {
      const params = new URLSearchParams();
      if (options?.category) {
        params.set('category', options.category);
      }
      if (options?.conversationId) {
        params.set('conversationId', options.conversationId);
      }
      if (options?.pageType) {
        params.set('pageType', options.pageType);
      }
      if (options?.limit) {
        params.set('limit', String(options.limit));
      }
      if (options?.offset) {
        params.set('offset', String(options.offset));
      }
      if (options?.excludeGarbled !== false) {
        // 默认排除乱码文件名
        params.set('excludeGarbled', 'true');
      } else {
        // 如果明确设置为false，则不排除
        params.set('excludeGarbled', 'false');
      }

      const query = params.toString();
      const response = await api.get(`/ai-search/files${query ? `?${query}` : ''}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('获取文件列表失败:', error);
      return [];
    }
  }

  /**
   * 上传文件
   */
  async uploadFiles(files: File[], pageType?: 'tech-package' | 'press-release'): Promise<FileUploadResponse[]> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      // 如果提供了pageType，添加到formData
      if (pageType) {
        formData.append('pageType', pageType);
      }

      const response = await api.post('/ai-search/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || '文件上传失败');
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  }

  /**
   * 合并知识库内容
   */
  async mergeKnowledgeBaseContent(sources: Source[]): Promise<string> {
    const knowledgeBaseSources = sources.filter((s) => s.type === 'knowledge_base');
    
    if (knowledgeBaseSources.length === 0) {
      return '';
    }

    const contents: string[] = [];

    for (const source of knowledgeBaseSources) {
      try {
        // 从source.id中提取techPointId（格式：kb_${techPointId}）
        const techPointId = source.id.replace('kb_', '');
        const techPointIdNum = parseInt(techPointId, 10);
        
        if (isNaN(techPointIdNum)) {
          continue;
        }

        // 获取技术点详情
        const techPointResponse = await techPointService.getTechPointById(techPointIdNum);
        if (techPointResponse.success && techPointResponse.data) {
          const techPoint = techPointResponse.data;
          let techPointContent = `技术点：${techPoint.name}\n`;
          
          if (techPoint.description) {
            techPointContent += `描述：${techPoint.description}\n`;
          }

          // 获取该技术点的知识点
          const knowledgePointsResponse = await knowledgePointService.getByTechPointId(
            techPointIdNum,
            { page: 1, pageSize: 100 }
          );
          
          if (knowledgePointsResponse.success && knowledgePointsResponse.data) {
            const knowledgePoints = knowledgePointsResponse.data.data || [];
            if (knowledgePoints.length > 0) {
              techPointContent += '\n相关知识点：\n';
              knowledgePoints.forEach((kp: any, index: number) => {
                techPointContent += `${index + 1}. ${kp.title || kp.content || ''}\n`;
                if (kp.content) {
                  techPointContent += `   内容：${kp.content.substring(0, 500)}${kp.content.length > 500 ? '...' : ''}\n`;
                }
              });
            }
          }

          contents.push(techPointContent);
        }
      } catch (error) {
        console.error(`获取知识库内容失败 (${source.id}):`, error);
      }
    }

    return contents.join('\n\n---\n\n');
  }

  /**
   * 准备工作流输入
   */
  async prepareWorkflowInput(
    userQuery: string,
    sources: Source[],
    files: File[] = []
  ): Promise<any> {
    const input: any = {};

    // 合并知识库内容
    const knowledgeContent = await this.mergeKnowledgeBaseContent(sources);
    
    // 组合用户问题和知识库内容
    let queryContent = userQuery;
    if (knowledgeContent) {
      queryContent = `知识库参考内容：\n\n${knowledgeContent}\n\n用户问题：${userQuery}`;
    }

    // 准备文件（如果有）
    if (files.length > 0) {
      const uploadedFiles = await this.uploadFiles(files);
      input.files = uploadedFiles.map((f) => f.url);
    }

    // 设置查询内容
    input.query = queryContent;
    input.sources = sources.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
    }));

    return input;
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(
    workflowId: string,
    input: any
  ): Promise<{ answer: string; outputs?: any }> {
    try {
      const result = await agentWorkflowService.executeWorkflow(workflowId, input);
      
      // 等待执行完成（如果需要）
      // 这里可能需要轮询执行状态
      
      // 返回结果
      return {
        answer: result.message || '执行完成',
        outputs: result,
      };
    } catch (error) {
      console.error('工作流执行失败:', error);
      throw error;
    }
  }

  /**
   * 创建对话
   */
  async createConversation(
    request: CreateConversationRequest
  ): Promise<Conversation> {
    try {
      const response = await api.post('/ai-search/conversations', request);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || '创建对话失败');
    } catch (error) {
      console.error('创建对话失败:', error);
      throw error;
    }
  }

  /**
   * 获取对话列表
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await api.get('/ai-search/conversations');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('获取对话列表失败:', error);
      return [];
    }
  }

  /**
   * 获取对话详情
   */
  async getConversation(
    id: string,
    options?: {
      limit?: number;
      before?: string;
    }
  ): Promise<Conversation | null> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) {
        params.set('limit', String(options.limit));
      }
      if (options?.before) {
        params.set('before', options.before);
      }

      const query = params.toString();
      const response = await api.get(
        `/ai-search/conversations/${id}${query ? `?${query}` : ''}`
      );
      if (response.data.success && response.data.data) {
        const payload = response.data.data;
        return {
          ...payload,
          messages: (payload.messages || []).map((message: any) => ({
            ...message,
            createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
          })),
          createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
          updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : new Date(),
          hasMoreMessages: Boolean(payload.hasMoreMessages),
          nextCursor: payload.nextCursor || undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('获取对话详情失败:', error);
      return null;
    }
  }

  /**
   * 发送消息
   */
  async sendMessage(
    conversationId: string,
    request: SendMessageRequest
  ): Promise<{ userMessage: Message; aiMessage?: Message; error?: string; errorDetail?: string }> {
    try {
      const formData = new FormData();
      formData.append('content', request.content);
      if (request.sources) {
        formData.append('sources', JSON.stringify(request.sources));
      }
      if (request.files) {
        request.files.forEach((file) => {
          formData.append('files', file);
        });
      }
      if (request.workflowId) {
        formData.append('workflowId', request.workflowId);
      }
      if (typeof request.contextWindowSize === 'number') {
        formData.append('contextWindowSize', String(request.contextWindowSize));
      }

      const response = await api.post(
        `/ai-search/conversations/${conversationId}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success && response.data.data) {
        const payload = response.data.data;
        const normalized = {
          userMessage: this.normalizeMessage(response.data.data.userMessage),
          aiMessage: payload.aiMessage ? this.normalizeMessage(payload.aiMessage) : undefined,
          error: payload.error,
          errorDetail: payload.errorDetail,
        };
        return normalized;
      }
      throw new Error(response.data.error || '发送消息失败');
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }

  async triggerFeatureAgent(
    conversationId: string,
    payload: {
      featureType: string;
      messageId?: string;
      content?: string;
      sources?: Source[];
      contextWindowSize?: number;
      workflowId?: string;
    }
  ): Promise<{ message: Message } | null> {
    try {
      const response = await api.post(
        `/ai-search/conversations/${conversationId}/agents`,
        payload
      );

      if (response.data.success && response.data.data?.message) {
        return {
          message: this.normalizeMessage(response.data.data.message),
        };
      }

      return null;
    } catch (error) {
      console.error('触发子Agent失败:', error);
      throw error;
    }
  }

  /**
   * 删除对话
   */
  async deleteConversation(id: string): Promise<void> {
    try {
      await api.delete(`/ai-search/conversations/${id}`);
    } catch (error) {
      console.error('删除对话失败:', error);
      throw error;
    }
  }

  /**
   * 生成输出内容（PPT/脚本/思维导图）
   */
  async generateOutput(
    type: 'ppt' | 'script' | 'mindmap',
    conversationId: string,
    messageId: string,
    content: string
  ): Promise<OutputContent> {
    try {
      const response = await api.post('/ai-search/outputs', {
        type,
        conversationId,
        messageId,
        content,
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || '生成输出内容失败');
    } catch (error) {
      console.error('生成输出内容失败:', error);
      throw error;
    }
  }

  /**
   * 获取输出内容列表
   */
  async getOutputs(conversationId?: string): Promise<OutputContent[]> {
    try {
      const url = conversationId
        ? `/ai-search/outputs?conversationId=${conversationId}`
        : '/ai-search/outputs';
      const response = await api.get(url);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('获取输出内容列表失败:', error);
      return [];
    }
  }

  /**
   * 获取字段映射配置
   */
  async getFieldMappingConfig(workflowId: string): Promise<FieldMappingConfig | null> {
    try {
      const response = await api.get(`/ai-search/field-mappings/${workflowId}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('获取字段映射配置失败:', error);
      return null;
    }
  }

  /**
   * 获取所有字段映射配置
   */
  async getAllFieldMappingConfigs(): Promise<Array<{ workflowId: string; config: FieldMappingConfig; createdAt: string; updatedAt: string }>> {
    try {
      const response = await api.get('/ai-search/field-mappings');
      if (response.data.success) {
        return response.data.data || [];
      }
      throw new Error(response.data.error || '获取字段映射配置列表失败');
    } catch (error) {
      console.error('获取字段映射配置列表失败:', error);
      throw error;
    }
  }

  /**
   * 删除字段映射配置
   */
  async deleteFieldMappingConfig(workflowId: string): Promise<void> {
    try {
      const response = await api.delete(`/ai-search/field-mappings/${workflowId}`);
      if (!response.data.success) {
        throw new Error(response.data.error || '删除字段映射配置失败');
      }
    } catch (error) {
      console.error('删除字段映射配置失败:', error);
      throw error;
    }
  }

}

export const aiSearchService = new AiSearchService();
