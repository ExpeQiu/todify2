import axios, { AxiosInstance } from 'axios';
import { TPD_API_BASE_URL } from '../config/tpd';
import {
  TechPoint,
  ApiResponse,
  PaginatedResponse,
  TechPointSearchParams,
} from '../types/techPoint';

/**
 * TPD2 项目技术点服务
 * 用于访问 TPD2 项目的技术点对外服务 API
 */
class TPDTechPointService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: TPD_API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 响应拦截器：将 TPD2 的响应格式转换为 todify3 期望的格式
    this.client.interceptors.response.use(
      (response) => {
        // TPD2 响应格式: { code: 200, message: 'success', data: {...}, requestId: '...' }
        // todify3 期望格式: { success: true, data: {...} }
        if (response.data && response.data.code === 200) {
          return {
            ...response,
            data: {
              success: true,
              data: response.data.data,
              message: response.data.message,
            },
          };
        }
        return response;
      },
      (error) => {
        // 错误响应格式转换
        if (error.response && error.response.data) {
          const tpdError = error.response.data;
          return Promise.reject({
            ...error,
            response: {
              ...error.response,
              data: {
                success: false,
                error: tpdError.message || '请求失败',
                code: tpdError.code,
              },
            },
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取技术点列表
   * 将 TPD2 的查询参数映射到 TPD2 API 期望的格式
   */
  async getTechPoints(
    params?: TechPointSearchParams
  ): Promise<ApiResponse<PaginatedResponse<TechPoint>>> {
    try {
      // 构建 TPD2 API 查询参数
      const queryParams: Record<string, any> = {};

      if (params?.page) {
        queryParams.page = params.page.toString();
      }
      if (params?.pageSize) {
        queryParams.pageSize = params.pageSize.toString();
      }
      if (params?.keyword) {
        queryParams.keyword = params.keyword;
      }
      if (params?.category_id) {
        queryParams.category_id = params.category_id.toString();
      }
      if (params?.status) {
        queryParams.status = params.status;
      }
      if (params?.type) {
        queryParams.tech_type = params.type;
      }
      if (params?.priority) {
        queryParams.priority = params.priority;
      }
      if (params?.sortBy) {
        queryParams.orderBy = params.sortBy;
      }
      if (params?.sortOrder) {
        queryParams.orderDirection = params.sortOrder.toUpperCase();
      }

      const response = await this.client.get('/tech-points', {
        params: queryParams,
      });

      // 响应已经被拦截器转换，现在格式是 { success: true, data: {...} }
      const responseData = response.data;

      if (responseData.success && responseData.data) {
        // TPD2 返回的 data 格式: { data: [], total: number, page: number, pageSize: number, totalPages: number }
        // 确保返回格式符合 PaginatedResponse
        const paginatedData = responseData.data;
        const dataArray = paginatedData.data || [];
        const total = paginatedData.total || 0;
        const page = paginatedData.page || 1;
        const pageSize = paginatedData.pageSize || 20;
        const totalPages = paginatedData.totalPages || Math.ceil(total / pageSize);
        
        return {
          success: true,
          data: {
            data: dataArray,
            items: dataArray, // 兼容性：某些地方可能使用 items
            total,
            page,
            pageSize,
            totalPages,
          },
          message: responseData.message,
        };
      }

      return {
        success: false,
        error: responseData.error || '获取技术点列表失败',
      };
    } catch (error: any) {
      console.error('获取技术点列表失败:', error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          '获取技术点列表失败',
      };
    }
  }
}

// 导出单例实例
export const tpdTechPointService = new TPDTechPointService();

