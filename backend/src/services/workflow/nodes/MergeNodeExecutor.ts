import { NodeExecutor } from './NodeExecutor';

/**
 * Merge节点执行器
 */
export class MergeNodeExecutor implements NodeExecutor {
  async execute(node: any, context: Record<string, any>): Promise<any> {
    const strategy = node.data?.strategy || 'merge';
    const sources: string[] = node.data?.sources || [];
    const values = sources.map(id => context.nodeOutputs?.[id]).filter(v => v !== undefined);
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
}

