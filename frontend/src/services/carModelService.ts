import api from './api';
import { ApiResponse } from '../types/techPoint';

export interface CarModel {
  id: number;
  name: string;
  brand_id?: number;
  [key: string]: any;
}

export const carModelService = {
  getByBrand: async (brandId: number): Promise<{ data?: CarModel[] }> => {
    try {
      const response = await api.get(`/car-models/brand/${brandId}`);
      return { data: response.data?.data || response.data || [] };
    } catch (error) {
      console.error('获取车型列表失败:', error);
      return { data: [] };
    }
  },

  create: async (data: { name: string; brand_id?: number }): Promise<ApiResponse<CarModel>> => {
    try {
      const response = await api.post('/car-models', data);
      return response.data;
    } catch (error) {
      console.error('创建车型失败:', error);
      return {
        success: false,
        error: '创建车型失败'
      };
    }
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete(`/car-models/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除车型失败:', error);
      return {
        success: false,
        error: '删除车型失败'
      };
    }
  },
};

export default carModelService;

