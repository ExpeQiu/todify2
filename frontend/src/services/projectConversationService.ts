import api from './api';
import { ConversationRecord } from './chatHistoryService';

export interface ProjectConversationResponse {
  success: boolean;
  data: ConversationRecord[];
  message: string;
  error?: string;
}

/**
 * 项目对话记录服务
 */
export class ProjectConversationService {
  /**
   * 获取项目的对话记录列表
   */
  static async getProjectConversations(
    projectId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<ConversationRecord[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await api.get<ProjectConversationResponse>(
        `/projects/${projectId}/conversations?${params.toString()}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      console.error('获取项目对话记录失败:', error);
      return [];
    }
  }
}

export default ProjectConversationService;

