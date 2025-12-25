// Placeholder for AgentWorkflowService
// All actual agent workflow logic has been removed as part of project slimming.
// This file exists to prevent compilation errors from other modules that still import it.

import { logger } from '@/shared/lib/logger';

class AgentWorkflowService {
  async getAllWorkflows() {
    logger.warn('AgentWorkflowService.getAllWorkflows called, but agent workflow functionality is removed.');
    return [];
  }
  
  async executeWorkflow(workflowId: string, params: any) {
    logger.warn('AgentWorkflowService.executeWorkflow called, but agent workflow functionality is removed.', {
      workflowId,
    });
    return {
      success: false,
      message: '工作流功能已移除',
      data: null,
    };
  }
  
  async executeRole(roleId: string, params: any) {
    logger.warn('AgentWorkflowService.executeRole called, but agent workflow functionality is removed.', {
      roleId,
    });
    return {
      success: false,
      message: 'AI角色工作流功能已移除',
      data: null,
    };
  }
}

// Export both class and instance for compatibility
export { AgentWorkflowService };
export const agentWorkflowService = new AgentWorkflowService();

