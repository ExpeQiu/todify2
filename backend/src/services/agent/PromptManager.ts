import { PromptVariable } from '../../models/AIRole';

/**
 * Prompt 管理服务
 * 负责渲染 Prompt，替换变量等
 */
export class PromptManager {
  /**
   * 渲染 Prompt（替换变量）
   * @param template Prompt 模板字符串
   * @param variables 变量定义列表
   * @param context 上下文数据
   * @returns 渲染后的 Prompt
   */
  renderPrompt(
    template: string,
    variables: PromptVariable[],
    context: Record<string, any>
  ): string {
    if (!variables || variables.length === 0) {
      return template;
    }

    let rendered = template;

    for (const variable of variables) {
      const value = this.resolveVariable(variable, context);
      // 支持 {{variable}} 和 {variable} 两种格式
      const patterns = [
        new RegExp(`\\{\\{${this.escapeRegex(variable.name)}\\}\\}`, 'g'),
        new RegExp(`\\{${this.escapeRegex(variable.name)}\\}`, 'g')
      ];
      
      for (const pattern of patterns) {
        rendered = rendered.replace(pattern, value);
      }
    }

    return rendered;
  }

  /**
   * 解析变量值
   * @param variable 变量定义
   * @param context 上下文数据
   * @returns 变量值
   */
  private resolveVariable(variable: PromptVariable, context: Record<string, any>): string {
    switch (variable.type) {
      case 'static':
        return variable.value || '';
      
      case 'dynamic':
        if (variable.source) {
          return this.getNestedValue(context, variable.source) || '';
        }
        return '';
      
      case 'context':
        return context[variable.name] || '';
      
      default:
        return '';
    }
  }

  /**
   * 获取嵌套属性值（如：user.profile.name）
   * @param obj 对象
   * @param path 属性路径（支持点号分隔）
   * @returns 属性值（转换为字符串）
   */
  private getNestedValue(obj: any, path: string): string {
    if (!obj || !path) {
      return '';
    }

    try {
      const value = path.split('.').reduce((acc, part) => {
        if (acc === null || acc === undefined) {
          return null;
        }
        return acc[part];
      }, obj);

      // 转换为字符串
      if (value === null || value === undefined) {
        return '';
      }

      if (typeof value === 'object') {
        return JSON.stringify(value);
      }

      return String(value);
    } catch (error) {
      console.warn(`获取嵌套属性值失败: ${path}`, error);
      return '';
    }
  }

  /**
   * 转义正则表达式特殊字符
   * @param str 字符串
   * @returns 转义后的字符串
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 提取模板中的所有变量名
   * @param template Prompt 模板
   * @returns 变量名列表
   */
  extractVariables(template: string): string[] {
    const variables: string[] = [];
    const patterns = [
      /\{\{(\w+)\}\}/g,  // {{variable}}
      /\{(\w+)\}/g        // {variable}
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(template)) !== null) {
        const varName = match[1];
        if (!variables.includes(varName)) {
          variables.push(varName);
        }
      }
    }

    return variables;
  }
}

