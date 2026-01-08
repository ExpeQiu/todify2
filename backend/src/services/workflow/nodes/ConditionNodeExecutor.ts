import { NodeExecutor } from './NodeExecutor';

/**
 * Condition节点执行器
 */
export class ConditionNodeExecutor implements NodeExecutor {
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
    const cond = node.data?.condition;
    let result = true;
    
    try {
      if (cond?.expression) {
        const { evaluateExpression } = require('@/src/utils/expressionEvaluator');
        result = !!evaluateExpression(cond.expression, context);
      } else if (cond && cond.left && cond.operator) {
        const left = this.resolvePath(cond.left, context);
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
    
    context[node.id] = { condition: !!result };
    return { result: !!result };
  }
}

