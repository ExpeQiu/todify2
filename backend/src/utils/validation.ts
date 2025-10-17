import { 
  AiSearchRequest, 
  TechAppRequest, 
  ValidationResult, 
  ValidationError,
  AiSearchResponse,
  TechAppResponse 
} from '../types/api';

// 验证AI搜索请求参数
export function validateAiSearchRequest(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // 检查必需的query参数
  if (!data.query) {
    errors.push({
      field: 'query',
      message: 'Query parameter is required',
      value: data.query
    });
  } else if (typeof data.query !== 'string') {
    errors.push({
      field: 'query',
      message: 'Query must be a string',
      value: data.query
    });
  } else if (data.query.trim().length === 0) {
    errors.push({
      field: 'query',
      message: 'Query cannot be empty',
      value: data.query
    });
  }

  // 检查inputs参数（可选）
  if (data.inputs !== undefined && typeof data.inputs !== 'object') {
    errors.push({
      field: 'inputs',
      message: 'Inputs must be an object',
      value: data.inputs
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// 验证技术应用请求参数
export function validateTechAppRequest(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // 检查必需的inputs参数
  if (!data.inputs) {
    errors.push({
      field: 'inputs',
      message: 'Inputs parameter is required',
      value: data.inputs
    });
  } else if (typeof data.inputs !== 'object') {
    errors.push({
      field: 'inputs',
      message: 'Inputs must be an object',
      value: data.inputs
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// 验证AI搜索响应数据格式
// 验证AI搜索响应数据 (聊天消息API格式)
export function validateAiSearchResponse(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // 检查必需字段
  const requiredFields = ['event', 'task_id', 'id', 'message_id', 'conversation_id', 'mode', 'answer', 'metadata', 'created_at'];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      errors.push({
        field,
        message: `${field} is required in response`,
        value: data[field]
      });
    }
  }

  // 检查metadata对象结构
  if (data.metadata) {
    if (!data.metadata.usage) {
      errors.push({
        field: 'metadata.usage',
        message: 'usage is required in metadata object',
        value: data.metadata.usage
      });
    } else {
      const usageRequiredFields = ['prompt_tokens', 'completion_tokens', 'total_tokens', 'total_price', 'currency', 'latency'];
      for (const field of usageRequiredFields) {
        if (data.metadata.usage[field] === undefined || data.metadata.usage[field] === null) {
          errors.push({
            field: `metadata.usage.${field}`,
            message: `${field} is required in usage object`,
            value: data.metadata.usage[field]
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// 验证技术应用响应数据格式 (工作流API格式)
export function validateTechAppResponse(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // 检查必需字段
  const requiredFields = ['workflow_run_id', 'task_id', 'data'];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      errors.push({
        field,
        message: `${field} is required in response`,
        value: data[field]
      });
    }
  }

  // 检查data对象结构
  if (data.data) {
    const dataRequiredFields = ['id', 'workflow_id', 'status', 'outputs', 'error', 'elapsed_time', 'total_tokens', 'total_steps', 'created_at', 'finished_at'];
    for (const field of dataRequiredFields) {
      if (data.data[field] === undefined || data.data[field] === null) {
        errors.push({
          field: `data.${field}`,
          message: `${field} is required in data object`,
          value: data.data[field]
        });
      }
    }

    // 检查outputs对象
    if (data.data.outputs && typeof data.data.outputs !== 'object') {
      errors.push({
        field: 'data.outputs',
        message: 'outputs must be an object',
        value: data.data.outputs
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// 通用响应格式化函数
export function formatApiResponse<T>(success: boolean, data?: T, message?: string, error?: string) {
  return {
    success,
    data,
    message,
    error
  };
}

// 格式化验证错误响应
export function formatValidationErrorResponse(errors: ValidationError[]) {
  return {
    success: false,
    error: 'Validation failed',
    message: '请求参数验证失败',
    details: errors
  };
}