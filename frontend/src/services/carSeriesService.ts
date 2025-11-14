import api from './api';
import {
  CarSeries,
  CarSeriesFormData,
  UpdateCarSeriesFormData,
  CarSeriesSearchParams,
  CarSeriesStats,
  ApiResponse,
  PaginatedResponse
} from '../types/carSeries';
import { TechPoint } from '../types/techPoint';

const CAR_SERIES_BASE_URL = '/car-series';

export const carSeriesService = {
  // 获取所有车系
  async getAll(params?: CarSeriesSearchParams): Promise<PaginatedResponse<CarSeries>> {
    const response = await api.get(CAR_SERIES_BASE_URL, { params });
    return response.data;
  },

  // 根据ID获取车系
  async getById(id: number, includeModel?: boolean, includeBrand?: boolean): Promise<ApiResponse<CarSeries>> {
    const params: any = {};
    if (includeModel) params.includeModel = includeModel;
    if (includeBrand) params.includeBrand = includeBrand;
    const response = await api.get(`${CAR_SERIES_BASE_URL}/${id}`, { params });
    return response.data;
  },

  // 根据品牌ID获取车系
  async getByBrand(brandId: number, params?: CarSeriesSearchParams): Promise<PaginatedResponse<CarSeries>> {
    const response = await api.get(`${CAR_SERIES_BASE_URL}/brand/${brandId}`, { params });
    return response.data;
  },

  // 根据车型ID获取车系
  async getByModel(modelId: number, params?: CarSeriesSearchParams): Promise<PaginatedResponse<CarSeries>> {
    const response = await api.get(`${CAR_SERIES_BASE_URL}/model/${modelId}`, { params });
    return response.data;
  },

  // 创建车系
  async create(data: CarSeriesFormData): Promise<ApiResponse<CarSeries>> {
    const response = await api.post(CAR_SERIES_BASE_URL, data);
    return response.data;
  },

  // 更新车系
  async update(id: number, data: UpdateCarSeriesFormData): Promise<ApiResponse<CarSeries>> {
    const response = await api.put(`${CAR_SERIES_BASE_URL}/${id}`, data);
    return response.data;
  },

  // 软删除车系（停产）
  async discontinue(id: number): Promise<ApiResponse<void>> {
    const response = await api.patch(`${CAR_SERIES_BASE_URL}/${id}/discontinue`);
    return response.data;
  },

  // 硬删除车系
  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`${CAR_SERIES_BASE_URL}/${id}`);
    return response.data;
  },

  // 获取车系统计
  async getStats(): Promise<ApiResponse<CarSeriesStats>> {
    const response = await api.get(`${CAR_SERIES_BASE_URL}/stats`);
    return response.data;
  },

  // 获取车系关联的技术点
  async getTechPoints(id: number): Promise<ApiResponse<TechPoint[]>> {
    const response = await api.get(`${CAR_SERIES_BASE_URL}/${id}/tech-points`);
    return response.data;
  }
};

export default carSeriesService;