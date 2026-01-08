import { NodeExecutor } from './NodeExecutor';

/**
 * Transform节点执行器
 */
export class TransformNodeExecutor implements NodeExecutor {
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

  async execute(node: any, context: Record<string, any>): Promise<any> {
    const ruleType = node.data?.ruleType;
    const sourceField = node.data?.sourceField;
    const targetField = node.data?.targetField;
    const rule = node.data?.rule || {};
    let sourceVal = sourceField ? this.resolvePath(sourceField, context) : context;
    let out: any = sourceVal;
    
    try {
      switch (ruleType) {
        case 'json_path':
          out = sourceField ? this.resolvePath(sourceField, context) : sourceVal;
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
    
    if (targetField) this.assignPath(targetField, context, out);
    return { transformed: out };
  }
}

