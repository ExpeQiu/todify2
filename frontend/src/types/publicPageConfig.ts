// 公开页面配置类型定义

export interface PublicPageConfig {
  id: string;
  name: string;
  description?: string;
  address?: string; // 地址配置
  displayMode: 'all' | 'workflow' | 'custom' | 'role';
  workflowId?: string;
  roleIds?: string[];
  accessToken: string;
  isActive: boolean;
  templateType?: 'speech' | 'ai-chat' | 'ai-chat-edit' | 'ai-chat-knowledge' | 'ai-chat-source' | 'ai-chat-source-tools' | 'custom' | null;
  customHtml?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePublicPageConfigRequest {
  name: string;
  description?: string;
  address?: string; // 地址配置
  displayMode?: 'all' | 'workflow' | 'custom' | 'role'; // 可选，默认为'role'
  workflowId?: string;
  roleIds?: string[];
  templateType?: 'speech' | 'ai-chat' | 'ai-chat-edit' | 'ai-chat-knowledge' | 'ai-chat-source' | 'ai-chat-source-tools' | 'custom' | null;
  customHtml?: string;
  isActive?: boolean; // 可选，用于创建时直接设置状态
}

export interface UpdatePublicPageConfigRequest {
  name?: string;
  description?: string;
  address?: string; // 地址配置
  displayMode?: 'all' | 'workflow' | 'custom' | 'role';
  workflowId?: string;
  roleIds?: string[];
  isActive?: boolean;
  templateType?: 'speech' | 'ai-chat' | 'ai-chat-edit' | 'ai-chat-knowledge' | 'ai-chat-source' | 'ai-chat-source-tools' | 'custom' | null;
  customHtml?: string;
}

export interface PublicPageConfigPreview {
  config: PublicPageConfig;
  roles: any[]; // AIRoleConfig[]
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

