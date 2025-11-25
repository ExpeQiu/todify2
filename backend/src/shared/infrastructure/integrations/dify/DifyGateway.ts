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
        const requestInfo = {
          service,
          method: request.method,
          url: request.url,
          baseURL: request.baseURL,
          fullUrl: request.baseURL ? `${request.baseURL}${request.url}` : request.url,
          data: request.data,
        };
        logger.debug('Dify 请求', requestInfo);
        console.log('Dify 请求详情:', JSON.stringify(requestInfo, null, 2));
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
          const errorInfo = {
            service,
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            fullUrl: error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url,
            code: error.code,
            errno: error.errno,
            syscall: error.syscall,
            address: error.address,
            port: error.port,
          };
          logger.error('Dify 响应错误', errorInfo);
          console.error('Dify 响应错误详情:', JSON.stringify(errorInfo, null, 2));
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
      const axiosError = error as any;
      const errorDetails = {
        message: axiosError.message || (error instanceof Error ? error.message : String(error)),
        code: axiosError.code,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        responseData: axiosError.response?.data,
        requestUrl: axiosError.config?.url,
        requestBaseURL: axiosError.config?.baseURL,
        fullUrl: axiosError.config?.baseURL ? `${axiosError.config.baseURL}${axiosError.config.url}` : axiosError.config?.url,
        errno: axiosError.errno,
        syscall: axiosError.syscall,
        address: axiosError.address,
        port: axiosError.port,
      };
      logger.error('Dify executeChat 失败', { error: errorDetails, input });
      console.error('Dify executeChat 详细错误:', JSON.stringify(errorDetails, null, 2));
      
      // 构建详细的错误消息
      let errorMessage = errorDetails.message;
      if (errorDetails.code) {
        errorMessage += ` (${errorDetails.code})`;
      }
      if (errorDetails.status) {
        errorMessage += ` [HTTP ${errorDetails.status}]`;
      }
      if (errorDetails.responseData) {
        errorMessage += `: ${JSON.stringify(errorDetails.responseData)}`;
      }
      
      return failure({
        code: 'DIFY_CHAT_ERROR',
        message: '调用 Dify 聊天服务失败',
        details: errorMessage,
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

