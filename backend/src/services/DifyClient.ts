import axios from 'axios';

// Dify应用类型枚举
export enum DifyAppType {
  AI_SEARCH = 'ai-search',
  TECH_PACKAGE = 'tech-package',
  TECH_STRATEGY = 'tech-strategy', 
  TECH_ARTICLE = 'tech-article',
  TECH_PUBLISH = 'tech-publish'
}

// 定义工作流响应数据接口
export interface DifyWorkflowResponse {
  workflow_run_id: string;
  task_id: string;
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
  private baseUrl: string;
  private workflowBaseUrl: string;

  constructor() {
    this.baseUrl = process.env.DIFY_BASE_URL || 'http://47.113.225.93:9999/v1';
    this.workflowBaseUrl = process.env.DIFY_WORKFLOW_BASE_URL || 'http://47.113.225.93:9999/v1';
  }

  // 获取对应应用的API密钥
  private getApiKey(appType: DifyAppType): string {
    const apiKeys: { [key in DifyAppType]: string } = {
      [DifyAppType.AI_SEARCH]: process.env.AI_SEARCH_API_KEY || '',
      [DifyAppType.TECH_PACKAGE]: process.env.TECH_PACKAGE_API_KEY || '',
      [DifyAppType.TECH_STRATEGY]: process.env.TECH_STRATEGY_API_KEY || '',
      [DifyAppType.TECH_ARTICLE]: process.env.TECH_ARTICLE_API_KEY || '',
      [DifyAppType.TECH_PUBLISH]: process.env.TECH_PUBLISH_API_KEY || ''
    };

    const apiKey = apiKeys[appType];
    if (!apiKey) {
      throw new Error(`API key not found for app type: ${appType}`);
    }
    return apiKey;
  }

  // 调用工作流API (用于AI搜索)
  async runWorkflow(appType: DifyAppType, inputs: any, responseMode: string = 'blocking', user: string = 'todify2-user'): Promise<DifyWorkflowResponse> {
    try {
      const apiKey = this.getApiKey(appType);
      
      const response = await axios.post(
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
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Dify workflow API error for ${appType}:`, error);
      throw error;
    }
  }

  // 调用Dify应用API (用于其他应用)
  async callApp(appType: DifyAppType, inputs: any, responseMode: string = 'blocking', user: string = 'todify2-user'): Promise<any> {
    try {
      const apiKey = this.getApiKey(appType);
      
      const response = await axios.post(
        `${this.baseUrl}/chat-messages`,
        {
          inputs,
          query: inputs.query || '',
          response_mode: responseMode,
          user,
          conversation_id: '',
          files: []
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Dify API error for ${appType}:`, error);
      throw error;
    }
  }

  // AI搜索应用 (使用聊天消息API)
  async aiSearch(query: string, inputs: any = {}, responseMode: string = 'blocking'): Promise<DifyChatResponse> {
    try {
      const apiKey = this.getApiKey(DifyAppType.AI_SEARCH);
      
      const response = await axios.post(
        `${this.baseUrl}/chat-messages`,
        {
          inputs,
          query,
          response_mode: responseMode,
          conversation_id: '',
          user: 'todify2-user',
          files: []
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Dify AI Search API error:', error);
      // 如果API不可用，返回模拟数据
      console.warn('Dify API不可用，返回模拟数据');
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
  async techPackage(inputs: any): Promise<DifyWorkflowResponse> {
    try {
      return await this.runWorkflow(DifyAppType.TECH_PACKAGE, inputs);
    } catch (error) {
      // 如果API不可用，返回模拟数据
      console.warn('Dify API不可用，返回模拟数据:', error);
      return this.getMockTechPackageResponse(inputs);
    }
  }

  // 模拟技术包装响应
  private getMockTechPackageResponse(inputs: any): DifyWorkflowResponse {
    return {
      workflow_run_id: 'mock-run-' + Date.now(),
      task_id: 'mock-task-' + Date.now(),
      data: {
        id: 'mock-workflow-' + Date.now(),
        workflow_id: 'tech-package-workflow',
        status: 'succeeded',
        outputs: {
          text: `技术包装完成！\n\n输入数据：${JSON.stringify(inputs, null, 2)}\n\n这是一个模拟的技术包装结果，展示了系统的完整工作流程。`,
          summary: '技术包装摘要',
          recommendations: ['建议1', '建议2', '建议3']
        },
        error: null,
        elapsed_time: 1.5,
        total_tokens: 150,
        total_steps: 3,
        created_at: Math.floor(Date.now() / 1000),
        finished_at: Math.floor(Date.now() / 1000) + 1
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

  // 技术发布应用 (使用工作流API)
  async techPublish(inputs: any): Promise<DifyWorkflowResponse> {
    return this.runWorkflow(DifyAppType.TECH_PUBLISH, inputs);
  }
}

export default new DifyClient();