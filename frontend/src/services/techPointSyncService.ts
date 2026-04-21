import api from './api';
import { TechPoint } from '../types/techPoint';
import { ApiResponse, PaginatedResponse } from '../types/techPoint';

/**
 * 技术点同步服务
 * 用于从 tech-hub 拉取技术点并覆盖/更新本地数据
 */
export const techPointSyncService = {
  /**
   * 从 tech-hub 同步技术点数据（单向拉取）
   * @param options 同步选项
   */
  async syncFromTechHub(options?: {
    fullSync?: boolean; // 是否全量同步
    lastSyncTime?: string; // 上次同步时间，用于增量同步
    apiBaseUrl?: string; // 自定义 API 基础 URL
    apiKey?: string; // 自定义 API Key
  }): Promise<ApiResponse<{
    synced: number; // 同步的技术点数量（总数）
    updated: number; // 更新的技术点数量
    created: number; // 创建的技术点数量
    errors: number; // 错误数量
  }>> {
    try {
      const response = await api.post('/tech-points/sync', {
        fullSync: options?.fullSync ?? false,
        lastSyncTime: options?.lastSyncTime,
        apiBaseUrl: options?.apiBaseUrl,
        apiKey: options?.apiKey,
      });
      // 后端返回的格式是 { success, message, data: { total, created, updated, errors } }
      if (response.data && response.data.data) {
        const stats = response.data.data;
        return {
          success: response.data.success ?? true,
          data: {
            synced: stats.total || (stats.created || 0) + (stats.updated || 0),
            updated: stats.updated || 0,
            created: stats.created || 0,
            errors: stats.errors || 0,
          },
          message: response.data.message,
        };
      }
      return response.data;
    } catch (error) {
      console.error('同步技术点数据失败:', error);
      return {
        success: false,
        error: '同步技术点数据失败'
      };
    }
  },

  /**
   * 兼容旧调用：保留方法名，内部转发到 tech-hub 单向拉取。
   */
  async syncFromTPD2(options?: {
    fullSync?: boolean;
    lastSyncTime?: string;
    apiBaseUrl?: string;
    apiKey?: string;
  }) {
    return this.syncFromTechHub(options);
  },

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<ApiResponse<{
    lastSyncTime: string | null;
    lastSyncType: 'from_tech_hub' | null;
    syncInProgress: boolean;
    syncProgress?: {
      total: number;
      completed: number;
      failed: number;
    };
  }>> {
    try {
      const response = await api.get('/tech-points/sync/status');
      return response.data;
    } catch (error) {
      console.error('获取同步状态失败:', error);
      return {
        success: false,
        error: '获取同步状态失败'
      };
    }
  },

  /**
   * 获取同步日志
   * @param options 查询选项
   */
  async getSyncLogs(options?: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PaginatedResponse<{
    id: number;
    syncType: 'from_tech_hub';
    status: 'success' | 'failed' | 'partial';
    syncedCount: number;
    errorCount: number;
    startTime: string;
    endTime: string | null;
    errorMessage?: string;
  }>>> {
    try {
      const response = await api.get('/tech-points/sync/logs', {
        params: options,
      });
      return response.data;
    } catch (error) {
      console.error('获取同步日志失败:', error);
      return {
        success: false,
        error: '获取同步日志失败'
      };
    }
  },
};

export default techPointSyncService;
