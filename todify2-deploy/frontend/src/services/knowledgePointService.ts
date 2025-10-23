import api from './api';
import {
  KnowledgePoint,
  CreateKnowledgePointFormData,
  UpdateKnowledgePointFormData,
  KnowledgePointQueryOptions,
  ApiResponse,
  PaginatedResponse
} from '../types/knowledgePoint';

const KNOWLEDGE_POINT_BASE_URL = '/knowledge-points';

export const knowledgePointService = {
  // 创建知识点
  async create(data: CreateKnowledgePointFormData): Promise<ApiResponse<KnowledgePoint>> {
    const response = await api.post(KNOWLEDGE_POINT_BASE_URL, data);
    return response.data;
  },

  // 根据技术点ID获取知识点列表
  async getByTechPointId(
    techPointId: number, 
    options?: KnowledgePointQueryOptions
  ): Promise<PaginatedResponse<KnowledgePoint>> {
    const params = {
      page: options?.page || 1,
      pageSize: options?.pageSize || 10,
      orderBy: options?.orderBy || 'created_at',
      orderDirection: options?.orderDirection || 'DESC'
    };
    
    const response = await api.get(`${KNOWLEDGE_POINT_BASE_URL}/tech-point/${techPointId}`, { params });
    return response.data;
  },

  // 根据ID获取知识点详情
  async getById(id: number): Promise<ApiResponse<KnowledgePoint>> {
    const response = await api.get(`${KNOWLEDGE_POINT_BASE_URL}/${id}`);
    return response.data;
  },

  // 更新知识点
  async update(id: number, data: UpdateKnowledgePointFormData): Promise<ApiResponse<KnowledgePoint>> {
    const response = await api.put(`${KNOWLEDGE_POINT_BASE_URL}/${id}`, data);
    return response.data;
  },

  // 删除知识点
  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`${KNOWLEDGE_POINT_BASE_URL}/${id}`);
    return response.data;
  }
};