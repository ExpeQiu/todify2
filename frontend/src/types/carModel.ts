// 车型相关类型定义
import { Brand } from './brand';

export interface CarModel {
  id: number;
  name: string;
  brand_id: number;
  category?: string;
  launch_year?: number;
  end_year?: number;
  market_segment?: string;
  status: CarModelStatus;
  metadata?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  brand?: Brand;
}

export enum CarModelStatus {
  ACTIVE = 'active',
  DISCONTINUED = 'discontinued',
  PLANNED = 'planned'
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

// 车型统计数据
export interface CarModelStats {
  total: number;
  byStatus: Record<string, number>;
  byBrand: Record<string, number>;
  byCategory: Record<string, number>;
  byYear: Record<string, number>;
}

// 搜索和筛选参数
export interface CarModelSearchParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  status?: CarModelStatus;
  brandId?: number;
  category?: string;
  launch_year?: number;
  end_year?: number;
  market_segment?: string;
  includeBrand?: boolean;
}

// 创建车型表单数据
export interface CarModelFormData {
  name: string;
  brand_id: number;
  category?: string;
  launch_year?: number;
  end_year?: number;
  market_segment?: string;
  status?: CarModelStatus;
  metadata?: any;
}

// 更新车型表单数据
export interface UpdateCarModelFormData {
  name?: string;
  brand_id?: number;
  category?: string;
  launch_year?: number;
  end_year?: number;
  market_segment?: string;
  status?: CarModelStatus;
  metadata?: any;
}