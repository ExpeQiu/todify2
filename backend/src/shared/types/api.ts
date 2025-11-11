/**
 * 统一的 API 响应格式定义
 * 前后端共享的 API 契约
 */

/**
 * API 错误载荷
 */
export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * 统一的 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  message?: string;
}

/**
 * 分页响应元数据
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: PaginationMeta;
}

/**
 * 验证错误详情
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * 验证错误响应
 */
export interface ValidationErrorResponse extends ApiResponse<never> {
  error: ApiErrorPayload & {
    code: 'VALIDATION_ERROR';
    details: {
      errors: ValidationError[];
    };
  };
}

/**
 * 标准错误代码枚举
 */
export enum ApiErrorCode {
  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // Dify 相关错误
  DIFY_CHAT_ERROR = 'DIFY_CHAT_ERROR',
  DIFY_WORKFLOW_ERROR = 'DIFY_WORKFLOW_ERROR',

  // 业务错误
  AI_SEARCH_FAILED = 'AI_SEARCH_FAILED',
  WORKFLOW_EXECUTION_FAILED = 'WORKFLOW_EXECUTION_FAILED',
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown,
): ApiResponse<never> {
  const response: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
    },
  };
  
  if (details !== undefined) {
    response.error!.details = details;
  }
  
  return response;
}

/**
 * 创建验证错误响应
 */
export function createValidationErrorResponse(
  errors: ValidationError[],
): ValidationErrorResponse {
  return {
    success: false,
    error: {
      code: ApiErrorCode.VALIDATION_ERROR,
      message: '请求参数验证失败',
      details: {
        errors,
      },
    },
  };
}

