/**
 * Agent错误类型定义
 * 统一错误处理，便于前端解析和处理
 */

/**
 * Agent错误代码枚举
 */
export enum AgentErrorCode {
  TIMEOUT = 'TIMEOUT',
  TOOL_ERROR = 'TOOL_ERROR',
  LLM_ERROR = 'LLM_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Agent错误接口
 */
export interface AgentError {
  code: AgentErrorCode;
  message: string;
  details?: any;
  recoverable: boolean;
  timestamp: number;
  stack?: string;
  context?: {
    roleId?: string;
    executionId?: string;
    step?: string;
  };
}

/**
 * Agent错误类
 */
export class AgentError extends Error {
  public readonly code: AgentErrorCode;
  public readonly recoverable: boolean;
  public readonly timestamp: number;
  public readonly details?: any;
  public readonly context?: {
    roleId?: string;
    executionId?: string;
    step?: string;
  };

  constructor(
    code: AgentErrorCode,
    message: string,
    options?: {
      recoverable?: boolean;
      details?: any;
      context?: {
        roleId?: string;
        executionId?: string;
        step?: string;
      };
    }
  ) {
    super(message);
    this.name = 'AgentError';
    this.code = code;
    this.recoverable = options?.recoverable ?? false;
    this.timestamp = Date.now();
    this.details = options?.details;
    this.context = options?.context;
    
    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AgentError);
    }
  }

  /**
   * 转换为JSON格式（便于序列化）
   */
  toJSON(): AgentError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      stack: this.stack,
      context: this.context
    };
  }
}

/**
 * Agent错误处理器
 * 统一错误处理和格式化
 */
export class AgentErrorHandler {
  /**
   * 标准化错误（将各种错误转换为AgentError）
   */
  static normalizeError(
    error: any,
    context?: {
      roleId?: string;
      executionId?: string;
      step?: string;
    }
  ): AgentError {
    // 如果已经是AgentError，直接返回
    if (error instanceof AgentError) {
      return error;
    }

    // 根据错误类型分类
    const errorMessage = error?.message || String(error);
    const errorCode = error?.code;

    // 超时错误
    if (
      errorCode === 'ETIMEDOUT' ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('超时')
    ) {
      return new AgentError(
        AgentErrorCode.TIMEOUT,
        '请求超时，请稍后重试',
        {
          recoverable: true,
          details: error,
          context
        }
      );
    }

    // 网络错误
    if (
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'ENOTFOUND' ||
      errorCode === 'ECONNRESET' ||
      errorMessage.includes('network') ||
      errorMessage.includes('网络')
    ) {
      return new AgentError(
        AgentErrorCode.NETWORK_ERROR,
        '网络连接失败，请检查网络设置',
        {
          recoverable: true,
          details: error,
          context
        }
      );
    }

    // 认证错误
    if (
      errorMessage.includes('401') ||
      errorMessage.includes('Unauthorized') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('认证')
    ) {
      return new AgentError(
        AgentErrorCode.AUTHENTICATION_ERROR,
        '认证失败，请检查API Key配置',
        {
          recoverable: false,
          details: error,
          context
        }
      );
    }

    // 限流错误
    if (
      errorMessage.includes('429') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('限流')
    ) {
      return new AgentError(
        AgentErrorCode.RATE_LIMIT_ERROR,
        '请求频率过高，请稍后重试',
        {
          recoverable: true,
          details: error,
          context
        }
      );
    }

    // 配置错误
    if (
      errorMessage.includes('不存在') ||
      errorMessage.includes('未配置') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('missing')
    ) {
      return new AgentError(
        AgentErrorCode.CONFIG_ERROR,
        errorMessage || '配置错误',
        {
          recoverable: false,
          details: error,
          context
        }
      );
    }

    // 验证错误
    if (
      errorMessage.includes('验证') ||
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid')
    ) {
      return new AgentError(
        AgentErrorCode.VALIDATION_ERROR,
        errorMessage || '参数验证失败',
        {
          recoverable: false,
          details: error,
          context
        }
      );
    }

    // LLM错误
    if (
      errorMessage.includes('LLM') ||
      errorMessage.includes('model') ||
      errorMessage.includes('provider')
    ) {
      return new AgentError(
        AgentErrorCode.LLM_ERROR,
        errorMessage || 'LLM调用失败',
        {
          recoverable: true,
          details: error,
          context
        }
      );
    }

    // 工具错误
    if (
      errorMessage.includes('工具') ||
      errorMessage.includes('tool') ||
      errorMessage.includes('Tool')
    ) {
      return new AgentError(
        AgentErrorCode.TOOL_ERROR,
        errorMessage || '工具执行失败',
        {
          recoverable: true,
          details: error,
          context
        }
      );
    }

    // 未知错误
    return new AgentError(
      AgentErrorCode.UNKNOWN_ERROR,
      errorMessage || '未知错误',
      {
        recoverable: false,
        details: error,
        context
      }
    );
  }

  /**
   * 格式化错误为前端友好的格式
   */
  static formatForFrontend(error: AgentError): {
    code: string;
    message: string;
    recoverable: boolean;
    details?: any;
  } {
    return {
      code: error.code,
      message: error.message,
      recoverable: error.recoverable,
      details: error.details
    };
  }
}
