import { NodeExecutor } from './NodeExecutor';

/**
 * Memory节点执行器
 */
export class MemoryNodeExecutor implements NodeExecutor {
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

  async execute(node: any, context: Record<string, any>): Promise<any> {
    const srcId = node.data?.sourceNodeId;
    const srcField = node.data?.sourceField;
    let content = node.data?.content;
    
    if (srcId) {
      let val = context.nodeOutputs?.[srcId];
      if (srcField) val = this.resolvePath(srcField, val);
      content = val ?? content;
    }
    
    context[node.id] = { content };
    return { content };
  }
}

