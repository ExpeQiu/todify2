import api from './api';
import { ApiResponse } from '../types/techPoint';

export interface CarSeries {
  id: number;
  name: string;
  model_id?: number;
  [key: string]: any;
}

export const carSeriesService = {
  getByModel: async (modelId: number): Promise<{ data?: CarSeries[] }> => {
    try {
      const response = await api.get(`/car-series/model/${modelId}`);
      return { data: response.data?.data || response.data || [] };
    } catch (error) {
      console.error('获取车系列表失败:', error);
      return { data: [] };
    }
  },

  create: async (data: { name: string; model_id?: number }): Promise<ApiResponse<CarSeries>> => {
    try {
      const response = await api.post('/car-series', data);
      return response.data;
    } catch (error) {
      console.error('创建车系失败:', error);
      return {
        success: false,
        error: '创建车系失败'
      };
    }
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete(`/car-series/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除车系失败:', error);
      return {
        success: false,
        error: '删除车系失败'
      };
    }
  },
};

export default carSeriesService;

