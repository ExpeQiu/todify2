import { logger } from '@/shared/lib/logger';

export type EngineMode = 'native' | 'langgraph';

export interface AdaptedNode {
  id: string;
  type: string;
  data: Record<string, any>;
}

export interface AdaptedEdge {
  id: string;
  source: string;
  target: string;
  condition?: any;
}

export interface AdaptedWorkflow {
  nodes: AdaptedNode[];
  edges: AdaptedEdge[];
}

export class WorkflowLangGraphAdapter {
  static adapt(nodes: any[], edges: any[]): AdaptedWorkflow {
    const adaptedNodes: AdaptedNode[] = nodes.map(n => ({
      id: n.id,
      type: n.type,
      data: n.data || {},
    }));
    const adaptedEdges: AdaptedEdge[] = edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      condition: e.condition,
    }));
    return { nodes: adaptedNodes, edges: adaptedEdges };
  }

  static validate(adapted: AdaptedWorkflow): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const nodeIds = new Set(adapted.nodes.map(n => n.id));
    // 节点至少一个
    if (adapted.nodes.length === 0) errors.push('工作流必须至少包含一个节点');
    // 边合法性
    adapted.edges.forEach(e => {
      if (!nodeIds.has(e.source)) errors.push(`边的源节点不存在: ${e.source}`);
      if (!nodeIds.has(e.target)) errors.push(`边的目标节点不存在: ${e.target}`);
    });
    // 起始节点（入度为0）至少一个
    const inDegree = new Map<string, number>();
    adapted.nodes.forEach(n => inDegree.set(n.id, 0));
    adapted.edges.forEach(e => inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1));
    const starters = Array.from(inDegree.entries()).filter(([, deg]) => deg === 0).map(([id]) => id);
    if (starters.length === 0) errors.push('没有入度为0的起始节点');
    // 循环检测（DFS）
    const visited = new Set<string>();
    const stack = new Set<string>();
    const outgoing = new Map<string, string[]>();
    adapted.nodes.forEach(n => outgoing.set(n.id, []));
    adapted.edges.forEach(e => {
      const arr = outgoing.get(e.source) || [];
      arr.push(e.target);
      outgoing.set(e.source, arr);
    });
    const hasCycle = (id: string): boolean => {
      if (stack.has(id)) return true;
      if (visited.has(id)) return false;
      visited.add(id);
      stack.add(id);
      for (const nxt of outgoing.get(id) || []) {
        if (hasCycle(nxt)) return true;
      }
      stack.delete(id);
      return false;
    };
    for (const n of adapted.nodes) {
      if (hasCycle(n.id)) {
        errors.push('工作流包含循环依赖');
        break;
      }
    }
    if (errors.length) logger.warn('LangGraph编译校验失败', { errors });
    return { isValid: errors.length === 0, errors };
  }
}

