import { NodeExecutor } from './NodeExecutor';

/**
 * Output节点执行器
 */
export class OutputNodeExecutor implements NodeExecutor {
  async execute(node: any, context: Record<string, any>): Promise<any> {
    const outputs = node.data?.outputs || [];
    const results: any[] = [];
    
    for (const out of outputs) {
      let value: any;
      if (out.sourceNodeId) {
        value = context.nodeOutputs[out.sourceNodeId];
        if (out.sourceField) {
          const path = out.sourceField.split('.');
          value = path.reduce((obj: any, key: string) => obj?.[key], value);
        }
      } else {
        value = context;
      }
      if (!context.outputs) context.outputs = {};
      context.outputs[out.name || 'output'] = value;
      results.push({ name: out.name || 'output', value, type: out.type || typeof value });
    }
    
    return { outputs: results, count: results.length };
  }
}

