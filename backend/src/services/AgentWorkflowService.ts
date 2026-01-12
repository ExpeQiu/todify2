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
  
  async deleteTemplate(id: string): Promise<boolean> {
    logger.warn('AgentWorkflowService.deleteTemplate called, but agent workflow functionality is removed.', {
      id,
    });
    return false;
  }
  
  async searchWorkflows(query: string) {
    logger.warn('AgentWorkflowService.searchWorkflows called, but agent workflow functionality is removed.');
    return [];
  }
  
  async getWorkflowById(id: string) {
    logger.warn('AgentWorkflowService.getWorkflowById called, but agent workflow functionality is removed.', { id });
    return null;
  }
  
  async createWorkflow(data: any) {
    logger.warn('AgentWorkflowService.createWorkflow called, but agent workflow functionality is removed.');
    return { success: false, message: '工作流功能已移除', data: null };
  }
  
  async updateWorkflow(id: string, data: any) {
    logger.warn('AgentWorkflowService.updateWorkflow called, but agent workflow functionality is removed.', { id });
    return { success: false, message: '工作流功能已移除', data: null };
  }
  
  async deleteWorkflow(id: string) {
    logger.warn('AgentWorkflowService.deleteWorkflow called, but agent workflow functionality is removed.', { id });
    return { success: false, message: '工作流功能已移除' };
  }
  
  async compileWorkflow(workflowId: string, engine?: string) {
    logger.warn('AgentWorkflowService.compileWorkflow called, but agent workflow functionality is removed.', { workflowId, engine });
    return { success: false, message: '工作流功能已移除', data: null };
  }
  
  async getExecutionHistory(workflowId: string) {
    logger.warn('AgentWorkflowService.getExecutionHistory called, but agent workflow functionality is removed.', { workflowId });
    return [];
  }
  
  async getExecutionById(executionId: string) {
    logger.warn('AgentWorkflowService.getExecutionById called, but agent workflow functionality is removed.', { executionId });
    return null;
  }
  
  async getAllTemplates(category?: string) {
    logger.warn('AgentWorkflowService.getAllTemplates called, but agent workflow functionality is removed.', { category });
    return [];
  }
  
  async getTemplateById(id: string) {
    logger.warn('AgentWorkflowService.getTemplateById called, but agent workflow functionality is removed.', { id });
    return null;
  }
  
  async createTemplate(data: any) {
    logger.warn('AgentWorkflowService.createTemplate called, but agent workflow functionality is removed.');
    return { success: false, message: '工作流功能已移除', data: null };
  }
  
  async createWorkflowFromTemplate(templateId: string, data: any) {
    logger.warn('AgentWorkflowService.createWorkflowFromTemplate called, but agent workflow functionality is removed.', { templateId });
    return { success: false, message: '工作流功能已移除', data: null };
  }
}

// Export both class and instance for compatibility
export { AgentWorkflowService };
export const agentWorkflowService = new AgentWorkflowService();

