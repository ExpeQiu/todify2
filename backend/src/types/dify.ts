/**
 * Dify API类型定义
 * 提供完整的Dify API响应类型
 */

// Dify应用类型枚举
export enum DifyAppType {
  AI_SEARCH = 'ai-search',
  TECH_PACKAGE = 'tech-package',
  TECH_STRATEGY = 'tech-strategy',
  TECH_ARTICLE = 'tech-article',
  CORE_DRAFT = 'core-draft',
  TECH_PUBLISH = 'tech-publish'
}

// Dify工作流响应数据接口
export interface DifyWorkflowResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: {
      text?: string;
      answer?: string;
      text3?: string;
      [key: string]: unknown;
    };
    error: string | null;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

// Dify聊天消息响应数据接口
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

// Dify API输入参数
export interface DifyInputs {
  [key: string]: string | number | boolean | undefined;
  Additional_information?: string;
  query?: string;
  coreDraft?: string;
  input1?: string;
  input2?: string;
  input3?: string;
  'sys.query'?: string;
}

// Dify API调用选项
export interface DifyCallOptions {
  responseMode?: 'blocking' | 'streaming';
  user?: string;
  conversationId?: string;
  timeout?: number;
}
