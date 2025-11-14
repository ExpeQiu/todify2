import { useQuery } from '@tanstack/react-query';

import configService, { type DifyAPIConfig, type WorkflowStepConfig } from '@/services/configService';

export const WORKFLOW_QUERY_KEYS = {
  difyConfigs: ['workflow', 'configs', 'dify'] as const,
  workflowConfigs: ['workflow', 'configs', 'steps'] as const,
};

export const useDifyConfigsQuery = () =>
  useQuery<DifyAPIConfig[]>({
    queryKey: WORKFLOW_QUERY_KEYS.difyConfigs,
    queryFn: () => configService.getDifyConfigs(),
  });

export const useWorkflowConfigsQuery = () =>
  useQuery<WorkflowStepConfig[]>({
    queryKey: WORKFLOW_QUERY_KEYS.workflowConfigs,
    queryFn: () => configService.getWorkflowConfigs(),
  });
