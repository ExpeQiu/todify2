// 品牌相关类型定义

export interface Brand {
  id: number;
  name: string;
  description?: string;
  country?: string;
  founded_year?: number;
  logo_url?: string;
  website?: string;
  status: BrandStatus;
  metadata?: string;
  created_at: string;
  updated_at: string;
}

export enum BrandStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued'
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

// 品牌统计数据
export interface BrandStats {
  total: number;
  byStatus: Record<string, number>;
  byCountry: Record<string, number>;
}

// 搜索和筛选参数
export interface BrandSearchParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  status?: BrandStatus;
  country?: string;
  founded_year?: number;
}

// 创建品牌表单数据
export interface BrandFormData {
  name: string;
  description?: string;
  country?: string;
  founded_year?: number;
  logo_url?: string;
  website?: string;
  status?: BrandStatus;
  metadata?: any;
}

// 更新品牌表单数据
export interface UpdateBrandFormData {
  name?: string;
  description?: string;
  country?: string;
  founded_year?: number;
  logo_url?: string;
  website?: string;
  status?: BrandStatus;
  metadata?: any;
}