// 车系相关类型定义
import { Brand } from './brand';
import { CarModel } from './carModel';

export interface CarSeries {
  id: number;
  name: string;
  model_id: number;
  description?: string;
  launch_year?: number;
  end_year?: number;
  market_segment?: string;
  status: CarSeriesStatus;
  metadata?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  model?: CarModel;
}

export enum CarSeriesStatus {
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

// 车系统计数据
export interface CarSeriesStats {
  total: number;
  byStatus: Record<string, number>;
  byModel: Record<string, number>;
  byBrand: Record<string, number>;
  bySegment: Record<string, number>;
}

// 搜索和筛选参数
export interface CarSeriesSearchParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  status?: CarSeriesStatus;
  modelId?: number;
  brandId?: number;
  market_segment?: string;
  launch_year?: number;
  end_year?: number;
  includeModel?: boolean;
  includeBrand?: boolean;
}

// 创建车系表单数据
export interface CarSeriesFormData {
  name: string;
  model_id: number;
  description?: string;
  launch_year?: number;
  end_year?: number;
  market_segment?: string;
  status?: CarSeriesStatus;
  metadata?: any;
}

// 更新车系表单数据
export interface UpdateCarSeriesFormData {
  name?: string;
  model_id?: number;
  description?: string;
  launch_year?: number;
  end_year?: number;
  market_segment?: string;
  status?: CarSeriesStatus;
  metadata?: any;
}