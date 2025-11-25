import { ToolCall } from '../llm/types';
import { ToolConfig } from '../../models/AIRole';
import axios from 'axios';
import { AgentWorkflowService } from '../AgentWorkflowService';
import { aiRoleModel } from '../../models';

/**
 * 工具执行结果
 */
export interface ToolExecutionResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * 工具执行器
 * 负责执行各种类型的工具调用
 */
export class ToolExecutor {
  private agentWorkflowService: AgentWorkflowService;

  constructor() {
    this.agentWorkflowService = new AgentWorkflowService();
  }

  /**
   * 执行工具调用
   * @param toolCall 工具调用信息
   * @param toolConfig 工具配置
   * @returns 执行结果（JSON 字符串）
   */
  async executeTool(toolCall: ToolCall, toolConfig: ToolConfig): Promise<string> {
    try {
      // 解析参数
      const args = JSON.parse(toolCall.function.arguments || '{}');

      // 验证参数
      this.validateParameters(args, toolConfig.parameters);

      // 根据工具类型执行
      let result: ToolExecutionResult;

      switch (toolConfig.type) {
        case 'search':
          result = await this.executeSearch(args);
          break;

        case 'calculation':
          result = this.executeCalculation(args);
          break;

        case 'time':
          result = this.getTime(args);
          break;

        case 'api':
          result = await this.executeAPI(toolConfig, args);
          break;

        case 'workflow':
          result = await this.executeWorkflow(toolConfig, args);
          break;

        case 'agent':
          result = await this.executeAgent(toolConfig, args);
          break;

        default:
          result = {
            success: false,
            content: JSON.stringify({ error: `不支持的工具类型: ${toolConfig.type}` })
          };
      }

      if (!result.success) {
        return JSON.stringify({ error: result.error || '工具执行失败' });
      }

      return result.content;
    } catch (error) {
      console.error(`工具执行失败: ${toolConfig.name}`, error);
      return JSON.stringify({
        error: error instanceof Error ? error.message : '工具执行失败'
      });
    }
  }

  /**
   * 验证参数
   */
  private validateParameters(args: any, parameters: ToolConfig['parameters']): void {
    for (const param of parameters) {
      if (param.required && (args[param.name] === undefined || args[param.name] === null)) {
        throw new Error(`缺少必需参数: ${param.name}`);
      }

      // 类型验证
      if (args[param.name] !== undefined) {
        const value = args[param.name];
        const expectedType = param.type;

        switch (expectedType) {
          case 'string':
            if (typeof value !== 'string') {
              throw new Error(`参数 ${param.name} 必须是字符串类型`);
            }
            break;
          case 'number':
            if (typeof value !== 'number') {
              throw new Error(`参数 ${param.name} 必须是数字类型`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              throw new Error(`参数 ${param.name} 必须是布尔类型`);
            }
            break;
          case 'array':
            if (!Array.isArray(value)) {
              throw new Error(`参数 ${param.name} 必须是数组类型`);
            }
            break;
          case 'object':
            if (typeof value !== 'object' || Array.isArray(value) || value === null) {
              throw new Error(`参数 ${param.name} 必须是对象类型`);
            }
            break;
        }

        // 枚举值验证
        if (param.enum && !param.enum.includes(String(value))) {
          throw new Error(`参数 ${param.name} 的值必须是以下之一: ${param.enum.join(', ')}`);
        }
      }
    }
  }

  /**
   * 执行搜索工具
   */
  private async executeSearch(args: any): Promise<ToolExecutionResult> {
    try {
      const query = args.query || '';
      const limit = args.limit || 10;

      if (!query) {
        return {
          success: false,
          content: JSON.stringify({ error: '搜索查询不能为空' })
        };
      }

      // TODO: 集成现有的 AI Search 功能
      // 这里暂时返回占位符
      return {
        success: true,
        content: JSON.stringify({
          query,
          results: [],
          message: '搜索功能将在后续版本中实现'
        })
      };
    } catch (error) {
      return {
        success: false,
        content: JSON.stringify({ error: error instanceof Error ? error.message : '搜索失败' })
      };
    }
  }

  /**
   * 执行计算工具
   */
  private executeCalculation(args: any): ToolExecutionResult {
    try {
      const expression = args.expression || '';

      if (!expression) {
        return {
          success: false,
          content: JSON.stringify({ error: '计算表达式不能为空' })
        };
      }

      // 安全的数学表达式计算
      // 只允许数字、运算符和基本数学函数
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');

      // 使用 Function 构造函数进行安全计算（限制作用域）
      try {
        // 更安全的方式：使用 mathjs 或类似的库
        // 这里使用简单的 eval（仅用于演示，生产环境应使用更安全的方法）
        const result = this.safeEvaluate(sanitized);

        return {
          success: true,
          content: JSON.stringify({
            expression,
            result
          })
        };
      } catch (error) {
        return {
          success: false,
          content: JSON.stringify({ error: '表达式计算失败: ' + (error instanceof Error ? error.message : '未知错误') })
        };
      }
    } catch (error) {
      return {
        success: false,
        content: JSON.stringify({ error: error instanceof Error ? error.message : '计算失败' })
      };
    }
  }

  /**
   * 安全的表达式求值（简化版）
   */
  private safeEvaluate(expression: string): number {
    // 移除所有非数学字符
    const clean = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    // 使用 Function 构造函数（相对安全，但仍需谨慎）
    try {
      // eslint-disable-next-line no-new-func
      const func = new Function('return ' + clean);
      const result = func();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('计算结果不是有效数字');
      }
      
      return result;
    } catch (error) {
      throw new Error('表达式格式错误');
    }
  }

  /**
   * 获取时间工具
   */
  private getTime(args: any): ToolExecutionResult {
    try {
      const format = args.format || 'iso'; // iso, timestamp, date, time
      const timezone = args.timezone || 'Asia/Shanghai';

      const now = new Date();
      let result: any = {};

      switch (format) {
        case 'iso':
          result.iso = now.toISOString();
          result.local = now.toLocaleString('zh-CN', { timeZone: timezone });
          break;
        case 'timestamp':
          result.timestamp = now.getTime();
          result.unix = Math.floor(now.getTime() / 1000);
          break;
        case 'date':
          result.date = now.toLocaleDateString('zh-CN', { timeZone: timezone });
          result.year = now.getFullYear();
          result.month = now.getMonth() + 1;
          result.day = now.getDate();
          break;
        case 'time':
          result.time = now.toLocaleTimeString('zh-CN', { timeZone: timezone });
          result.hour = now.getHours();
          result.minute = now.getMinutes();
          result.second = now.getSeconds();
          break;
        default:
          result = {
            iso: now.toISOString(),
            timestamp: now.getTime(),
            local: now.toLocaleString('zh-CN', { timeZone: timezone })
          };
      }

      result.timezone = timezone;
      result.format = format;

      return {
        success: true,
        content: JSON.stringify(result)
      };
    } catch (error) {
      return {
        success: false,
        content: JSON.stringify({ error: error instanceof Error ? error.message : '获取时间失败' })
      };
    }
  }

  /**
   * 执行 API 调用工具
   */
  private async executeAPI(toolConfig: ToolConfig, args: any): Promise<ToolExecutionResult> {
    try {
      const implementation = toolConfig.implementation;
      if (!implementation || !implementation.endpoint) {
        return {
          success: false,
          content: JSON.stringify({ error: 'API 端点未配置' })
        };
      }

      const method = (implementation.method || 'POST').toUpperCase();
      const url = implementation.endpoint;
      const headers = implementation.headers || {};

      let response;
      switch (method) {
        case 'GET':
          response = await axios.get(url, { headers, params: args, timeout: 30000 });
          break;
        case 'POST':
          response = await axios.post(url, args, { headers, timeout: 30000 });
          break;
        case 'PUT':
          response = await axios.put(url, args, { headers, timeout: 30000 });
          break;
        case 'DELETE':
          response = await axios.delete(url, { headers, params: args, timeout: 30000 });
          break;
        default:
          return {
            success: false,
            content: JSON.stringify({ error: `不支持的 HTTP 方法: ${method}` })
          };
      }

      return {
        success: true,
        content: JSON.stringify(response.data)
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 'N/A';
        const message = error.response?.data?.message || error.message;
        return {
          success: false,
          content: JSON.stringify({ error: `API 调用失败 (${status}): ${message}` })
        };
      }
      return {
        success: false,
        content: JSON.stringify({ error: error instanceof Error ? error.message : 'API 调用失败' })
      };
    }
  }

  /**
   * 执行 Workflow 工具
   */
  private async executeWorkflow(toolConfig: ToolConfig, args: any): Promise<ToolExecutionResult> {
    try {
      const implementation = toolConfig.implementation;
      if (!implementation || !implementation.workflowId) {
        return {
          success: false,
          content: JSON.stringify({ error: 'Workflow ID 未配置' })
        };
      }

      const workflowId = implementation.workflowId;
      const workflowInput = args.inputs || args;

      // 执行工作流
      const result = await this.agentWorkflowService.executeWorkflow(workflowId, {
        input: workflowInput
      });

      // 提取输出
      const output = result.data?.outputs || result.message || result;

      return {
        success: true,
        content: JSON.stringify(output)
      };
    } catch (error) {
      return {
        success: false,
        content: JSON.stringify({ error: error instanceof Error ? error.message : 'Workflow 执行失败' })
      };
    }
  }

  /**
   * 执行 Agent 调用工具
   */
  private async executeAgent(toolConfig: ToolConfig, args: any): Promise<ToolExecutionResult> {
    try {
      const implementation = toolConfig.implementation;
      if (!implementation || !implementation.agentId) {
        return {
          success: false,
          content: JSON.stringify({ error: 'Agent ID 未配置' })
        };
      }

      const agentId = implementation.agentId;
      const query = args.query || args.input || JSON.stringify(args);

      // 获取 Agent 配置
      const agent = await aiRoleModel.getById(agentId);
      if (!agent || !agent.enabled) {
        return {
          success: false,
          content: JSON.stringify({ error: `Agent 不存在或已禁用: ${agentId}` })
        };
      }

      // TODO: 调用 Agent 的 chat 接口
      // 这里需要避免循环调用，暂时返回占位符
      return {
        success: true,
        content: JSON.stringify({
          message: `Agent ${agentId} 调用功能将在后续版本中实现`,
          query
        })
      };
    } catch (error) {
      return {
        success: false,
        content: JSON.stringify({ error: error instanceof Error ? error.message : 'Agent 调用失败' })
      };
    }
  }
}

