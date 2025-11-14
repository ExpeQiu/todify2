import { useQuery } from '@tanstack/react-query';

import { agentWorkflowService } from '@/services/agentWorkflowService';
import { aiRoleService } from '@/services/aiRoleService';

export const WORKFLOW_AGENT_QUERY_KEYS = {
  workflows: ['workflow', 'agents', 'workflows'] as const,
  aiRoles: ['workflow', 'agents', 'aiRoles'] as const,
};

export const useAgentWorkflowsQuery = () =>
  useQuery({
    queryKey: WORKFLOW_AGENT_QUERY_KEYS.workflows,
    queryFn: () => agentWorkflowService.getAllWorkflows(),
  });

export const useAIRolesQuery = () =>
  useQuery({
    queryKey: WORKFLOW_AGENT_QUERY_KEYS.aiRoles,
    queryFn: () => aiRoleService.getAIRoles(),
  });
