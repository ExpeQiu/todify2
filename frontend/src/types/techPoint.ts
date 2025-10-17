// 技术点相关类型定义
import { CarModel } from './carModel';

export interface TechPoint {
  id: number;
  name: string;
  description: string;
  category_id: number;
  type: TechType;
  priority: TechPriority;
  status: TechStatus;
  created_at: string;
  updated_at: string;
  category?: TechCategory;
}

export interface TechCategory {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  level: number;
  created_at: string;
  updated_at: string;
  parent?: TechCategory;
  children?: TechCategory[];
}

export enum TechType {
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
  INNOVATION = 'innovation',
  TECHNOLOGY = 'technology'
}

export enum TechPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum TechStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
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
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 技术点统计数据
export interface TechPointStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

// 搜索和筛选参数
export interface TechPointSearchParams {
  keyword?: string;
  category_id?: number;
  type?: TechType;
  priority?: TechPriority;
  status?: TechStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 创建/更新技术点的表单数据
export interface TechPointFormData {
  name: string;
  description: string;
  category_id: number;
  type: TechType;
  priority: TechPriority;
  status: TechStatus;
}