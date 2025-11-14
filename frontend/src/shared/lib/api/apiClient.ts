import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import type { ApiResponse, ApiErrorPayload } from '@/shared/types/api';

class ApiClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
      timeout: 120_000, // 增加到120秒（2分钟），适应AI请求的较长响应时间
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // 处理超时错误
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          const apiError: ApiErrorPayload = {
            code: 'TIMEOUT_ERROR',
            message: '请求超时，请稍后重试。AI处理可能需要较长时间，请耐心等待。',
            details: error.response?.data?.error?.details || error.response?.data,
          };
          return Promise.reject(apiError);
        }

        const apiError: ApiErrorPayload = {
          code: error.response?.data?.error?.code || 'API_ERROR',
          message: error.response?.data?.error?.message || error.message || '请求失败',
          details: error.response?.data?.error?.details || error.response?.data,
        };

        return Promise.reject(apiError);
      }
    );
  }

  private unwrap<T>(response: AxiosResponse<ApiResponse<T>>): ApiResponse<T> {
    if (response.data) {
      return response.data;
    }
    return {
      success: false,
      error: {
        code: 'EMPTY_RESPONSE',
        message: '接口返回内容为空',
      },
    };
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return this.unwrap<T>(response);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return this.unwrap<T>(response);
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return this.unwrap<T>(response);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return this.unwrap<T>(response);
  }
}

export const apiClient = new ApiClient();

