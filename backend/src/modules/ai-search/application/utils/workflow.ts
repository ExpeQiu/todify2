import { agentWorkflowService } from '@/services/AgentWorkflowService';
import type { FieldMappingService } from '@/services/AiSearchService';
import { fieldMappingEngine } from '@/utils/fieldMapping';

export const resolveWorkflowId = async (): Promise<string | null> => {
  const workflowId = process.env.AI_SEARCH_WORKFLOW_ID || null;
  if (workflowId) {
    return workflowId;
  }

  const workflows = await agentWorkflowService.getAllWorkflows();
  const defaultWorkflow = workflows.find((w) => w.name === '智能工作流');
  return defaultWorkflow?.id || workflows[0]?.id || null;
};

export const mapWorkflowInput = (
  data: any,
  inputMappings?: any[]
) => {
  if (inputMappings && inputMappings.length > 0) {
    return fieldMappingEngine.mapInputFields(data, inputMappings);
  }
  return data;
};

export const extractWorkflowOutput = (
  workflowResult: any,
  outputMappings?: any[]
) => {
  const workflowOutput = workflowResult?.data || workflowResult;
  if (outputMappings && outputMappings.length > 0) {
    return fieldMappingEngine.extractOutputFields(workflowOutput, outputMappings);
  }
  return {};
};

export const ensureFieldMappingConfig = async (
  fieldMappingService: FieldMappingService,
  workflowId: string
) => {
  const config = await fieldMappingService.getFieldMappingConfig(workflowId);
  return config || null;
};

export const formatMessageRecord = (record: any) => ({
  id: record.id,
  role: record.role,
  content: record.content,
  sources: record.sources ? JSON.parse(record.sources) : [],
  outputs: record.outputs ? JSON.parse(record.outputs) : {},
  createdAt: new Date(record.created_at),
});
