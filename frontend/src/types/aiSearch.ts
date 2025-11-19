import { Source } from '../components/ai-search/SourceSidebar';

/**
 * 对话消息
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  outputs?: {
    content?: any;
    files?: any[];
    metadata?: any;
    structured?: any;
    [key: string]: any;
  };
  createdAt: Date;
}

/**
 * 对话
 */
export interface Conversation {
  id: string;
  title: string;
  sources: Source[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  hasMoreMessages?: boolean;
  nextCursor?: string;
}

/**
 * 输出内容
 */
export interface OutputContent {
  id: string;
  type: 'ppt' | 'script' | 'mindmap' | 'other';
  title: string;
  content: any;
  messageId: string;
  conversationId: string;
  createdAt: Date;
}

/**
 * 工作流配置
 */
export interface WorkflowConfig {
  id: string;
  name: string;
  description?: string;
  inputParameters: WorkflowInputParameter[];
  outputParameters: WorkflowOutputParameter[];
}

/**
 * 工作流输入参数
 */
export interface WorkflowInputParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';
  required: boolean;
  description?: string;
}

/**
 * 工作流输出参数
 */
export interface WorkflowOutputParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';
  description?: string;
}

/**
 * 文件上传响应
 */
export interface FileUploadResponse {
  id: string;
  fileId?: string; // 后端返回的文件ID
  name: string;
  url: string;
  type: string;
  size: number;
  category?: string; // 文件分类
  createdAt?: string; // 创建时间
}

/**
 * 创建对话请求
 */
export interface CreateConversationRequest {
  title?: string;
  sources: Source[];
}

/**
 * 发送消息请求
 */
export interface SendMessageRequest {
  content: string;
  sources?: Source[];
  files?: File[];
  contextWindowSize?: number;
  workflowId?: string;
  fileList?: string; // 文件列表（逗号分隔的文件名）
  knowledgeBaseNames?: string; // 知识库名称列表（逗号分隔）
}

export interface SendMessageResponse {
  userMessage: Message;
  aiMessage?: Message;
  error?: string;
  errorDetail?: string;
}

/**
 * API响应
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 字段映射规则
 */
export interface FieldMappingRule {
  workflowInputName: string; // 工作流输入参数名
  sourceType: 'field' | 'expression'; // 映射来源类型
  sourceField?: string; // AI对话字段名（如 'query', 'sources', 'files'）
  expression?: string; // 表达式映射（支持JavaScript表达式）
  defaultValue?: any; // 默认值（当源字段为空时）
}

/**
 * 输出字段映射规则
 */
export interface OutputMappingRule {
  workflowOutputName: string; // 工作流输出参数名
  targetField: string; // 目标字段名（如 'content', 'files', 'metadata'）
  extractExpression: string; // 提取表达式（如 'output.text' 或 'output.files'）
}

/**
 * 功能对象类型
 */
export type FeatureObjectType = 
  | 'ai-dialog'          // AI对话框
  | 'five-view-analysis' // 五看分析
  | 'three-fix-analysis' // 三定分析
  | 'tech-matrix'        // 技术矩阵
  | 'propagation-strategy' // 传播策略
  | 'exhibition-video'   // 展具与视频
  | 'translation'        // 翻译
  | 'ppt-outline'        // 技术讲稿
  | 'script';            // 脚本

/**
 * 功能对象配置
 */
export interface FeatureObjectConfig {
  featureType: FeatureObjectType; // 功能对象类型
  workflowId: string; // 关联的工作流ID
  inputMappings: FieldMappingRule[]; // 输入字段映射规则
  outputMappings: OutputMappingRule[]; // 输出字段映射规则
  pageType?: 'tech-package' | 'tech-strategy' | 'tech-article' | 'press-release';
  label?: string; // 自定义显示名称（可选）
  agentId?: string; // 关联的AI角色ID（可选）
}

/**
 * 字段映射配置
 */
export interface FieldMappingConfig {
  workflowId: string; // 关联的工作流ID（向后兼容）
  inputMappings: FieldMappingRule[]; // 输入字段映射规则（向后兼容）
  outputMappings: OutputMappingRule[]; // 输出字段映射规则（向后兼容）
  featureObjects?: FeatureObjectConfig[]; // 功能对象配置列表
}
