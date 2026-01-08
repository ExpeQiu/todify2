import { NodeExecutor } from './NodeExecutor';
import { NodeRegistry } from './NodeRegistry';

/**
 * Loop节点执行器（支持while和for循环）
 */
export class LoopNodeExecutor implements NodeExecutor {
  private maxIterations: number = 100; // 最大迭代次数，防止死循环

  async execute(node: any, context: Record<string, any>): Promise<any> {
    const loopType = node.data?.loopType || 'while'; // 'while' 或 'for'
    const condition = node.data?.condition; // while循环条件
    const loopVariable = node.data?.loopVariable; // for循环变量
    const loopValues = node.data?.loopValues || []; // for循环的值数组
    const loopNodes = node.data?.loopNodes || []; // 循环体内的节点
    const loopEdges = node.data?.loopEdges || []; // 循环体内的边

    const results: any[] = [];
    let iteration = 0;

    if (loopType === 'while') {
      // While循环
      while (this.evaluateCondition(condition, context) && iteration < this.maxIterations) {
        iteration++;
        const iterationContext = { ...context, loopIteration: iteration };
        
        try {
          // 执行循环体内的节点
          const loopResult = await this.executeLoopBody(loopNodes, loopEdges, iterationContext);
          results.push({ iteration, status: 'success', result: loopResult });
          
          // 更新上下文
          Object.assign(context, iterationContext);
        } catch (error) {
          results.push({ 
            iteration, 
            status: 'failed', 
            error: error instanceof Error ? error.message : '循环体执行失败' 
          });
          // 根据配置决定是否继续
          if (node.data?.breakOnError) {
            break;
          }
        }
      }

      if (iteration >= this.maxIterations) {
        throw new Error(`循环达到最大迭代次数: ${this.maxIterations}`);
      }
    } else if (loopType === 'for') {
      // For循环
      for (const value of loopValues) {
        if (iteration >= this.maxIterations) {
          throw new Error(`循环达到最大迭代次数: ${this.maxIterations}`);
        }
        
        iteration++;
        const iterationContext = { 
          ...context, 
          loopIteration: iteration,
          [loopVariable]: value
        };
        
        try {
          // 执行循环体内的节点
          const loopResult = await this.executeLoopBody(loopNodes, loopEdges, iterationContext);
          results.push({ iteration, status: 'success', result: loopResult, value });
          
          // 更新上下文
          Object.assign(context, iterationContext);
        } catch (error) {
          results.push({ 
            iteration, 
            status: 'failed', 
            error: error instanceof Error ? error.message : '循环体执行失败',
            value
          });
          // 根据配置决定是否继续
          if (node.data?.breakOnError) {
            break;
          }
        }
      }
    }

    context[node.id] = { 
      loopType, 
      iterations: iteration, 
      results 
    };

    return { 
      loopType, 
      iterations: iteration, 
      results,
      completed: true
    };
  }

  /**
   * 评估循环条件
   */
  private evaluateCondition(condition: any, context: Record<string, any>): boolean {
    if (!condition) return false;
    
    try {
      if (typeof condition === 'string') {
        // 尝试作为表达式评估
        const { evaluateExpression } = require('@/src/utils/expressionEvaluator');
        return !!evaluateExpression(condition, context);
      } else if (condition.expression) {
        const { evaluateExpression } = require('@/src/utils/expressionEvaluator');
        return !!evaluateExpression(condition.expression, context);
      } else if (condition.left && condition.operator) {
        // 使用条件逻辑
        const left = this.resolvePath(condition.left, context);
        const right = condition.right;
        switch (condition.operator) {
          case '==': return left == right;
          case '!=': return left != right;
          case '>': return left > right;
          case '<': return left < right;
          case '>=': return left >= right;
          case '<=': return left <= right;
          case 'contains': return Array.isArray(left) ? left.includes(right) : String(left).includes(String(right));
          case 'not_contains': return Array.isArray(left) ? !left.includes(right) : !String(left).includes(String(right));
          case 'exists': return left !== undefined && left !== null;
          case 'not_exists': return left === undefined || left === null;
          default: return false;
        }
      }
    } catch (error) {
      console.error('循环条件评估失败:', error);
      return false;
    }
    
    return false;
  }

  /**
   * 执行循环体
   */
  private async executeLoopBody(
    nodes: any[], 
    edges: any[], 
    context: Record<string, any>
  ): Promise<any> {
    // 构建循环体内部的执行顺序（拓扑排序）
    const inbound = new Map<string, any[]>();
    edges.forEach((e: any) => {
      const list = inbound.get(e.target) || [];
      list.push(e);
      inbound.set(e.target, list);
    });

    const nodeOutputs: Record<string, any> = {};
    context.nodeOutputs = nodeOutputs;

    // 拓扑排序
    const order = this.topologicalSort(nodes, edges);
    
    for (const level of order) {
      await Promise.all(level.map(async (node: any) => {
        // 检查入边条件
        const incoming = inbound.get(node.id) || [];
        if (incoming.length > 0) {
          const passAll = await this.evaluateIncomingConditions(incoming, context);
          if (!passAll) return;
        }

        // 执行节点
        try {
          const result = await NodeRegistry.execute(node, context);
          nodeOutputs[node.id] = result;
        } catch (error) {
          console.error(`循环体内节点执行失败: ${node.id}`, error);
          throw error;
        }
      }));
    }

    return nodeOutputs;
  }

  /**
   * 拓扑排序
   */
  private topologicalSort(nodes: any[], edges: any[]): any[][] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    
    nodes.forEach((node: any) => {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    });

    edges.forEach((edge: any) => {
      const source = edge.source;
      const target = edge.target;
      const current = inDegree.get(target) || 0;
      inDegree.set(target, current + 1);
      const list = adjList.get(source) || [];
      list.push(target);
      adjList.set(source, list);
    });

    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    const result: any[][] = [];
    while (queue.length > 0) {
      const level: any[] = [];
      const currentLevelSize = queue.length;
      
      for (let i = 0; i < currentLevelSize; i++) {
        const nodeId = queue.shift()!;
        const node = nodes.find((n: any) => n.id === nodeId);
        if (node) {
          level.push(node);
        }

        const neighbors = adjList.get(nodeId) || [];
        neighbors.forEach((neighborId: string) => {
          const degree = inDegree.get(neighborId) || 0;
          inDegree.set(neighborId, degree - 1);
          if (degree - 1 === 0) {
            queue.push(neighborId);
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
   * 评估入边条件
   */
  private async evaluateIncomingConditions(edges: any[], context: Record<string, any>): Promise<boolean> {
    for (const e of edges) {
      const cond = e.condition;
      if (!cond) continue;
      try {
        if (typeof cond === 'string') {
          const { evaluateExpression } = require('@/utils/expressionEvaluator');
          const ok = !!evaluateExpression(cond, context);
          if (!ok) return false;
        } else if (cond?.type === 'js_expression') {
          const { evaluateExpression } = require('@/utils/expressionEvaluator');
          const ok = !!evaluateExpression(cond.expression, context);
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

  /**
   * 解析路径
   */
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
}

