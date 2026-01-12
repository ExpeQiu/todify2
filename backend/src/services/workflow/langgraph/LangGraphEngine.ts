import { logger } from '@/shared/lib/logger';
import { aiRoleModel, workflowExecutionModel } from '@/models';
import { NodeRegistry } from '../nodes/NodeRegistry';
import { InputNodeExecutor } from '../nodes/InputNodeExecutor';
import { AgentNodeExecutor } from '../nodes/AgentNodeExecutor';
import { OutputNodeExecutor } from '../nodes/OutputNodeExecutor';
import { ConditionNodeExecutor } from '../nodes/ConditionNodeExecutor';
import { AssignNodeExecutor } from '../nodes/AssignNodeExecutor';
import { TransformNodeExecutor } from '../nodes/TransformNodeExecutor';
import { MergeNodeExecutor } from '../nodes/MergeNodeExecutor';
import { MemoryNodeExecutor } from '../nodes/MemoryNodeExecutor';
import { LoopNodeExecutor } from '../nodes/LoopNodeExecutor';
import { AgentOrchestrator } from '../../agent/AgentOrchestrator';
import { DifyGateway } from '@/shared/infrastructure/integrations/dify';

export class LangGraphEngine {
  constructor() {
    // 注册内置节点执行器
    this.registerBuiltinNodes();
  }

  /**
   * 注册内置节点执行器
   */
  private registerBuiltinNodes(): void {
    NodeRegistry.register('input', new InputNodeExecutor());
    NodeRegistry.register('agent', new AgentNodeExecutor());
    NodeRegistry.register('output', new OutputNodeExecutor());
    NodeRegistry.register('condition', new ConditionNodeExecutor());
    NodeRegistry.register('assign', new AssignNodeExecutor());
    NodeRegistry.register('transform', new TransformNodeExecutor());
    NodeRegistry.register('merge', new MergeNodeExecutor());
    NodeRegistry.register('memory', new MemoryNodeExecutor());
    NodeRegistry.register('loop', new LoopNodeExecutor());
  }

  async execute(workflow: any, options: { input?: any }): Promise<{ executionId: string; message: string; data?: any }> {
    const startedAt = Date.now();
    const execution = await workflowExecutionModel.create({
      execution_type: 'agent_workflow',
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      status: 'running',
      shared_context: options.input || {},
      node_results: [],
      start_time: new Date().toISOString(),
      // 记录引擎
      metadata: { engine: 'langgraph' },
    } as any);

    try {
      const nodes = JSON.parse(workflow.nodes);
      const edges = JSON.parse(workflow.edges || '[]');
      const inbound = new Map<string, any[]>();
      edges.forEach((e: any) => {
        const list = inbound.get(e.target) || [];
        list.push(e);
        inbound.set(e.target, list);
      });
      const sharedContext: Record<string, any> = { workflowInput: options.input || {}, nodeOutputs: {} };
      const nodeResults: any[] = [];

      const order = this.topologicalSort(nodes, edges);
      for (const level of order) {
        const results = await Promise.allSettled(level.map(async (node: any) => {
          // 条件边 gating：若有入边条件不满足则跳过
          const incoming = inbound.get(node.id) || [];
          if (incoming.length > 0) {
            const passAll = await this.evaluateIncomingConditions(incoming, sharedContext);
            if (!passAll) return { status: 'skipped' };
          }
          return this.executeNode(node, sharedContext);
        }));
        results.forEach((res, idx) => {
          const node = level[idx];
          if (res.status === 'fulfilled') {
            nodeResults.push({ nodeId: node.id, status: 'completed', output: res.value });
            sharedContext.nodeOutputs[node.id] = res.value;
          } else {
            nodeResults.push({ nodeId: node.id, status: 'failed', error: res.reason?.message || '节点执行失败' });
          }
        });
      }

      const finalText = this.extractFinalText(nodes, sharedContext);
      await workflowExecutionModel.update(execution.id, {
        status: 'completed',
        end_time: new Date().toISOString(),
        duration: Date.now() - startedAt,
        node_results: JSON.stringify(nodeResults),
        shared_context: JSON.stringify(sharedContext),
      } as any);

      return {
        executionId: execution.id,
        message: finalText || '工作流执行完成',
        data: {
          outputs: {
            text: finalText,
            answer: finalText,
            content: finalText,
            metadata: { workflowId: workflow.id, executionId: execution.id, engine: 'langgraph' },
          },
          nodeResults,
        },
      };
    } catch (error) {
      await workflowExecutionModel.update(execution.id, {
        status: 'failed',
        end_time: new Date().toISOString(),
        duration: Date.now() - startedAt,
        error_message: error instanceof Error ? error.message : String(error),
      } as any);
      throw error;
    }
  }

  private async executeNode(node: any, sharedContext: Record<string, any>): Promise<any> {
    // 使用NodeRegistry执行节点（支持插件化）
    try {
      return await NodeRegistry.execute(node, sharedContext);
    } catch (error) {
      // 如果节点未注册，返回跳过状态
      if (error instanceof Error && error.message.includes('未知节点类型')) {
        logger.warn(`节点类型未注册: ${node.type}`, { nodeId: node.id });
        return { type: node.type, status: 'skipped', error: error.message };
      }
      throw error;
    }
  }

  private executeInput(node: any, sharedContext: Record<string, any>): any {
    const inputs = (node.data?.inputs || []) as any[];
    const workflowInput = sharedContext.workflowInput || {};
    const results: any[] = [];
    for (const inputParam of inputs) {
      const name = inputParam.name || 'input';
      let value = workflowInput[name];
      if (value === undefined && name === 'input' && workflowInput.query) value = workflowInput.query;
      if (value === undefined && inputParam.defaultValue !== undefined) value = inputParam.defaultValue;
      if (inputParam.required && value === undefined) throw new Error(`必需参数 ${name} 未提供`);
      sharedContext[name] = value;
      results.push({ name, value, type: inputParam.type || typeof value });
    }
    return { inputs: results, count: results.length };
  }

  private async executeAgent(node: any, sharedContext: Record<string, any>): Promise<any> {
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
      const nodeInput = { ...sharedContext, ...(node.data?.inputs || {}) };
      let query = nodeInput.query || nodeInput.input || nodeInput.workflowInput?.query || nodeInput.question || nodeInput.text || nodeInput.content;
      if (!query) {
        query = typeof nodeInput === 'string' ? nodeInput : JSON.stringify(nodeInput);
      }
      
      // 从 sharedContext 中提取可用作 context 的数据
      const context: Record<string, any> = {};
      Object.keys(nodeInput).forEach(key => {
        if (key !== 'query' && key !== 'input' && key !== 'workflowInput') {
          context[key] = nodeInput[key];
        }
      });
      
      const result = await orchestrator.executeAgent(agentId, query, '', context);
      
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
    const nodeInput = { ...sharedContext, ...(node.data?.inputs || {}) };
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

  private executeOutput(node: any, sharedContext: Record<string, any>): any {
    const outputs = node.data?.outputs || [];
    const results: any[] = [];
    for (const out of outputs) {
      let value: any;
      if (out.sourceNodeId) {
        value = sharedContext.nodeOutputs[out.sourceNodeId];
        if (out.sourceField) {
          const path = out.sourceField.split('.');
          value = path.reduce((obj: any, key: string) => obj?.[key], value);
        }
      } else {
        value = sharedContext;
      }
      if (!sharedContext.outputs) sharedContext.outputs = {};
      sharedContext.outputs[out.name || 'output'] = value;
      results.push({ name: out.name || 'output', value, type: out.type || typeof value });
    }
    return { outputs: results, count: results.length };
  }

  private async evaluateIncomingConditions(edges: any[], sharedContext: Record<string, any>): Promise<boolean> {
    const { evaluateExpression } = require('@/utils/expressionEvaluator');
    for (const e of edges) {
      const cond = e.condition;
      if (!cond) continue;
      try {
        if (typeof cond === 'string') {
          const ok = !!evaluateExpression(cond, sharedContext);
          if (!ok) return false;
        } else if (cond?.type === 'js_expression') {
          const ok = !!evaluateExpression(cond.expression, sharedContext);
          if (!ok) return false;
        } else if (cond?.type === 'always') {
          continue;
        }
      } catch {
        return false;
      }
    }
    return true;
  }

  private executeCondition(node: any, sharedContext: Record<string, any>): any {
    const cond = node.data?.condition;
    let result = true;
    try {
      if (cond?.expression) {
        const { evaluateExpression } = require('@/src/utils/expressionEvaluator');
        result = !!evaluateExpression(cond.expression, sharedContext);
      } else if (cond && cond.left && cond.operator) {
        const left = this.resolvePath(cond.left, sharedContext);
        const right = cond.right;
        switch (cond.operator) {
          case '==': result = left == right; break;
          case '!=': result = left != right; break;
          case '>': result = left > right; break;
          case '<': result = left < right; break;
          case '>=': result = left >= right; break;
          case '<=': result = left <= right; break;
          case 'contains': result = Array.isArray(left) ? left.includes(right) : String(left).includes(String(right)); break;
          case 'not_contains': result = Array.isArray(left) ? !left.includes(right) : !String(left).includes(String(right)); break;
          case 'exists': result = left !== undefined && left !== null; break;
          case 'not_exists': result = left === undefined || left === null; break;
          default: result = true;
        }
      }
    } catch {}
    sharedContext[node.id] = { condition: !!result };
    return { result: !!result };
  }

  private executeAssign(node: any, sharedContext: Record<string, any>): any {
    const variable = node.data?.variable;
    const expression = node.data?.expression;
    let value = node.data?.value;
    try {
      if (expression) {
        const { evaluateExpression } = require('@/src/utils/expressionEvaluator');
        value = evaluateExpression(expression, sharedContext);
      } else if (typeof value === 'string' && value.startsWith('context.')) {
        value = this.resolvePath(value.replace(/^context\./, ''), sharedContext);
      }
    } catch {}
    if (variable) sharedContext[variable] = value;
    return { assigned: { [variable]: value } };
  }

  private executeTransform(node: any, sharedContext: Record<string, any>): any {
    const ruleType = node.data?.ruleType;
    const sourceField = node.data?.sourceField;
    const targetField = node.data?.targetField;
    const rule = node.data?.rule || {};
    let sourceVal = sourceField ? this.resolvePath(sourceField, sharedContext) : sharedContext;
    let out: any = sourceVal;
    try {
      switch (ruleType) {
        case 'json_path':
          out = sourceField ? this.resolvePath(sourceField, sharedContext) : sourceVal;
          break;
        case 'format':
          out = typeof rule.format === 'string' ? String(rule.format).replace(/\{value\}/g, String(sourceVal ?? '')) : sourceVal;
          break;
        case 'parse':
          if (rule.parseAs === 'json') out = JSON.parse(String(sourceVal ?? 'null'));
          else if (rule.parseAs === 'number') out = Number(sourceVal);
          else if (rule.parseAs === 'boolean') out = String(sourceVal).toLowerCase() === 'true';
          break;
        case 'stringify':
          out = JSON.stringify(sourceVal);
          break;
        default:
          out = sourceVal;
      }
    } catch {}
    if (targetField) this.assignPath(targetField, sharedContext, out);
    return { transformed: out };
  }

  private executeMerge(node: any, sharedContext: Record<string, any>): any {
    const strategy = node.data?.strategy || 'merge';
    const sources: string[] = node.data?.sources || [];
    const values = sources.map(id => sharedContext.nodeOutputs?.[id]).filter(v => v !== undefined);
    let result: any;
    switch (strategy) {
      case 'override':
        result = values.reduce((_, v) => v, undefined);
        break;
      case 'append':
        result = ([] as any[]).concat(...values.map(v => Array.isArray(v) ? v : [v]));
        break;
      case 'concat':
        result = values.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join('');
        break;
      default:
        result = Object.assign({}, ...values);
        break;
    }
    return { merged: result };
  }

  private executeMemory(node: any, sharedContext: Record<string, any>): any {
    const srcId = node.data?.sourceNodeId;
    const srcField = node.data?.sourceField;
    let content = node.data?.content;
    if (srcId) {
      let val = sharedContext.nodeOutputs?.[srcId];
      if (srcField) val = this.resolvePath(srcField, val);
      content = val ?? content;
    }
    sharedContext[node.id] = { content };
    return { content };
  }

  private resolvePath(expr: string, obj: any): any {
    if (!expr) return undefined;
    const parts = expr.split('.');
    let cur = obj;
    for (const p of parts) {
      const m = p.match(/(.+?)\[(\d+)\]/);
      if (m) {
        cur = cur?.[m[1]];
        cur = cur?.[Number(m[2])];
      } else {
        cur = cur?.[p];
      }
      if (cur === undefined || cur === null) break;
    }
    return cur;
  }

  private assignPath(expr: string, obj: any, value: any) {
    const parts = expr.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!cur[key] || typeof cur[key] !== 'object') cur[key] = {};
      cur = cur[key];
    }
    cur[parts[parts.length - 1]] = value;
  }

  private topologicalSort(nodes: any[], edges: any[]): any[][] {
    const nodeMap = new Map<string, any>();
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();
    nodes.forEach(n => { nodeMap.set(n.id, n); inDegree.set(n.id, 0); dependents.set(n.id, []); });
    edges.forEach(e => { inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1); (dependents.get(e.source) || []).push(e.target); });
    const result: any[][] = [];
    const queue: any[] = [];
    const processed = new Set<string>();
    inDegree.forEach((deg, id) => { if (deg === 0) queue.push(nodeMap.get(id)!); });
    while (queue.length) {
      const size = queue.length; const level: any[] = [];
      for (let i = 0; i < size; i++) {
        const node = queue.shift()!; if (processed.has(node.id)) continue; level.push(node); processed.add(node.id);
        const deps = dependents.get(node.id) || [];
        deps.forEach(did => { inDegree.set(did, (inDegree.get(did) || 0) - 1); if (inDegree.get(did) === 0 && !processed.has(did)) queue.push(nodeMap.get(did)!); });
      }
      if (level.length) result.push(level);
    }
    return result;
  }

  private extractFinalText(nodes: any[], sharedContext: Record<string, any>): string {
    const outputNode = nodes.find((n: any) => n.type === 'output');
    let content = '';
    const extract = (out: any): string => {
      if (!out) return '';
      if (typeof out === 'string') return out.trim();
      if (Array.isArray(out)) return out.length ? extract(out[0]) : '';
      if (typeof out === 'object') {
        return out.answer?.trim() || out.result?.trim() || out.content?.trim() || out.text?.trim() || out.message?.trim() || '';
      }
      return String(out);
    };
    if (outputNode) {
      const outs = outputNode.data?.outputs || [];
      if (outs.length && outs[0].sourceNodeId) {
        const src = sharedContext.nodeOutputs[outs[0].sourceNodeId];
        content = outs[0].sourceField ? extract(outs[0].sourceField.split('.').reduce((o: any, k: string) => o?.[k], src)) : extract(src);
      } else {
        content = extract(sharedContext.nodeOutputs[outputNode.id]);
      }
    }
    if (!content) {
      for (const [, v] of Object.entries(sharedContext.nodeOutputs || {})) {
        content = extract(v);
        if (content) break;
      }
    }
    return content;
  }
}
