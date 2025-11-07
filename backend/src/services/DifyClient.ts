import { createDifyGateway, DifyGateway } from '@/shared/infrastructure/integrations/dify';
import { isSuccess } from '@/shared/lib/result';
import { logger } from '@/shared/lib/logger';

// Dify应用类型枚举
export enum DifyAppType {
  AI_SEARCH = 'ai-search',
  TECH_PACKAGE = 'tech-package',
  TECH_STRATEGY = 'tech-strategy', 
  TECH_ARTICLE = 'tech-article',
  CORE_DRAFT = 'core-draft',
  TECH_PUBLISH = 'tech-publish'
}

// 定义工作流响应数据接口
export interface DifyWorkflowResponse {
  workflow_run_id: string;
  task_id: string;
  conversation_id?: string; // 添加 conversation_id 字段用于多轮对话
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: {
      text?: string;
      [key: string]: any;
    };
    error: string | null;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

// 定义聊天消息响应数据接口
export interface DifyChatResponse {
  event: string;
  task_id: string;
  id: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: {
    usage: {
      prompt_tokens: number;
      prompt_unit_price: string;
      prompt_price_unit: string;
      prompt_price: string;
      completion_tokens: number;
      completion_unit_price: string;
      completion_price_unit: string;
      completion_price: string;
      total_tokens: number;
      total_price: string;
      currency: string;
      latency: number;
    };
    retriever_resources?: Array<{
      position: number;
      dataset_id: string;
      dataset_name: string;
      document_id: string;
      document_name: string;
      segment_id: string;
      score: number;
      content: string;
    }>;
  };
  created_at: number;
}

class DifyClient {
  private gatewayCache: Map<DifyAppType, DifyGateway> = new Map();

  private getApiKey(appType: DifyAppType): string {
    const apiKeys: Record<DifyAppType, string | undefined> = {
      [DifyAppType.AI_SEARCH]: process.env.AI_SEARCH_API_KEY,
      [DifyAppType.TECH_PACKAGE]: process.env.TECH_PACKAGE_API_KEY,
      [DifyAppType.TECH_STRATEGY]: process.env.TECH_STRATEGY_API_KEY,
      [DifyAppType.TECH_ARTICLE]: process.env.TECH_ARTICLE_API_KEY,
      [DifyAppType.CORE_DRAFT]: process.env.CORE_DRAFT_API_KEY ?? process.env.TECH_ARTICLE_API_KEY,
      [DifyAppType.TECH_PUBLISH]: process.env.TECH_PUBLISH_API_KEY ?? process.env.TECH_ARTICLE_API_KEY,
    };

    const apiKey = apiKeys[appType];
    if (!apiKey) {
      throw new Error(`未配置 ${appType} 对应的 Dify API Key`);
    }
    return apiKey;
  }

  private getGateway(appType: DifyAppType): DifyGateway {
    if (this.gatewayCache.has(appType)) {
      return this.gatewayCache.get(appType)!;
    }

    const apiKey = this.getApiKey(appType);
    const gateway = createDifyGateway(apiKey);
    this.gatewayCache.set(appType, gateway);
    return gateway;
  }

  async runWorkflow(appType: DifyAppType, inputs: any, responseMode = 'blocking', user = 'todify2-user'): Promise<DifyWorkflowResponse> {
    logger.info('调用 Dify 工作流', { appType, responseMode });
    const gateway = this.getGateway(appType);
    const result = await gateway.executeWorkflow({
      workflowId: appType,
      inputs,
      userId: user,
    });

    if (isSuccess(result) && result.value.raw) {
      return result.value.raw as DifyWorkflowResponse;
    }

    if (!isSuccess(result)) {
      throw new Error(result.error.message);
    }

    throw new Error('Dify 工作流调用未返回有效数据');
  }

  async callApp(appType: DifyAppType, inputs: any, responseMode = 'blocking', user = 'todify2-user'): Promise<any> {
    logger.info('调用 Dify 应用', { appType, responseMode });
    const gateway = this.getGateway(appType);
    const result = await gateway.executeChat({
      query: inputs.query || '',
      conversationId: inputs.conversation_id,
      inputs,
      userId: user,
    });

    if (isSuccess(result) && result.value.raw) {
      return result.value.raw;
    }

    if (!isSuccess(result)) {
      throw new Error(result.error.message);
    }

    throw new Error('Dify 应用调用未返回有效数据');
  }

  async aiSearch(query: string, inputs: any = {}, conversationId = '', responseMode = 'blocking'): Promise<DifyChatResponse> {
    try {
      const gateway = this.getGateway(DifyAppType.AI_SEARCH);
      const result = await gateway.executeChat({
        query,
        conversationId,
        inputs,
      });

      if (isSuccess(result)) {
        return (result.value.raw as DifyChatResponse) ?? this.getMockAiSearchResponse(query, inputs);
      }

      throw new Error(result.error.message);
    } catch (error) {
      logger.warn('Dify AI Search 调用失败，返回模拟数据', { error });
      return this.getMockAiSearchResponse(query, inputs);
    }
  }

  // 模拟AI搜索响应
  private getMockAiSearchResponse(query: string, inputs: any): DifyChatResponse {
    return {
      event: 'message',
      task_id: 'mock-task-' + Date.now(),
      id: 'mock-message-' + Date.now(),
      message_id: 'mock-message-' + Date.now(),
      conversation_id: 'mock-conversation-' + Date.now(),
      mode: 'chat',
      answer: `基于您的问题"${query}"，这是一个模拟的AI问答响应。\n\n人工智能（Artificial Intelligence，简称AI）是计算机科学的一个分支，旨在创建能够执行通常需要人类智能的任务的系统。这些任务包括学习、推理、问题解决、感知、语言理解等。\n\n主要特点：\n1. 机器学习能力\n2. 自然语言处理\n3. 模式识别\n4. 决策制定\n\n这是一个演示响应，展示了系统的完整工作流程。`,
      metadata: {
        usage: {
          prompt_tokens: 50,
          prompt_unit_price: '0.001',
          prompt_price_unit: 'USD',
          prompt_price: '0.00005',
          completion_tokens: 100,
          completion_unit_price: '0.002',
          completion_price_unit: 'USD',
          completion_price: '0.0002',
          total_tokens: 150,
          total_price: '0.00025',
          currency: 'USD',
          latency: 1.2
        },
        retriever_resources: [
          {
            position: 1,
            dataset_id: 'mock-dataset-1',
            dataset_name: 'AI知识库',
            document_id: 'mock-doc-1',
            document_name: '人工智能基础',
            segment_id: 'mock-segment-1',
            score: 0.95,
            content: '人工智能是模拟人类智能的技术...'
          }
        ]
      },
      created_at: Math.floor(Date.now() / 1000)
    };
  }

  // 技术包装应用 (使用工作流API)
  // 将聊天响应转换为工作流响应格式
  private convertChatToWorkflowResponse(chatResponse: DifyChatResponse): DifyWorkflowResponse {
    // 验证必需字段
    if (!chatResponse.id || !chatResponse.task_id) {
      throw new Error(`Invalid chat response: missing required fields. Response: ${JSON.stringify(chatResponse, null, 2)}`);
    }
    
    return {
      workflow_run_id: `chat-${chatResponse.id}`,
      task_id: chatResponse.task_id,
      conversation_id: chatResponse.conversation_id, // 传递 conversation_id 用于多轮对话
      data: {
        id: chatResponse.id,
        workflow_id: 'tech-package-chat',
        status: 'succeeded',
        outputs: {
          text: chatResponse.answer || '',
          answer: chatResponse.answer || ''
        },
        error: null,
        elapsed_time: chatResponse.metadata?.usage?.latency || 0,
        total_tokens: chatResponse.metadata?.usage?.total_tokens || 0,
        total_steps: 1,
        created_at: chatResponse.created_at || Math.floor(Date.now() / 1000),
        finished_at: chatResponse.created_at || Math.floor(Date.now() / 1000)
      }
    };
  }

  async techPackage(inputs: any): Promise<DifyWorkflowResponse> {
    try {
      const raw = await this.callApp(DifyAppType.TECH_PACKAGE, {
        ...inputs,
        query: '请对以上技术信息进行包装分析',
      });
      return this.convertChatToWorkflowResponse(raw);
    } catch (error) {
      logger.warn('Dify 技术包装调用失败，返回模拟数据', { error });
      return this.getMockTechPackageResponse(inputs);
    }
  }

  // 模拟技术包装响应
  private getMockTechPackageResponse(inputs: any): DifyWorkflowResponse {
    // 模拟Dify工作流的结构化输出
    const mockAnswer = `# 技术包装分析报告

## 输入信息分析
${inputs.Additional_information || '未提供具体信息'}

## 技术要点提炼
1. **核心技术概念**：基于输入信息识别的关键技术点
2. **应用场景**：技术在实际业务中的应用价值
3. **技术优势**：相比传统方案的改进之处

## 通俗化解释
将复杂的技术概念转化为易于理解的表述，帮助非技术人员快速掌握核心要点。

## 实施建议
- 短期目标：快速验证技术可行性
- 中期规划：完善技术架构设计
- 长期愿景：构建完整的技术生态

---
*本报告基于AI智能分析生成，为技术决策提供参考依据。*`;

    return {
      workflow_run_id: 'mock-run-' + Date.now(),
      task_id: 'mock-task-' + Date.now(),
      data: {
        id: 'mock-workflow-' + Date.now(),
        workflow_id: 'tech-package-workflow',
        status: 'succeeded',
        outputs: {
          answer: mockAnswer,
          text: mockAnswer,
          reasoning_content: '基于输入的技术信息进行深度分析和结构化整理',
          summary: '技术包装完成，已生成结构化分析报告'
        },
        error: null,
        elapsed_time: 2.3,
        total_tokens: 280,
        total_steps: 4,
        created_at: Math.floor(Date.now() / 1000),
        finished_at: Math.floor(Date.now() / 1000) + 2
      }
    };
  }

  // 技术策略应用 (使用工作流API)
  async techStrategy(inputs: any): Promise<DifyWorkflowResponse> {
    return this.runWorkflow(DifyAppType.TECH_STRATEGY, inputs);
  }

  // 技术通稿应用 (使用工作流API)
  async techArticle(inputs: any): Promise<DifyWorkflowResponse> {
    return this.runWorkflow(DifyAppType.TECH_ARTICLE, inputs);
  }

  // 技术发布生成 (使用chatflow模式)
  async techPublish(inputs: any, conversationId?: string): Promise<DifyWorkflowResponse> {
    const gateway = this.getGateway(DifyAppType.TECH_PUBLISH);

    const additionalInfo = this.extractAdditionalInfo(inputs);
    const queryText = inputs['sys.query'] || inputs.query || '请根据提供的补充信息生成技术发布会稿';

    const result = await gateway.executeChat({
      query: queryText,
      conversationId,
      inputs: additionalInfo ? { Additional_information: additionalInfo } : {},
      userId: 'todify2-user',
    });

    if (isSuccess(result) && result.value.raw) {
      return this.convertChatToWorkflowResponse(result.value.raw as DifyChatResponse);
    }

    if (!isSuccess(result)) {
      throw new Error(result.error.message);
    }

    throw new Error('Dify techPublish 调用未返回有效数据');
  }

  // 核心稿件生成
  async coreDraft(inputs: any): Promise<DifyWorkflowResponse> {
    return this.runWorkflow(DifyAppType.CORE_DRAFT, inputs);
  }

  private extractAdditionalInfo(inputs: any) {
    const candidate = inputs.Additional_information ?? inputs.coreDraft;
    if (!candidate) {
      return undefined;
    }

    if (typeof candidate === 'string') {
      return candidate.trim() || undefined;
    }

    return JSON.stringify(candidate);
  }
}

export default new DifyClient();