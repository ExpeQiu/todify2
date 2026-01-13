import { ToolCall } from '../llm/types';
import { ToolConfig } from '../../models/AIRole';
import axios from 'axios';
import { aiRoleModel, agentWorkflowModel } from '../../models';
import { LangGraphEngine } from '../workflow/langgraph/LangGraphEngine';
import { evaluate } from 'mathjs';
import DifyClient from '../DifyClient';
import { AgentOrchestrator } from './AgentOrchestrator';
import { toolToRoleMapping, toolToFeatureTypeMapping } from './tools/expert-tools';
import { DifyGateway } from '@/shared/infrastructure/integrations/dify';
import { toolCallEventManager } from './ToolCallEventManager';

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
  constructor() {
    // AgentWorkflowService 已被移除，使用 LangGraphEngine 替代
  }

  /**
   * 执行工具调用
   * @param toolCall 工具调用信息
   * @param toolConfig 工具配置
   * @param conversationId 对话ID（可选，用于事件推送）
   * @returns 执行结果（JSON 字符串）
   */
  async executeTool(toolCall: ToolCall, toolConfig: ToolConfig, conversationId?: string): Promise<string> {
    const toolName = toolConfig.name;
    
    // 发送工具开始事件
    if (conversationId) {
      toolCallEventManager.emitToolStart(conversationId, toolName, toolConfig.id, {
        arguments: toolCall.function.arguments
      });
    }

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
          // 传递 conversationId 给 executeAgent
          result = await this.executeAgent(toolConfig, args, conversationId);
          break;

        default:
          result = {
            success: false,
            content: JSON.stringify({ error: `不支持的工具类型: ${toolConfig.type}` })
          };
      }

      if (!result.success) {
        // 发送工具错误事件
        if (conversationId) {
          toolCallEventManager.emitToolError(conversationId, toolName, result.error || '工具执行失败');
        }
        return JSON.stringify({ error: result.error || '工具执行失败' });
      }

      // 发送工具完成事件
      if (conversationId) {
        try {
          const resultData = JSON.parse(result.content);
          toolCallEventManager.emitToolComplete(conversationId, toolName, resultData);
        } catch {
          // 如果结果不是 JSON，直接发送原始内容
          toolCallEventManager.emitToolComplete(conversationId, toolName, { content: result.content });
        }
      }

      return result.content;
    } catch (error) {
      console.error(`工具执行失败: ${toolConfig.name}`, error);
      
      // 发送工具错误事件
      if (conversationId) {
        toolCallEventManager.emitToolError(
          conversationId, 
          toolName, 
          error instanceof Error ? error.message : '工具执行失败'
        );
      }
      
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
   * 执行搜索工具（集成AI Search功能）
   */
  private async executeSearch(args: any): Promise<ToolExecutionResult> {
    try {
      const query = args.query || '';
      const limit = args.limit || 10;
      const filters = args.filters || {};
      const conversationId = args.conversationId || '';

      if (!query) {
        return {
          success: false,
          content: JSON.stringify({ error: '搜索查询不能为空' })
        };
      }

      // 调用DifyClient的AI Search功能
      const difyClient = DifyClient;
      const inputs: Record<string, any> = {
        ...filters
      };

      // 如果有限制参数，添加到输入中
      if (limit && limit !== 10) {
        inputs.limit = limit;
      }

      const result = await difyClient.aiSearch(query, inputs, conversationId);

      // 格式化搜索结果
      const searchResults = {
        query,
        answer: result.answer || '',
        results: result.metadata?.retriever_resources || [],
        count: result.metadata?.retriever_resources?.length || 0,
        sources: (result.metadata?.retriever_resources || []).map((resource: any) => ({
          document: resource.document_name || resource.document_id,
          dataset: resource.dataset_name || resource.dataset_id,
          content: resource.content,
          score: resource.score,
          position: resource.position
        })),
        conversationId: result.conversation_id || conversationId,
        usage: result.metadata?.usage || {}
      };

      return {
        success: true,
        content: JSON.stringify(searchResults)
      };
    } catch (error) {
      return {
        success: false,
        content: JSON.stringify({ 
          error: error instanceof Error ? error.message : '搜索失败',
          query: args.query || ''
        })
      };
    }
  }

  /**
   * 执行计算工具（使用mathjs库，安全可靠）
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

      try {
        // 使用mathjs进行安全的数学表达式计算
        // mathjs会解析并验证表达式，只允许数学运算，防止代码注入
        const result = evaluate(expression);

        // 验证结果是否为有效数字
        if (typeof result !== 'number' || !isFinite(result)) {
          return {
            success: false,
            content: JSON.stringify({ error: '计算结果不是有效数字', result })
          };
        }

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
          content: JSON.stringify({ 
            error: '表达式计算失败: ' + (error instanceof Error ? error.message : '未知错误'),
            expression
          })
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

      // 使用 LangGraphEngine 替代 AgentWorkflowService
      const workflow = await agentWorkflowModel.getById(workflowId);
      if (!workflow) {
        return {
          success: false,
          content: JSON.stringify({ error: `工作流不存在: ${workflowId}` })
        };
      }

      const engine = new LangGraphEngine();
      const result = await engine.execute(workflow, { input: workflowInput });

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
   * 执行 Agent 嵌套调用工具
   * 支持专家工具（Consult_Tech, Consult_Scene, Consult_Market, Consult_Content）
   * @param conversationId 对话ID（可选，用于事件推送）
   */
  private async executeAgent(toolConfig: ToolConfig, args: any, conversationId?: string): Promise<ToolExecutionResult> {
    try {
      const implementation = toolConfig.implementation;
      
      // 检查是否是专家工具
      const isExpertTool = toolConfig.name && (
        toolConfig.name.startsWith('Consult_') ||
        toolToRoleMapping[toolConfig.name]
      );

      let targetAgentId: string | null = null;

      if (isExpertTool && toolConfig.name) {
        // 专家工具：根据工具名称映射到专家角色
        const roleId = toolToRoleMapping[toolConfig.name];
        
        // 所有专家工具都使用对应的 Direct Agent
        // 专家角色配置：
        // - tech-fundamentalist (技术原教旨主义者) - Direct Agent
        // - scene-alchemist (场景炼金术师) - Direct Agent  
        // - market-sniper (市场狙击手) - Direct Agent
        // - content-director (内容大导演) - Direct Agent
        targetAgentId = roleId || implementation?.agentId;
        
        if (!targetAgentId) {
          console.warn(`专家工具 ${toolConfig.name} 未找到对应的角色ID`, { 
            toolName: toolConfig.name,
            roleId,
            implementation 
          });
        }
      } else {
        // 普通 Agent 工具
        if (!implementation || !implementation.agentId) {
          return {
            success: false,
            content: JSON.stringify({ error: 'Agent ID 未配置' })
          };
        }
        targetAgentId = implementation.agentId;
      }

      if (!targetAgentId) {
        return {
          success: false,
          content: JSON.stringify({ error: '无法确定目标 Agent ID' })
        };
      }

      // 构建查询内容
      let query = args.query || args.input || '';
      if (!query) {
        // 如果没有 query，根据工具类型构建查询
        if (toolConfig.name === 'Consult_Tech') {
          // 技术原教旨主义者：优先使用 techDocument，如果有 analysisType 也包含
          const techDoc = args.techDocument || '';
          const analysisType = args.analysisType || '';
          if (techDoc) {
            query = analysisType 
              ? `请进行${analysisType === 'five-view' ? '五看分析' : analysisType === 'three-fix' ? '三定分析' : '技术矩阵分析'}：\n\n${techDoc}`
              : `请分析以下技术文档：\n\n${techDoc}`;
          } else {
            query = '请分析技术文档';
          }
        } else if (toolConfig.name === 'Consult_Scene') {
          // 场景炼金术师：使用 techPoint 和 userContext
          const techPoint = args.techPoint || '';
          const userContext = args.userContext || '';
          query = techPoint 
            ? `请分析技术点"${techPoint}"的用户场景${userContext ? `，用户画像：${userContext}` : ''}`
            : '请分析用户场景';
        } else if (toolConfig.name === 'Consult_Market') {
          // 市场狙击手：使用 techDescription、targetAudience、competitors
          const techDesc = args.techDescription || '';
          const targetAudience = args.targetAudience || '';
          const competitors = args.competitors || '';
          const parts: string[] = [];
          if (techDesc) parts.push(`技术描述：${techDesc}`);
          if (targetAudience) parts.push(`目标人群：${targetAudience}`);
          if (competitors) parts.push(`竞品信息：${competitors}`);
          query = parts.length > 0 
            ? `请分析市场策略：\n${parts.join('\n')}`
            : '请分析市场策略';
        } else if (toolConfig.name === 'Consult_Content') {
          // 内容大导演：使用 strategy、contentType、materials
          const strategy = args.strategy || '';
          const contentType = args.contentType || 'script';
          const materials = args.materials || '';
          const parts: string[] = [];
          if (strategy) parts.push(`传播策略：${strategy}`);
          if (materials) parts.push(`已有素材：${materials}`);
          query = parts.length > 0
            ? `请生成${contentType === 'script' ? '脚本' : contentType === 'ppt-outline' ? 'PPT大纲' : contentType === 'poster' ? '海报文案' : '视频分镜'}：\n${parts.join('\n')}`
            : `请生成${contentType === 'script' ? '脚本' : contentType === 'ppt-outline' ? 'PPT大纲' : contentType === 'poster' ? '海报文案' : '视频分镜'}`;
        } else {
          // 其他工具：尝试从 args 中提取有意义的内容
          const meaningfulArgs = Object.entries(args)
            .filter(([key]) => !key.startsWith('_') && args[key])
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
          query = meaningfulArgs || JSON.stringify(args);
        }
      }

      // 检查调用深度（防止无限递归）
      const maxDepth = 3;
      const currentDepth = args._callDepth || 0;
      if (currentDepth >= maxDepth) {
        return {
          success: false,
          content: JSON.stringify({ 
            error: `Agent嵌套调用深度超过限制: ${maxDepth}`,
            currentDepth,
            maxDepth
          })
        };
      }

      // 获取 Agent 配置
      const agent = await aiRoleModel.getById(targetAgentId);
      if (!agent || !agent.enabled) {
        return {
          success: false,
          content: JSON.stringify({ error: `Agent 不存在或已禁用: ${targetAgentId}` })
        };
      }

      // 专家工具统一使用 Direct Agent
      // 所有专家角色（tech-fundamentalist, scene-alchemist, market-sniper, content-director）都是 Direct Agent 类型
      if (agent.provider === 'direct-agent') {
        // 使用 Direct Agent
        const orchestrator = new AgentOrchestrator();
        
        // 从args中提取context，但不包括_callDepth
        const context: Record<string, any> = { ...args };
        delete context._callDepth;
        delete context.query;
        delete context.input;
        
        // 传递调用深度信息和工具元数据
        const nestedContext = {
          ...context,
          _callDepth: currentDepth + 1,
          _toolName: toolConfig.name,
          _toolType: toolConfig.type
        };

        const result = await orchestrator.executeAgent(
          targetAgentId,
          query,
          '', // 新对话，避免嵌套调用共享对话历史
          nestedContext
        );

        return {
          success: true,
          content: JSON.stringify({
            content: result.content,
            usage: result.usage,
            depth: currentDepth + 1,
            conversationId: result.conversationId,
            toolName: toolConfig.name,
            metadata: {
              ...result.metadata,
              nestedCall: true,
              callDepth: currentDepth + 1,
              toolName: toolConfig.name
            }
          })
        };
      } else if (agent.provider === 'dify') {
        // 如果专家工具配置为 Dify 类型（向后兼容），使用 Dify Agent
        return await this.executeDifyAgent(agent, query, args);
      } else {
        return {
          success: false,
          content: JSON.stringify({ 
            error: `Agent ${targetAgentId} 的 provider 类型不支持: ${agent.provider}`,
            provider: agent.provider,
            expectedProvider: 'direct-agent'
          })
        };
      }
    } catch (error) {
      return {
        success: false,
        content: JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Agent 调用失败',
          details: error instanceof Error ? error.stack : String(error)
        })
      };
    }
  }

  /**
   * 执行 Dify Agent
   */
  private async executeDifyAgent(agent: any, query: string, args: any): Promise<ToolExecutionResult> {
    try {
      const difyConfig = agent.difyConfig ? JSON.parse(agent.difyConfig) : null;
      if (!difyConfig) {
        return {
          success: false,
          content: JSON.stringify({ error: 'Dify 配置不存在' })
        };
      }

      const { connectionType, apiKey, apiUrl } = difyConfig;
      let actualBaseUrl = apiUrl;
      if (apiUrl && apiUrl.startsWith('/')) {
        actualBaseUrl = process.env.DIFY_BASE_URL || 'http://47.113.225.93:9999/v1';
      }

      // 创建 DifyGateway
      const gateway = new DifyGateway({
        baseUrl: actualBaseUrl,
        workflowBaseUrl: actualBaseUrl,
        apiKey,
        timeout: 60000,
        maxRetries: 3,
      });

      // 构建输入参数
      const inputs: Record<string, any> = {
        query: query,
        ...args
      };
      const conversationId = args.conversationId || '';

      // 调用 Dify
      if (connectionType === 'chatflow') {
        const chatResult = await gateway.executeChat({
          query,
          conversationId,
          inputs,
          userId: 'expert-tool',
        });

        if (chatResult.success && chatResult.value) {
          const chatData = chatResult.value.raw as any;
          return {
            success: true,
            content: JSON.stringify({
              content: chatData.answer || chatResult.value.answer || '',
              conversationId: chatData.conversation_id || chatResult.value.conversationId || conversationId,
              metadata: chatData.metadata || {}
            })
          };
        } else {
          return {
            success: false,
            content: JSON.stringify({ 
              error: chatResult.error?.message || 'Dify 聊天调用失败'
            })
          };
        }
      } else {
        // workflow 模式
        const workflowResult = await gateway.executeWorkflow({
          workflowId: 'custom-workflow',
          inputs,
          userId: 'expert-tool',
        });

        if (workflowResult.success && workflowResult.value) {
          const workflowData = workflowResult.value.raw as any;
          return {
            success: true,
            content: JSON.stringify({
              content: workflowData.data?.outputs?.text || workflowData.data?.outputs?.answer || '',
              conversationId: workflowData.conversation_id || conversationId,
              metadata: workflowData.metadata || {}
            })
          };
        } else {
          return {
            success: false,
            content: JSON.stringify({ 
              error: workflowResult.error?.message || 'Dify Workflow 调用失败'
            })
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        content: JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Dify Agent 调用失败',
          details: error instanceof Error ? error.stack : String(error)
        })
      };
    }
  }
}

