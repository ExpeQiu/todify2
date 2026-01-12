import axios from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ArticleType {
  id: string;
  code: string;
  name: string;
  description?: string;
  enabled: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateArticleTypeDTO {
  code: string;
  name: string;
  description?: string;
  enabled?: number;
  sort_order?: number;
}

export interface UpdateArticleTypeDTO {
  code?: string;
  name?: string;
  description?: string;
  enabled?: number;
  sort_order?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ArticleTypeService {
  /**
   * 获取所有文章类型
   */
  async getAll(enabledOnly: boolean = false): Promise<ApiResponse<ArticleType[]>> {
    try {
      const response = await api.get<ApiResponse<ArticleType[]>>('/article-types', {
        params: { enabled: enabledOnly }
      });
      return response.data;
    } catch (error) {
      console.error('获取文章类型列表失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取文章类型列表失败'
      };
    }
  }

  /**
   * 根据ID获取文章类型
   */
  async getById(id: string): Promise<ApiResponse<ArticleType>> {
    try {
      const response = await api.get<ApiResponse<ArticleType>>(`/article-types/${id}`);
      return response.data;
    } catch (error) {
      console.error('获取文章类型失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取文章类型失败'
      };
    }
  }

  /**
   * 创建文章类型
   */
  async create(data: CreateArticleTypeDTO): Promise<ApiResponse<ArticleType>> {
    try {
      const response = await api.post<ApiResponse<ArticleType>>('/article-types', data);
      return response.data;
    } catch (error: any) {
      console.error('创建文章类型失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '创建文章类型失败'
      };
    }
  }

  /**
   * 更新文章类型
   */
  async update(id: string, data: UpdateArticleTypeDTO): Promise<ApiResponse<ArticleType>> {
    try {
      const response = await api.put<ApiResponse<ArticleType>>(`/article-types/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('更新文章类型失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '更新文章类型失败'
      };
    }
  }

  /**
   * 删除文章类型
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete<ApiResponse<void>>(`/article-types/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('删除文章类型失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '删除文章类型失败'
      };
    }
  }

  /**
   * 获取文章类型关联的AI角色ID列表
   */
  async getAssociatedAIRoleIds(articleTypeId: string): Promise<ApiResponse<string[]>> {
    try {
      const response = await api.get<ApiResponse<string[]>>(`/article-types/${articleTypeId}/ai-roles`);
      return response.data;
    } catch (error: any) {
      console.error('获取关联AI角色失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '获取关联AI角色失败'
      };
    }
  }

  /**
   * 设置文章类型关联的AI角色
   */
  async setAssociatedAIRoles(articleTypeId: string, aiRoleIds: string[]): Promise<ApiResponse<string[]>> {
    try {
      const response = await api.put<ApiResponse<string[]>>(`/article-types/${articleTypeId}/ai-roles`, {
        aiRoleIds
      });
      return response.data;
    } catch (error: any) {
      console.error('设置关联AI角色失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '设置关联AI角色失败'
      };
    }
  }
}

const articleTypeService = new ArticleTypeService();
export default articleTypeService;

