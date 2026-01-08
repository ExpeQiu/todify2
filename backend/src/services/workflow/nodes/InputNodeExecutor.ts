import { NodeExecutor } from './NodeExecutor';

/**
 * Input节点执行器
 */
export class InputNodeExecutor implements NodeExecutor {
  async execute(node: any, context: Record<string, any>): Promise<any> {
    const inputs = (node.data?.inputs || []) as any[];
    const workflowInput = context.workflowInput || {};
    const results: any[] = [];
    
    for (const inputParam of inputs) {
      const name = inputParam.name || 'input';
      let value = workflowInput[name];
      if (value === undefined && name === 'input' && workflowInput.query) value = workflowInput.query;
      if (value === undefined && inputParam.defaultValue !== undefined) value = inputParam.defaultValue;
      if (inputParam.required && value === undefined) throw new Error(`必需参数 ${name} 未提供`);
      context[name] = value;
      results.push({ name, value, type: inputParam.type || typeof value });
    }
    
    return { inputs: results, count: results.length };
  }
}

