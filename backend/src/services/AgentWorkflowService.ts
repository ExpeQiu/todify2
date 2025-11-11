import { AgentWorkflow, WorkflowExecution, WorkflowTemplate } from '../models/AgentWorkflow';
import { agentWorkflowModel, workflowExecutionModel, workflowTemplateModel } from '../models';
import { formatApiResponse } from '../utils/validation';
import { logger } from '@/shared/lib/logger';

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
      workflow_id: workflowId,
      workflow_name: workflow.name,
      status: 'running',
      shared_context: options.input || {},
      node_results: [],
      start_time: new Date().toISOString(),
    });

    const fallbackOutput = this.buildFallbackOutput(workflow, options?.input ?? {});

    try {
      await workflowExecutionModel.update(execution.id, {
        status: 'completed',
        end_time: new Date().toISOString(),
        duration: Date.now() - startedAt,
        error: null,
        metadata: {
          ...(fallbackOutput.metadata || {}),
          workflowId,
          fallback: true,
        },
      });
    } catch (error) {
      logger.warn('更新工作流执行记录失败', { executionId: execution.id, error });
    }

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

