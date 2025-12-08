// 技术点相关类型定义
import { CarModel } from './carModel';

export interface TechPoint {
  id: number;
  name: string;
  description: string;
  features?: string; // 技术特性（从technology_versions迁移）
  version?: string; // 版本号（从technology_versions迁移）
  release_date?: string; // 发布日期（从technology_versions迁移）
  technology_id?: number; // 关联的技术IP（从technology_versions迁移）
  category_id: number;
  parent_id?: number | null;
  level: number;
  tech_type: TechType; // 统一使用tech_type与后端保持一致
  priority: TechPriority;
  status: TechStatus;
  tags?: string[];
  technical_details?: Record<string, any>;
  benefits?: Record<string, any>;
  applications?: string[];
  keywords?: string[];
  source_url?: string;
  created_by?: string;
  tech_principle?: string; // 技术原理
  tech_value?: string; // 价值
  tech_boundary?: string; // 适用边界
  highlights?: string[]; // 技术亮点列表
  evidence_measured?: string[]; // 证据-实测列表
  evidence_certified?: string[]; // 证据-认证列表
  evidence_comparison?: string[]; // 证据-对比列表
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
  tech_type?: TechType; // 统一使用tech_type
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
  features?: string; // 技术特性
  version?: string; // 版本号
  release_date?: string; // 发布日期
  technology_id?: number; // 关联的技术IP
  category_id: number;
  parent_id?: number | null;
  level?: number;
  tech_type: TechType; // 统一使用tech_type
  priority: TechPriority;
  status: TechStatus;
  tags?: string[];
  technical_details?: Record<string, any>;
  benefits?: Record<string, any>;
  applications?: string[];
  keywords?: string[];
  source_url?: string;
  created_by?: string;
  tech_principle?: string; // 技术原理
  tech_value?: string; // 价值
  tech_boundary?: string; // 适用边界
  highlights?: string[]; // 技术亮点列表
  evidence_measured?: string[]; // 证据-实测列表
  evidence_certified?: string[]; // 证据-认证列表
  evidence_comparison?: string[]; // 证据-对比列表
}