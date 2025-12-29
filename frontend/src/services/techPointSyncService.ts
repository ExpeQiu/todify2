import api from './api';
import { TechPoint } from '../types/techPoint';
import { ApiResponse, PaginatedResponse } from '../types/techPoint';

/**
 * 技术点同步服务
 * 用于与 TPD2 项目进行技术点信息同步
 * 
 * 后续实现功能：
 * 1. 从 TPD2 同步技术点数据
 * 2. 增量同步（只同步更新的数据）
 * 3. 双向同步（支持从 TPD2 到 todify3 和反向）
 * 4. 同步冲突处理
 * 5. 同步日志记录
 */
export const techPointSyncService = {
  /**
   * 从 TPD2 同步技术点数据
   * @param options 同步选项
   */
  async syncFromTPD2(options?: {
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
   * 同步技术点到 TPD2
   * @param techPointIds 要同步的技术点ID列表，如果不提供则同步所有
   * @param apiConfig API 配置
   */
  async syncToTPD2(
    techPointIds?: number[],
    apiConfig?: {
      apiBaseUrl?: string;
      apiKey?: string;
    }
  ): Promise<ApiResponse<{
    synced: number;
    created?: number;
    updated?: number;
    errors: number;
  }>> {
    try {
      const response = await api.post('/tech-points/sync/to-tpd2', {
        techPointIds,
        apiBaseUrl: apiConfig?.apiBaseUrl,
        apiKey: apiConfig?.apiKey,
      });
      
      // 后端返回的格式是 { success, message, data: { total, created, updated, errors } }
      if (response.data && response.data.data) {
        const stats = response.data.data;
        return {
          success: response.data.success ?? true,
          data: {
            synced: stats.total || (stats.created || 0) + (stats.updated || 0),
            created: stats.created || 0,
            updated: stats.updated || 0,
            errors: stats.errors || 0,
          },
          message: response.data.message,
        };
      }
      return response.data;
    } catch (error) {
      console.error('同步技术点到 TPD2 失败:', error);
      return {
        success: false,
        error: '同步技术点到 TPD2 失败'
      };
    }
  },

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<ApiResponse<{
    lastSyncTime: string | null;
    lastSyncType: 'from_tpd2' | 'to_tpd2' | null;
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
    syncType: 'from_tpd2' | 'to_tpd2';
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
