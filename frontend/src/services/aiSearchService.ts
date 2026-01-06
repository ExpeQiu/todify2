import api from './api';
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
  async getWorkflowConfig(pageType?: 'tech-package' | 'press-release' | 'tech-strategy' | 'tech-article'): Promise<WorkflowConfig | null> {
    try {
      // 先尝试从API获取配置的工作流，传递pageType参数
      const params = pageType ? `?pageType=${pageType}` : '';
      const response = await api.get(`/ai-search/workflow${params}`);
      if (response.data.success && response.data.data) {
        // 如果API返回了完整的配置，直接使用
        if (response.data.data.config) {
          return response.data.data.config;
        }
        // 如果只返回了workflowId，需要从API获取工作流详情
        if (response.data.data.workflowId) {
          const workflowResponse = await api.get(`/workflow/${response.data.data.workflowId}`);
          if (workflowResponse.data.success && workflowResponse.data.data) {
            return this.convertWorkflowToConfig(workflowResponse.data.data);
          }
        }
      }
      
      // 如果没有配置，返回null，让调用方处理
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
  async uploadFiles(files: File[], pageType?: 'tech-package' | 'press-release' | 'tech-strategy' | 'tech-article'): Promise<FileUploadResponse[]> {
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
    request: CreateConversationRequest & { pageType?: string }
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
  async getConversations(pageType?: string): Promise<Conversation[]> {
    try {
      const params = pageType ? `?pageType=${encodeURIComponent(pageType)}` : '';
      const response = await api.get(`/ai-search/conversations${params}`);
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
          difyConversationId: payload.difyConversationId || undefined,
          pageType: payload.pageType || payload.page_type,
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
      if (request.fileList) {
        formData.append('fileList', request.fileList);
      }
      if (request.knowledgeBaseNames) {
        formData.append('knowledgeBaseNames', request.knowledgeBaseNames);
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
        
        // 添加调试日志
        console.log('[aiSearchService] 发送消息响应:', {
          hasUserMessage: !!payload.userMessage,
          hasAiMessage: !!payload.aiMessage,
          aiMessageContent: payload.aiMessage?.content,
          aiMessageContentLength: payload.aiMessage?.content?.length,
          aiMessageOutputs: payload.aiMessage?.outputs,
          error: payload.error,
          errorDetail: payload.errorDetail,
        });
        
        const normalized = {
          userMessage: this.normalizeMessage(response.data.data.userMessage),
          aiMessage: payload.aiMessage ? this.normalizeMessage(payload.aiMessage) : undefined,
          error: payload.error,
          errorDetail: payload.errorDetail,
        };
        
        // 如果AI消息内容为空或只有默认消息，记录警告
        if (normalized.aiMessage && (!normalized.aiMessage.content || normalized.aiMessage.content.trim() === '工作流执行完成')) {
          const outputs = normalized.aiMessage.outputs || {};
          
          // 详细展开outputs对象
          console.warn('[aiSearchService] AI消息内容异常 - 详细信息:', {
            content: normalized.aiMessage.content,
            outputs: JSON.parse(JSON.stringify(outputs)), // 深度克隆以便查看完整对象
            outputsKeys: Object.keys(outputs),
            outputsContent: outputs.content,
            outputsContentType: typeof outputs.content,
            outputsText: outputs.text,
            outputsAnswer: outputs.answer,
            outputsOutput: outputs.output,
            outputsMetadata: outputs.metadata,
            fullMessage: JSON.parse(JSON.stringify(normalized.aiMessage)), // 深度克隆
          });
          
          // 尝试从outputs中提取实际内容
          const possibleContent = 
            (outputs.content && typeof outputs.content === 'string' ? outputs.content : '') ||
            (outputs.text && typeof outputs.text === 'string' ? outputs.text : '') ||
            (outputs.answer && typeof outputs.answer === 'string' ? outputs.answer : '') ||
            (outputs.output && typeof outputs.output === 'string' ? outputs.output : '') ||
            '';
          
          if (possibleContent && possibleContent.trim() && possibleContent.trim() !== '工作流执行完成') {
            console.warn('[aiSearchService] 发现outputs中有实际内容，但content字段使用了默认值:', {
              actualContent: possibleContent.substring(0, 200),
              actualContentLength: possibleContent.length,
            });
          } else {
            console.error('[aiSearchService] 未在outputs中找到实际内容，需要检查后端日志');
          }
        }
        
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
    content: string,
    pageType?: string
  ): Promise<OutputContent> {
    try {
      const response = await api.post('/ai-search/outputs', {
        type,
        conversationId,
        messageId,
        content,
        pageType,
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
  async getOutputs(conversationId?: string, pageType?: string): Promise<OutputContent[]> {
    try {
      const params = new URLSearchParams();
      if (conversationId) {
        params.set('conversationId', conversationId);
      }
      if (pageType) {
        params.set('pageType', pageType);
      }
      const query = params.toString();
      const url = query ? `/ai-search/outputs?${query}` : '/ai-search/outputs';
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
   * 跨页面获取对话列表（支持多个pageType）
   */
  async getConversationsAcrossPages(pageTypes: string[]): Promise<Conversation[]> {
    try {
      const allConversations: Conversation[] = [];
      await Promise.all(
        pageTypes.map(async (pageType) => {
          const conversations = await this.getConversations(pageType);
          allConversations.push(...conversations);
        })
      );
      // 按更新时间排序
      return allConversations.sort(
        (a, b) => {
          const timeA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
          const timeB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
          return timeB - timeA;
        }
      );
    } catch (error) {
      console.error('跨页面获取对话列表失败:', error);
      return [];
    }
  }

  /**
   * 跨页面获取输出内容列表（支持多个pageType）
   */
  async getOutputsAcrossPages(pageTypes: string[]): Promise<OutputContent[]> {
    try {
      const allOutputs: OutputContent[] = [];
      await Promise.all(
        pageTypes.map(async (pageType) => {
          const outputs = await this.getOutputs(undefined, pageType);
          allOutputs.push(...outputs);
        })
      );
      // 按创建时间排序
      return allOutputs.sort(
        (a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          return timeB - timeA;
        }
      );
    } catch (error) {
      console.error('跨页面获取输出内容列表失败:', error);
      return [];
    }
  }

  /**
   * 聚合生成技术通稿
   */
  async aggregateTechArticle(params: {
    conversationIds: string[];
    outputIds?: string[];
    articleTypes: ('media_release' | 'internal_memo' | 'social_media')[];
    tone?: string;
    targetAudience?: string;
    workflowId?: string;
  }): Promise<any> {
    try {
      const response = await api.post('/ai-search/tech-article/aggregate', params);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || '聚合生成技术通稿失败');
    } catch (error) {
      console.error('聚合生成技术通稿失败:', error);
      throw error;
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
    } catch (error: any) {
      // 404 表示配置不存在，这是正常情况，返回 null
      if (error?.response?.status === 404) {
        return null;
      }
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
   * 保存字段映射配置（支持功能对象维度）
   */
  async saveFieldMappingConfig(workflowId: string, config: FieldMappingConfig): Promise<void> {
    try {
      const response = await api.post(`/ai-search/field-mappings/${workflowId}`, config);
      if (!response.data.success) {
        throw new Error(response.data.error || '保存字段映射配置失败');
      }
    } catch (error) {
      console.error('保存字段映射配置失败:', error);
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
