import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  message?: string;
}

class ApiClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
      timeout: 30_000,
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

