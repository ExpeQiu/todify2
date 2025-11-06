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
  templateType?: 'speech' | 'ai-chat' | 'ai-chat-edit' | 'ai-chat-knowledge' | 'custom' | null;
  customHtml?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePublicPageConfigRequest {
  name: string;
  description?: string;
  address?: string; // 地址配置
  displayMode: 'all' | 'workflow' | 'custom' | 'role';
  workflowId?: string;
  roleIds?: string[];
  templateType?: 'speech' | 'ai-chat' | 'ai-chat-edit' | 'ai-chat-knowledge' | 'custom' | null;
  customHtml?: string;
}

export interface UpdatePublicPageConfigRequest {
  name?: string;
  description?: string;
  address?: string; // 地址配置
  displayMode?: 'all' | 'workflow' | 'custom' | 'role';
  workflowId?: string;
  roleIds?: string[];
  isActive?: boolean;
  templateType?: 'speech' | 'ai-chat' | 'ai-chat-edit' | 'ai-chat-knowledge' | 'custom' | null;
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

