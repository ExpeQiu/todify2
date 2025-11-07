import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SendMessageUseCase } from '@/modules/ai-search/application/useCases/SendMessage.usecase';
import { agentWorkflowService } from '@/services/AgentWorkflowService';

vi.mock('@/services/AgentWorkflowService', () => ({
  agentWorkflowService: {
    executeWorkflow: vi.fn(),
    getAllWorkflows: vi.fn(() => []),
  },
}));

vi.mock('@/utils/fieldMapping', () => ({
  fieldMappingEngine: {
    mapInputFields: vi.fn((_data, _mappings) => ({ mapped: true })),
    extractOutputFields: vi.fn((_output, _mappings) => ({ content: 'AI 回复' })),
  },
}));

describe('SendMessageUseCase', () => {
  const aiSearchService = {
    sendMessage: vi.fn(),
    getMessageById: vi.fn(),
  } as any;

  const fieldMappingService = {
    getFieldMappingConfig: vi.fn(),
  } as any;

  const useCase = new SendMessageUseCase(aiSearchService, fieldMappingService);

  const mockedWorkflowService = agentWorkflowService as unknown as {
    executeWorkflow: ReturnType<typeof vi.fn>;
    getAllWorkflows: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedWorkflowService.getAllWorkflows.mockReturnValue([
      { id: 'flow-1', name: '智能工作流' },
    ]);
    mockedWorkflowService.executeWorkflow.mockResolvedValue({ message: 'AI 回复' });
  });

  it('should create user message and ai reply successfully', async () => {
    aiSearchService.sendMessage
      .mockResolvedValueOnce({ id: 'user-1', role: 'user', content: 'hello', created_at: new Date().toISOString() })
      .mockResolvedValueOnce({ id: 'ai-1', role: 'assistant', content: 'AI 回复', created_at: new Date().toISOString() });

    fieldMappingService.getFieldMappingConfig.mockResolvedValue({
      inputMappings: [],
      outputMappings: [],
    });

    const result = await useCase.execute({
      conversationId: 'conv-1',
      content: 'hello',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.aiMessage?.content).toBe('AI 回复');
    }
  });
});
