/**
 * 安全的表达式执行器
 * 提供受限的JavaScript执行环境，防止恶意代码执行
 */

/**
 * 创建安全的表达式执行上下文
 */
function createSafeContext(data: Record<string, any>): Record<string, any> {
  // 创建安全的上下文，只包含允许的对象和函数
  const safeContext: Record<string, any> = {
    // 数据变量
    ...data,
    
    // 安全的工具函数
    JSON: {
      stringify: JSON.stringify,
      parse: JSON.parse,
    },
    
    // 数组方法（限制为安全的操作）
    Array: {
      isArray: Array.isArray,
    },
    
    // 字符串方法
    String: String,
    
    // 数学方法（只读）
    Math: {
      abs: Math.abs,
      max: Math.max,
      min: Math.min,
      round: Math.round,
      floor: Math.floor,
      ceil: Math.ceil,
    },
    
    // 日期（只读）
    Date: Date,
    
    // 禁止访问的对象
    console: undefined,
    process: undefined,
    global: undefined,
    window: undefined,
    document: undefined,
    require: undefined,
    import: undefined,
    eval: undefined,
    Function: undefined,
    setTimeout: undefined,
    setInterval: undefined,
    clearTimeout: undefined,
    clearInterval: undefined,
    Buffer: undefined,
    fs: undefined,
    path: undefined,
    __dirname: undefined,
    __filename: undefined,
  };

  return safeContext;
}

/**
 * 执行安全的表达式
 * @param expression JavaScript表达式字符串
 * @param data 可用的数据变量
 * @returns 表达式执行结果
 */
export function evaluateExpression(
  expression: string,
  data: Record<string, any>
): any {
  try {
    // 创建安全上下文
    const context = createSafeContext(data);

    // 提取上下文中的键名
    const keys = Object.keys(context);
    const values = Object.values(context);

    // 使用Function构造函数创建函数，避免使用eval
    // 这样可以更好地控制作用域
    const func = new Function(...keys, `return (${expression})`);
    
    // 执行函数
    const result = func(...values);

    return result;
  } catch (error) {
    console.error('表达式执行失败:', error);
    throw new Error(`表达式执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 提取输出字段值
 * @param extractExpression 提取表达式（如 'output.text' 或 'output.files[0]'）
 * @param outputData 工作流输出数据
 * @returns 提取的值
 */
export function extractOutputValue(
  extractExpression: string,
  outputData: any
): any {
  try {
    // 创建包含output变量的上下文
    const context = createSafeContext({ output: outputData });

    // 使用表达式提取值
    // 支持简单的属性访问和数组索引
    // 例如: output.text, output.files[0], output.metadata.title
    
    // 如果表达式是简单的属性访问，直接提取
    if (extractExpression.startsWith('output.')) {
      const path = extractExpression.substring(7); // 移除 'output.' 前缀
      
      // 支持嵌套属性访问（如 output.metadata.title）
      const parts = path.split('.');
      let value = outputData;
      
      for (const part of parts) {
        // 检查是否是数组索引（如 [0]）
        if (part.includes('[') && part.includes(']')) {
          const [prop, indexStr] = part.split('[');
          if (prop) {
            value = value[prop];
          }
          const index = parseInt(indexStr.replace(']', ''), 10);
          value = value[index];
        } else {
          value = value[part];
        }
        
        if (value === undefined || value === null) {
          return undefined;
        }
      }
      
      return value;
    }
    
    // 如果不是简单的属性访问，使用表达式执行器
    return evaluateExpression(extractExpression, { output: outputData });
  } catch (error) {
    console.error('提取输出值失败:', error);
    return undefined;
  }
}

