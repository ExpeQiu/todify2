/**
 * Workflow执行引擎
 * 负责解析和执行Agent Workflow
 */

import {
  AgentWorkflow,
  AgentWorkflowNode,
  AgentWorkflowEdge,
  WorkflowExecution,
  WorkflowExecutionOptions,
  WorkflowExecutionStatus,
  NodeExecutionResult,
  NodeExecutionStatus,
  SharedContext,
  DEFAULT_EXECUTION_OPTIONS,
} from '../types/agentWorkflow';
import aiRoleService from './aiRoleService';

// ==================== 执行引擎类 ====================

export class WorkflowEngine {
  private execution: WorkflowExecution | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private onProgressCallback?: (execution: WorkflowExecution) => void;

  /**
   * 设置进度回调
   */
  onProgress(callback: (execution: WorkflowExecution) => void) {
    this.onProgressCallback = callback;
  }

  /**
   * 执行工作流
   */
  async execute(
    workflow: AgentWorkflow,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecution> {
    if (this.isRunning) {
      throw new Error('工作流正在执行中');
    }

    const mergedOptions = { ...DEFAULT_EXECUTION_OPTIONS, ...options };
    this.isRunning = true;
    this.isPaused = false;
    this.isCancelled = false;

    // 创建执行实例
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.execution = {
      id: executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: 'running' as WorkflowExecutionStatus,
      sharedContext: {
        workflowInput: mergedOptions.input || {},
        nodeOutputs: {},
      },
      nodeResults: [],
      startTime: new Date(),
    };

    // 初始化所有节点为pending状态
    for (const node of workflow.nodes) {
      this.execution.nodeResults.push({
        nodeId: node.id,
        status: 'pending',
        startTime: new Date(),
      });
    }

    this.notifyProgress();

    try {
      // 按照拓扑排序执行节点
      const executionOrder = this.topologicalSort(workflow.nodes, workflow.edges);
      await this.executeNodesInOrder(workflow, executionOrder, mergedOptions);
      
      this.execution.status = 'completed';
      this.execution.endTime = new Date();
      this.execution.duration = this.execution.endTime.getTime() - this.execution.startTime.getTime();
    } catch (error) {
      this.execution.status = 'failed';
      this.execution.endTime = new Date();
      this.execution.duration = this.execution.endTime.getTime() - this.execution.startTime.getTime();
      this.execution.error = {
        message: error instanceof Error ? error.message : String(error),
      };
    } finally {
      this.isRunning = false;
      this.notifyProgress();
    }

    return this.execution;
  }

  /**
   * 暂停执行
   */
  pause() {
    if (this.isRunning) {
      this.isPaused = true;
      this.execution!.status = 'paused';
      this.notifyProgress();
    }
  }

  /**
   * 继续执行
   */
  resume() {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      this.execution!.status = 'running';
      this.notifyProgress();
    }
  }

  /**
   * 取消执行
   */
  cancel() {
    if (this.isRunning) {
      this.isCancelled = true;
      this.execution!.status = 'cancelled';
      this.execution!.endTime = new Date();
      this.execution!.duration = this.execution!.endTime.getTime() - this.execution!.startTime.getTime();
      this.notifyProgress();
    }
  }

  /**
   * 获取当前执行状态
   */
  getExecution(): WorkflowExecution | null {
    return this.execution;
  }

  /**
   * 拓扑排序：确定节点执行顺序
   */
  private topologicalSort(
    nodes: AgentWorkflowNode[],
    edges: AgentWorkflowEdge[]
  ): AgentWorkflowNode[][] {
    // 构建依赖图和入度数组
    const nodeMap = new Map<string, AgentWorkflowNode>();
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

    // 使用Kahn算法进行拓扑排序
    const result: AgentWorkflowNode[][] = [];
    const queue: AgentWorkflowNode[] = [];
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
      const level: AgentWorkflowNode[] = [];

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
   * 按顺序执行节点
   */
  private async executeNodesInOrder(
    workflow: AgentWorkflow,
    executionOrder: AgentWorkflowNode[][],
    options: Required<WorkflowExecutionOptions>
  ): Promise<void> {
    // 逐层执行
    for (const level of executionOrder) {
      if (this.isCancelled) {
        throw new Error('工作流已取消');
      }

      // 等待暂停恢复
      while (this.isPaused && !this.isCancelled) {
        await this.sleep(100);
      }

      if (this.isCancelled) {
        throw new Error('工作流已取消');
      }

      // 并行执行同一层的节点
      await this.executeLevelInParallel(workflow, level, options);
    }
  }

  /**
   * 并行执行同层节点
   */
  private async executeLevelInParallel(
    workflow: AgentWorkflow,
    level: AgentWorkflowNode[],
    options: Required<WorkflowExecutionOptions>
  ): Promise<void> {
    const maxConcurrent = Math.min(options.maxConcurrentNodes, level.length);
    const chunks: AgentWorkflowNode[][] = [];

    // 将节点分块以控制并发数
    for (let i = 0; i < level.length; i += maxConcurrent) {
      chunks.push(level.slice(i, i + maxConcurrent));
    }

    // 逐块执行
    for (const chunk of chunks) {
      if (this.isCancelled) {
        throw new Error('工作流已取消');
      }

      // 并行执行当前块中的节点
      const promises = chunk.map(node => this.executeNode(workflow, node, options));
      await Promise.allSettled(promises);
    }
  }

  /**
   * 执行单个节点
   */
  private async executeNode(
    workflow: AgentWorkflow,
    node: AgentWorkflowNode,
    options: Required<WorkflowExecutionOptions>
  ): Promise<void> {
    const nodeResult = this.execution!.nodeResults.find(r => r.nodeId === node.id);
    if (!nodeResult) {
      return;
    }

    nodeResult.status = 'running';
    nodeResult.startTime = new Date();
    this.notifyProgress();

    try {
      // 准备节点输入
      const nodeInput = await this.prepareNodeInput(workflow, node, this.execution!.sharedContext);
      nodeResult.input = nodeInput;

      let output: any;

      // 根据节点类型执行不同的逻辑
      switch (node.type) {
        case 'agent':
          output = await this.executeAgentNode(node, nodeInput);
          break;
        case 'condition':
          output = await this.executeConditionNode(node, nodeInput);
          break;
        case 'assign':
          output = await this.executeAssignNode(node, nodeInput);
          break;
        case 'merge':
          output = await this.executeMergeNode(node, workflow);
          break;
        case 'transform':
          output = await this.executeTransformNode(node, nodeInput);
          break;
        case 'input':
          output = await this.executeInputNode(node, options.input);
          break;
        case 'output':
          output = await this.executeOutputNode(node, workflow);
          break;
        case 'memory':
          output = await this.executeMemoryNode(node, workflow);
          break;
        default:
          throw new Error(`不支持的节点类型: ${node.type}`);
      }

      nodeResult.status = 'completed';
      nodeResult.output = output;
      nodeResult.endTime = new Date();
      nodeResult.duration = nodeResult.endTime.getTime() - nodeResult.startTime.getTime();

      // 将输出保存到共享上下文
      this.execution!.sharedContext.nodeOutputs[node.id] = output;

    } catch (error) {
      nodeResult.status = 'failed';
      nodeResult.endTime = new Date();
      nodeResult.duration = nodeResult.endTime.getTime() - nodeResult.startTime.getTime();
      nodeResult.error = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };

      if (!options.continueOnError) {
        throw error;
      }

      if (options.logging) {
        console.error(`节点执行失败: ${node.id}`, error);
      }
    } finally {
      this.notifyProgress();
    }
  }

  /**
   * 执行Agent节点
   */
  private async executeAgentNode(node: AgentWorkflowNode, input: any): Promise<any> {
    // 获取Agent配置
    const agent = await aiRoleService.getAIRole(node.agentId!);
    if (!agent) {
      throw new Error(`Agent不存在: ${node.agentId}`);
    }

    // 调用Agent执行（通过Dify API）
    return await this.callAgent(agent, input);
  }

  /**
   * 执行条件节点
   */
  private async executeConditionNode(node: AgentWorkflowNode, input: any): Promise<any> {
    const data = node.data as any;
    const condition = data.condition || {};

    // 解析变量引用
    const resolveValue = (value: string): any => {
      if (!value || typeof value !== 'string') return value;
      
      // 支持 ${nodeId.output.field} 格式的变量引用
      const varMatch = value.match(/\$\{([^}]+)\}/);
      if (varMatch) {
        const path = varMatch[1].split('.');
        let refValue = input;
        
        for (const key of path) {
          if (refValue && typeof refValue === 'object' && key in refValue) {
            refValue = refValue[key];
          } else {
            // 尝试从共享上下文获取
            const nodeId = path[0];
            if (this.execution?.sharedContext.nodeOutputs?.[nodeId]) {
              const nodeOutput = this.execution.sharedContext.nodeOutputs[nodeId];
              const restPath = path.slice(1);
              refValue = restPath.reduce((obj, k) => obj?.[k], nodeOutput);
            } else {
              return value; // 无法解析，返回原值
            }
          }
        }
        return refValue;
      }
      
      return value;
    };

    const leftValue = resolveValue(condition.left || '');
    const rightValue = resolveValue(String(condition.right || ''));

    // 如果有表达式，优先使用表达式
    if (condition.expression) {
      try {
        // 创建一个安全的执行环境
        const context = {
          ...input,
          nodeOutputs: this.execution?.sharedContext.nodeOutputs || {},
          left: leftValue,
          right: rightValue,
        };
        
        // 简单的表达式求值（注意：生产环境应使用更安全的表达式解析器）
        const result = new Function('return ' + condition.expression.replace(/\$\{([^}]+)\}/g, (_, path) => {
          const parts = path.split('.');
          return `context.${parts.join('.')}`;
        }))();
        
        return {
          result: Boolean(result),
          leftValue,
          rightValue,
          condition: condition.expression,
        };
      } catch (error) {
        throw new Error(`条件表达式执行失败: ${condition.expression}, 错误: ${error}`);
      }
    }

    // 使用操作符进行比较
    let result = false;
    const operator = condition.operator || '==';

    switch (operator) {
      case '==':
        result = leftValue == rightValue;
        break;
      case '!=':
        result = leftValue != rightValue;
        break;
      case '>':
        result = Number(leftValue) > Number(rightValue);
        break;
      case '<':
        result = Number(leftValue) < Number(rightValue);
        break;
      case '>=':
        result = Number(leftValue) >= Number(rightValue);
        break;
      case '<=':
        result = Number(leftValue) <= Number(rightValue);
        break;
      case 'contains':
        result = String(leftValue).includes(String(rightValue));
        break;
      case 'not_contains':
        result = !String(leftValue).includes(String(rightValue));
        break;
      case 'startsWith':
        result = String(leftValue).startsWith(String(rightValue));
        break;
      case 'endsWith':
        result = String(leftValue).endsWith(String(rightValue));
        break;
      case 'exists':
        result = leftValue !== undefined && leftValue !== null;
        break;
      case 'not_exists':
        result = leftValue === undefined || leftValue === null;
        break;
      default:
        throw new Error(`不支持的操作符: ${operator}`);
    }

    return {
      result,
      leftValue,
      rightValue,
      operator,
      branch: result ? 'true' : 'false',
    };
  }

  /**
   * 执行赋值节点
   */
  private async executeAssignNode(node: AgentWorkflowNode, input: any): Promise<any> {
    const data = node.data as any;
    const variable = data.variable || 'result';
    let value = data.value || data.expression || '';

    // 解析变量引用和表达式
    if (typeof value === 'string') {
      // 支持 ${nodeId.output.field} 格式的变量引用
      value = value.replace(/\$\{([^}]+)\}/g, (_, path) => {
        const parts = path.split('.');
        let refValue = input;
        
        for (const key of parts) {
          if (refValue && typeof refValue === 'object' && key in refValue) {
            refValue = refValue[key];
          } else {
            // 尝试从共享上下文获取
            const nodeId = parts[0];
            if (this.execution?.sharedContext.nodeOutputs?.[nodeId]) {
              const nodeOutput = this.execution.sharedContext.nodeOutputs[nodeId];
              const restPath = parts.slice(1);
              refValue = restPath.reduce((obj, k) => obj?.[k], nodeOutput);
            } else {
              return `\${${path}}`; // 无法解析，返回原值
            }
          }
        }
        return refValue;
      });

      // 如果有表达式，尝试执行
      if (data.expression && data.expression !== value) {
        try {
          // 简单的表达式求值（注意：生产环境应使用更安全的表达式解析器）
          const context = {
            ...input,
            nodeOutputs: this.execution?.sharedContext.nodeOutputs || {},
          };
          value = new Function('return ' + value.replace(/\$\{([^}]+)\}/g, (_, path) => {
            const parts = path.split('.');
            return `context.${parts.join('.')}`;
          }))();
        } catch {
          // 表达式执行失败，使用原始值
        }
      }

      // 类型转换
      if (data.valueType && data.valueType !== 'auto') {
        switch (data.valueType) {
          case 'number':
            value = Number(value);
            break;
          case 'boolean':
            value = value === 'true' || value === true || value === 1;
            break;
          case 'object':
            try {
              value = JSON.parse(String(value));
            } catch {
              // 解析失败，保持原值
            }
            break;
        }
      }
    }

    // 将变量保存到共享上下文
    this.execution!.sharedContext[variable] = value;

    return {
      variable,
      value,
      valueType: typeof value,
    };
  }

  /**
   * 执行合并节点
   */
  private async executeMergeNode(node: AgentWorkflowNode, workflow: AgentWorkflow): Promise<any> {
    const data = node.data as any;
    const strategy = data.strategy || 'override';
    const sources = data.sources || [];

    // 获取所有源节点的输出
    const sourceOutputs = sources
      .map((nodeId: string) => {
        const output = this.execution?.sharedContext.nodeOutputs?.[nodeId];
        return output !== undefined ? output : null;
      })
      .filter((output: any) => output !== null);

    if (sourceOutputs.length === 0) {
      return {};
    }

    let result: any;

    switch (strategy) {
      case 'override':
        // 后面的覆盖前面的
        result = Object.assign({}, ...sourceOutputs);
        break;
      case 'merge':
        // 深度合并对象
        result = this.deepMerge(...sourceOutputs);
        break;
      case 'append':
        // 数组追加
        result = sourceOutputs.reduce((acc: any[], output: any) => {
          if (Array.isArray(output)) {
            return [...acc, ...output];
          }
          return [...acc, output];
        }, []);
        break;
      case 'concat':
        // 连接（字符串或数组）
        result = sourceOutputs.reduce((acc: any, output: any) => {
          if (typeof acc === 'string' && typeof output === 'string') {
            return acc + output;
          }
          if (Array.isArray(acc) && Array.isArray(output)) {
            return [...acc, ...output];
          }
          return String(acc) + String(output);
        });
        break;
      default:
        result = sourceOutputs[0];
    }

    return {
      strategy,
      sources,
      result,
      mergedCount: sourceOutputs.length,
    };
  }

  /**
   * 深度合并对象
   */
  private deepMerge(...objects: any[]): any {
    const result: any = {};
    
    for (const obj of objects) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) && typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
            result[key] = this.deepMerge(result[key], obj[key]);
          } else {
            result[key] = obj[key];
          }
        }
      }
    }
    
    return result;
  }

  /**
   * 执行转换节点
   */
  private async executeTransformNode(node: AgentWorkflowNode, input: any): Promise<any> {
    const data = node.data as any;
    const ruleType = data.ruleType || 'json_path';
    const rule = data.rule || {};
    let sourceData = input;

    // 获取源数据
    if (data.sourceField) {
      // 支持 ${nodeId.output.field} 格式
      if (data.sourceField.startsWith('${') && data.sourceField.endsWith('}')) {
        const path = data.sourceField.slice(2, -1).split('.');
        const nodeId = path[0];
        if (this.execution?.sharedContext.nodeOutputs?.[nodeId]) {
          const nodeOutput = this.execution.sharedContext.nodeOutputs[nodeId];
          const restPath = path.slice(1);
          sourceData = restPath.reduce((obj, k) => obj?.[k], nodeOutput);
        }
      } else {
        sourceData = sourceData[data.sourceField];
      }
    }

    let result: any;

    switch (ruleType) {
      case 'json_path':
        // JSON路径提取（简化实现，实际应使用JSONPath库）
        if (rule.jsonPath) {
          const path = rule.jsonPath.replace(/^\$\.?/, '').split('.');
          result = path.reduce((obj, k) => obj?.[k], sourceData);
        } else {
          result = sourceData;
        }
        break;
      case 'format':
        // 格式化
        if (rule.format) {
          const values = Array.isArray(sourceData) ? sourceData : [sourceData];
          result = rule.format.replace(/\{(\d+)\}/g, (_, index) => {
            return values[parseInt(index)] || '';
          });
        } else {
          result = sourceData;
        }
        break;
      case 'parse':
        // 解析
        const parseAs = rule.parseAs || 'json';
        if (typeof sourceData === 'string') {
          switch (parseAs) {
            case 'json':
              try {
                result = JSON.parse(sourceData);
              } catch {
                result = sourceData;
              }
              break;
            case 'number':
              result = Number(sourceData);
              break;
            case 'boolean':
              result = sourceData === 'true' || sourceData === '1';
              break;
            case 'date':
              result = new Date(sourceData);
              break;
            default:
              result = sourceData;
          }
        } else {
          result = sourceData;
        }
        break;
      case 'stringify':
        // 序列化
        try {
          result = JSON.stringify(sourceData);
        } catch {
          result = String(sourceData);
        }
        break;
      default:
        result = sourceData;
    }

    return {
      ruleType,
      sourceData,
      result,
      targetField: data.targetField,
    };
  }

  /**
   * 执行输入节点
   */
  private async executeInputNode(node: AgentWorkflowNode, workflowInput: any): Promise<any> {
    const data = node.data as any;
    const inputs = data.inputs || [];
    
    const results: any[] = [];
    
    for (const inputParam of inputs) {
      const inputName = inputParam.name || 'input';
      
      // 从工作流输入中获取对应参数的值
      let value = workflowInput?.[inputName];
      
      // 如果没有提供值，使用默认值
      if (value === undefined && inputParam.defaultValue !== undefined) {
        value = inputParam.defaultValue;
      }
      
      // 如果必需且没有值，抛出错误
      if (inputParam.required && value === undefined) {
        throw new Error(`必需参数 ${inputName} 未提供`);
      }
      
      // 如果是文件类型，处理文件
      if (inputParam.type === 'file' && value) {
        // 如果是File对象，转换为base64或保存文件信息
        if (value instanceof File) {
          // 检查文件大小限制
          if (inputParam.maxSize && value.size > inputParam.maxSize) {
            throw new Error(`文件 ${inputName} 大小超过限制 ${(inputParam.maxSize / (1024 * 1024)).toFixed(2)}MB`);
          }
          
          // 检查文件类型
          if (inputParam.accept) {
            const accepts = inputParam.accept.split(',').map(a => a.trim());
            const fileType = value.type || '';
            const fileName = value.name || '';
            const fileExt = fileName.includes('.') ? '.' + fileName.split('.').pop()?.toLowerCase() : '';
            
            const isValidType = accepts.some(accept => {
              if (accept.startsWith('.')) {
                return fileExt === accept || fileExt === accept.toLowerCase();
              } else if (accept.includes('*')) {
                const baseType = accept.split('/')[0];
                return fileType.startsWith(baseType + '/');
              } else {
                return fileType === accept || fileExt === accept;
              }
            });
            
            if (!isValidType) {
              throw new Error(`文件 ${inputName} 类型不符合要求，需要: ${inputParam.accept}`);
            }
          }
          
          // 将文件转换为base64（对于小文件）或保存文件信息
          // 这里可以根据实际需求选择处理方式
          value = {
            name: value.name,
            type: value.type,
            size: value.size,
            lastModified: value.lastModified,
            // 如果需要，可以在这里读取文件内容为base64
            // content: await this.fileToBase64(value),
          };
        }
      }
      
      // 将输入值保存到共享上下文
      this.execution!.sharedContext[inputName] = value;
      
      results.push({
        name: inputName,
        value,
        type: inputParam.type || typeof value,
      });
    }
    
    // 保存工作流输入到共享上下文
    this.execution!.sharedContext.workflowInput = workflowInput;
    
    return {
      inputs: results,
      count: results.length,
    };
  }

  /**
   * 执行输出节点
   */
  private async executeOutputNode(node: AgentWorkflowNode, workflow: AgentWorkflow): Promise<any> {
    const data = node.data as any;
    const outputs = data.outputs || [];
    
    const results: any[] = [];
    
    for (const outputParam of outputs) {
      const outputName = outputParam.name || 'output';
      
      let outputValue: any;
      
      // 如果有指定的源节点，从该节点获取输出
      if (outputParam.sourceNodeId) {
        const sourceOutput = this.execution?.sharedContext.nodeOutputs?.[outputParam.sourceNodeId];
        
        if (sourceOutput === undefined) {
          throw new Error(`源节点 ${outputParam.sourceNodeId} 的输出不存在`);
        }
        
        // 如果指定了字段，提取该字段
        if (outputParam.sourceField) {
          const fieldPath = outputParam.sourceField.split('.');
          outputValue = fieldPath.reduce((obj, key) => obj?.[key], sourceOutput);
        } else {
          outputValue = sourceOutput;
        }
      } else {
        // 如果没有指定源节点，使用共享上下文
        outputValue = this.execution?.sharedContext;
      }
      
      // 如果是文件类型，处理文件输出
      if (outputParam.type === 'file' && outputValue) {
        // 如果outputValue是文件信息对象，添加下载信息
        if (typeof outputValue === 'object' && outputValue.name) {
          outputValue = {
            ...outputValue,
            downloadFileName: outputParam.downloadFileName || outputValue.name,
            downloadUrl: outputValue.url || outputValue.path, // 根据实际存储方式调整
          };
        }
      }
      
      // 将输出保存到共享上下文的 outputs 字段
      if (!this.execution!.sharedContext.outputs) {
        this.execution!.sharedContext.outputs = {};
      }
      this.execution!.sharedContext.outputs[outputName] = outputValue;
      
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
   * 执行文本记忆节点
   */
  private async executeMemoryNode(node: AgentWorkflowNode, workflow: AgentWorkflow): Promise<any> {
    const data = node.data as any;
    let content = data.content || '';
    
    // 如果有指定的源节点，从该节点获取文本
    if (data.sourceNodeId) {
      const sourceOutput = this.execution?.sharedContext.nodeOutputs?.[data.sourceNodeId];
      
      if (sourceOutput === undefined) {
        // 如果源节点输出不存在，使用配置的默认内容
        console.warn(`源节点 ${data.sourceNodeId} 的输出不存在，使用配置的默认内容`);
      } else {
        // 如果指定了字段，提取该字段
        if (data.sourceField) {
          const fieldPath = data.sourceField.split('.');
          const extractedValue = fieldPath.reduce((obj, key) => obj?.[key], sourceOutput);
          
          // 将提取的值转换为字符串
          if (extractedValue !== undefined && extractedValue !== null) {
            if (typeof extractedValue === 'object') {
              content = JSON.stringify(extractedValue, null, 2);
            } else {
              content = String(extractedValue);
            }
          }
        } else {
          // 如果没有指定字段，使用整个输出
          if (typeof sourceOutput === 'object') {
            content = JSON.stringify(sourceOutput, null, 2);
          } else {
            content = String(sourceOutput);
          }
        }
      }
    }
    
    // 如果允许编辑且内容不为空，可以考虑在执行时提供编辑界面
    // 这里我们先存储内容，编辑功能可以在前端实现
    const memoryId = data.memoryId || `memory_${node.id}`;
    
    // 将文本内容保存到共享上下文
    this.execution!.sharedContext[memoryId] = content;
    this.execution!.sharedContext.nodeOutputs![node.id] = {
      content,
      memoryId,
      editable: data.editable !== false,
      autoSave: data.autoSave === true,
    };
    
    // 如果启用了自动保存且配置了记忆ID，可以在这里实现持久化逻辑
    // 注意：实际的持久化应该通过API调用实现
    if (data.autoSave && data.memoryId) {
      // TODO: 实现持久化存储逻辑
      // await this.saveMemory(data.memoryId, content);
    }
    
    return {
      content,
      memoryId,
      editable: data.editable !== false,
      autoSave: data.autoSave === true,
      sourceNodeId: data.sourceNodeId,
      sourceField: data.sourceField,
    };
  }

  /**
   * 准备节点输入
   */
  private async prepareNodeInput(
    workflow: AgentWorkflow,
    node: AgentWorkflowNode,
    sharedContext: SharedContext
  ): Promise<any> {
    const nodeInput: any = {};

    // 合并三种输入源
    // 1. 静态输入（node.data.inputs）
    if (node.data.inputs) {
      Object.assign(nodeInput, node.data.inputs);
    }

    // 2. 共享上下文
    Object.assign(nodeInput, sharedContext);

    // 3. 引用上游节点输出
    if (node.data.inputSources) {
      for (const [field, source] of Object.entries(node.data.inputSources)) {
        if (source.type === 'static') {
          nodeInput[field] = source.value;
        } else if (source.type === 'node_output') {
          const upstreamOutput = sharedContext.nodeOutputs?.[source.nodeId!];
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
   * 调用Agent
   */
  private async callAgent(agent: any, input: any): Promise<any> {
    const query =
      typeof input === 'string'
        ? input
        : typeof input?.query === 'string'
        ? input.query
        : JSON.stringify(input);

    const response = await aiRoleService.chatWithRole(agent.id, query, input);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Agent 执行失败');
    }

    return {
      ...response.data,
    };
  }

  /**
   * 通知进度
   */
  private notifyProgress() {
    if (this.onProgressCallback && this.execution) {
      this.onProgressCallback({ ...this.execution });
    }
  }

  /**
   * 休眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 创建单例实例
export const workflowEngine = new WorkflowEngine();
