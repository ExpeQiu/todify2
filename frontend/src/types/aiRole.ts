// AI角色类型定义

// Dify工作流输入字段配置
export interface DifyInputField {
  variable: string;              // 字段变量名（如：Additional_information, input1等）
  label: string;                 // 字段标签（显示名称）
  type: 'text' | 'paragraph' | 'select' | 'file-list' | 'number';  // 字段类型
  required?: boolean;            // 是否必填
  maxLength?: number;            // 最大长度（文本类型）
  placeholder?: string;          // 占位符
  hint?: string;                 // 提示信息
  options?: string[];            // 选项列表（select类型）
  default?: string;              // 默认值
  allowedFileTypes?: string[];   // 允许的文件类型（file-list）
  allowedFileExtensions?: string[]; // 允许的文件扩展名（file-list）
  maxFiles?: number;             // 最大文件数（file-list）
}

// Dify配置
export interface DifyConfig {
  apiUrl: string;              // Dify API地址
  apiKey: string;              // API密钥
  connectionType: 'chatflow' | 'workflow';
  inputFields?: DifyInputField[];  // Dify工作流输入字段配置
}

// Prompt变量定义
export interface PromptVariable {
  name: string;           // 变量名，如 user_name
  description: string;    // 变量说明
  type: 'static' | 'dynamic' | 'context';  // 静态/动态/上下文
  value?: string;         // 静态值
  source?: string;        // 动态来源（如：user.profile.name）
}

// Prompt模板
export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];    // 需要的变量列表
}

// 工具参数定义
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  enum?: string[];        // 枚举值
  default?: any;
}

// 工具配置
export interface ToolConfig {
  id: string;
  name: string;           // 工具名称（function name）
  description: string;    // 工具描述
  type: 'search' | 'api' | 'calculation' | 'workflow' | 'agent' | 'time' | 'custom';
  enabled: boolean;
  parameters: ToolParameter[];  // 参数定义（JSON Schema格式）
  implementation?: {
    endpoint?: string;    // API端点
    method?: string;      // HTTP方法
    headers?: Record<string, string>;
    workflowId?: string;  // 关联的workflow ID
    agentId?: string;     // 关联的agent ID
  };
}

// Agent调用配置
export interface AgentCallConfig {
  id: string;
  targetAgentId?: string;      // 目标Agent ID
  targetWorkflowId?: string;   // 目标Workflow ID
  name: string;                // 调用名称
  description: string;         // 调用描述
  trigger: 'manual' | 'auto';  // 手动/自动触发
  inputMapping?: Record<string, string>;   // 输入映射
  outputMapping?: Record<string, string>;  // 输出映射
}

// Direct Agent配置
export interface DirectAgentConfig {
  // LLM基础配置
  llm: {
    provider: 'openai' | 'azure-openai' | 'qwen' | 'ernie' | 'custom';
    apiKey: string;
    apiBaseUrl?: string;  // 自定义端点
    model: string;        // gpt-4, gpt-3.5-turbo, qwen-max等
    temperature: number;  // 0-2
    maxTokens: number;    // 最大生成token数
    topP?: number;        // 0-1
  };
  
  // Prompt配置
  prompt: {
    systemPrompt: string;           // 系统提示词
    variables?: PromptVariable[];   // 动态变量
    templates?: PromptTemplate[];   // 预设模板
  };
  
  // 上下文管理策略
  contextStrategy: {
    type: 'window' | 'summary' | 'hybrid';  // 窗口/摘要/混合
    maxMessages: number;                     // 最大历史消息数
    maxTokens: number;                       // 最大上下文token数
    summaryThreshold?: number;               // 触发摘要的消息数阈值
    includeSystemPrompt: boolean;            // 是否每次都包含system prompt
  };
  
  // 工具调用配置
  tools?: ToolConfig[];
  
  // Agent协作配置
  agentCalls?: AgentCallConfig[];
}

export interface AIRoleConfig {
  id: string;                    // 唯一标识
  name: string;                  // 角色名称
  description: string;           // 角色描述
  avatar?: string;               // 角色头像URL
  systemPrompt?: string;         // 系统提示词（保留用于向后兼容）
  
  // Provider配置（Dify 或 Direct Agent）
  provider?: 'dify' | 'direct-agent';  // 默认为 'dify' 以保持向后兼容
  
  // Dify配置（保持现有，可选）
  difyConfig?: DifyConfig;
  
  // Direct Agent配置（新增，可选）
  agentConfig?: DirectAgentConfig;
  
  enabled: boolean;              // 是否启用
  source?: 'smart-workflow' | 'independent-page' | 'custom';  // 来源标记
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationState {
  id: string;                    // 对话ID
  roleId: string;                // 关联的角色ID
  conversationId?: string;       // Dify对话ID（用于多轮对话）
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
  isRegenerating?: boolean;
}

export interface AIRoleChatProps {
  roleConfig: AIRoleConfig;
  conversationId?: string;
  onConversationUpdate?: (conversationId: string) => void;
  onClose?: () => void;
}

export interface AIRolePreset {
  name: string;
  description: string;
  avatar?: string;
  systemPrompt?: string;
  difyConfig: {
    connectionType: 'chatflow' | 'workflow';
  };
}

