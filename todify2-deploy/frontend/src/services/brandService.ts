import api from './api';
import {
  Brand,
  BrandFormData,
  UpdateBrandFormData,
  BrandSearchParams,
  BrandStats,
  ApiResponse,
  PaginatedResponse
} from '../types/brand';

const BRAND_BASE_URL = '/brands';

export const brandService = {
  // 获取所有品牌
  async getAll(params?: BrandSearchParams): Promise<PaginatedResponse<Brand>> {
    const response = await api.get(BRAND_BASE_URL, { params });
    return response.data;
  },

  // 根据ID获取品牌
  async getById(id: number): Promise<ApiResponse<Brand>> {
    const response = await api.get(`${BRAND_BASE_URL}/${id}`);
    return response.data;
  },

  // 根据名称获取品牌
  async getByName(name: string): Promise<ApiResponse<Brand>> {
    const response = await api.get(`${BRAND_BASE_URL}/name/${encodeURIComponent(name)}`);
    return response.data;
  },

  // 创建品牌
  async create(data: BrandFormData): Promise<ApiResponse<Brand>> {
    const response = await api.post(BRAND_BASE_URL, data);
    return response.data;
  },

  // 更新品牌
  async update(id: number, data: UpdateBrandFormData): Promise<ApiResponse<Brand>> {
    const response = await api.put(`${BRAND_BASE_URL}/${id}`, data);
    return response.data;
  },

  // 删除品牌
  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`${BRAND_BASE_URL}/${id}`);
    return response.data;
  },

  // 获取品牌统计
  async getStats(): Promise<ApiResponse<BrandStats>> {
    const response = await api.get(`${BRAND_BASE_URL}/stats`);
    return response.data;
  }
};