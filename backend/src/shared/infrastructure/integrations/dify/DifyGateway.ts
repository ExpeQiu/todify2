import axios, { AxiosInstance } from 'axios';

import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

export interface DifyConfig {
  baseUrl: string;
  workflowBaseUrl?: string;
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
}

export interface ChatInput {
  query: string;
  conversationId?: string;
  inputs?: Record<string, unknown>;
  userId?: string;
}

export interface ChatOutput {
  conversationId: string;
  messageId: string;
  answer: string;
  raw: unknown;
}

export interface WorkflowInput {
  workflowId: string;
  inputs: Record<string, unknown>;
  userId?: string;
}

export interface WorkflowOutput {
  workflowRunId: string;
  taskId: string;
  status: 'running' | 'succeeded' | 'failed';
  outputs?: Record<string, unknown>;
  raw: unknown;
}

export class DifyGateway {
  private readonly chatClient: AxiosInstance;
  private readonly workflowClient: AxiosInstance;
  private readonly maxRetries: number;

  constructor(private readonly config: DifyConfig) {
    if (!config.baseUrl) {
      throw new Error('Dify baseUrl 未配置');
    }

    this.chatClient = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout ?? 30_000,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.workflowClient = axios.create({
      baseURL: config.workflowBaseUrl ?? config.baseUrl,
      timeout: config.timeout ?? 60_000,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.maxRetries = config.maxRetries ?? 2;

    const attachLogging = (instance: AxiosInstance, service: 'chat' | 'workflow') => {
      instance.interceptors.request.use((request) => {
        logger.debug('Dify 请求', {
          service,
          method: request.method,
          url: request.url,
          data: request.data,
        });
        return request;
      });

      instance.interceptors.response.use(
        (response) => {
          logger.debug('Dify 响应', {
            service,
            status: response.status,
          });
          return response;
        },
        (error) => {
          logger.error('Dify 响应错误', {
            service,
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });
          return Promise.reject(error);
        }
      );
    };

    attachLogging(this.chatClient, 'chat');
    attachLogging(this.workflowClient, 'workflow');
  }

  async executeChat(input: ChatInput): Promise<Result<ChatOutput>> {
    try {
      const response = await this.retry(() =>
        this.chatClient.post('/chat-messages', {
          query: input.query,
          conversation_id: input.conversationId,
          inputs: input.inputs ?? {},
          response_mode: 'blocking',
          user: input.userId ?? 'todify-user',
          files: [],
        })
      );

      return success({
        conversationId: response.data?.conversation_id,
        messageId: response.data?.message_id,
        answer: response.data?.answer,
        raw: response.data,
      });
    } catch (error) {
      logger.error('Dify executeChat 失败', { error, input });
      return failure({
        code: 'DIFY_CHAT_ERROR',
        message: '调用 Dify 聊天服务失败',
        details: error instanceof Error ? error.message : error,
      });
    }
  }

  async executeWorkflow(input: WorkflowInput): Promise<Result<WorkflowOutput>> {
    try {
      const response = await this.retry(() =>
        this.workflowClient.post('/workflows/run', {
          inputs: input.inputs,
          response_mode: 'blocking',
          user: input.userId ?? 'todify-user',
        })
      );

      return success({
        workflowRunId: response.data?.workflow_run_id,
        taskId: response.data?.task_id,
        status: response.data?.status,
        outputs: response.data?.data?.outputs,
        raw: response.data,
      });
    } catch (error) {
      logger.error('Dify executeWorkflow 失败', { error, input });
      return failure({
        code: 'DIFY_WORKFLOW_ERROR',
        message: '调用 Dify 工作流服务失败',
        details: error instanceof Error ? error.message : error,
      });
    }
  }

  private async retry<T>(fn: () => Promise<T>, retries = this.maxRetries): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      logger.warn('Dify 请求失败，准备重试', { retriesRemaining: retries });
      await new Promise((resolve) => setTimeout(resolve, 500));
      return this.retry(fn, retries - 1);
    }
  }
}

export const createDifyGateway = (apiKey?: string) => {
  if (!apiKey) {
    throw new Error('未配置 Dify API Key');
  }

  return new DifyGateway({
    baseUrl: process.env.DIFY_BASE_URL ?? 'http://localhost:9999/v1',
    workflowBaseUrl: process.env.DIFY_WORKFLOW_BASE_URL ?? process.env.DIFY_BASE_URL ?? 'http://localhost:9999/v1',
    apiKey,
    timeout: 60_000,
    maxRetries: 3,
  });
};

