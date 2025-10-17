import api from './api';
import {
  CarModel,
  CarModelFormData,
  UpdateCarModelFormData,
  CarModelSearchParams,
  CarModelStats,
  ApiResponse,
  PaginatedResponse
} from '../types/carModel';
import { TechPoint } from '../types/techPoint';

const CAR_MODEL_BASE_URL = '/car-models';

export const carModelService = {
  // 获取所有车型
  async getAll(params?: CarModelSearchParams): Promise<PaginatedResponse<CarModel>> {
    const response = await api.get(CAR_MODEL_BASE_URL, { params });
    return response.data;
  },

  // 根据ID获取车型
  async getById(id: number, includeBrand?: boolean): Promise<ApiResponse<CarModel>> {
    const params = includeBrand ? { includeBrand } : {};
    const response = await api.get(`${CAR_MODEL_BASE_URL}/${id}`, { params });
    return response.data;
  },

  // 根据品牌ID获取车型
  async getByBrand(brandId: number, params?: CarModelSearchParams): Promise<PaginatedResponse<CarModel>> {
    const response = await api.get(`${CAR_MODEL_BASE_URL}/brand/${brandId}`, { params });
    return response.data;
  },

  // 创建车型
  async create(data: CarModelFormData): Promise<ApiResponse<CarModel>> {
    const response = await api.post(CAR_MODEL_BASE_URL, data);
    return response.data;
  },

  // 更新车型
  async update(id: number, data: UpdateCarModelFormData): Promise<ApiResponse<CarModel>> {
    const response = await api.put(`${CAR_MODEL_BASE_URL}/${id}`, data);
    return response.data;
  },

  // 删除车型
  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`${CAR_MODEL_BASE_URL}/${id}`);
    return response.data;
  },

  // 获取车型统计
  async getStats(): Promise<ApiResponse<CarModelStats>> {
    const response = await api.get(`${CAR_MODEL_BASE_URL}/stats`);
    return response.data;
  },

  // 获取车型关联的技术点
  async getTechPoints(id: number): Promise<ApiResponse<TechPoint[]>> {
    const response = await api.get(`${CAR_MODEL_BASE_URL}/${id}/tech-points`);
    return response.data;
  }
};

export default carModelService;