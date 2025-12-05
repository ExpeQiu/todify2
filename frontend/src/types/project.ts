// 项目相关类型定义

export enum ProjectType {
  NORMAL = 'normal',
  FEATURED = 'featured'
}

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  cover_image?: string;
  icon?: string;
  type: ProjectType;
  status: ProjectStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_opened_at?: string;
  sourceCount?: number;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 创建/更新项目的表单数据
export interface ProjectFormData {
  name: string;
  description?: string;
  cover_image?: string;
  icon?: string;
  type?: ProjectType;
  status?: ProjectStatus;
}

// 项目搜索和筛选参数
export interface ProjectSearchParams {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  status?: ProjectStatus;
  type?: ProjectType;
}
