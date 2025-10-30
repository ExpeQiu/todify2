import axios, { AxiosError } from 'axios';
import { Logger } from '../utils/logger';
import {
  DifyAppType,
  DifyWorkflowResponse,
  DifyChatResponse,
  DifyInputs,
  DifyCallOptions
} from '../types/dify';

class DifyClient {
  private baseUrl: string;
  private workflowBaseUrl: string;

  constructor() {
    this.baseUrl = process.env.DIFY_BASE_URL || 'http://47.113.225.93:9999/v1';
    this.workflowBaseUrl = process.env.DIFY_WORKFLOW_BASE_URL || 'http://47.113.225.93:9999/v1';
  }

  // 获取对应应用的API密钥
  private getApiKey(appType: DifyAppType): string {
    const apiKeys: Record<DifyAppType, string> = {
      [DifyAppType.AI_SEARCH]: process.env.AI_SEARCH_API_KEY || '',
      [DifyAppType.TECH_PACKAGE]: process.env.TECH_PACKAGE_API_KEY || '',
      [DifyAppType.TECH_STRATEGY]: process.env.TECH_STRATEGY_API_KEY || '',
      [DifyAppType.TECH_ARTICLE]: process.env.TECH_ARTICLE_API_KEY || '',
      [DifyAppType.CORE_DRAFT]: process.env.CORE_DRAFT_API_KEY || process.env.TECH_ARTICLE_API_KEY || '',
      [DifyAppType.TECH_PUBLISH]: process.env.TECH_PUBLISH_API_KEY || process.env.TECH_ARTICLE_API_KEY || ''
    };

    const apiKey = apiKeys[appType];
    if (!apiKey) {
      const error = `API key not found for app type: ${appType}`;
      Logger.error(error);
      throw new Error(error);
    }
    return apiKey;
  }

  // 调用工作流API (用于AI搜索)
  async runWorkflow(
    appType: DifyAppType,
    inputs: DifyInputs,
    options: DifyCallOptions = {}
  ): Promise<DifyWorkflowResponse> {
    const {
      responseMode = 'blocking',
      user = 'todify2-user',
      timeout = 60000
    } = options;

    try {
      const apiKey = this.getApiKey(appType);

      Logger.api('Dify', 'runWorkflow', {
        appType,
        url: this.workflowBaseUrl,
        inputs: Object.keys(inputs),
      });

      const response = await axios.post<DifyWorkflowResponse>(
        `${this.workflowBaseUrl}/workflows/run`,
        {
          inputs,
          response_mode: responseMode,
          user
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout
        }
      );

      Logger.api('Dify', 'runWorkflow success', {
        appType,
        workflowRunId: response.data.workflow_run_id,
      });

      return response.data;
    } catch (error) {
      this.handleDifyError(error, 'runWorkflow', appType);
      throw error;
    }
  }

  // 调用Dify应用API (用于其他应用)
  async callApp(
    appType: DifyAppType,
    inputs: DifyInputs,
    options: DifyCallOptions = {}
  ): Promise<DifyChatResponse> {
    const {
      responseMode = 'blocking',
      user = 'todify2-user',
      conversationId = '',
      timeout = 30000
    } = options;

    try {
      const apiKey = this.getApiKey(appType);

      Logger.api('Dify', 'callApp', {
        appType,
        url: this.baseUrl,
        inputs: Object.keys(inputs),
      });

      const response = await axios.post<DifyChatResponse>(
        `${this.baseUrl}/chat-messages`,
        {
          inputs,
          query: inputs.query || '',
          response_mode: responseMode,
          user,
          conversation_id: conversationId,
          files: []
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout
        }
      );

      Logger.api('Dify', 'callApp success', {
        appType,
        messageId: response.data.message_id,
      });

      return response.data;
    } catch (error) {
      this.handleDifyError(error, 'callApp', appType);
      throw error;
    }
  }

  // AI搜索应用 (使用聊天消息API)
  async aiSearch(
    query: string,
    inputs: DifyInputs = {},
    options: DifyCallOptions = {}
  ): Promise<DifyChatResponse> {
    const { responseMode = 'blocking', conversationId = '' } = options;

    try {
      const apiKey = this.getApiKey(DifyAppType.AI_SEARCH);

      Logger.api('Dify', 'aiSearch', { query: query.substring(0, 100) });

      const response = await axios.post<DifyChatResponse>(
        `${this.baseUrl}/chat-messages`,
        {
          inputs,
          query,
          response_mode: responseMode,
          conversation_id: conversationId,
          user: 'todify2-user',
          files: []
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      Logger.api('Dify', 'aiSearch success', {
        messageId: response.data.message_id,
      });

      return response.data;
    } catch (error) {
      Logger.warn('Dify AI Search API error, returning mock data', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.getMockAiSearchResponse(query, inputs);
    }
  }

  // 模拟AI搜索响应
  private getMockAiSearchResponse(query: string, inputs: DifyInputs): DifyChatResponse {
    Logger.debug('Generating mock AI search response', { query });

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

  // 将聊天响应转换为工作流响应格式
  private convertChatToWorkflowResponse(chatResponse: DifyChatResponse): DifyWorkflowResponse {
    return {
      workflow_run_id: `chat-${chatResponse.id}`,
      task_id: chatResponse.task_id,
      data: {
        id: chatResponse.id,
        workflow_id: 'tech-package-chat',
        status: 'succeeded',
        outputs: {
          text: chatResponse.answer,
          answer: chatResponse.answer
        },
        error: null,
        elapsed_time: chatResponse.metadata.usage.latency,
        total_tokens: chatResponse.metadata.usage.total_tokens,
        total_steps: 1,
        created_at: chatResponse.created_at,
        finished_at: chatResponse.created_at
      }
    };
  }

  // 技术包装应用 (使用聊天API)
  async techPackage(inputs: DifyInputs): Promise<DifyWorkflowResponse> {
    try {
      const chatResponse = await this.callApp(DifyAppType.TECH_PACKAGE, {
        ...inputs,
        query: "请对以上技术信息进行包装分析"
      });

      return this.convertChatToWorkflowResponse(chatResponse);
    } catch (error) {
      Logger.warn('Dify techPackage API error, returning mock data', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.getMockTechPackageResponse(inputs);
    }
  }

  // 模拟技术包装响应
  private getMockTechPackageResponse(inputs: DifyInputs): DifyWorkflowResponse {
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

  // 技术策略应用
  async techStrategy(inputs: DifyInputs): Promise<DifyWorkflowResponse> {
    return this.runWorkflow(DifyAppType.TECH_STRATEGY, inputs);
  }

  // 技术通稿应用
  async techArticle(inputs: DifyInputs): Promise<DifyWorkflowResponse> {
    return this.runWorkflow(DifyAppType.TECH_ARTICLE, inputs);
  }

  // 核心稿件生成
  async coreDraft(inputs: DifyInputs): Promise<DifyWorkflowResponse> {
    return this.runWorkflow(DifyAppType.CORE_DRAFT, inputs);
  }

  // 技术发布生成 (使用chatflow模式)
  async techPublish(inputs: DifyInputs | string): Promise<DifyWorkflowResponse> {
    try {
      const apiKey = this.getApiKey(DifyAppType.TECH_PUBLISH);

      if (!apiKey) {
        throw new Error('TECH_PUBLISH_API_KEY is not configured in environment variables');
      }

      Logger.api('Dify', 'techPublish', { apiKey: `${apiKey.substring(0, 10)}...` });

      // 处理chatflow模式的参数映射
      let additionalInfo = '';
      if (typeof inputs === 'string') {
        additionalInfo = inputs;
      } else if (inputs.Additional_information) {
        additionalInfo = inputs.Additional_information;
      } else if (inputs.coreDraft) {
        additionalInfo = String(inputs.coreDraft);
      } else {
        additionalInfo = JSON.stringify(inputs);
      }

      const queryText = typeof inputs === 'object' && (inputs['sys.query'] || inputs.query)
        ? String(inputs['sys.query'] || inputs.query)
        : '请根据提供的补充信息生成技术发布会稿';

      const chatflowInputs: DifyInputs = {
        Additional_information: additionalInfo
      };

      Logger.debug('Tech Publish inputs', { chatflowInputs, query: queryText });

      const response = await axios.post<DifyChatResponse>(
        `${this.baseUrl}/chat-messages`,
        {
          inputs: chatflowInputs,
          query: queryText,
          response_mode: 'blocking',
          user: 'todify2-user',
          conversation_id: '',
          files: []
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      Logger.api('Dify', 'techPublish success', { status: response.status });

      return this.convertChatToWorkflowResponse(response.data);
    } catch (error) {
      this.handleDifyError(error, 'techPublish', DifyAppType.TECH_PUBLISH);
      throw error;
    }
  }

  // 统一的错误处理
  private handleDifyError(error: unknown, operation: string, appType: DifyAppType): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      Logger.error(`Dify API error - ${operation}`, {
        appType,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
    } else if (error instanceof Error) {
      Logger.exception(error, `Dify ${operation} - ${appType}`);
    } else {
      Logger.error(`Unknown Dify error - ${operation}`, {
        appType,
        error: String(error),
      });
    }
  }
}

export default new DifyClient();
