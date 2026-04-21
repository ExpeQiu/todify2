// Placeholder for AgentWorkflowService
// All actual agent workflow logic has been removed as part of project slimming.
// This file exists to prevent compilation errors from other modules that still import it.
// However, executeRole is still needed for AI role execution.

import { logger } from '@/shared/lib/logger';
import { aiRoleModel } from '@/models';
import { AgentOrchestrator } from './agent/AgentOrchestrator';
import { DifyGateway } from '@/shared/infrastructure/integrations/dify';

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
    try {
      logger.info('执行AI角色', { roleId, hasParams: !!params });
      
      // 获取AI角色配置
      const role = await aiRoleModel.getById(roleId);
      if (!role) {
        logger.error('AI角色不存在', { roleId });
        return {
          success: false,
          message: `AI角色不存在: ${roleId}`,
          data: null,
        };
      }

      if (!role.enabled) {
        logger.error('AI角色已禁用', { roleId });
        return {
          success: false,
          message: `AI角色已禁用: ${roleId}`,
          data: null,
        };
      }

      const provider = role.provider || 'dify';
      
      // 从 params 中提取 query 和其他输入
      const input = params.input || params;
      const query = input.query || input.question || input.text || input.content || '';
      const conversationId = input.conversationId || '';
      const context = { ...input };
      delete context.query;
      delete context.question;
      delete context.text;
      delete context.content;
      delete context.conversationId;

      // 支持 Direct Agent 类型
      if (provider === 'direct-agent') {
        if (!role.agentConfig) {
          logger.error('Direct Agent配置不存在', { roleId });
          return {
            success: false,
            message: `AI角色 ${roleId} 的Direct Agent配置不存在`,
            data: null,
          };
        }

        const orchestrator = new AgentOrchestrator();
        const result = await orchestrator.executeAgent(roleId, query, conversationId, context);

        return {
          success: true,
          message: '执行成功',
          data: {
            outputs: {
              answer: result.content,
              text: result.content,
              content: result.content,
              conversation_id: result.conversationId,
            },
            conversation_id: result.conversationId,
            metadata: result.metadata || {},
            usage: result.usage || {},
          },
        };
      }

      // Dify Agent 类型
      if (!role.difyConfig) {
        logger.error('Dify配置不存在', { roleId });
        return {
          success: false,
          message: `AI角色 ${roleId} 的Dify配置不存在`,
          data: null,
        };
      }

      const { connectionType, apiKey, apiUrl } = role.difyConfig;
      let actualBaseUrl = apiUrl;
      if (apiUrl.startsWith('/')) {
        actualBaseUrl = process.env.DIFY_BASE_URL || 'http://47.113.225.93:9999/v1';
      }

      const gateway = new DifyGateway({
        baseUrl: actualBaseUrl,
        workflowBaseUrl: actualBaseUrl,
        apiKey,
        timeout: 60000,
        maxRetries: 3,
      });

      const inputs = { ...context };
      
      if (connectionType === 'chatflow') {
        const chatResult = await gateway.executeChat({
          query,
          conversationId,
          inputs,
          userId: 'ai-role-user',
        });

        if (chatResult.success) {
          const chatData = chatResult.value.raw as any;
          return {
            success: true,
            message: '执行成功',
            data: {
              outputs: {
                answer: chatData.answer || chatResult.value.answer,
                text: chatData.answer || chatResult.value.answer,
                content: chatData.answer || chatResult.value.answer,
              },
              conversation_id: chatData.conversation_id || chatResult.value.conversationId,
              metadata: chatData.metadata || {},
            },
          };
        } else {
          logger.error('Dify聊天调用失败', { roleId, error: chatResult.error });
          return {
            success: false,
            message: chatResult.error?.message || 'Dify聊天调用失败',
            data: null,
          };
        }
      } else {
        // 工作流模式
        const workflowResult = await gateway.executeWorkflow({
          workflowId: 'custom-workflow',
          inputs,
          userId: 'ai-role-user',
        });

        if (workflowResult.success) {
          const workflowData = workflowResult.value.raw as any;
          return {
            success: true,
            message: '执行成功',
            data: {
              outputs: {
                text: workflowData.data?.outputs?.text || workflowData.data?.outputs?.answer || '',
                answer: workflowData.data?.outputs?.answer || workflowData.data?.outputs?.text || '',
                content: workflowData.data?.outputs?.text || workflowData.data?.outputs?.answer || '',
              },
              conversation_id: workflowData.conversation_id,
              workflow_run_id: workflowData.workflow_run_id || workflowResult.value.workflowRunId,
              task_id: workflowData.task_id || workflowResult.value.taskId,
            },
          };
        } else {
          logger.error('Dify工作流调用失败', { roleId, error: workflowResult.error });
          return {
            success: false,
            message: workflowResult.error?.message || 'Dify工作流调用失败',
            data: null,
          };
        }
      }
    } catch (error) {
      logger.error('执行AI角色失败', { roleId, error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '执行AI角色失败',
        data: null,
      };
    }
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

