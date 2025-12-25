// Placeholder for agentWorkflowService
// All actual agent workflow logic has been removed as part of project slimming.
// This file exists to prevent compilation errors from other modules that still import it.

export interface AgentWorkflow {
  id: string;
  name: string;
  description?: string;
  published?: boolean;
  [key: string]: any;
}

export const agentWorkflowService = {
  getAllWorkflows: async (): Promise<AgentWorkflow[]> => {
    console.warn('agentWorkflowService.getAllWorkflows called, but agent workflow functionality is removed.');
    return [];
  },
  
  executeWorkflow: async (workflowId: string, input: any): Promise<any> => {
    console.warn('agentWorkflowService.executeWorkflow called, but agent workflow functionality is removed.', {
      workflowId,
    });
    return {
      success: false,
      message: '工作流功能已移除',
      data: null,
    };
  },
  
  updateWorkflow: async (workflowId: string, data: any): Promise<any> => {
    console.warn('agentWorkflowService.updateWorkflow called, but agent workflow functionality is removed.', {
      workflowId,
      data,
    });
    return {
      success: false,
      message: '工作流功能已移除',
    };
  },
};

export const workflowTemplateService = {
  createTemplate: async (data: any): Promise<any> => {
    console.warn('workflowTemplateService.createTemplate called, but workflow template functionality is removed.', { data });
    return {
      success: false,
      message: '工作流模板功能已移除',
    };
  },
};

export default agentWorkflowService;

