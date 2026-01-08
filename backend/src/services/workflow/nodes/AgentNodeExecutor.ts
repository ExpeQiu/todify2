import { NodeExecutor } from './NodeExecutor';
import { aiRoleModel } from '../../../models';
import { DifyGateway } from '@/shared/infrastructure/integrations/dify';
import { AgentOrchestrator } from '../../agent/AgentOrchestrator';

/**
 * Agent节点执行器
 */
export class AgentNodeExecutor implements NodeExecutor {
  async execute(node: any, context: Record<string, any>): Promise<any> {
    const agentId = node.agentId || node.data?.agentId;
    if (!agentId) throw new Error(`Agent节点 ${node.id} 未配置agentId`);
    
    const role = await aiRoleModel.getById(agentId);
    if (!role) throw new Error(`AI角色不存在: ${agentId}`);
    if (!role.enabled) throw new Error(`AI角色已禁用: ${agentId}`);
    
    const provider = role.provider || 'dify';
    
    // 支持 Direct Agent 类型
    if (provider === 'direct-agent') {
      if (!role.agentConfig) {
        throw new Error(`AI角色 ${agentId} 的Direct Agent配置不存在`);
      }
      
      // 使用 AgentOrchestrator 执行 Direct Agent
      const orchestrator = new AgentOrchestrator();
      const nodeInput = { ...context, ...(node.data?.inputs || {}) };
      let query = nodeInput.query || nodeInput.input || nodeInput.workflowInput?.query || nodeInput.question || nodeInput.text || nodeInput.content;
      if (!query) {
        query = typeof nodeInput === 'string' ? nodeInput : JSON.stringify(nodeInput);
      }
      
      // 从 sharedContext 中提取可用作 context 的数据
      const agentContext: Record<string, any> = {};
      Object.keys(nodeInput).forEach(key => {
        if (key !== 'query' && key !== 'input' && key !== 'workflowInput') {
          agentContext[key] = nodeInput[key];
        }
      });
      
      const result = await orchestrator.executeAgent(agentId, query, '', agentContext);
      
      return {
        answer: result.content,
        result: result.content,
        conversation_id: result.conversationId,
        raw: result
      };
    }
    
    // Dify Agent 类型的原有逻辑
    if (!role.difyConfig) throw new Error(`AI角色 ${agentId} 的Dify配置不存在`);
    const { connectionType, apiKey, apiUrl } = role.difyConfig;
    let actualBaseUrl = apiUrl;
    if (apiUrl.startsWith('/')) actualBaseUrl = process.env.DIFY_BASE_URL || 'http://47.113.225.93:9999/v1';
    const gateway = new DifyGateway({ baseUrl: actualBaseUrl, workflowBaseUrl: actualBaseUrl, apiKey, timeout: 60000, maxRetries: 3 });
    const nodeInput = { ...context, ...(node.data?.inputs || {}) };
    let query = nodeInput.query || nodeInput.input || nodeInput.workflowInput?.query || nodeInput.question || nodeInput.text || nodeInput.content;
    if (!query) query = typeof nodeInput === 'string' ? nodeInput : JSON.stringify(nodeInput);
    const inputs = { ...nodeInput };
    delete inputs.query;
    delete inputs.input;
    if (connectionType === 'chatflow') {
      const result = await gateway.executeChat({ query, conversationId: '', inputs, userId: 'todify3-user' });
      if ((result as any).ok || (result as any).value) {
        const raw = (result as any).value?.raw ?? (result as any).raw;
        return { answer: raw?.answer || (result as any).value?.answer, conversation_id: raw?.conversation_id, raw };
      }
      throw new Error((result as any).error?.message || 'Dify聊天调用失败');
    } else {
      const result = await gateway.executeWorkflow({ workflowId: 'workflow', inputs, userId: 'todify3-user' });
      if ((result as any).ok || (result as any).value) {
        const raw = (result as any).value?.raw ?? (result as any).raw;
        return { result: raw?.data?.outputs?.text || raw?.data?.outputs?.answer || '', raw };
      }
      throw new Error((result as any).error?.message || 'Dify工作流调用失败');
    }
  }
}

