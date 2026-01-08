import { NodeExecutor } from './NodeExecutor';

/**
 * Assign节点执行器
 */
export class AssignNodeExecutor implements NodeExecutor {
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
    const variable = node.data?.variable;
    const expression = node.data?.expression;
    let value = node.data?.value;
    
    try {
      if (expression) {
        const { evaluateExpression } = require('@/src/utils/expressionEvaluator');
        value = evaluateExpression(expression, context);
      } else if (typeof value === 'string' && value.startsWith('context.')) {
        value = this.resolvePath(value.replace(/^context\./, ''), context);
      }
    } catch {}
    
    if (variable) context[variable] = value;
    return { assigned: { [variable]: value } };
  }
}

