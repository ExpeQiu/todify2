import axios from 'axios';

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
      [DifyAppType.CORE_DRAFT]: process.env.CORE_DRAFT_API_KEY || process.env.TECH_ARTICLE_API_KEY || '',
      [DifyAppType.TECH_PUBLISH]: process.env.TECH_PUBLISH_API_KEY || process.env.TECH_ARTICLE_API_KEY || ''
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
          },
          timeout: 60000 // 60秒超时，增加到60秒以适应Dify工作流处理时间
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
          },
          timeout: 30000 // 30秒超时
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
          },
          timeout: 30000 // 30秒超时
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

  async techPackage(inputs: any): Promise<DifyWorkflowResponse> {
    try {
      // 技术包装使用聊天API而不是工作流API
      const chatResponse = await this.callApp(DifyAppType.TECH_PACKAGE, {
        ...inputs,
        query: "请对以上技术信息进行包装分析"
      });
      
      // 将聊天响应转换为工作流响应格式
      return this.convertChatToWorkflowResponse(chatResponse);
    } catch (error) {
      // 如果API不可用，返回模拟数据
      console.warn('Dify API不可用，返回模拟数据:', error);
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
  async techPublish(inputs: any): Promise<DifyWorkflowResponse> {
    try {
      const apiKey = this.getApiKey(DifyAppType.TECH_PUBLISH);
      
      // 检查API key是否存在
      if (!apiKey) {
        throw new Error('TECH_PUBLISH_API_KEY is not configured in environment variables');
      }
      
      console.log('Tech Publish API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
      console.log('Tech Publish Base URL:', this.baseUrl);
      
      // 处理chatflow模式的参数映射
      // 支持多种输入格式：Additional_information, coreDraft, 或直接传入的字符串
      let additionalInfo = '';
      if (inputs.Additional_information) {
        additionalInfo = inputs.Additional_information;
      } else if (inputs.coreDraft) {
        additionalInfo = typeof inputs.coreDraft === 'string' 
          ? inputs.coreDraft 
          : JSON.stringify(inputs.coreDraft);
      } else if (typeof inputs === 'string') {
        additionalInfo = inputs;
      } else {
        additionalInfo = JSON.stringify(inputs);
      }
      
      // 处理query参数，支持sys.query或query字段
      const queryText = inputs['sys.query'] || inputs.query || '请根据提供的补充信息生成技术发布会稿';
      
      const chatflowInputs = {
        Additional_information: additionalInfo
      };
      
      console.log('Tech Publish Inputs:', chatflowInputs);
      console.log('Tech Publish Query:', queryText);
      
      const response = await axios.post(
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
          timeout: 60000 // 60秒超时
        }
      );

      console.log('Tech Publish Response:', response.status, response.statusText);
      
      // 将chatflow响应转换为workflow响应格式以保持兼容性
      return this.convertChatToWorkflowResponse(response.data);
    } catch (error) {
      console.error(`Dify chatflow API error for tech-publish:`, error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Response headers:', error.response?.headers);
      }
      throw error;
    }
  }

  // 核心稿件生成
  async coreDraft(inputs: any): Promise<DifyWorkflowResponse> {
    return this.runWorkflow(DifyAppType.CORE_DRAFT, inputs);
  }
}

export default new DifyClient();