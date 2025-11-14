// API请求和响应类型定义

// 通用API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// AI搜索请求参数
export interface AiSearchRequest {
  query: string;
  inputs?: {
    [key: string]: any;
  };
}

// AI搜索响应数据 (使用聊天消息API格式)
export interface AiSearchResponse {
  event: string;
  task_id: string;
  id: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: {
    usage: {
      prompt_tokens: number;
      prompt_unit_price: string;
      prompt_price_unit: string;
      prompt_price: string;
      completion_tokens: number;
      completion_unit_price: string;
      completion_price_unit: string;
      completion_price: string;
      total_tokens: number;
      total_price: string;
      currency: string;
      latency: number;
    };
    retriever_resources?: Array<{
      position: number;
      dataset_id: string;
      dataset_name: string;
      document_id: string;
      document_name: string;
      segment_id: string;
      score: number;
      content: string;
    }>;
  };
  created_at: number;
}

// 技术应用请求参数 - 基于Dify工作流字段要求
export interface TechAppRequest {
  inputs: {
    // 对应Dify input1: 上游信息 (必填, 最大5000字符)
    input1?: string;
    // 对应Dify input2: 附件上传 (可选, 最多5个文件)
    input2?: File[];
    // 对应Dify input3: 优化建议 (可选, 最大1000字符)
    input3?: string;
    // 兼容旧版本字段
    query?: string;
    [key: string]: any;
  };
}

// 技术应用响应数据 (使用工作流API格式) - 基于Dify输出字段要求
export interface TechAppResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: {
      // 对应Dify输出字段: text (来自LLM节点的text输出)
      text?: string;
      [key: string]: any;
    };
    error: string | null;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

// 数据验证错误
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// 请求验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Dify工作流字段映射 - 基于robot1-技术包装.yml
export interface DifyFieldMapping {
  // 输入字段映射
  inputs: {
    // input1: 上游信息 (必填, 最大5000字符)
    input1: {
      type: 'paragraph';
      required: true;
      maxLength: 5000;
      label: '上游信息';
      description: '输入需要处理的上游信息内容';
    };
    // input2: 附件上传 (可选, 最多5个文件)
    input2: {
      type: 'file-list';
      required: false;
      maxFiles: 5;
      allowedTypes: ['image', 'document'];
      allowedExtensions: ['.JPG', '.JPEG', '.PNG', '.GIF', '.WEBP', '.SVG'];
      label: '附件上传';
      description: '支持上传图片和文档文件';
    };
    // input3: 优化建议 (可选, 最大1000字符)
    input3: {
      type: 'paragraph';
      required: false;
      maxLength: 1000;
      label: '优化建议';
      description: '提供优化建议或特殊要求';
    };
  };
  // 输出字段映射
  outputs: {
    // text: 处理结果文本
    text: {
      type: 'string';
      source: 'llm_output';
      description: 'LLM处理后的文本结果';
    };
  };
}