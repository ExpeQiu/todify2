import { AgentWorkflow, WorkflowExecution, WorkflowTemplate } from '../models/AgentWorkflow';
import { agentWorkflowModel, workflowExecutionModel, workflowTemplateModel, aiRoleModel } from '../models';
import { formatApiResponse } from '../utils/validation';
import { logger } from '@/shared/lib/logger';
import DifyClient from './DifyClient';
import { DifyGateway } from '@/shared/infrastructure/integrations/dify';
import { isSuccess } from '@/shared/lib/result';

/**
 * Agent工作流服务
 */
export class AgentWorkflowService {
  /**
   * 验证工作流是否有效
   */
  async validateWorkflow(workflow: AgentWorkflow): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // 解析nodes和edges
      const nodes = JSON.parse(workflow.nodes);
      const edges = JSON.parse(workflow.edges);

      // 检查节点是否为空
      if (!Array.isArray(nodes) || nodes.length === 0) {
        errors.push('工作流必须至少包含一个节点');
      }

      // 检查节点ID唯一性
      const nodeIds = new Set<string>();
      for (const node of nodes) {
        if (nodeIds.has(node.id)) {
          errors.push(`节点ID重复: ${node.id}`);
        }
        nodeIds.add(node.id);
      }

      // 检查边的有效性
      for (const edge of edges) {
        if (!nodeIds.has(edge.source)) {
          errors.push(`边的源节点不存在: ${edge.source}`);
        }
        if (!nodeIds.has(edge.target)) {
          errors.push(`边的目标节点不存在: ${edge.target}`);
        }
      }

      // 检查是否有环
      if (this.hasCycle(nodes, edges)) {
        errors.push('工作流包含循环依赖，请检查边的连接');
      }
    } catch (error) {
      errors.push(`JSON解析失败: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 检查是否有环
   */
  private hasCycle(nodes: any[], edges: any[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleFromNode = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true; // 发现环
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      // 检查所有相邻节点
      const outgoingEdges = edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycleFromNode(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // 检查每个节点
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycleFromNode(node.id)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 创建Agent工作流
   */
  async createWorkflow(data: any): Promise<AgentWorkflow> {
    const workflow = await agentWorkflowModel.create(data);
    
    // 验证工作流
    const validation = await this.validateWorkflow(workflow);
    if (!validation.isValid) {
      throw new Error(`工作流验证失败: ${validation.errors.join(', ')}`);
    }

    return workflow;
  }

  /**
   * 获取所有工作流
   */
  async getAllWorkflows(): Promise<AgentWorkflow[]> {
    return await agentWorkflowModel.getAll();
  }

  /**
   * 根据ID获取工作流
   */
  async getWorkflowById(id: string): Promise<AgentWorkflow | null> {
    return await agentWorkflowModel.getById(id);
  }

  /**
   * 更新工作流
   */
  async updateWorkflow(id: string, data: any): Promise<AgentWorkflow> {
    const workflow = await agentWorkflowModel.update(id, data);
    
    // 验证更新后的工作流
    const validation = await this.validateWorkflow(workflow);
    if (!validation.isValid) {
      throw new Error(`工作流验证失败: ${validation.errors.join(', ')}`);
    }

    return workflow;
  }

  /**
   * 删除工作流
   */
  async deleteWorkflow(id: string): Promise<boolean> {
    return await agentWorkflowModel.delete(id);
  }

  /**
   * 搜索工作流
   */
  async searchWorkflows(query: string): Promise<AgentWorkflow[]> {
    return await agentWorkflowModel.search(query);
  }

  /**
   * 执行工作流（异步）
   */
  async executeWorkflow(
    workflowId: string,
    options: any
  ): Promise<{ executionId: string; message: string; data?: any }> {
    // 获取工作流定义
    const workflow = await agentWorkflowModel.getById(workflowId);
    if (!workflow) {
      throw new Error('工作流不存在');
    }

    const startedAt = Date.now();
    // 创建执行实例
    const execution = await workflowExecutionModel.create({
      execution_type: 'agent_workflow',
      workflow_id: workflowId,
      workflow_name: workflow.name,
      status: 'running',
      shared_context: options.input || {},
      node_results: [],
      start_time: new Date().toISOString(),
    });

    try {
      // 解析工作流节点和边
      const nodes = JSON.parse(workflow.nodes);
      const edges = JSON.parse(workflow.edges || '[]');

      // 检查是否有配置的Agent节点
      const hasConfiguredAgent = this.workflowHasConfiguredAgent(workflow);
      if (!hasConfiguredAgent) {
        const fallbackOutput = this.buildFallbackOutput(workflow, options?.input ?? {});
        await workflowExecutionModel.update(execution.id, {
          status: 'completed',
          end_time: new Date().toISOString(),
          duration: Date.now() - startedAt,
        });
        return {
          executionId: execution.id,
          message: fallbackOutput.message,
          data: {
            outputs: {
              output: fallbackOutput.content,
              metadata: {
                ...(fallbackOutput.metadata || {}),
                workflowId,
                fallback: true,
                generatedAt: new Date().toISOString(),
              },
            },
          },
        };
      }

      // 执行工作流节点
      const sharedContext: Record<string, any> = {
        workflowInput: options.input || {},
        nodeOutputs: {},
      };

      // 按照拓扑顺序执行节点
      const executionOrder = this.topologicalSort(nodes, edges);
      const nodeResults: any[] = [];

      for (const level of executionOrder) {
        // 并行执行同一层的节点
        const levelResults = await Promise.allSettled(
          level.map(node => this.executeNode(node, sharedContext, options))
        );

        levelResults.forEach((result, index) => {
          const node = level[index];
          if (result.status === 'fulfilled') {
            nodeResults.push({
              nodeId: node.id,
              status: 'completed',
              output: result.value,
            });
            sharedContext.nodeOutputs[node.id] = result.value;
          } else {
            nodeResults.push({
              nodeId: node.id,
              status: 'failed',
              error: result.reason?.message || '节点执行失败',
            });
            logger.error(`节点执行失败: ${node.id}`, { error: result.reason });
          }
        });
      }

      // 提取输出节点的结果
      const outputNode = nodes.find((n: any) => n.type === 'output');
      let finalOutput: any = null;
      let outputContent = '';

      if (outputNode) {
        const outputData = outputNode.data || {};
        const outputs = outputData.outputs || [];
        
        if (outputs.length > 0 && outputs[0].sourceNodeId) {
          finalOutput = sharedContext.nodeOutputs[outputs[0].sourceNodeId];
          
          // 提取内容
          if (finalOutput) {
            if (typeof finalOutput === 'string') {
              outputContent = finalOutput;
            } else if (finalOutput.answer) {
              outputContent = finalOutput.answer;
            } else if (finalOutput.content) {
              outputContent = finalOutput.content;
            } else if (finalOutput.text) {
              outputContent = finalOutput.text;
            } else if (finalOutput.result) {
              outputContent = finalOutput.result;
            } else {
              outputContent = JSON.stringify(finalOutput, null, 2);
            }
          }
        }
      }

      // 如果没有找到输出节点，尝试从最后一个agent节点获取结果
      if (!finalOutput) {
        const agentNodes = nodes.filter((n: any) => n.type === 'agent');
        if (agentNodes.length > 0) {
          const lastAgentNode = agentNodes[agentNodes.length - 1];
          finalOutput = sharedContext.nodeOutputs[lastAgentNode.id];
          
          if (finalOutput) {
            if (typeof finalOutput === 'string') {
              outputContent = finalOutput;
            } else if (finalOutput.answer) {
              outputContent = finalOutput.answer;
            } else if (finalOutput.content) {
              outputContent = finalOutput.content;
            } else if (finalOutput.text) {
              outputContent = finalOutput.text;
            } else if (finalOutput.result) {
              outputContent = finalOutput.result;
            } else {
              outputContent = JSON.stringify(finalOutput, null, 2);
            }
          }
        }
      }

      // 更新执行记录
      await workflowExecutionModel.update(execution.id, {
        status: 'completed',
        end_time: new Date().toISOString(),
        duration: Date.now() - startedAt,
        node_results: JSON.stringify(nodeResults),
        shared_context: JSON.stringify(sharedContext),
      });

      return {
        executionId: execution.id,
        message: outputContent || '工作流执行完成',
        data: {
          outputs: {
            output: finalOutput || outputContent,
            text: outputContent,
            answer: outputContent,
            metadata: {
              workflowId,
              executionId: execution.id,
              nodeResults: nodeResults.length,
              generatedAt: new Date().toISOString(),
            },
          },
        },
      };
    } catch (error) {
      logger.error('工作流执行失败', { workflowId, executionId: execution.id, error });
      
      await workflowExecutionModel.update(execution.id, {
        status: 'failed',
        end_time: new Date().toISOString(),
        duration: Date.now() - startedAt,
        error_message: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * 拓扑排序：确定节点执行顺序
   */
  private topologicalSort(nodes: any[], edges: any[]): any[][] {
    const nodeMap = new Map<string, any>();
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    nodes.forEach(node => {
      nodeMap.set(node.id, node);
      inDegree.set(node.id, 0);
      dependents.set(node.id, []);
    });

    edges.forEach(edge => {
      const currentInDegree = inDegree.get(edge.target) || 0;
      inDegree.set(edge.target, currentInDegree + 1);

      const currentDependents = dependents.get(edge.source) || [];
      currentDependents.push(edge.target);
      dependents.set(edge.source, currentDependents);
    });

    const result: any[][] = [];
    const queue: any[] = [];
    const processed = new Set<string>();

    // 找到所有入度为0的节点（起始节点）
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeMap.get(nodeId)!);
      }
    });

    // 按层处理，同一层的节点可以并行执行
    while (queue.length > 0) {
      const levelSize = queue.length;
      const level: any[] = [];

      for (let i = 0; i < levelSize; i++) {
        const node = queue.shift()!;
        if (processed.has(node.id)) continue;

        level.push(node);
        processed.add(node.id);

        // 减少依赖节点的入度
        const nodeDependents = dependents.get(node.id) || [];
        nodeDependents.forEach(dependentId => {
          const currentInDegree = inDegree.get(dependentId) || 0;
          inDegree.set(dependentId, currentInDegree - 1);

          // 如果入度变为0，加入下一层
          if (inDegree.get(dependentId) === 0 && !processed.has(dependentId)) {
            queue.push(nodeMap.get(dependentId)!);
          }
        });
      }

      if (level.length > 0) {
        result.push(level);
      }
    }

    return result;
  }

  /**
   * 执行单个节点
   */
  private async executeNode(
    node: any,
    sharedContext: Record<string, any>,
    options: any
  ): Promise<any> {
    try {
      switch (node.type) {
        case 'input':
          return this.executeInputNode(node, sharedContext, options);
        case 'agent':
          return await this.executeAgentNode(node, sharedContext);
        case 'output':
          return this.executeOutputNode(node, sharedContext);
        default:
          logger.warn(`未知节点类型: ${node.type}`, { nodeId: node.id });
          return { type: node.type, status: 'skipped' };
      }
    } catch (error) {
      logger.error(`节点执行失败: ${node.id}`, { error });
      throw error;
    }
  }

  /**
   * 执行输入节点
   */
  private executeInputNode(
    node: any,
    sharedContext: Record<string, any>,
    options: any
  ): any {
    const data = node.data || {};
    const inputs = data.inputs || [];
    const workflowInput = sharedContext.workflowInput || {};

    const results: any[] = [];
    for (const inputParam of inputs) {
      const inputName = inputParam.name || 'input';
      let value = workflowInput[inputName];

      if (value === undefined && inputParam.defaultValue !== undefined) {
        value = inputParam.defaultValue;
      }

      if (inputParam.required && value === undefined) {
        throw new Error(`必需参数 ${inputName} 未提供`);
      }

      sharedContext[inputName] = value;
      results.push({
        name: inputName,
        value,
        type: inputParam.type || typeof value,
      });
    }

    return {
      inputs: results,
      count: results.length,
    };
  }

  /**
   * 执行Agent节点
   */
  private async executeAgentNode(
    node: any,
    sharedContext: Record<string, any>
  ): Promise<any> {
    const agentId = node.agentId || node.data?.agentId;
    if (!agentId) {
      throw new Error(`Agent节点 ${node.id} 未配置agentId`);
    }

    // 获取AI角色配置
    const role = await aiRoleModel.getById(agentId);
    if (!role) {
      throw new Error(`AI角色不存在: ${agentId}`);
    }

    if (!role.enabled) {
      throw new Error(`AI角色已禁用: ${agentId}`);
    }

    // 准备输入数据
    const nodeInput = this.prepareNodeInput(node, sharedContext);
    const query = nodeInput.query || nodeInput.input || JSON.stringify(nodeInput);
    const inputs = { ...nodeInput };
    delete inputs.query;
    delete inputs.input;

    // 根据连接类型调用Dify API
    const { connectionType, apiKey, apiUrl } = role.difyConfig;
    let conversationId = nodeInput.conversationId || '';

    if (!apiKey || !apiUrl) {
      throw new Error(`AI角色 ${agentId} 的Dify配置不完整`);
    }

    // 创建自定义的DifyGateway
    const gateway = new DifyGateway({
      baseUrl: apiUrl,
      workflowBaseUrl: apiUrl,
      apiKey,
      timeout: 60_000,
      maxRetries: 3,
    });

    if (connectionType === 'chatflow') {
      // 使用聊天流模式
      const result = await gateway.executeChat({
        query,
        conversationId,
        inputs,
        userId: 'todify3-user',
      });

      if (isSuccess(result)) {
        const chatResponse = result.value.raw as any;
        return {
          answer: chatResponse.answer || result.value.answer,
          conversation_id: chatResponse.conversation_id || result.value.conversationId,
          message_id: chatResponse.message_id || result.value.messageId,
          metadata: chatResponse.metadata || {},
          raw: chatResponse,
        };
      } else {
        throw new Error(result.error.message || 'Dify聊天调用失败');
      }
    } else {
      // 使用工作流模式
      const result = await gateway.executeWorkflow({
        workflowId: 'workflow',
        inputs,
        userId: 'todify3-user',
      });

      if (isSuccess(result)) {
        const workflowResponse = result.value.raw as any;
        return {
          result: workflowResponse.data?.outputs?.text || workflowResponse.data?.outputs?.answer || '',
          conversation_id: workflowResponse.conversation_id,
          workflow_run_id: workflowResponse.workflow_run_id || result.value.workflowRunId,
          task_id: workflowResponse.task_id || result.value.taskId,
          raw: workflowResponse,
        };
      } else {
        throw new Error(result.error.message || 'Dify工作流调用失败');
      }
    }
  }

  /**
   * 执行输出节点
   */
  private executeOutputNode(
    node: any,
    sharedContext: Record<string, any>
  ): any {
    const data = node.data || {};
    const outputs = data.outputs || [];

    const results: any[] = [];
    for (const outputParam of outputs) {
      const outputName = outputParam.name || 'output';
      let outputValue: any;

      if (outputParam.sourceNodeId) {
        outputValue = sharedContext.nodeOutputs[outputParam.sourceNodeId];
        
        if (outputParam.sourceField) {
          const fieldPath = outputParam.sourceField.split('.');
          outputValue = fieldPath.reduce((obj: any, key: string) => obj?.[key], outputValue);
        }
      } else {
        outputValue = sharedContext;
      }

      if (!sharedContext.outputs) {
        sharedContext.outputs = {};
      }
      sharedContext.outputs[outputName] = outputValue;

      results.push({
        name: outputName,
        value: outputValue,
        type: outputParam.type || typeof outputValue,
      });
    }

    return {
      outputs: results,
      count: results.length,
    };
  }

  /**
   * 准备节点输入
   */
  private prepareNodeInput(
    node: any,
    sharedContext: Record<string, any>
  ): Record<string, any> {
    const nodeInput: Record<string, any> = {};

    // 合并静态输入
    if (node.data?.inputs) {
      Object.assign(nodeInput, node.data.inputs);
    }

    // 合并共享上下文
    Object.assign(nodeInput, sharedContext);

    // 合并上游节点输出
    if (node.data?.inputSources) {
      for (const [field, source] of Object.entries(node.data.inputSources as Record<string, any>)) {
        if (source.type === 'static') {
          nodeInput[field] = source.value;
        } else if (source.type === 'node_output') {
          const upstreamOutput = sharedContext.nodeOutputs?.[source.nodeId];
          if (upstreamOutput) {
            nodeInput[field] = source.outputField
              ? upstreamOutput[source.outputField]
              : upstreamOutput;
          }
        }
      }
    }

    return nodeInput;
  }

  /**
   * 获取工作流执行历史
   */
  async getExecutionHistory(workflowId: string): Promise<WorkflowExecution[]> {
    return await workflowExecutionModel.getByWorkflowId(workflowId);
  }

  /**
   * 获取执行详情
   */
  async getExecutionById(executionId: string): Promise<WorkflowExecution | null> {
    return await workflowExecutionModel.getById(executionId);
  }

  /**
   * 更新执行状态
   */
  async updateExecution(executionId: string, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution> {
    return await workflowExecutionModel.update(executionId, updates);
  }

  private buildFallbackOutput(workflow: AgentWorkflow, workflowInput: Record<string, any>) {
    const query =
      workflowInput?.input ||
      workflowInput?.query ||
      workflowInput?.summary ||
      (typeof workflowInput === 'string' ? workflowInput : '');

    const contentLines: string[] = [];
    if (query) {
      contentLines.push(`根据您的输入：${query}`);
    } else {
      contentLines.push('尚未获取到具体的用户输入。');
    }

    const hasConfiguredAgent = this.workflowHasConfiguredAgent(workflow);
    if (hasConfiguredAgent) {
      contentLines.push('工作流已启动，但当前环境尚未接入实际的执行引擎。');
      contentLines.push('如需获得真实结果，请在后端集成 Dify 或实现 Agent 执行逻辑。');
    } else {
      contentLines.push('检测到工作流中尚未配置有效的 Agent 节点。');
      contentLines.push('请在“工作流”页面为 Agent 节点选择对应的智能体后再试。');
    }

    return {
      message: '工作流执行完成（模拟响应）',
      content: contentLines.join('\n'),
      metadata: {
        hasConfiguredAgent,
      },
    };
  }

  private workflowHasConfiguredAgent(workflow: AgentWorkflow): boolean {
    try {
      const nodes = JSON.parse(workflow.nodes);
      return nodes.some(
        (node: any) =>
          node?.type === 'agent' &&
          node?.data &&
          node.data.agentId &&
          String(node.data.agentId).trim().length > 0,
      );
    } catch (error) {
      logger.warn('解析工作流节点失败，无法判断 Agent 配置状态', { workflowId: workflow.id, error });
      return false;
    }
  }

  /**
   * 创建模板
   */
  async createTemplate(data: any): Promise<WorkflowTemplate> {
    console.log('[AgentWorkflowService] createTemplate 接收到的数据:', {
      name: data.name,
      category: data.category,
      hasWorkflowStructure: !!data.workflowStructure,
      hasWorkflow_structure: !!data.workflow_structure,
      workflowStructureType: typeof data.workflowStructure,
      workflowStructureKeys: data.workflowStructure && typeof data.workflowStructure === 'object' ? Object.keys(data.workflowStructure) : null,
    });
    
    // 确保 workflowStructure 字段名正确（前端发送的是 workflowStructure，后端模型期望 workflow_structure）
    const createData: any = {
      name: data.name,
      description: data.description,
      category: data.category,
      thumbnail: data.thumbnail,
      metadata: data.metadata,
      is_public: data.isPublic !== undefined ? data.isPublic : data.is_public,
      // 优先使用 workflowStructure（前端发送的字段名），如果没有则使用 workflow_structure
      workflow_structure: data.workflowStructure || data.workflow_structure,
    };
    
    // 如果有 id，也传递
    if (data.id) {
      createData.id = data.id;
    }
    
    console.log('[AgentWorkflowService] 转换后的数据:', {
      hasWorkflowStructure: !!createData.workflow_structure,
      workflowStructureType: typeof createData.workflow_structure,
      workflowStructureKeys: createData.workflow_structure && typeof createData.workflow_structure === 'object' ? Object.keys(createData.workflow_structure) : null,
    });
    
    return await workflowTemplateModel.create(createData);
  }

  /**
   * 获取所有模板
   */
  async getAllTemplates(category?: string): Promise<WorkflowTemplate[]> {
    return await workflowTemplateModel.getAll(category);
  }

  /**
   * 根据ID获取模板
   */
  async getTemplateById(id: string): Promise<WorkflowTemplate | null> {
    return await workflowTemplateModel.getById(id);
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<boolean> {
    return await workflowTemplateModel.delete(id);
  }

  /**
   * 增加模板使用次数
   */
  async incrementTemplateUsage(id: string): Promise<void> {
    await workflowTemplateModel.incrementUsage(id);
  }

  /**
   * 从模板创建工作流
   */
  async createWorkflowFromTemplate(
    templateId: string,
    options: {
      name: string;
      description?: string;
      agentMappings?: Record<string, string>;
    }
  ): Promise<AgentWorkflow> {
    const template = await workflowTemplateModel.getById(templateId);
    if (!template) {
      throw new Error('模板不存在');
    }

    // 增加使用次数
    await this.incrementTemplateUsage(templateId);

    // 解析模板的工作流结构
    const workflowStructure = JSON.parse(template.workflow_structure);
    
    // 应用agent映射
    let { nodes } = workflowStructure;
    if (options.agentMappings) {
      nodes = nodes.map((node: any) => ({
        ...node,
        agentId: options.agentMappings![node.agentId] || node.agentId,
      }));
    }

    // 创建工作流
    return await this.createWorkflow({
      name: options.name,
      description: options.description || template.description,
      nodes,
      edges: workflowStructure.edges,
    });
  }
}

// 创建服务实例
export const agentWorkflowService = new AgentWorkflowService();

