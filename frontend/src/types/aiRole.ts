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

export interface AIRoleConfig {
  id: string;                    // 唯一标识
  name: string;                  // 角色名称
  description: string;           // 角色描述
  avatar?: string;               // 角色头像URL
  systemPrompt?: string;         // 系统提示词
  difyConfig: {
    apiUrl: string;              // Dify API地址
    apiKey: string;              // API密钥
    connectionType: 'chatflow' | 'workflow';
    inputFields?: DifyInputField[];  // Dify工作流输入字段配置
  };
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

