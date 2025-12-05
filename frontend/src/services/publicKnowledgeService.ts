import api from './api';
import {
  PublicKnowledgeCategory,
  CategoryTreeNode,
  PublicKnowledgeFile,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateFileDTO,
  UpdateFileDTO,
  ApiResponse
} from '../types/publicKnowledge';

const BASE_URL = '/public-knowledge';

export const publicKnowledgeService = {
  // ==================== 分类相关 ====================

  /**
   * 获取分类树
   */
  async getCategoryTree(): Promise<ApiResponse<CategoryTreeNode[]>> {
    const response = await api.get<CategoryTreeNode[]>(`${BASE_URL}/categories/tree`);
    return response.data;
  },

  /**
   * 获取所有分类
   */
  async getAllCategories(): Promise<ApiResponse<PublicKnowledgeCategory[]>> {
    const response = await api.get<PublicKnowledgeCategory[]>(`${BASE_URL}/categories`);
    return response.data;
  },

  /**
   * 根据ID获取分类
   */
  async getCategoryById(id: number): Promise<ApiResponse<PublicKnowledgeCategory>> {
    const response = await api.get<PublicKnowledgeCategory>(`${BASE_URL}/categories/${id}`);
    return response.data;
  },

  /**
   * 创建分类
   */
  async createCategory(data: CreateCategoryDTO): Promise<ApiResponse<PublicKnowledgeCategory>> {
    const response = await api.post<PublicKnowledgeCategory>(`${BASE_URL}/categories`, data);
    return response.data;
  },

  /**
   * 更新分类
   */
  async updateCategory(id: number, data: UpdateCategoryDTO): Promise<ApiResponse<PublicKnowledgeCategory>> {
    const response = await api.put<PublicKnowledgeCategory>(`${BASE_URL}/categories/${id}`, data);
    return response.data;
  },

  /**
   * 删除分类
   */
  async deleteCategory(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<void>(`${BASE_URL}/categories/${id}`);
    return response.data;
  },

  // ==================== 文件相关 ====================

  /**
   * 获取文件列表
   */
  async getFiles(categoryId?: number | null): Promise<ApiResponse<PublicKnowledgeFile[]>> {
    const params: any = {};
    if (categoryId !== undefined) {
      params.category_id = categoryId === null ? 'null' : categoryId;
    }
    const response = await api.get<PublicKnowledgeFile[]>(`${BASE_URL}/files`, { params });
    return response.data;
  },

  /**
   * 根据ID获取文件
   */
  async getFileById(id: number): Promise<ApiResponse<PublicKnowledgeFile>> {
    const response = await api.get<PublicKnowledgeFile>(`${BASE_URL}/files/${id}`);
    return response.data;
  },

  /**
   * 上传文件
   */
  async uploadFile(
    file: File,
    data?: CreateFileDTO
  ): Promise<ApiResponse<PublicKnowledgeFile>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (data?.category_id !== undefined) {
      formData.append('category_id', data.category_id === null ? 'null' : String(data.category_id));
    }
    if (data?.description) {
      formData.append('description', data.description);
    }
    if (data?.uploaded_by) {
      formData.append('uploaded_by', String(data.uploaded_by));
    }

    // 使用 axios 直接上传，因为 api 封装可能不支持 FormData
    const axios = (await import('axios')).default;
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const response = await axios.post<ApiResponse<PublicKnowledgeFile>>(
      `${baseURL}${BASE_URL}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * 更新文件
   */
  async updateFile(id: number, data: UpdateFileDTO): Promise<ApiResponse<PublicKnowledgeFile>> {
    const response = await api.put<PublicKnowledgeFile>(`${BASE_URL}/files/${id}`, data);
    return response.data;
  },

  /**
   * 删除文件
   */
  async deleteFile(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<void>(`${BASE_URL}/files/${id}`);
    return response.data;
  },

  /**
   * 下载文件
   */
  async downloadFile(id: number): Promise<Blob> {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}${BASE_URL}/files/${id}/download`);
    if (!response.ok) {
      throw new Error('下载文件失败');
    }
    return response.blob();
  },

  /**
   * 获取文件URL
   */
  getFileUrl(file: PublicKnowledgeFile): string {
    if (file.file_url) {
      return file.file_url;
    }
    // 如果没有file_url，使用file_path构建URL
    const fileName = file.file_path.split('/').pop() || '';
    return `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}${BASE_URL}/files/${fileName}`;
  }
};
