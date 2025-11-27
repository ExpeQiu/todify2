import { AgentWorkflow, WorkflowExecution, WorkflowTemplate } from '../models/AgentWorkflow';
import { agentWorkflowModel, workflowExecutionModel, workflowTemplateModel, aiRoleModel } from '../models';
import { formatApiResponse } from '../utils/validation';
import { logger } from '@/shared/lib/logger';
import DifyClient from './DifyClient';
import { DifyGateway } from '@/shared/infrastructure/integrations/dify';
import { isSuccess } from '@/shared/lib/result';
import { AgentOrchestrator } from './agent/AgentOrchestrator';

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
   * 直接执行AI角色（不通过工作流）
   * 支持 Dify 类型和 Direct Agent 类型
   * @param roleId AI角色ID
   * @param input 输入数据，包含 query、sources、history 等
   */
  async executeRole(
    roleId: string,
    input: Record<string, any>
  ): Promise<{ executionId: string; message: string; data?: any }> {
    logger.info('直接执行AI角色', { roleId, inputKeys: Object.keys(input) });
    
    // 获取角色配置
    const role = await aiRoleModel.getById(roleId);
    if (!role) {
      throw new Error(`AI角色不存在: ${roleId}`);
    }
    
    if (!role.enabled) {
      throw new Error(`AI角色已禁用: ${roleId}`);
    }
    
    const provider = role.provider || 'dify';
    
    // 提取 query
    const query = input.query || input.input || input.text || input.content || JSON.stringify(input);
    
    try {
      if (provider === 'direct-agent') {
        // Direct Agent 类型：使用 AgentOrchestrator
        logger.info('使用 Direct Agent 模式执行', { roleId, queryLength: query?.length });
        
        const orchestrator = new AgentOrchestrator();
        const result = await orchestrator.executeAgent(
          roleId,
          query,
          '', // 不传递 conversationId，每次是独立的调用
          input // 传递完整输入作为上下文
        );
        
        return {
          executionId: `exec_direct_${Date.now()}`,
          message: result.content || '角色执行完成',
          data: {
            outputs: {
              answer: result.content,
              content: result.content,
              conversationId: result.conversationId,
              usage: result.usage,
              metadata: result.metadata,
            },
            nodeOutputs: {},
          },
        };
      } else {
        // Dify 类型：使用 executeAgentNode
        logger.info('使用 Dify 模式执行', { roleId, queryLength: query?.length });
        
        // 构建一个虚拟的 Agent 节点
        const virtualNode = {
          id: `virtual_${Date.now()}`,
          type: 'agent',
          agentId: roleId,
          data: { agentId: roleId },
        };
        
        // 构建共享上下文
        const sharedContext = {
          workflowInput: input,
          nodeOutputs: {},
        };
        
        const result = await this.executeAgentNode(virtualNode, sharedContext);
        
        // 提取内容
        const content = result?.answer || result?.result || result?.content || '';
        
        return {
          executionId: `exec_role_${Date.now()}`,
          message: content || '角色执行完成',
          data: {
            outputs: result,
            nodeOutputs: { [virtualNode.id]: result },
          },
        };
      }
    } catch (error) {
      logger.error('AI角色执行失败', { roleId, provider, error });
      throw error;
    }
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

      logger.info('开始执行工作流', {
        workflowId,
        workflowName: workflow.name,
        nodesCount: nodes.length,
        edgesCount: edges.length,
        nodeTypes: nodes.map((n: any) => n.type),
        agentNodes: nodes.filter((n: any) => n.type === 'agent').map((n: any) => ({
          id: n.id,
          agentId: n.agentId || n.data?.agentId,
          hasData: !!n.data,
        })),
        outputNodes: nodes.filter((n: any) => n.type === 'output').map((n: any) => ({
          id: n.id,
          outputs: n.data?.outputs,
        })),
      });

      // 检查是否有配置的Agent节点
      const hasConfiguredAgent = this.workflowHasConfiguredAgent(workflow);
      logger.info('检查Agent节点配置', {
        workflowId,
        hasConfiguredAgent,
      });
      
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

      logger.info('工作流执行顺序', {
        workflowId,
        executionOrderLevels: executionOrder.length,
        executionOrder: executionOrder.map((level, idx) => ({
          level: idx + 1,
          nodes: level.map((n: any) => ({ id: n.id, type: n.type })),
        })),
      });

      for (const level of executionOrder) {
        // 并行执行同一层的节点
        logger.info('执行节点层级', {
          workflowId,
          levelNodes: level.map((n: any) => ({ id: n.id, type: n.type })),
        });
        
        const levelResults = await Promise.allSettled(
          level.map(node => this.executeNode(node, sharedContext, options))
        );

        levelResults.forEach((result, index) => {
          const node = level[index];
          if (result.status === 'fulfilled') {
            const nodeOutput = result.value;
            nodeResults.push({
              nodeId: node.id,
              status: 'completed',
              output: nodeOutput,
            });
            sharedContext.nodeOutputs[node.id] = nodeOutput;
            
            // 记录节点执行结果（特别是Agent节点）
            if (node.type === 'agent') {
              logger.info('Agent节点执行完成', {
                nodeId: node.id,
                hasOutput: !!nodeOutput,
                outputType: typeof nodeOutput,
                outputKeys: nodeOutput && typeof nodeOutput === 'object' ? Object.keys(nodeOutput) : null,
                hasAnswer: nodeOutput && typeof nodeOutput === 'object' ? !!nodeOutput.answer : false,
                answerType: nodeOutput && typeof nodeOutput === 'object' && nodeOutput.answer ? typeof nodeOutput.answer : null,
                answerLength: nodeOutput && typeof nodeOutput === 'object' && nodeOutput.answer && typeof nodeOutput.answer === 'string' ? nodeOutput.answer.length : null,
              });
            }
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

      // 辅助函数：从输出对象中提取内容
      const extractContent = (output: any): string => {
        if (!output) return '';
        
        // 如果是字符串，直接返回
        if (typeof output === 'string') {
          return output.trim();
        }
        
        // 如果是数组，尝试提取第一个元素
        if (Array.isArray(output)) {
          if (output.length > 0) {
            return extractContent(output[0]);
          }
          return '';
        }
        
        // 如果是对象，尝试从常见字段中提取
        if (typeof output === 'object') {
          // 优先从 answer 字段提取（Agent节点chatflow模式通常返回这个字段）
          if (output.answer && typeof output.answer === 'string' && output.answer.trim()) {
            logger.info('从answer字段提取内容', {
              answerLength: output.answer.length,
              answerPreview: output.answer.substring(0, 100),
            });
            return output.answer.trim();
          }
          // 然后尝试 result 字段（Agent节点workflow模式通常返回这个字段）
          if (output.result && typeof output.result === 'string' && output.result.trim()) {
            logger.info('从result字段提取内容', {
              resultLength: output.result.length,
              resultPreview: output.result.substring(0, 100),
            });
            return output.result.trim();
          }
          // 尝试 content 字段
          if (output.content && typeof output.content === 'string' && output.content.trim()) {
            logger.info('从content字段提取内容', {
              contentLength: output.content.length,
              contentPreview: output.content.substring(0, 100),
            });
            return output.content.trim();
          }
          // 尝试 text 字段
          if (output.text && typeof output.text === 'string' && output.text.trim()) {
            logger.info('从text字段提取内容', {
              textLength: output.text.length,
              textPreview: output.text.substring(0, 100),
            });
            return output.text.trim();
          }
          // 尝试 message 字段
          if (output.message && typeof output.message === 'string' && output.message.trim()) {
            logger.info('从message字段提取内容', {
              messageLength: output.message.length,
              messagePreview: output.message.substring(0, 100),
            });
            return output.message.trim();
          }
          
          // 如果都没有，尝试从raw字段中提取
          if (output.raw) {
            const rawContent = extractContent(output.raw);
            if (rawContent) return rawContent;
          }
          
          // 如果对象有 value 字段（输出节点的结构），递归提取
          if (output.value !== undefined && output.value !== null) {
            const valueContent = extractContent(output.value);
            if (valueContent) return valueContent;
          }
          
          // 如果对象有 outputs 字段（输出节点的结构），尝试从第一个输出项提取
          if (output.outputs && Array.isArray(output.outputs) && output.outputs.length > 0) {
            const firstOutput = output.outputs[0];
            if (firstOutput.value !== undefined && firstOutput.value !== null) {
              const valueContent = extractContent(firstOutput.value);
              if (valueContent) return valueContent;
            }
          }
          
          // 最后回退：字符串化整个对象（但这不是我们想要的，应该返回空字符串）
          // 返回空字符串，让调用者知道提取失败
          return '';
        }
        
        // 其他类型，转换为字符串
        return String(output);
      };

      if (outputNode) {
        const outputData = outputNode.data || {};
        const outputs = outputData.outputs || [];
        
        if (outputs.length > 0 && outputs[0].sourceNodeId) {
          const sourceNodeId = outputs[0].sourceNodeId;
          const sourceOutput = sharedContext.nodeOutputs[sourceNodeId];
          
          logger.info('输出节点配置了源节点', {
            sourceNodeId,
            sourceField: outputs[0].sourceField,
            hasSourceOutput: !!sourceOutput,
            sourceOutputType: typeof sourceOutput,
            sourceOutputKeys: sourceOutput && typeof sourceOutput === 'object' ? Object.keys(sourceOutput) : null,
          });
          
          // 如果输出节点配置了 sourceField，从该字段提取
          if (outputs[0].sourceField) {
            const fieldPath = outputs[0].sourceField.split('.');
            let extractedValue = sourceOutput;
            for (const key of fieldPath) {
              if (extractedValue && typeof extractedValue === 'object') {
                extractedValue = extractedValue[key];
              } else {
                extractedValue = undefined;
                break;
              }
            }
            if (extractedValue !== undefined) {
              finalOutput = extractedValue;
              outputContent = extractContent(extractedValue);
              logger.info('从源节点的指定字段提取内容', {
                fieldPath: outputs[0].sourceField,
                extractedType: typeof extractedValue,
                contentLength: outputContent.length,
              });
            } else {
              // 如果指定字段不存在，尝试从整个源输出中提取
              finalOutput = sourceOutput;
              outputContent = extractContent(sourceOutput);
              logger.info('从源节点的整个输出提取内容', {
                contentLength: outputContent.length,
              });
            }
          } else {
            // 如果没有指定字段，从整个源输出中提取
            finalOutput = sourceOutput;
            outputContent = extractContent(sourceOutput);
            logger.info('从源节点的整个输出提取内容（无字段指定）', {
              contentLength: outputContent.length,
            });
          }
        } else {
          // 如果输出节点没有配置源节点，尝试从输出节点本身的输出中提取
          logger.warn('输出节点没有配置源节点，尝试从输出节点结果中提取', {
            outputNodeId: outputNode.id,
          });
          
          const outputNodeResult = sharedContext.nodeOutputs[outputNode.id];
          if (outputNodeResult) {
            logger.info('输出节点执行结果', {
              hasOutputs: !!outputNodeResult.outputs,
              outputsLength: Array.isArray(outputNodeResult.outputs) ? outputNodeResult.outputs.length : 0,
              outputNodeResultType: typeof outputNodeResult,
              outputNodeResultKeys: typeof outputNodeResult === 'object' ? Object.keys(outputNodeResult) : null,
            });
            
            // 输出节点的结果通常是结构化的：{ outputs: [{ name, value, type }], count: 1 }
            // 需要从 outputs[].value 中提取实际内容
            if (outputNodeResult.outputs && Array.isArray(outputNodeResult.outputs)) {
              // 尝试从输出节点的输出数组中提取
              for (const outputItem of outputNodeResult.outputs) {
                if (outputItem.value !== undefined && outputItem.value !== null) {
                  logger.info('从输出节点的value字段提取', {
                    outputName: outputItem.name,
                    valueType: typeof outputItem.value,
                    valueKeys: outputItem.value && typeof outputItem.value === 'object' ? Object.keys(outputItem.value) : null,
                  });
                  
                  const extracted = extractContent(outputItem.value);
                  if (extracted && extracted.trim()) {
                    finalOutput = outputItem.value;
                    outputContent = extracted;
                    logger.info('从输出节点的value字段提取内容成功', {
                      outputName: outputItem.name,
                      contentLength: outputContent.length,
                      contentPreview: outputContent.substring(0, 100),
                    });
                    break;
                  }
                }
              }
            }
            // 如果还是没有，尝试直接提取整个输出节点结果
            if (!outputContent || !outputContent.trim()) {
              logger.warn('从输出节点的value字段提取失败，尝试直接提取整个结果');
              outputContent = extractContent(outputNodeResult);
              if (outputContent && outputContent.trim()) {
                finalOutput = outputNodeResult;
                logger.info('从输出节点结果直接提取内容', {
                  contentLength: outputContent.length,
                  contentPreview: outputContent.substring(0, 100),
                });
              }
            }
          } else {
            logger.warn('输出节点执行结果不存在', {
              outputNodeId: outputNode.id,
              availableNodeOutputs: Object.keys(sharedContext.nodeOutputs || {}),
            });
          }
        }
      }

      // 如果没有找到输出节点或内容为空，尝试从所有agent节点获取结果
      if (!outputContent || !outputContent.trim()) {
        const agentNodes = nodes.filter((n: any) => n.type === 'agent');
        logger.info('尝试从Agent节点提取内容', {
          agentNodesCount: agentNodes.length,
          agentNodeIds: agentNodes.map(n => n.id),
          availableNodeOutputs: Object.keys(sharedContext.nodeOutputs || {}),
        });
        
        if (agentNodes.length > 0) {
          // 从最后一个agent节点开始，向前查找
          for (let i = agentNodes.length - 1; i >= 0; i--) {
            const agentNode = agentNodes[i];
            const agentOutput = sharedContext.nodeOutputs[agentNode.id];
            
            logger.info('检查Agent节点输出', {
              nodeId: agentNode.id,
              hasOutput: !!agentOutput,
              outputType: typeof agentOutput,
              outputKeys: agentOutput && typeof agentOutput === 'object' ? Object.keys(agentOutput) : null,
            });
            
            if (agentOutput) {
              // 直接尝试从answer字段提取（Agent节点chatflow模式通常返回这个字段）
              let extracted = '';
              if (agentOutput.answer && typeof agentOutput.answer === 'string' && agentOutput.answer.trim()) {
                extracted = agentOutput.answer.trim();
                logger.info('从Agent节点answer字段提取内容', {
                  nodeId: agentNode.id,
                  extractedLength: extracted.length,
                  extractedPreview: extracted.substring(0, 100),
                });
              } else if (agentOutput.result && typeof agentOutput.result === 'string' && agentOutput.result.trim()) {
                // 尝试从result字段提取（Agent节点workflow模式通常返回这个字段）
                extracted = agentOutput.result.trim();
                logger.info('从Agent节点result字段提取内容', {
                  nodeId: agentNode.id,
                  extractedLength: extracted.length,
                  extractedPreview: extracted.substring(0, 100),
                });
              } else {
                // 使用extractContent函数提取
                logger.info('使用extractContent函数从Agent节点提取内容', {
                  nodeId: agentNode.id,
                  outputType: typeof agentOutput,
                  outputKeys: typeof agentOutput === 'object' ? Object.keys(agentOutput) : null,
                });
                extracted = extractContent(agentOutput);
              }
              
              if (extracted && extracted.trim()) {
                finalOutput = agentOutput;
                outputContent = extracted;
                logger.info('从Agent节点提取内容成功', { 
                  nodeId: agentNode.id,
                  contentLength: outputContent.length,
                  contentPreview: outputContent.substring(0, 100),
                });
                break;
              } else {
                logger.warn('从Agent节点提取内容失败', {
                  nodeId: agentNode.id,
                  extractedLength: extracted?.length || 0,
                  outputType: typeof agentOutput,
                  outputKeys: typeof agentOutput === 'object' ? Object.keys(agentOutput) : null,
                  hasAnswer: agentOutput && typeof agentOutput === 'object' ? !!agentOutput.answer : false,
                  hasResult: agentOutput && typeof agentOutput === 'object' ? !!agentOutput.result : false,
                  answerType: agentOutput && typeof agentOutput === 'object' && agentOutput.answer ? typeof agentOutput.answer : null,
                  resultType: agentOutput && typeof agentOutput === 'object' && agentOutput.result ? typeof agentOutput.result : null,
                });
              }
            } else {
              logger.warn('Agent节点输出不存在', {
                nodeId: agentNode.id,
              });
            }
          }
        }
      }

      // 如果还是没有内容，尝试从所有节点输出中查找
      if (!outputContent || !outputContent.trim()) {
        logger.info('尝试从所有节点输出中查找内容', {
          availableNodeOutputs: Object.keys(sharedContext.nodeOutputs || {}),
        });
        
        for (const [nodeId, nodeOutput] of Object.entries(sharedContext.nodeOutputs || {})) {
          logger.info('检查节点输出', {
            nodeId,
            outputType: typeof nodeOutput,
            outputKeys: nodeOutput && typeof nodeOutput === 'object' ? Object.keys(nodeOutput) : null,
          });
          
          // 直接尝试从answer字段提取（chatflow模式）
          let extracted = '';
          if (nodeOutput && typeof nodeOutput === 'object' && nodeOutput.answer && typeof nodeOutput.answer === 'string' && nodeOutput.answer.trim()) {
            extracted = nodeOutput.answer.trim();
            logger.info('从节点输出answer字段提取内容', {
              nodeId,
              extractedLength: extracted.length,
              extractedPreview: extracted.substring(0, 100),
            });
          } else if (nodeOutput && typeof nodeOutput === 'object' && nodeOutput.result && typeof nodeOutput.result === 'string' && nodeOutput.result.trim()) {
            // 尝试从result字段提取（workflow模式）
            extracted = nodeOutput.result.trim();
            logger.info('从节点输出result字段提取内容', {
              nodeId,
              extractedLength: extracted.length,
              extractedPreview: extracted.substring(0, 100),
            });
          } else {
            extracted = extractContent(nodeOutput);
          }
          
          if (extracted && extracted.trim()) {
            finalOutput = nodeOutput;
            outputContent = extracted;
            logger.info('从节点输出中提取内容成功', { 
              nodeId,
              contentLength: outputContent.length,
              contentPreview: outputContent.substring(0, 100),
            });
            break;
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

      // 从 Agent 节点输出中提取 conversation_id（用于多轮对话）
      let conversationId: string | null = null;
      for (const [nodeId, nodeOutput] of Object.entries(sharedContext.nodeOutputs || {})) {
        if (nodeOutput && typeof nodeOutput === 'object' && nodeOutput.conversation_id) {
          conversationId = nodeOutput.conversation_id;
          logger.info('从 Agent 节点输出中提取到 conversation_id', {
            nodeId,
            conversationId,
          });
          break;
        }
      }

      // 记录最终提取的内容
      logger.info('工作流执行完成，提取结果', {
        workflowId,
        executionId: execution.id,
        hasContent: !!outputContent,
        contentLength: outputContent?.length || 0,
        nodeResultsCount: nodeResults.length,
        nodeOutputsKeys: Object.keys(sharedContext.nodeOutputs || {}),
        hasConversationId: !!conversationId,
      });

      return {
        executionId: execution.id,
        message: outputContent || '工作流执行完成',
        data: {
          outputs: {
            output: finalOutput || outputContent,
            text: outputContent,
            answer: outputContent,
            content: outputContent,
            conversation_id: conversationId || undefined, // 包含 conversation_id 用于多轮对话
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

    logger.info('执行输入节点', {
      nodeId: node.id,
      inputsCount: inputs.length,
      inputNames: inputs.map((i: any) => i.name),
      workflowInputKeys: Object.keys(workflowInput),
      hasQuery: !!workflowInput.query,
    });

    const results: any[] = [];
    for (const inputParam of inputs) {
      const inputName = inputParam.name || 'input';
      let value = workflowInput[inputName];

      // 如果字段名为 'input' 但没有值，尝试使用 'query' 字段
      if (value === undefined && inputName === 'input' && workflowInput.query) {
        value = workflowInput.query;
        logger.info('输入节点：将query字段映射到input', {
          nodeId: node.id,
          queryValue: typeof value === 'string' ? value.substring(0, 100) : value,
        });
      }

      if (value === undefined && inputParam.defaultValue !== undefined) {
        value = inputParam.defaultValue;
      }

      if (inputParam.required && value === undefined) {
        logger.error('输入节点必需参数未提供', {
          nodeId: node.id,
          inputName,
          availableKeys: Object.keys(workflowInput),
        });
        throw new Error(`必需参数 ${inputName} 未提供`);
      }

      sharedContext[inputName] = value;
      results.push({
        name: inputName,
        value,
        type: inputParam.type || typeof value,
      });
    }

    logger.info('输入节点执行完成', {
      nodeId: node.id,
      resultsCount: results.length,
      results: results.map((r: any) => ({ name: r.name, type: r.type, hasValue: r.value !== undefined })),
    });

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
    
    // 尝试从多个可能的字段中提取query
    // 优先级：query > input > workflowInput.query > 整个nodeInput的字符串化
    let query = nodeInput.query;
    if (!query) {
      query = nodeInput.input;
    }
    if (!query && nodeInput.workflowInput?.query) {
      query = nodeInput.workflowInput.query;
    }
    if (!query && typeof nodeInput === 'object') {
      // 如果还是没有，尝试从其他常见字段中提取
      query = nodeInput.question || nodeInput.text || nodeInput.content;
    }
    if (!query) {
      // 最后回退：如果nodeInput是字符串，直接使用；否则字符串化
      query = typeof nodeInput === 'string' ? nodeInput : JSON.stringify(nodeInput);
    }
    
    const inputs = { ...nodeInput };
    delete inputs.query;
    delete inputs.input;

    // 检查 provider 类型，Workflow 目前只支持 Dify
    const provider = role.provider || 'dify';
    if (provider === 'direct-agent') {
      throw new Error(`AI角色 ${agentId} 是 Direct Agent 类型，不支持在 Workflow 中使用。请使用 Dify 类型的角色。`);
    }

    // 根据连接类型调用Dify API
    if (!role.difyConfig) {
      throw new Error(`AI角色 ${agentId} 的Dify配置不存在`);
    }

    const { connectionType, apiKey, apiUrl } = role.difyConfig;
    // 尝试从多个可能的位置获取 conversationId
    // 优先级：nodeInput.conversationId > nodeInput.workflowInput.conversationId > sharedContext.workflowInput.conversationId
    let conversationId = nodeInput.conversationId || '';
    if (!conversationId && nodeInput.workflowInput?.conversationId) {
      conversationId = nodeInput.workflowInput.conversationId;
      logger.info('从 nodeInput.workflowInput 获取到 conversationId', { conversationId });
    }
    if (!conversationId && sharedContext.workflowInput?.conversationId) {
      conversationId = sharedContext.workflowInput.conversationId;
      logger.info('从 sharedContext.workflowInput 获取到 conversationId', { conversationId });
    }

    if (!apiKey || !apiUrl) {
      throw new Error(`AI角色 ${agentId} 的Dify配置不完整`);
    }

    // 处理相对路径：如果是相对路径，使用实际的 Dify 服务器地址
    let actualBaseUrl = apiUrl;
    if (apiUrl.startsWith('/')) {
      // 相对路径，通过后端代理处理，使用实际的 Dify 服务器地址
      actualBaseUrl = process.env.DIFY_BASE_URL || 'http://47.113.225.93:9999/v1';
      logger.info('检测到相对路径，转换为完整URL', {
        agentId,
        原始: apiUrl,
        转换后: actualBaseUrl,
      });
    }

    logger.info('创建 DifyGateway', {
      agentId,
      baseUrl: actualBaseUrl,
      apiKey: apiKey.substring(0, 10) + '...',
      connectionType,
    });

    // 创建自定义的DifyGateway
    const gateway = new DifyGateway({
      baseUrl: actualBaseUrl,
      workflowBaseUrl: actualBaseUrl,
      apiKey,
      timeout: 60_000,
      maxRetries: 3,
    });

    logger.info('准备执行Agent节点', {
      nodeId: node.id,
      agentId,
      connectionType,
      query: query?.substring(0, 100),
      queryLength: query?.length || 0,
      '传递给Dify的conversationId': conversationId || '空（首次对话）',
      inputsKeys: Object.keys(inputs || {}),
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
        const agentOutput = {
          answer: chatResponse.answer || result.value.answer,
          conversation_id: chatResponse.conversation_id || result.value.conversationId,
          message_id: chatResponse.message_id || result.value.messageId,
          metadata: chatResponse.metadata || {},
          raw: chatResponse,
        };
        
        logger.info('Agent节点执行完成 (chatflow)', {
          nodeId: node.id,
          agentId,
          hasAnswer: !!agentOutput.answer,
          answerLength: agentOutput.answer?.length || 0,
          answerPreview: agentOutput.answer?.substring(0, 200) || null,
          answerType: typeof agentOutput.answer,
          rawKeys: chatResponse && typeof chatResponse === 'object' ? Object.keys(chatResponse) : null,
        });
        
        return agentOutput;
      } else {
        logger.error('Agent节点执行失败 (chatflow)', {
          nodeId: node.id,
          agentId,
          error: result.error,
        });
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
        const agentOutput = {
          result: workflowResponse.data?.outputs?.text || workflowResponse.data?.outputs?.answer || '',
          conversation_id: workflowResponse.conversation_id,
          workflow_run_id: workflowResponse.workflow_run_id || result.value.workflowRunId,
          task_id: workflowResponse.task_id || result.value.taskId,
          raw: workflowResponse,
        };
        
        logger.info('Agent节点执行完成 (workflow)', {
          nodeId: node.id,
          agentId,
          hasResult: !!agentOutput.result,
          resultLength: agentOutput.result?.length || 0,
          resultPreview: agentOutput.result?.substring(0, 200) || null,
          resultType: typeof agentOutput.result,
          rawKeys: workflowResponse && typeof workflowResponse === 'object' ? Object.keys(workflowResponse) : null,
          outputsKeys: workflowResponse?.data?.outputs && typeof workflowResponse.data.outputs === 'object' ? Object.keys(workflowResponse.data.outputs) : null,
        });
        
        return agentOutput;
      } else {
        logger.error('Agent节点执行失败 (workflow)', {
          nodeId: node.id,
          agentId,
          error: result.error,
        });
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

