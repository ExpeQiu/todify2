import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosError } from 'axios';

import { DifyGateway, createDifyGateway } from '@/shared/infrastructure/integrations/dify';
import { isSuccess } from '@/shared/lib/result';

// Mock axios
vi.mock('axios');

describe('DifyGateway', () => {
  let gateway: DifyGateway;
  let mockChatClient: any;
  let mockWorkflowClient: any;

  beforeEach(() => {
    mockChatClient = {
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };

    mockWorkflowClient = {
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };

    vi.spyOn(axios, 'create').mockImplementation((config) => {
      if (config?.baseURL?.includes('workflow') || config?.baseURL?.includes('9999')) {
        return mockWorkflowClient;
      }
      return mockChatClient;
    });

    gateway = new DifyGateway({
      baseUrl: 'http://localhost:9999/v1',
      apiKey: 'test-api-key',
      timeout: 30000,
      maxRetries: 2,
    });
  });

  describe('executeChat', () => {
    it('should successfully execute chat and return result', async () => {
      const mockResponse = {
        data: {
          conversation_id: 'conv-123',
          message_id: 'msg-456',
          answer: 'Hello, this is a test response',
        },
      };

      mockChatClient.post.mockResolvedValue(mockResponse);

      const result = await gateway.executeChat({
        query: 'Hello',
        conversationId: 'conv-123',
        inputs: {},
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value.conversationId).toBe('conv-123');
        expect(result.value.messageId).toBe('msg-456');
        expect(result.value.answer).toBe('Hello, this is a test response');
      }
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockResponse = {
        data: {
          conversation_id: 'conv-123',
          message_id: 'msg-456',
          answer: 'Success after retry',
        },
      };

      mockChatClient.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse);

      const result = await gateway.executeChat({
        query: 'Hello',
      });

      expect(isSuccess(result)).toBe(true);
      expect(mockChatClient.post).toHaveBeenCalledTimes(2);
    });

    it('should return failure after max retries', async () => {
      const error = new Error('Network error');
      mockChatClient.post.mockRejectedValue(error);

      const result = await gateway.executeChat({
        query: 'Hello',
      });

      expect(isSuccess(result)).toBe(false);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe('DIFY_CHAT_ERROR');
        expect(result.error.message).toBe('调用 Dify 聊天服务失败');
      }
      // Should retry maxRetries times (2) + initial attempt = 3 calls
      expect(mockChatClient.post).toHaveBeenCalledTimes(3);
    });
  });

  describe('executeWorkflow', () => {
    it('should successfully execute workflow and return result', async () => {
      const mockResponse = {
        data: {
          workflow_run_id: 'run-123',
          task_id: 'task-456',
          status: 'succeeded',
          data: {
            outputs: {
              text: 'Workflow completed',
            },
          },
        },
      };

      mockWorkflowClient.post.mockResolvedValue(mockResponse);

      const result = await gateway.executeWorkflow({
        workflowId: 'test-workflow',
        inputs: { query: 'test' },
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value.workflowRunId).toBe('run-123');
        expect(result.value.taskId).toBe('task-456');
        expect(result.value.status).toBe('succeeded');
        expect(result.value.outputs?.text).toBe('Workflow completed');
      }
    });

    it('should return failure on workflow error', async () => {
      const error = new Error('Workflow execution failed');
      mockWorkflowClient.post.mockRejectedValue(error);

      const result = await gateway.executeWorkflow({
        workflowId: 'test-workflow',
        inputs: {},
      });

      expect(isSuccess(result)).toBe(false);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe('DIFY_WORKFLOW_ERROR');
        expect(result.error.message).toBe('调用 Dify 工作流服务失败');
      }
    });
  });

  describe('createDifyGateway', () => {
    it('should create gateway with default config', () => {
      const gateway = createDifyGateway('test-key');
      expect(gateway).toBeInstanceOf(DifyGateway);
    });

    it('should throw error if apiKey is not provided', () => {
      expect(() => createDifyGateway()).toThrow('未配置 Dify API Key');
    });
  });
});

